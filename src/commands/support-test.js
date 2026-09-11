const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('support-test')
    .setDescription('Testet, ob der Support-Benachrichtigungs-Kanal erreichbar ist.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const guild = interaction.guild;
    const ids = ['1544319828532273282', '1544320340925096006'];
    const found = [];

    for (const id of ids) {
      const channel = guild.channels.cache.get(id) || await guild.channels.fetch(id).catch(() => null);
      if (channel) {
        found.push({ id, name: channel.name, type: channel.type, sendable: channel.permissionsFor(guild.members.me)?.has('SendMessages') });
      }
    }

    const embed = new EmbedBuilder()
      .setColor(found.length > 0 ? 0x22c55e : 0xef4444)
      .setTitle('🧪 Support-Check')
      .setDescription(found.length > 0 ? 'Support-Kanäle wurden gefunden.' : 'Kein Support-Kanal in dieser Guild gefunden.');

    if (found.length === 0) {
      embed.addFields({ name: 'Hinweis', value: 'Der Bot muss im selben Discord-Server sein wie die Support-Kanäle. Die aktuellen Support-IDs müssen in dieser Guild existieren.' });
    } else {
      for (const item of found) {
        embed.addFields({ name: `#${item.name}`, value: `ID: ${item.id}\nSendMessages: ${item.sendable ? 'Ja' : 'Nein'}`, inline: false });
      }
    }

    await interaction.reply({ embeds: [embed] });

    if (found.length > 0) {
      const target = found.find((item) => item.id === '1544319828532273282') || found[0];
      const channel = guild.channels.cache.get(target.id) || await guild.channels.fetch(target.id).catch(() => null);
      if (channel) {
        await channel.send({ content: `🧪 Testnachricht vom Astro Bot: Support-Benachrichtigung funktioniert.` }).catch((err) => {
          console.error('Support test send failed:', err);
        });
      }
    }
  },
};
