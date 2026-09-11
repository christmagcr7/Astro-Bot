const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Startet ein Giveaway.')
    .addStringOption((option) => option.setName('title').setDescription('Titel').setRequired(true))
    .addIntegerOption((option) => option.setName('duration_minutes').setDescription('Dauer in Minuten').setRequired(true).setMinValue(1))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  async execute(interaction) {
    const title = interaction.options.getString('title');
    const durationMinutes = interaction.options.getInteger('duration_minutes');
    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle('🎁 Giveaway')
      .setDescription(`${title}\nDauer: ${durationMinutes} Minuten`)
      .setFooter({ text: 'Astro Bot • Community' });

    const message = await interaction.channel.send({ embeds: [embed] });
    await message.react('🎉');
    await interaction.reply({ content: 'Giveaway gestartet.', ephemeral: true });
  },
};
