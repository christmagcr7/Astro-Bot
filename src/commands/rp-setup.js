const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rp-setup')
    .setDescription('Aktiviert optionale RP-Funktionen für den Server.')
    .addBooleanOption((option) => option.setName('enable').setDescription('RP-Funktionen aktivieren').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const settingsPath = path.join(__dirname, '..', '..', 'data', `${guildId}.json`);
    const existing = fs.existsSync(settingsPath) ? JSON.parse(fs.readFileSync(settingsPath, 'utf8')) : {};
    const enabled = interaction.options.getBoolean('enable');

    existing.rpEnabled = enabled;
    fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
    fs.writeFileSync(settingsPath, JSON.stringify(existing, null, 2));

    const embed = new EmbedBuilder()
      .setColor(enabled ? config.colors.success : config.colors.warning)
      .setTitle(enabled ? '🎭 RP-Modus aktiviert' : '🎭 RP-Modus deaktiviert')
      .setDescription(enabled ? 'RP-Funktionen sind jetzt für diesen Server aktiviert.' : 'RP-Funktionen wurden deaktiviert.');

    await interaction.reply({ embeds: [embed] });
  },
};
