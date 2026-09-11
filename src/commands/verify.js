const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Sendet das Verifizierungs-Panel.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.success)
      .setTitle('✅ Verifizierung')
      .setDescription('Klicke auf den Button, um dich zu verifizieren und Zugriff auf die Community zu erhalten.')
      .setFooter({ text: 'Astro Bot • Verification' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('verify_member')
        .setLabel('Jetzt verifizieren')
        .setEmoji('✅')
        .setStyle(ButtonStyle.Success)
    );

    await interaction.channel.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: 'Verifizierungs-Panel gesendet.', ephemeral: true });
  },
};
