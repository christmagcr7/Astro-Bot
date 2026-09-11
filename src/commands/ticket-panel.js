const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-panel')
    .setDescription('Erstellt ein Ticket-Panel mit Kategorien.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    const { createTicketPanel } = require('../utils/tickets');
    await createTicketPanel(interaction, client);
  },
};
