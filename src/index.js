const { Client, GatewayIntentBits, Collection, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField, ChannelType, REST, Routes, Partials } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config');

const client = new Client({
  partials: [Partials.Channel],
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.DirectMessages,
  ],
});

client.commands = new Collection();
client.cooldowns = new Collection();
client.ticketData = new Map();
client.serverSettings = new Map();
client.rpSessions = new Map();
client.teamRoles = new Map();
client.applicationSessions = new Map();

const commands = [];

const getDisabledCommands = () => {
  const disabledPath = path.join(__dirname, '..', 'data', 'disabled-commands.json');
  if (!fs.existsSync(disabledPath)) return new Set();
  try {
    return new Set(JSON.parse(fs.readFileSync(disabledPath, 'utf8')));
  } catch {
    return new Set();
  }
};

const loadCommands = () => {
  const commandsDir = path.join(__dirname, 'commands');
  const disabledCommands = getDisabledCommands();
  for (const file of fs.readdirSync(commandsDir)) {
    if (!file.endsWith('.js')) continue;
    const command = require(path.join(commandsDir, file));
    if (command.data) {
      if (disabledCommands.has(command.data.name)) continue;
      client.commands.set(command.data.name, command);
      commands.push(command.data.toJSON());
    }
  }
};

const loadEvents = () => {
  const eventsDir = path.join(__dirname, 'events');
  for (const file of fs.readdirSync(eventsDir)) {
    if (!file.endsWith('.js')) continue;
    const event = require(path.join(eventsDir, file));
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else {
      client.on(event.name, (...args) => event.execute(...args, client));
    }
  }
};

