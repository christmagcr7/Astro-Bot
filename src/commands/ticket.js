const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Verwaltet Tickets für den Server.')
    .addSubcommand((sub) => sub.setName('create').setDescription('Erstellt ein neues Ticket'))
    .addSubcommand((sub) => sub.setName('close').setDescription('Schließt ein Ticket'))
    .addSubcommand((sub) => sub.setName('panel').setDescription('Erstellt ein Ticket-Panel'))
    .addSubcommand((sub) => sub.setName('add').setDescription('Fügt Benutzer zu einem Ticket hinzu').addUserOption((option) => option.setName('user').setDescription('Benutzer').setRequired(true)))
    .addSubcommand((sub) => sub.setName('remove').setDescription('Entfernt Benutzer aus einem Ticket').addUserOption((option) => option.setName('user').setDescription('Benutzer').setRequired(true)))
    .addSubcommand((sub) => sub.setName('transcript').setDescription('Erstellt eine Transkript-Datei für ein Ticket')),

  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();
    const { createTicket, closeTicket, addUserToTicket, removeUserFromTicket, generateTranscript, createTicketPanel } = require('../utils/tickets');

    if (sub === 'create') {
      await createTicket(interaction, client);
      return;
    }

    if (sub === 'close') {
      await closeTicket(interaction, client);
      return;
    }

    if (sub === 'panel') {
      await createTicketPanel(interaction, client);
      return;
    }

    if (sub === 'add') {
      await addUserToTicket(interaction, client);
      return;
    }

    if (sub === 'remove') {
      await removeUserFromTicket(interaction, client);
      return;
    }

    if (sub === 'transcript') {
      await generateTranscript(interaction, client);
      return;
    }
  },
};
