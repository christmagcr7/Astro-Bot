const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Setzt einen Benutzer für eine bestimmte Zeit in Timeout.')
    .addUserOption((option) => option.setName('user').setDescription('Benutzer').setRequired(true))
    .addIntegerOption((option) => option.setName('minutes').setDescription('Minuten').setRequired(true).setMinValue(1).setMaxValue(10080))
    .addStringOption((option) => option.setName('reason').setDescription('Grund').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const minutes = interaction.options.getInteger('minutes');
    const reason = interaction.options.getString('reason') || 'Kein Grund angegeben';
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (!member) {
      await interaction.reply({ content: 'Der Benutzer ist nicht auf diesem Server.', ephemeral: true });
      return;
    }

    await member.timeout(minutes * 60 * 1000, reason);

    const embed = new EmbedBuilder()
      .setColor(config.colors.warning)
      .setTitle('⏱️ Timeout gesetzt')
      .addFields(
        { name: 'User', value: `${user}`, inline: true },
        { name: 'Dauer', value: `${minutes} Minuten`, inline: true },
        { name: 'Grund', value: reason, inline: false },
      );

    await interaction.reply({ embeds: [embed] });
  },
};
