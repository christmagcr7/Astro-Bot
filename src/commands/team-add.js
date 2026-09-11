const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('team-add')
    .setDescription('Fügt ein Mitglied zu einem Team hinzu.')
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

    await member.roles.add(role);

    const embed = new EmbedBuilder()
      .setColor(config.colors.success)
      .setTitle('✅ Teammitglied hinzugefügt')
      .setDescription(`${user} wurde der Rolle ${role} zugewiesen.`);

    await interaction.reply({ embeds: [embed] });
  },
};
