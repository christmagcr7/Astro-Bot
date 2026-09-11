const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Zeigt Informationen über den Server an.'),
  async execute(interaction) {
    const guild = interaction.guild;
    const embed = new EmbedBuilder()
      .setColor(config.colors.secondary)
      .setTitle(`🌌 ${guild.name}`)
      .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }) || null)
      .addFields(
        { name: 'Owner', value: `<@${guild.ownerId}>`, inline: true },
        { name: 'Mitglieder', value: `${guild.memberCount}`, inline: true },
        { name: 'Erstellt', value: new Date(guild.createdAt).toLocaleDateString(), inline: true },
        { name: 'Boosts', value: `${guild.premiumSubscriptionCount || 0}`, inline: true },
        { name: 'Kanäle', value: `${guild.channels.cache.size}`, inline: true },
      );

    await interaction.reply({ embeds: [embed] });
  },
};
