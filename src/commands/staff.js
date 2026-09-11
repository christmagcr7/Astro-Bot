const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('staff')
    .setDescription('Zeigt wichtige Staff-Infos und Team-Status an.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle('🛡️ Team Status')
      .setDescription('Staff- und Moderationsstatus für den Server.')
      .addFields(
        { name: 'Support', value: 'Aktiv', inline: true },
        { name: 'Moderation', value: 'Aktiv', inline: true },
        { name: 'Tickets', value: 'Aktiv', inline: true },
        { name: 'RP', value: 'Optional über /rp-setup', inline: true },
      );

    await interaction.reply({ embeds: [embed] });
  },
};
