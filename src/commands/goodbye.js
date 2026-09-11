const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('goodbye')
    .setDescription('Konfiguriert das Goodbye-System für den Server.')
    .addChannelOption((option) =>
      option
        .setName('channel')
        .setDescription('Goodbye-Kanal')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    )
    .addStringOption((option) => option.setName('message').setDescription('Goodbye-Nachricht').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const settingsPath = path.join(__dirname, '..', '..', 'data', `${guildId}.json`);
    const existing = fs.existsSync(settingsPath) ? JSON.parse(fs.readFileSync(settingsPath, 'utf8')) : {};

    const channel = interaction.options.getChannel('channel');
    const message = interaction.options.getString('message');

    if (channel) existing.goodbyeChannelId = channel.id;
    if (message) existing.goodbyeMessage = message;

    fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
    fs.writeFileSync(settingsPath, JSON.stringify(existing, null, 2));

    const embed = new EmbedBuilder()
      .setColor(config.colors.warning)
      .setTitle('👋 Goodbye-System')
      .setDescription('Das Goodbye-System wurde gespeichert.')
      .addFields(
        { name: 'Kanal', value: channel ? `<#${channel.id}>` : existing.goodbyeChannelId ? `<#${existing.goodbyeChannelId}>` : 'Nicht gesetzt', inline: true },
        { name: 'Nachricht', value: existing.goodbyeMessage || 'Auf Wiedersehen (user)! 👋', inline: false },
      );

    await interaction.reply({ embeds: [embed] });
  },
};
