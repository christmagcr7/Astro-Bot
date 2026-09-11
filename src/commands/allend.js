const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../config');

const commandsToRemove = new Set(['rools', 'del-channels', 'channels']);
const announcementTargets = [
  'welcome',
  'verify',
  'rules',
  'server-rules',
  'announcements',
  'changelog',
  'support',
  'helpdesk',
  'tickets',
  'team-chat',
];

const isTargetChannel = (channel) => {
  if (![ChannelType.GuildText, ChannelType.GuildAnnouncement].includes(channel.type)) return false;
  const name = channel.name.toLowerCase();
  return announcementTargets.some((target) => name.includes(target));
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('allend')
    .setDescription('Sendet die letzten Astro-Infos und entfernt ausgewählte Setup-Commands.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle('🌌 Astro Bot Information')
      .setDescription('Astro Bot ist für diesen Bereich eingerichtet. Bitte beachte die Informationen und Regeln dieses Servers.')
      .setFooter({ text: 'Astro Bot • Server Information' });

    const verifyEmbed = new EmbedBuilder()
      .setColor(config.colors.success)
      .setTitle('✅ Verifizierung')
      .setDescription('Bitte bestätige deine Verifizierung über die verfügbaren Server-Funktionen. Danach erhältst du Zugriff auf die Community.')
      .setFooter({ text: 'Astro Bot • Verification' });

    const rulesEmbed = new EmbedBuilder()
      .setColor(config.colors.warning)
      .setTitle('📜 Serverregeln')
      .setDescription('Respektiere alle Mitglieder, halte dich an Discord-Regeln und folge den Anweisungen des Teams. Werbung, Spam und Belästigung sind nicht erlaubt.')
      .setFooter({ text: 'Astro Bot • Rules' });

    let sent = 0;
    for (const channel of interaction.guild.channels.cache.values()) {
      if (!isTargetChannel(channel)) continue;

      const lowerName = channel.name.toLowerCase();
      const messageEmbed = lowerName.includes('verify')
        ? verifyEmbed
        : lowerName.includes('rule')
          ? rulesEmbed
          : embed;

      await channel.send({ embeds: [messageEmbed] }).then(() => {
        sent += 1;
      }).catch((error) => {
        console.error(`Could not send /allend message to ${channel.name}:`, error.message);
      });
    }

    const rest = new REST({ version: '10' }).setToken(config.token);
    const commandData = await rest.get(Routes.applicationGuildCommands(config.clientId, interaction.guild.id));
    const removed = [];

    for (const command of commandData) {
      if (!commandsToRemove.has(command.name)) continue;
      await rest.delete(Routes.applicationGuildCommand(config.clientId, interaction.guild.id, command.id)).then(() => {
        removed.push(command.name);
      }).catch((error) => {
        console.error(`Could not remove command ${command.name}:`, error.message);
      });
    }

    const disabledCommandsPath = path.join(__dirname, '..', '..', 'data', 'disabled-commands.json');
    fs.mkdirSync(path.dirname(disabledCommandsPath), { recursive: true });
    const disabledCommands = fs.existsSync(disabledCommandsPath)
      ? JSON.parse(fs.readFileSync(disabledCommandsPath, 'utf8'))
      : [];
    fs.writeFileSync(
      disabledCommandsPath,
      JSON.stringify([...new Set([...disabledCommands, ...commandsToRemove])], null, 2)
    );

    await interaction.editReply({
      content: `✅ ${sent} Info-Nachrichten gesendet. Entfernt: ${removed.length ? removed.map((name) => `/${name}`).join(', ') : 'keine'}.`,
    });
  },
};
