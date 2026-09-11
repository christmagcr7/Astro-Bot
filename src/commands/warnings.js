const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('Zeigt die Warnungen eines Benutzers an.')
    .addUserOption((option) => option.setName('user').setDescription('Benutzer').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction) {
    const user = interaction.options.getUser('user') || interaction.user;

    const embed = new EmbedBuilder()
      .setColor(config.colors.info)
      .setTitle(`⚠️ Warnungen von ${user.username}`)
      .setDescription('Keine Warnungen gefunden.')
      .setFooter({ text: 'Astro Bot • Moderation' });

    await interaction.reply({ embeds: [embed] });
  },
};
