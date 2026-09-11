const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionsBitField, StringSelectMenuBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../config');

const SUPPORT_WAITROOM_ID = '1544320340925096006';
const SUPPORT_NOTIFICATION_ID = '1544319828532273282';

const findChannelByNames = (guild, names) => {
  const normalized = names.map((name) => name.toLowerCase());

  return guild.channels.cache.find((channel) => {
    if (!channel || channel.type !== ChannelType.GuildText) return false;
    const channelName = channel.name.toLowerCase();
    return normalized.some((name) => channelName === name || channelName.includes(name));
  });
};

const getGuildSettings = (guildId) => {
  const settingsPath = path.join(__dirname, '..', '..', 'data', `${guildId}.json`);
  if (!fs.existsSync(settingsPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  } catch {
    return null;
  }
};

const createTicket = async (interaction, client) => {
  await interaction.deferReply({ ephemeral: true });

  const guildId = interaction.guild.id;
  const settings = getGuildSettings(guildId) || {};
  const categoryName = (settings.ticketCategory || config.defaults.ticketCategory || 'support').toLowerCase();
  const supportNotificationId = settings.supportNotificationId || SUPPORT_NOTIFICATION_ID;
  const ticketCategory = interaction.guild.channels.cache.find((channel) => channel.type === ChannelType.GuildCategory && channel.name.toLowerCase() === categoryName) ||
    interaction.guild.channels.cache.find((channel) => channel.type === ChannelType.GuildCategory && channel.name.toLowerCase().includes(categoryName));
  const notificationChannel = interaction.guild.channels.cache.get(supportNotificationId)
    || interaction.guild.channels.cache.get(SUPPORT_NOTIFICATION_ID)
    || findChannelByNames(interaction.guild, ['support-chat', 'support-notification', 'support-bot', 'support-logs']);

  const channel = await interaction.guild.channels.create({
    name: `ticket-${interaction.user.username.toLowerCase()}`,
    type: ChannelType.GuildText,
    parent: ticketCategory ? ticketCategory.id : null,
    permissionOverwrites: [
      {
        id: interaction.guild.id,
        deny: [PermissionsBitField.Flags.ViewChannel],
      },
      {
        id: interaction.user.id,
        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory],
      },
      {
        id: interaction.guild.roles.everyone,
        deny: [PermissionsBitField.Flags.ViewChannel],
      },
    ],
  });

  client.ticketData.set(channel.id, {
    creatorId: interaction.user.id,
    category: categoryName,
    open: true,
  });

  const embed = new EmbedBuilder()
    .setColor(config.colors.primary)
    .setTitle(`🎫 Ticket: ${interaction.user.username}`)
    .setDescription('Ein Teammitglied wird sich in Kürze um dein Anliegen kümmern.')
    .addFields(
      { name: 'Erstellt von', value: `${interaction.user}`, inline: true },
      { name: 'Kategorie', value: categoryName, inline: true },
    )
    .setFooter({ text: 'Astro Bot • Ticket System' });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`ticket_close_${channel.id}`).setLabel('Ticket schließen').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId(`ticket_claim_${channel.id}`).setLabel('Ticket übernehmen').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`ticket_add_${channel.id}`).setLabel('Benutzer hinzufügen').setStyle(ButtonStyle.Primary)
  );

  await channel.send({ embeds: [embed], components: [row] });

  const resolvedNotification = notificationChannel || await interaction.guild.channels.fetch(supportNotificationId).catch(() => null) || await interaction.guild.channels.fetch(SUPPORT_NOTIFICATION_ID).catch(() => null);

  console.log(`Support debug: guild=${interaction.guild.id}, ticket=${channel.id}, notification=${resolvedNotification?.id || 'not-found'}`);

  if (resolvedNotification) {
    try {
      await resolvedNotification.send({
        embeds: [
          new EmbedBuilder()
            .setColor(config.colors.info)
            .setTitle('🎫 Support-Ticket erstellt')
            .setDescription('Ein neues Ticket wurde eröffnet.')
            .addFields(
              { name: 'Benutzer', value: `${interaction.user}`, inline: true },
              { name: 'Ticket', value: `<#${channel.id}>`, inline: true },
              { name: 'Kategorie', value: categoryName, inline: true },
            )
        ]
      });
    } catch (error) {
      console.error('Support notification failed:', error);
    }
  } else {
    console.warn(`Support notification channel not found for guild ${interaction.guild.id}. Tried ${supportNotificationId} and fallback names.`);
  }

  await interaction.editReply({ content: `Dein Ticket wurde erstellt: <#${channel.id}>` });
};

const closeTicket = async (interaction, client) => {
  const channel = interaction.channel;
  if (!channel || !channel.name.startsWith('ticket-')) {
    await interaction.reply({ content: 'Du kannst nur in einem Ticket-Channel dieses Kommando verwenden.', ephemeral: true });
    return;
  }

  const data = client.ticketData.get(channel.id) || { open: true };
  data.open = false;
  client.ticketData.set(channel.id, data);

  await channel.send({ embeds: [new EmbedBuilder().setColor(config.colors.warning).setTitle('🔒 Ticket geschlossen').setDescription('Dieses Ticket wurde geschlossen.')] });
  await interaction.reply({ content: 'Ticket wurde geschlossen.', ephemeral: true });
};

