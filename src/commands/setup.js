const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Konfiguriert Astro Bot für deinen Server.')
    .addChannelOption((option) =>
      option
        .setName('welcome_channel')
        .setDescription('Willkommenskanal')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    )
    .addChannelOption((option) =>
      option
        .setName('log_channel')
        .setDescription('Allgemeiner Log-Kanal')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    )
    .addChannelOption((option) =>
      option
        .setName('modlog_channel')
        .setDescription('Modlog-Kanal')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    )
    .addChannelOption((option) =>
      option
        .setName('ticket_channel')
        .setDescription('Ticket-Kanal')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    )
    .addChannelOption((option) =>
      option
        .setName('support_waitroom')
        .setDescription('Support-Warteraum')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    )
    .addChannelOption((option) =>
      option
        .setName('support_notification')
        .setDescription('Support-Benachrichtigung')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    )
    .addRoleOption((option) => option.setName('welcome_role').setDescription('Willkommensrolle').setRequired(false))
    .addStringOption((option) => option.setName('ticket_category').setDescription('Ticket-Kategorie').setRequired(false))
    .addRoleOption((option) => option.setName('auto_role').setDescription('Auto-Role').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    const guildId = interaction.guild.id;
    const settingsPath = path.join(__dirname, '..', '..', 'data', `${guildId}.json`);

    const existing = fs.existsSync(settingsPath)
      ? JSON.parse(fs.readFileSync(settingsPath, 'utf8'))
      : {
          welcomeChannelId: null,
          logChannelId: null,
          modlogChannelId: null,
          ticketChannelId: null,
          supportWaitroomId: '1544320340925096006',
          supportNotificationId: '1544319828532273282',
          welcomeRoleId: null,
          ticketCategory: 'support',
          autoRoleId: null,
          rpEnabled: false,
        };

    const welcomeChannel = interaction.options.getChannel('welcome_channel');
    const logChannel = interaction.options.getChannel('log_channel');
    const modlogChannel = interaction.options.getChannel('modlog_channel');
    const ticketChannel = interaction.options.getChannel('ticket_channel');
    const supportWaitroom = interaction.options.getChannel('support_waitroom');
    const supportNotification = interaction.options.getChannel('support_notification');
    const welcomeRole = interaction.options.getRole('welcome_role');
    const ticketCategory = interaction.options.getString('ticket_category');
    const autoRole = interaction.options.getRole('auto_role');

    if (welcomeChannel) existing.welcomeChannelId = welcomeChannel.id;
    if (logChannel) existing.logChannelId = logChannel.id;
    if (modlogChannel) existing.modlogChannelId = modlogChannel.id;
    if (ticketChannel) existing.ticketChannelId = ticketChannel.id;
    if (supportWaitroom) existing.supportWaitroomId = supportWaitroom.id;
    if (supportNotification) existing.supportNotificationId = supportNotification.id;
    if (welcomeRole) existing.welcomeRoleId = welcomeRole.id;
    if (ticketCategory) existing.ticketCategory = ticketCategory.toLowerCase();
    if (autoRole) existing.autoRoleId = autoRole.id;

    fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
    fs.writeFileSync(settingsPath, JSON.stringify(existing, null, 2));

    client.serverSettings.set(guildId, existing);

    const embed = new EmbedBuilder()
      .setColor(config.colors.success)
      .setTitle('✅ Astro Bot Setup')
      .setDescription('Die Konfiguration wurde gespeichert.')
      .addFields(
        { name: 'Willkommenskanal', value: welcomeChannel ? `<#${welcomeChannel.id}>` : existing.welcomeChannelId ? `<#${existing.welcomeChannelId}>` : 'Nicht gesetzt', inline: true },
        { name: 'Log Kanal', value: logChannel ? `<#${logChannel.id}>` : existing.logChannelId ? `<#${existing.logChannelId}>` : 'Nicht gesetzt', inline: true },
        { name: 'Modlog', value: modlogChannel ? `<#${modlogChannel.id}>` : existing.modlogChannelId ? `<#${existing.modlogChannelId}>` : 'Nicht gesetzt', inline: true },
        { name: 'Ticket Kanal', value: ticketChannel ? `<#${ticketChannel.id}>` : existing.ticketChannelId ? `<#${existing.ticketChannelId}>` : 'Nicht gesetzt', inline: true },
        { name: 'Support Warteraum', value: supportWaitroom ? `<#${supportWaitroom.id}>` : existing.supportWaitroomId ? `<#${existing.supportWaitroomId}>` : '1544320340925096006', inline: true },
        { name: 'Support Benachrichtigung', value: supportNotification ? `<#${supportNotification.id}>` : existing.supportNotificationId ? `<#${existing.supportNotificationId}>` : '1544319828532273282', inline: true },
        { name: 'Welcome Role', value: welcomeRole ? `${welcomeRole}` : existing.welcomeRoleId ? `<@&${existing.welcomeRoleId}>` : 'Nicht gesetzt', inline: true },
        { name: 'Auto Role', value: autoRole ? `${autoRole}` : existing.autoRoleId ? `<@&${existing.autoRoleId}>` : 'Nicht gesetzt', inline: true },
        { name: 'Ticket Kategorie', value: existing.ticketCategory || 'support', inline: true },
      );

    await interaction.reply({ embeds: [embed] });
  },
};
