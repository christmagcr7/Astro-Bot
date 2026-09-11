const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lock')
    .setDescription('Sperrt den aktuellen Kanal.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  async execute(interaction) {
    const everyoneRole = interaction.guild.roles.everyone;
    await interaction.channel.permissionOverwrites.edit(everyoneRole, { SendMessages: false });

    const embed = new EmbedBuilder()
      .setColor(config.colors.warning)
      .setTitle('🔒 Kanal gesperrt')
      .setDescription(`Der Kanal <#${interaction.channel.id}> wurde gesperrt.`);

    await interaction.reply({ embeds: [embed] });
  },
};
