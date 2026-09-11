const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Erstellt eine Umfrage.')
    .addStringOption((option) => option.setName('question').setDescription('Frage').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  async execute(interaction) {
    const question = interaction.options.getString('question');
    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle('📊 Umfrage')
      .setDescription(question)
      .setFooter({ text: 'Astro Bot • Community' });

    const message = await interaction.channel.send({ embeds: [embed] });
    await message.react('👍');
    await message.react('👎');
    await interaction.reply({ content: 'Umfrage erstellt.', ephemeral: true });
  },
};