const registerCommands = async () => {
  if (!config.token || !config.clientId) {
    console.warn('Missing TOKEN or CLIENT_ID. Skipping guild command registration.');
    return;
  }

  const rest = new REST({ version: '10' }).setToken(config.token);

  try {
    console.log('Refreshing application (/) commands...');
    if (config.guildId) {
      await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), {
        body: commands,
      });
      console.log('Successfully reloaded guild commands.');
    } else {
      await rest.put(Routes.applicationCommands(config.clientId), {
        body: commands,
      });
      console.log('Successfully reloaded global commands.');
    }
  } catch (error) {
    console.error('Failed to register commands:', error);
    if (error.code === 50001) {
      const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${config.clientId}&scope=bot%20applications.commands&permissions=8`;
      console.error('Discord fehlt der OAuth2-Scope applications.commands. Bot einmal über diesen Link neu installieren:');
      console.error(inviteUrl);
    }
  }
};

const createSystemEmbeds = () => {
  const info = new EmbedBuilder()
    .setColor(config.colors.primary)
    .setTitle('🚀 Astro Bot')
    .setDescription('Ein moderner Community- und RP-Discord-Bot mit Space/Galaxy-Design.')
    .addFields(
      { name: 'Moderation', value: 'Ban, Kick, Timeout, Warn, Clear, Lock, Unlock', inline: true },
      { name: 'Tickets', value: 'Support, Bewerbungen, Beschwerden und mehr', inline: true },
      { name: 'Community', value: 'Welcome, Logs, Suggestions, Polls, Giveaways', inline: true },
      { name: 'RP', value: 'Optionale Fraktions- und Charakter-Module', inline: true },
    )
    .setFooter({ text: 'Astro Bot • Space Theme' });

  return { info };
};

client.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction, client);
    } catch (error) {
      console.error(error);
      const reply = {
        content: 'Ein Fehler ist aufgetreten. Bitte versuche es später erneut.',
        ephemeral: true,
      };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(reply).catch(() => {});
      } else {
        await interaction.reply(reply).catch(() => {});
      }
    }
  }

  if (interaction.isButton()) {
    if (interaction.customId === 'apply_start') {
      const { questions } = require('./events/messageCreate');
      if (client.applicationSessions.has(interaction.user.id)) {
        await interaction.reply({ content: 'Du hast bereits eine laufende Bewerbung. Prüfe deine DMs.', ephemeral: true });
        return;
      }

      client.applicationSessions.set(interaction.user.id, {
        guildId: interaction.guild.id,
        answers: [],
      });
      await interaction.reply({ content: '📬 Ich habe dir die Bewerbungsfragen per DM geschickt.', ephemeral: true });
      await interaction.user.send(`📝 **Bewerbung gestartet**\n\n**Frage 1/${questions.length}:** ${questions[0]}`).catch(async () => {
        client.applicationSessions.delete(interaction.user.id);
        await interaction.followUp({ content: 'Ich konnte dir keine DM senden. Bitte aktiviere Direktnachrichten für diesen Server.', ephemeral: true });
      });
      return;
    }

    if (interaction.customId === 'verify_member') {
      const settingsPath = path.join(__dirname, '..', 'data', `${interaction.guild.id}.json`);
      let settings = {};
      if (fs.existsSync(settingsPath)) {
        try {
          settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        } catch {
          settings = {};
        }
      }

      const verifiedRoleId = settings.roleIds?.Verified || settings.autoRoleId;
      let verifiedRole = verifiedRoleId
        ? interaction.guild.roles.cache.get(verifiedRoleId)
        : interaction.guild.roles.cache.find((role) => role.name.toLowerCase() === 'verified');

      if (!verifiedRole) {
        verifiedRole = await interaction.guild.roles.create({
          name: 'Verified',
          color: 0x22c55e,
          hoist: true,
          mentionable: true,
          reason: 'Astro Bot verification setup',
        }).catch(() => null);
      }

      if (!verifiedRole) {
        await interaction.reply({ content: 'Die Verified-Rolle konnte nicht erstellt werden. Prüfe die Rollen-Berechtigung des Bots.', ephemeral: true });
        return;
      }

      if (interaction.member.roles.cache.has(verifiedRole.id)) {
        await interaction.reply({ content: '✅ Du bist bereits verifiziert.', ephemeral: true });
        return;
      }

      await interaction.member.roles.add(verifiedRole).catch(async () => {
        await interaction.reply({ content: 'Die Rolle konnte nicht vergeben werden. Die Bot-Rolle muss über der Verified-Rolle stehen.', ephemeral: true });
      });
      if (interaction.replied) return;
      await interaction.reply({ content: '✅ Du bist verifiziert! Willkommen auf dem Server.', ephemeral: true });
      return;
    }

    if (interaction.customId.startsWith('ticket_')) {
      const { handleTicketButton } = require('./utils/tickets');
      await handleTicketButton(interaction, client);
      return;
    }

    if (interaction.customId === 'astro_help') {
      const { info } = createSystemEmbeds();
      await interaction.reply({ embeds: [info], ephemeral: true });
    }
  }

  if (interaction.isStringSelectMenu()) {
    if (interaction.customId === 'ticket_category_select') {
      const { handleTicketCategorySelect } = require('./utils/tickets');
      await handleTicketCategorySelect(interaction, client);
      return;
    }

    if (interaction.customId === 'welcome_channel_select') {
      const guildId = interaction.guild.id;
      const selectedChannelId = interaction.values[0];
      const settingsPath = path.join(__dirname, 'data', `${guildId}.json`);
      const existing = fs.existsSync(settingsPath) ? JSON.parse(fs.readFileSync(settingsPath, 'utf8')) : { welcomeChannelId: null };
      existing.welcomeChannelId = selectedChannelId;
      fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
      fs.writeFileSync(settingsPath, JSON.stringify(existing, null, 2));
      client.serverSettings.set(guildId, existing);

      await interaction.reply({ content: `Willkommenskanal gesetzt: <#${selectedChannelId}>`, ephemeral: true });
    }
  }
});

(async () => {
  loadCommands();
  loadEvents();

  if (!config.token || config.token === 'YOUR_DISCORD_BOT_TOKEN' || config.token.startsWith('YOUR_')) {
    console.error('No valid Discord bot token found. Create a .env file with your real TOKEN from the Discord Developer Portal.');
    process.exit(1);
  }

  if (!config.clientId || config.clientId === 'YOUR_DISCORD_CLIENT_ID' || config.clientId.startsWith('YOUR_')) {
    console.error('No valid Discord client ID found. Update the .env file with your bot client ID.');
    process.exit(1);
  }

  await registerCommands();
  client.login(config.token);
})();
