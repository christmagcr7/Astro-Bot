const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rp-stop')
    .setDescription('Stoppt den RP-Modus für den Server.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    const guildId = interaction.guild.id;
    const state = client.rpSessions.get(guildId);

    if (!state) {
      await interaction.reply({ content: 'Es läuft aktuell keine RP-Session.', ephemeral: true });
      return;
    }

    state.status = 'inactive';
    state.stoppedAt = new Date();
    client.rpSessions.set(guildId, state);

    const embed = new EmbedBuilder()
      .setColor(config.colors.warning)
      .setTitle('🛑 RP-Session beendet')
      .setDescription('Der RP-Modus wurde beendet.')
      .addFields(
        { name: 'Name', value: state.name || 'RP-Session', inline: true },
        { name: 'Status', value: 'Inaktiv', inline: true },
      );

    await interaction.reply({ embeds: [embed] });
  },
};
