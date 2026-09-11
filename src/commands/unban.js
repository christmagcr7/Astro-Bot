const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Hebt einen Bann auf.')
    .addStringOption((option) => option.setName('user_id').setDescription('User ID').setRequired(true))
    .addStringOption((option) => option.setName('reason').setDescription('Grund').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  async execute(interaction) {
    const userId = interaction.options.getString('user_id');
    const reason = interaction.options.getString('reason') || 'Kein Grund angegeben';

    await interaction.guild.bans.remove(userId, reason).catch(() => null);

    const embed = new EmbedBuilder()
      .setColor(config.colors.success)
      .setTitle('✅ Bann aufgehoben')
      .addFields(
        { name: 'User ID', value: userId, inline: true },
        { name: 'Grund', value: reason, inline: true },
      );

    await interaction.reply({ embeds: [embed] });
  },
};
