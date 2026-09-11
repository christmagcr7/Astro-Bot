const config = require('../config');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`✅ Astro Bot online: ${client.user.tag}`);
    client.user.setActivity('🚀 Astro Bot | /help', { type: 2 });

  },
};