const addUserToTicket = async (interaction, client) => {
  const user = interaction.options.getUser('user');
  const channel = interaction.channel;
  if (!channel || !channel.name.startsWith('ticket-')) {
    await interaction.reply({ content: 'Dieses Kommando funktioniert nur in einem Ticket-Channel.', ephemeral: true });
    return;
  }

  await channel.permissionOverwrites.edit(user.id, {
    ViewChannel: true,
    SendMessages: true,
    ReadMessageHistory: true,
  });

  await interaction.reply({ content: `${user} wurde zum Ticket hinzugefügt.`, ephemeral: true });
};

const removeUserFromTicket = async (interaction, client) => {
  const user = interaction.options.getUser('user');
  const channel = interaction.channel;
  if (!channel || !channel.name.startsWith('ticket-')) {
    await interaction.reply({ content: 'Dieses Kommando funktioniert nur in einem Ticket-Channel.', ephemeral: true });
    return;
  }

  await channel.permissionOverwrites.edit(user.id, {
    ViewChannel: false,
  });

  await interaction.reply({ content: `${user} wurde aus dem Ticket entfernt.`, ephemeral: true });
};

const generateTranscript = async (interaction, client) => {
  const channel = interaction.channel;
  if (!channel || !channel.name.startsWith('ticket-')) {
    await interaction.reply({ content: 'Bitte nutze dieses Kommando in einem Ticket-Channel.', ephemeral: true });
    return;
  }

  const messages = await channel.messages.fetch({ limit: 100 });
  const transcript = messages
    .reverse()
    .map((m) => `${new Date(m.createdTimestamp).toISOString()} | ${m.author.tag}: ${m.content || '[Embed/Attachment]'}`)
    .join('\n');

  const filePath = path.join(__dirname, '..', '..', 'data', `transcript-${channel.id}.txt`);
  fs.writeFileSync(filePath, transcript, 'utf8');

  await interaction.reply({ content: `Transkript erstellt: ${filePath}`, ephemeral: true });
};

const createTicketPanel = async (interaction, client) => {
  await interaction.deferReply({ ephemeral: true });

  const recentMessages = await interaction.channel.messages.fetch({ limit: 100 }).catch(() => null);
  if (recentMessages) {
    const oldPanels = recentMessages.filter((message) => {
      if (message.author.id !== interaction.client.user.id) return false;
      const hasTicketSelect = message.components.some((row) =>
        row.components.some((component) => component.customId === 'ticket_category_select')
      );
      const hasOldTicketButton = message.components.some((row) =>
        row.components.some((component) => component.customId === 'ticket_create')
      );
      return hasTicketSelect || hasOldTicketButton;
    });

    await Promise.all(oldPanels.map((message) => message.delete().catch(() => {})));
  }
  
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('ticket_category_select')
    .setPlaceholder('Ticket-Kategorie auswählen')
    .addOptions([
      { label: 'Support', value: 'support', description: 'Probleme, Hilfe, Fragen' },
      { label: 'Bewerbung', value: 'bewerbung', description: 'Bewerbungen und Anfragen' },
      { label: 'Partnerschaft', value: 'partnerschaft', description: 'Kooperationen und Partnerschaften' },
      { label: 'Beschwerden', value: 'beschwerden', description: 'Beschwerden und Anliegen' },
      { label: 'Sonstiges', value: 'sonstiges', description: 'Andere Anfragen' },
    ]);

  const embed = new EmbedBuilder()
    .setColor(config.colors.primary)
    .setTitle('🎫 Support')
    .setDescription('Hast du ein Problem oder benötigst Hilfe?\nErstelle ein Ticket und unser Team hilft dir.')
    .setFooter({ text: 'Astro Bot • Ticket System' });

  const row = new ActionRowBuilder().addComponents(selectMenu);

  await interaction.channel.send({ embeds: [embed], components: [row] });
  await interaction.editReply({ content: 'Ticket-Panel erstellt.' });
};

