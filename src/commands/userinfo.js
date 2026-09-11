const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Zeigt Informationen über einen Benutzer an.')
    .addUserOption((option) => option.setName('user').setDescription('Benutzer').setRequired(false)),
  async execute(interaction) {
    const user = interaction.options.getUser('user') || interaction.user;
    const member = interaction.guild.members.cache.get(user.id);

    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle(`👤 ${user.tag}`)
      .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
      .addFields(
        { name: 'ID', value: user.id, inline: true },
        { name: 'Status', value: member?.presence?.status || 'Unbekannt', inline: true },
        { name: 'Server Beitritt', value: member?.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : 'Unbekannt', inline: true },
      );

    await interaction.reply({ embeds: [embed] });
  },
};
