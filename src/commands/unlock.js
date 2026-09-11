const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Entsperrt den aktuellen Kanal.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  async execute(interaction) {
    const everyoneRole = interaction.guild.roles.everyone;
    await interaction.channel.permissionOverwrites.edit(everyoneRole, { SendMessages: null });

    const embed = new EmbedBuilder()
      .setColor(config.colors.success)
      .setTitle('🔓 Kanal entsperrt')
      .setDescription(`Der Kanal <#${interaction.channel.id}> wurde entsperrt.`);

    await interaction.reply({ embeds: [embed] });
  },
};