const handleTicketButton = async (interaction, client) => {
  if (interaction.customId === 'ticket_create') {
    await createTicket(interaction, client);
    return;
  }

  if (interaction.customId.startsWith('ticket_close_')) {
    await interaction.deferReply({ ephemeral: true });
    const channelId = interaction.customId.replace('ticket_close_', '');
    const channel = interaction.guild.channels.cache.get(channelId);
    if (channel) {
      const data = client.ticketData.get(channel.id) || {};
      data.open = false;
      client.ticketData.set(channel.id, data);

      await channel.send({
        embeds: [new EmbedBuilder()
          .setColor(config.colors.warning)
          .setTitle('🔒 Ticket geschlossen')
          .setDescription('Dieses Ticket wird jetzt gelöscht.')],
      });
      await interaction.editReply({ content: 'Ticket geschlossen. Der Channel wird gelöscht.' });

      try {
        await channel.delete('Ticket geschlossen');
      } catch (error) {
        console.error('Ticket channel deletion failed:', error);
        await channel.permissionOverwrites.edit(interaction.guild.roles.everyone.id, {
          ViewChannel: false,
        }).catch(() => {});
        await channel.permissionOverwrites.edit(interaction.user.id, {
          SendMessages: false,
        }).catch(() => {});
        await interaction.followUp({
          content: 'Der Channel konnte nicht gelöscht werden. Er wurde stattdessen gesperrt. Prüfe die Berechtigung „Channels verwalten“.',
          ephemeral: true,
        }).catch(() => {});
      }
    } else {
      await interaction.editReply({ content: 'Ticket konnte nicht gefunden werden.' });
    }
    return;
  }

  if (interaction.customId.startsWith('ticket_claim_')) {
    await interaction.deferReply({ ephemeral: true });
    const channelId = interaction.customId.replace('ticket_claim_', '');
    const channel = interaction.guild.channels.cache.get(channelId);
    await interaction.editReply({ content: channel ? `Ticket übernommen von <@${interaction.user.id}>.` : 'Ticket konnte nicht gefunden werden.' });
    return;
  }

  if (interaction.customId.startsWith('ticket_add_')) {
    await interaction.reply({ content: 'Benutzer hinzufügen ist über den Slash-Command /ticket add möglich.', ephemeral: true });
  }
};

const handleTicketCategorySelect = async (interaction, client) => {
  await interaction.deferReply({ ephemeral: true });
  
  const category = interaction.values[0];
  
  const guildId = interaction.guild.id;
  const settings = getGuildSettings(guildId) || {};
  const categoryName = category.toLowerCase();
  const supportNotificationId = settings.supportNotificationId || SUPPORT_NOTIFICATION_ID;
  
  const ticketCategory = interaction.guild.channels.cache.find((channel) => 
    channel.type === ChannelType.GuildCategory && 
    channel.name.toLowerCase() === categoryName
  ) || interaction.guild.channels.cache.find((channel) => 
    channel.type === ChannelType.GuildCategory && 
    channel.name.toLowerCase().includes(categoryName)
  );

  const channel = await interaction.guild.channels.create({
    name: `${categoryName}-${interaction.user.username.toLowerCase()}`,
    type: ChannelType.GuildText,
    parent: ticketCategory ? ticketCategory.id : null,
    permissionOverwrites: [
      {
        id: interaction.guild.id,
        deny: [PermissionsBitField.Flags.ViewChannel],
      },
      {
        id: interaction.user.id,
        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory],
      },
      {
        id: interaction.guild.roles.everyone,
        deny: [PermissionsBitField.Flags.ViewChannel],
      },
    ],
  });

  client.ticketData.set(channel.id, {
    creatorId: interaction.user.id,
    category: categoryName,
    open: true,
  });

  const embed = new EmbedBuilder()
    .setColor(config.colors.primary)
    .setTitle(`🎫 Ticket: ${categoryName.charAt(0).toUpperCase() + categoryName.slice(1)}`)
    .setDescription('Ein Teammitglied wird sich in Kürze um dein Anliegen kümmern.')
    .addFields(
      { name: 'Erstellt von', value: `${interaction.user}`, inline: true },
      { name: 'Kategorie', value: categoryName, inline: true },
    )
    .setFooter({ text: 'Astro Bot • Ticket System' });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`ticket_close_${channel.id}`).setLabel('Ticket schließen').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId(`ticket_claim_${channel.id}`).setLabel('Ticket übernehmen').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`ticket_add_${channel.id}`).setLabel('Benutzer hinzufügen').setStyle(ButtonStyle.Primary)
  );

  await channel.send({ embeds: [embed], components: [row] });

  const resolvedNotification = await interaction.guild.channels.fetch(supportNotificationId).catch(() => null) || 
    await interaction.guild.channels.fetch(SUPPORT_NOTIFICATION_ID).catch(() => null);

  if (resolvedNotification) {
    try {
      await resolvedNotification.send({
        embeds: [
          new EmbedBuilder()
            .setColor(config.colors.info)
            .setTitle('🎫 Ticket erstellt')
            .setDescription(`Ein neues Ticket wurde eröffnet.`)
            .addFields(
              { name: 'Benutzer', value: `${interaction.user}`, inline: true },
              { name: 'Ticket', value: `<#${channel.id}>`, inline: true },
              { name: 'Kategorie', value: categoryName, inline: true },
            )
        ]
      });
    } catch (error) {
      console.error('Ticket notification failed:', error);
    }
  }

  await interaction.editReply({ content: `✅ Dein Ticket wurde erstellt: <#${channel.id}>` });
};

module.exports = {
  createTicket,
  closeTicket,
  addUserToTicket,
  removeUserFromTicket,
  generateTranscript,
  createTicketPanel,
  handleTicketButton,
  handleTicketCategorySelect,
};
