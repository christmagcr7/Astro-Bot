const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('team-remove')
    .setDescription('Entfernt ein Mitglied aus einem Team.')
    .addUserOption((option) => option.setName('user').setDescription('Mitglied').setRequired(true))
    .addRoleOption((option) => option.setName('role').setDescription('Team-Rolle').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const role = interaction.options.getRole('role');
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (!member) {
      await interaction.reply({ content: 'Das Mitglied konnte nicht gefunden werden.', ephemeral: true });
      return;
    }

    await member.roles.remove(role);

    const embed = new EmbedBuilder()
      .setColor(config.colors.warning)
      .setTitle('➖ Teammitglied entfernt')
      .setDescription(`${user} wurde aus der Rolle ${role} entfernt.`);

    await interaction.reply({ embeds: [embed] });
  },
};
