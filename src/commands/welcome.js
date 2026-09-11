const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('welcome')
    .setDescription('Konfiguriert das Welcome-System für den Server.')
    .addChannelOption((option) =>
      option
        .setName('channel')
        .setDescription('Willkommenskanal')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    )
    .addRoleOption((option) => option.setName('role').setDescription('Willkommensrolle').setRequired(false))
    .addStringOption((option) => option.setName('message').setDescription('Willkommensnachricht').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    const guildId = interaction.guild.id;
    const settingsPath = path.join(__dirname, '..', '..', 'data', `${guildId}.json`);

    const existing = fs.existsSync(settingsPath)
      ? JSON.parse(fs.readFileSync(settingsPath, 'utf8'))
      : {
          welcomeChannelId: null,
          welcomeRoleId: null,
          welcomeMessage: 'Willkommen {user} auf dem Server! 👋',
        };

    const channel = interaction.options.getChannel('channel');
    const role = interaction.options.getRole('role');
    const message = interaction.options.getString('message');

    if (channel) existing.welcomeChannelId = channel.id;
    if (role) existing.welcomeRoleId = role.id;
    if (message) existing.welcomeMessage = message;

    fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
    fs.writeFileSync(settingsPath, JSON.stringify(existing, null, 2));
    client.serverSettings.set(guildId, existing);

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('welcome_channel_select')
      .setPlaceholder('Willkommenskanal auswählen')
      .addOptions(
        interaction.guild.channels.cache
          .filter((ch) => ch.type === ChannelType.GuildText)
          .map((channel) => ({
            label: channel.name,
            value: channel.id,
            description: `Kanal: #${channel.name}`,
          }))
          .slice(0, 25)
      );

    const row = new ActionRowBuilder().addComponents(selectMenu);

    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle('🌌 Welcome-System')
      .setDescription('Willkommenskanal und Willkommensrolle wurden gespeichert.')
      .addFields(
        { name: 'Kanal', value: channel ? `<#${channel.id}>` : existing.welcomeChannelId ? `<#${existing.welcomeChannelId}>` : 'Nicht gesetzt', inline: true },
        { name: 'Rolle', value: role ? `${role}` : existing.welcomeRoleId ? `<@&${existing.welcomeRoleId}>` : 'Nicht gesetzt', inline: true },
        { name: 'Nachricht', value: existing.welcomeMessage || 'Willkommen {user} auf dem Server! 👋', inline: false },
      );

    await interaction.reply({ embeds: [embed], components: [row] });
  },
};
