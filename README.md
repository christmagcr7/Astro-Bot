# Astro Bot

Astro Bot ist ein moderner Discord-Bot für Community- und RP-Server mit Fokus auf Moderation, Tickets, Logging und Setup.

## Features

- Moderation: /ban, /kick, /timeout, /warn, /warnings, /clear, /unban, /lock, /unlock
- Ticket-System mit Ticket-Panel, Ticket-Kategorien und Ticket-Buttons
- Community: Welcome/Goodbye, Auto Role, Suggestions, Polls, Giveaways, Userinfo, Serverinfo, Avatar, Ping
- RP: optionale Aktivierung per /setup
- Logging: Discord-Logs für Join/Leave/Message/Moderation/Tickets/Server
- Space/Galaxy-Theme mit dunklem Design und violett-blauen Akzenten

## Setup

1. Install dependencies:
   npm install
2. Copy .env.example to .env and fill in your values.
3. Start the bot:
   npm start
4. Use /setup in Discord to configure welcome channel, log channel, modlog channel, ticket channel and more.

## Important

This project is intentionally lightweight and focused on slash commands, buttons, select menus, and embeds. It does not rely on an AI layer.
