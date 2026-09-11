require('dotenv').config();

module.exports = {
  token: process.env.TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID,
  ownerId: process.env.OWNER_ID,
  colors: {
    primary: 0x6a5cff,
    secondary: 0x8b5cf6,
    success: 0x22c55e,
    danger: 0xef4444,
    warning: 0xf59e0b,
    info: 0x38bdf8,
    dark: 0x0f172a,
  },
  defaults: {
    ticketCategory: 'support',
    modlogChannelName: 'modlog',
    logChannelName: 'logs',
    ticketChannelName: 'tickets',
    welcomeChannelName: 'welcome',
    autoRoleName: 'Member',
  },
};
