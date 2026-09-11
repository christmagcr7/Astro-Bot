const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('suggest')
    .setDescription('Erstellt einen Vorschlag.')
    .addStringOption((option) => option.setName('idea').setDescription('Vorschlag').setRequired(true)),
  async execute(interaction) {
    const idea = interaction.options.getString('idea');
    const embed = new EmbedBuilder()
      .setColor(config.colors.info)
      .setTitle('💡 Vorschlag')
      .setDescription(idea)
      .setFooter({ text: `Eingereicht von ${interaction.user.tag}` });

    await interaction.reply({ embeds: [embed] });
  },
};
