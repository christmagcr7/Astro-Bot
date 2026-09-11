const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Zeigt die verfügbaren Astro Bot Funktionen an.'),
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle('🚀 Astro Bot Hilfe')
      .setDescription('Hier findest du alle wichtigen Funktionen des Bots.')
      .addFields(
        { name: 'Moderation', value: '/ban /kick /timeout /warn /warnings /clear /unban /lock /unlock', inline: false },
        { name: 'Tickets', value: '/ticket /setup', inline: false },
        { name: 'Community', value: '/userinfo /serverinfo /avatar /poll /suggest /giveaway', inline: false },
        { name: 'RP', value: '/rp-start /rp-stop /rp-pause', inline: false },
        { name: 'Team Management', value: '/team-create /team-add /team-remove /team-list /team-role', inline: false },
      )
      .setFooter({ text: 'Astro Bot • Space Theme' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('astro_help')
        .setLabel('Systeminfo')
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  },
};
