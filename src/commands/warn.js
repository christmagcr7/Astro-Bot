const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warnt einen Benutzer.')
    .addUserOption((option) => option.setName('user').setDescription('Benutzer').setRequired(true))
    .addStringOption((option) => option.setName('reason').setDescription('Grund').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason');

    const embed = new EmbedBuilder()
      .setColor(config.colors.warning)
      .setTitle('⚠️ Warnung')
      .addFields(
        { name: 'User', value: `${user}`, inline: true },
        { name: 'Grund', value: reason, inline: true },
      );

    await interaction.reply({ embeds: [embed] });
  },
};
