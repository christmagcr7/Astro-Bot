const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('team-role')
    .setDescription('Zeigt Informationen zur Team-Rolle an.')
    .addRoleOption((option) => option.setName('role').setDescription('Team-Rolle').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  async execute(interaction) {
    const role = interaction.options.getRole('role');

    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle(`🛡️ ${role.name}`)
      .addFields(
        { name: 'ID', value: role.id, inline: true },
        { name: 'Mitglieder', value: `${role.members.size}`, inline: true },
        { name: 'Farbcode', value: role.hexColor, inline: true },
      );

    await interaction.reply({ embeds: [embed] });
  },
};
