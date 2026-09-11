const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kickt einen Benutzer.')
    .addUserOption((option) => option.setName('user').setDescription('Benutzer').setRequired(true))
    .addStringOption((option) => option.setName('reason').setDescription('Grund').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'Kein Grund angegeben';
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (!member) {
      await interaction.reply({ content: 'Der Benutzer ist nicht auf diesem Server.', ephemeral: true });
      return;
    }

    if (member.id === interaction.user.id) {
      await interaction.reply({ content: 'Du kannst dich nicht selbst kicken.', ephemeral: true });
      return;
    }

    await interaction.guild.members.kick(user, reason);

    const embed = new EmbedBuilder()
      .setColor(config.colors.warning)
      .setTitle('👢 Benutzer gekickt')
      .addFields(
        { name: 'User', value: `${user}`, inline: true },
        { name: 'Grund', value: reason, inline: true },
      );

    await interaction.reply({ embeds: [embed] });
  },
};
