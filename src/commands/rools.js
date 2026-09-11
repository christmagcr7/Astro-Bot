const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../config');

const roleBlueprint = [
  {
    name: 'Astro Owner',
    color: '#ff4d6d',
    permissions: [PermissionFlagsBits.Administrator],
    hoist: true,
  },
  {
    name: 'Astro Team',
    color: '#8b5cf6',
    permissions: [
      PermissionFlagsBits.ManageChannels,
      PermissionFlagsBits.ManageMessages,
      PermissionFlagsBits.KickMembers,
      PermissionFlagsBits.BanMembers,
      PermissionFlagsBits.ModerateMembers,
    ],
    hoist: true,
  },
  {
    name: 'Support Team',
    color: '#22d3ee',
    permissions: [PermissionFlagsBits.ManageMessages, PermissionFlagsBits.ReadMessageHistory],
    hoist: true,
  },
  { name: 'Verified', color: '#22c55e', permissions: [], hoist: true },
  { name: 'Tox', color: '#a855f7', permissions: [], hoist: true },
  { name: 'Nox', color: '#3b82f6', permissions: [], hoist: true },
  { name: 'Christ', color: '#10b981', permissions: [], hoist: true },
  { name: 'Astro Bots', color: '#64748b', permissions: [], hoist: false },
];

const settingsPath = (guildId) => path.join(__dirname, '..', '..', 'data', `${guildId}.json`);

const findChannel = (guild, phrase) => guild.channels.cache.find((channel) => channel.name.toLowerCase().includes(phrase));

const setReadOnly = async (channel, everyoneRole, teamRoles) => {
  if (!channel) return;
  await channel.permissionOverwrites.edit(everyoneRole, { ViewChannel: true, SendMessages: false }).catch(() => {});
  for (const role of teamRoles) {
    await channel.permissionOverwrites.edit(role, { ViewChannel: true, SendMessages: true, ReadMessageHistory: true }).catch(() => {});
  }
};

const setStaffOnly = async (channel, everyoneRole, staffRole) => {
  if (!channel || !staffRole) return;
  await channel.permissionOverwrites.edit(everyoneRole, { ViewChannel: false }).catch(() => {});
  await channel.permissionOverwrites.edit(staffRole, { ViewChannel: true, SendMessages: true, ReadMessageHistory: true }).catch(() => {});
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rools')
    .setDescription('Löscht alte Rollen und erstellt das Astro-Rollensystem.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;
    const botMember = guild.members.me;
    const deletableRoles = guild.roles.cache.filter((role) => (
      role.id !== guild.id
      && !role.managed
      && botMember
      && role.position < botMember.roles.highest.position
    ));

    let deletedRoles = 0;
    for (const role of deletableRoles.values()) {
      const deleted = await role.delete('Astro Bot /rools role reset').then(() => true).catch((error) => {
        console.error(`Could not delete role ${role.name}:`, error.message);
        return false;
      });
      if (deleted) deletedRoles += 1;
    }

    const roles = {};
    for (const blueprint of roleBlueprint) {
      const role = await guild.roles.create({
        name: blueprint.name,
        color: blueprint.color,
        hoist: blueprint.hoist,
        mentionable: true,
        permissions: blueprint.permissions,
        reason: 'Astro Bot /rools role setup',
      });
      roles[blueprint.name] = role;
    }

    if (roles['Astro Owner'] && interaction.member.roles.cache.has(roles['Astro Owner'].id) === false) {
      await interaction.member.roles.add(roles['Astro Owner']).catch(() => {});
    }

    const everyone = guild.roles.everyone;
    const teamRoles = [roles['Astro Team'], roles['Support Team']].filter(Boolean);
    const welcomeChannel = findChannel(guild, 'welcome');
    const verifyChannel = findChannel(guild, 'verify');
    const rulesChannel = findChannel(guild, 'rules');
    const announcementChannel = findChannel(guild, 'announcements');
    const communityChannel = findChannel(guild, 'chat');
    const supportChannel = findChannel(guild, 'support');
    const ticketChannel = findChannel(guild, 'tickets');
    const staffChannel = findChannel(guild, 'team-chat');

    await setReadOnly(welcomeChannel, everyone, teamRoles);
    await setReadOnly(rulesChannel, everyone, teamRoles);
    await setReadOnly(announcementChannel, everyone, teamRoles);
    await setReadOnly(verifyChannel, everyone, teamRoles);
    await setReadOnly(ticketChannel, everyone, teamRoles);
    await setStaffOnly(staffChannel, everyone, roles['Astro Team']);

    if (communityChannel) {
      await communityChannel.permissionOverwrites.edit(everyone, { ViewChannel: true, SendMessages: true }).catch(() => {});
      await communityChannel.permissionOverwrites.edit(roles.Verified, { ViewChannel: true, SendMessages: true }).catch(() => {});
    }

    if (supportChannel) {
      await supportChannel.permissionOverwrites.edit(everyone, { ViewChannel: true, SendMessages: true }).catch(() => {});
      await supportChannel.permissionOverwrites.edit(roles['Support Team'], { ViewChannel: true, SendMessages: true }).catch(() => {});
    }

    for (const [name, roleName] of [['tox office', 'Tox'], ['nox office', 'Nox'], ['christ office', 'Christ']]) {
      const office = findChannel(guild, name);
      if (office && roles[roleName]) {
        await office.permissionOverwrites.edit(everyone, { ViewChannel: false, Connect: false }).catch(() => {});
        await office.permissionOverwrites.edit(roles[roleName], { ViewChannel: true, Connect: true, Speak: true }).catch(() => {});
        await office.permissionOverwrites.edit(roles['Astro Team'], { ViewChannel: true, Connect: true, Speak: true }).catch(() => {});
      }
    }

    const currentSettings = fs.existsSync(settingsPath(guild.id))
      ? JSON.parse(fs.readFileSync(settingsPath(guild.id), 'utf8'))
      : {};
    currentSettings.roleIds = Object.fromEntries(Object.entries(roles).map(([name, role]) => [name, role.id]));
    currentSettings.autoRoleId = roles.Verified.id;
    fs.mkdirSync(path.dirname(settingsPath(guild.id)), { recursive: true });
    fs.writeFileSync(settingsPath(guild.id), JSON.stringify(currentSettings, null, 2));
    client.serverSettings.set(guild.id, currentSettings);

    const embed = new EmbedBuilder()
      .setColor(config.colors.success)
      .setTitle('✅ Astro-Rollen eingerichtet')
      .setDescription('Alte löschbare Rollen wurden entfernt und das neue Rollen-/Kanal-Rechtesystem wurde aktiviert.')
      .addFields(
        { name: 'Entfernt', value: `${deletedRoles} Rolle(n)`, inline: true },
        { name: 'Neu', value: `${roleBlueprint.length} Rolle(n)`, inline: true },
        { name: 'Owner', value: `${roles['Astro Owner']}`, inline: true },
        { name: 'Offices', value: 'Tox • Nox • Christ', inline: true },
        { name: 'Auto-Role', value: `${roles.Verified}`, inline: true },
      );

    await interaction.editReply({ embeds: [embed] });
  },
};
