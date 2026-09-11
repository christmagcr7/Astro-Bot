const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('team-list')
    .setDescription('Listet alle Team-Rollen dieses Servers auf.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  async execute(interaction, client) {
    const roles = interaction.guild.roles.cache.filter((role) => role.name && role.name !== '@everyone');
    const teamRoles = roles.filter((role) => role.color === config.colors.primary || role.hexColor !== '#000000');

    const list = teamRoles.size > 0
      ? teamRoles.map((role) => `${role} (${role.members.size} Mitglieder)`).slice(0, 20).join('\n')
      : 'Keine Teams gefunden.';

    const embed = new EmbedBuilder()
      .setColor(config.colors.secondary)
      .setTitle('📋 Team-Liste')
      .setDescription(list);

    await interaction.reply({ embeds: [embed] });
  },
};
