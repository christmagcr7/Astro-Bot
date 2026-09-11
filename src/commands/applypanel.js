const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('applypanel')
    .setDescription('Sendet das Bewerbungs-Panel.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle('📝 Bewerbung')
      .setDescription('Du möchtest Teil unseres Teams werden? Klicke auf den Button. Astro Bot sendet dir die Bewerbungsfragen direkt per DM.')
      .addFields(
        { name: '📬 Ablauf', value: 'Fragen per DM beantworten\nAntworten werden an das Team weitergeleitet\nDas Team meldet sich bei dir', inline: false },
      )
      .setFooter({ text: 'Astro Bot • Bewerbungen' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('apply_start')
        .setLabel('Bewerbung starten')
        .setEmoji('📝')
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.channel.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: 'Bewerbungs-Panel gesendet.', ephemeral: true });
  },
};
