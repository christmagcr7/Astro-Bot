const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../config');

const layout = [
  { name: '🌌・server-info', type: ChannelType.GuildText },
  { name: '🤖・bot-status', type: ChannelType.GuildText },
  {
    name: '👋・Astro Welcome',
    channels: [
      { name: '👋・welcome', type: ChannelType.GuildText },
      { name: '📜・rules', type: ChannelType.GuildText },
    ],
  },
  {
    name: '🛡️・Verification',
    channels: [
      { name: '✅・verify', type: ChannelType.GuildText },
    ],
  },
  {
    name: '📡・Information',
    channels: [
      { name: '📢・announcements', type: ChannelType.GuildText },
      { name: '🛠️・changelog', type: ChannelType.GuildText },
      { name: '📚・server-rules', type: ChannelType.GuildText },
    ],
  },
  {
    name: '💬・Community',
    channels: [
      { name: '💭・chat', type: ChannelType.GuildText },
      { name: '⚙️・commands', type: ChannelType.GuildText },
      { name: '💡・feedback', type: ChannelType.GuildText },
      { name: '💭・suggestions', type: ChannelType.GuildText },
    ],
  },
  {
    name: '🏢・Offices',
    channels: [
      { name: '🟣・Tox Office', type: ChannelType.GuildVoice },
      { name: '🔵・Nox Office', type: ChannelType.GuildVoice },
      { name: '🟢・Christ Office', type: ChannelType.GuildVoice },
    ],
  },
  {
    name: '🆘・Support',
    channels: [
      { name: '🎫・helpdesk', type: ChannelType.GuildText },
      { name: '📝・apply', type: ChannelType.GuildText },
      { name: '💬・support', type: ChannelType.GuildText },
      { name: '🎟️・tickets', type: ChannelType.GuildText },
      { name: '🔊・Support Waiting', type: ChannelType.GuildVoice },
      { name: '🤖・AI Support', type: ChannelType.GuildVoice },
    ],
  },
  {
    name: '🛡️・Staff',
    channels: [
      { name: '👥・team-chat', type: ChannelType.GuildText },
    ],
  },
];

const getSettingsPath = (guildId) => path.join(__dirname, '..', '..', 'data', `${guildId}.json`);

const loadSettings = (guildId) => {
  const settingsPath = getSettingsPath(guildId);
  if (!fs.existsSync(settingsPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  } catch {
    return {};
  }
};

const saveSettings = (guildId, settings) => {
  const settingsPath = getSettingsPath(guildId);
  fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
};

const findExistingChannel = (guild, name, type, parentId = null) => guild.channels.cache.find((channel) => (
  channel.name.toLowerCase() === name.toLowerCase()
  && channel.type === type
  && (parentId === null || channel.parentId === parentId)
));

const createOrGetChannel = async (guild, definition, parentId = null) => {
  const existing = findExistingChannel(guild, definition.name, definition.type, parentId);
  if (existing) return { channel: existing, created: false };

  const channel = await guild.channels.create({
    name: definition.name,
    type: definition.type,
    parent: parentId || undefined,
  });
  return { channel, created: true };
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('channels')
    .setDescription('Erstellt die Astro-Bot-Serverstruktur automatisch.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    await interaction.deferReply({ ephemeral: true });

    const created = [];
    const managedChannelIds = [];
    const settings = loadSettings(interaction.guild.id);
    const channelIds = {};

    for (const entry of layout) {
      if (entry.channels) {
        const categoryResult = await createOrGetChannel(interaction.guild, {
          name: entry.name,
          type: ChannelType.GuildCategory,
        });
        if (categoryResult.created) created.push(categoryResult.channel);
        managedChannelIds.push(categoryResult.channel.id);

        for (const child of entry.channels) {
          const childResult = await createOrGetChannel(interaction.guild, child, categoryResult.channel.id);
          if (childResult.created) created.push(childResult.channel);
          managedChannelIds.push(childResult.channel.id);
          channelIds[child.name.toLowerCase()] = childResult.channel.id;
        }
      } else {
        const channelResult = await createOrGetChannel(interaction.guild, entry);
        if (channelResult.created) created.push(channelResult.channel);
        managedChannelIds.push(channelResult.channel.id);
        channelIds[entry.name.toLowerCase()] = channelResult.channel.id;
      }
    }

    const desiredChannelIds = new Set(managedChannelIds);
    const channelsToDelete = interaction.guild.channels.cache.filter((channel) => !desiredChannelIds.has(channel.id));
    const orderedChannelsToDelete = [...channelsToDelete.values()].sort((a, b) => {
      const aIsCategory = a.type === ChannelType.GuildCategory ? 1 : 0;
      const bIsCategory = b.type === ChannelType.GuildCategory ? 1 : 0;
      return aIsCategory - bIsCategory;
    });
    settings.managedChannelIds = managedChannelIds;
    settings.welcomeChannelId = channelIds['👋・welcome'] || settings.welcomeChannelId || null;
    settings.verificationChannelId = channelIds['✅・verify'] || settings.verificationChannelId || null;
    settings.ticketChannelId = channelIds['🎟️・tickets'] || settings.ticketChannelId || null;
    settings.supportNotificationId = channelIds['💬・support'] || settings.supportNotificationId || null;
    settings.supportVoiceId = channelIds['🔊・support waiting'] || settings.supportVoiceId || null;
    settings.aiSupportVoiceId = channelIds['🤖・ai support'] || settings.aiSupportVoiceId || null;
    settings.officeChannelIds = {
      tox: channelIds['🟣・tox office'] || settings.officeChannelIds?.tox || null,
      nox: channelIds['🔵・nox office'] || settings.officeChannelIds?.nox || null,
      christ: channelIds['🟢・christ office'] || settings.officeChannelIds?.christ || null,
    };
    settings.supportWaitroomId = settings.supportVoiceId;
    saveSettings(interaction.guild.id, settings);
    client.serverSettings.set(interaction.guild.id, settings);

    const embed = new EmbedBuilder()
      .setColor(config.colors.success)
      .setTitle('✅ Serverstruktur erstellt')
      .setDescription('Die Astro-Bot-Kanalstruktur wurde eingerichtet. Vorhandene Kanäle wurden nicht dupliziert.')
      .addFields(
        { name: 'Neu erstellt', value: `${created.length} Kanal/Kategorie(n)`, inline: true },
        { name: 'Welcome', value: `<#${settings.welcomeChannelId}>`, inline: true },
        { name: 'Support-Chat', value: `<#${settings.supportNotificationId}>`, inline: true },
        { name: 'Support-Voice', value: `<#${settings.supportVoiceId}>`, inline: true },
      );

    await interaction.editReply({ embeds: [embed] });

    for (const channel of orderedChannelsToDelete) {
      await channel.delete('Astro Bot /channels layout cleanup').catch((error) => {
        console.error(`Could not delete channel ${channel.name}:`, error.message);
      });
    }
  },
};
