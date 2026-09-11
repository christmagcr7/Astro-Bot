const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member, client) {
    const guildId = member.guild.id;
    const settingsPath = path.join(__dirname, '..', '..', 'data', `${guildId}.json`);

    if (!fs.existsSync(settingsPath)) return;

    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    const channel = member.guild.channels.cache.get(settings.welcomeChannelId);
    const role = settings.welcomeRoleId ? member.guild.roles.cache.get(settings.welcomeRoleId) : null;

    if (role) {
      await member.roles.add(role).catch(() => {});
    }

    if (channel) {
      const baseMessage = settings.welcomeMessage || 'Willkommen (user) auf dem Server! 👋';
      const message = baseMessage
        .replace(/\(user\)/gi, `<@${member.id}>`)
        .replace(/\{user\}/gi, `<@${member.id}>`);
      await channel.send({ content: message });
    }
  },
};
