const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('Zeigt den Avatar eines Benutzers an.')
    .addUserOption((option) => option.setName('user').setDescription('Benutzer').setRequired(false)),
  async execute(interaction) {
    const user = interaction.options.getUser('user') || interaction.user;
    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle(`🪐 ${user.tag}`)
      .setImage(user.displayAvatarURL({ dynamic: true, size: 512 }));

    await interaction.reply({ embeds: [embed] });
  },
};
