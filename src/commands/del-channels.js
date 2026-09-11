const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../config');

const getSettingsPath = (guildId) => path.join(__dirname, '..', '..', 'data', `${guildId}.json`);

module.exports = {
  data: new SlashCommandBuilder()
    .setName('del-channels')
    .setDescription('Löscht die von Astro Bot erstellte Kanalstruktur.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    await interaction.deferReply({ ephemeral: true });

    const settingsPath = getSettingsPath(interaction.guild.id);
    let settings = {};
    if (fs.existsSync(settingsPath)) {
      try {
        settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      } catch {
        settings = {};
      }
    }

    const channels = interaction.guild.channels.cache;
    const orderedChannels = [...channels.values()].sort((a, b) => {
      const aIsCategory = a.type === ChannelType.GuildCategory ? 1 : 0;
      const bIsCategory = b.type === ChannelType.GuildCategory ? 1 : 0;
      return aIsCategory - bIsCategory;
    });

    const deleted = orderedChannels.length;

    delete settings.managedChannelIds;
    delete settings.welcomeChannelId;
    delete settings.verificationChannelId;
    delete settings.ticketChannelId;
    delete settings.supportNotificationId;
    delete settings.supportVoiceId;
    delete settings.aiSupportVoiceId;
    delete settings.supportWaitroomId;
    delete settings.officeChannelIds;
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    client.serverSettings.set(interaction.guild.id, settings);

    const embed = new EmbedBuilder()
      .setColor(config.colors.success)
      .setTitle('🗑️ Kanäle werden gelöscht')
      .setDescription(`Es werden jetzt alle ${deleted} Kanäle und Kategorien dieses Servers gelöscht.`);

    await interaction.editReply({ embeds: [embed] });

    for (const channel of orderedChannels) {
      await channel.delete('Astro Bot /del-channels - alle Kanäle').catch((error) => {
        console.error(`Could not delete channel ${channel.name}:`, error.message);
      });
    }
  },
};
