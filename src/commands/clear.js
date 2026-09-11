const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Löscht Nachrichten in einem Kanal.')
    .addIntegerOption((option) => option.setName('amount').setDescription('Anzahl').setRequired(true).setMinValue(1).setMaxValue(100))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const amount = interaction.options.getInteger('amount');
    const messages = await interaction.channel.messages.fetch({ limit: amount });
    await interaction.channel.bulkDelete(messages, true);

    const embed = new EmbedBuilder()
      .setColor(config.colors.success)
      .setTitle('🧹 Nachrichten gelöscht')
      .setDescription(`${amount} Nachrichten wurden entfernt.`);

    await interaction.editReply({ embeds: [embed] });
  },
};
