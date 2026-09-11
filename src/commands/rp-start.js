const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rp-start')
    .setDescription('Startet den RP-Modus für den Server.')
    .addStringOption((option) => option.setName('name').setDescription('Name der RP-Session').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    const guildId = interaction.guild.id;
    const sessionName = interaction.options.getString('name') || 'RP-Session';

    const state = client.rpSessions.get(guildId) || {
      status: 'inactive',
      name: 'RP-Session',
      startedAt: null,
    };

    state.status = 'active';
    state.name = sessionName;
    state.startedAt = new Date();
    client.rpSessions.set(guildId, state);

    const embed = new EmbedBuilder()
      .setColor(config.colors.success)
      .setTitle('🎭 RP-Session gestartet')
      .setDescription(`Der RP-Modus wurde für diesen Server aktiviert.`)
      .addFields(
        { name: 'Name', value: sessionName, inline: true },
        { name: 'Status', value: 'Aktiv', inline: true },
        { name: 'Seit', value: new Date(state.startedAt).toLocaleString('de-DE'), inline: false },
      );

    await interaction.reply({ embeds: [embed] });
  },
};
