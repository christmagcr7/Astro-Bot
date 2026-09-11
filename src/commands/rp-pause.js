const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rp-pause')
    .setDescription('Pausiert oder setzt den RP-Modus fort.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    const guildId = interaction.guild.id;
    const state = client.rpSessions.get(guildId);

    if (!state) {
      await interaction.reply({ content: 'Es läuft aktuell keine RP-Session. Nutze zuerst /rp-start.', ephemeral: true });
      return;
    }

    const isPaused = state.status === 'paused';
    state.status = isPaused ? 'active' : 'paused';
    client.rpSessions.set(guildId, state);

    const embed = new EmbedBuilder()
      .setColor(isPaused ? config.colors.success : config.colors.info)
      .setTitle(isPaused ? '▶️ RP-Session fortgesetzt' : '⏸️ RP-Session pausiert')
      .setDescription(isPaused ? 'Der RP-Modus läuft wieder.' : 'Der RP-Modus wurde pausiert.')
      .addFields(
        { name: 'Name', value: state.name || 'RP-Session', inline: true },
        { name: 'Status', value: state.status, inline: true },
      );

    await interaction.reply({ embeds: [embed] });
  },
};
