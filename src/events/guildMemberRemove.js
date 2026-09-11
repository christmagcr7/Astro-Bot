const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'guildMemberRemove',
  async execute(member) {
    const guildId = member.guild.id;
    const settingsPath = path.join(__dirname, '..', '..', 'data', `${guildId}.json`);

    if (!fs.existsSync(settingsPath)) return;

    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    const channel = member.guild.channels.cache.get(settings.goodbyeChannelId);

    if (!channel) return;

    const baseMessage = settings.goodbyeMessage || 'Auf Wiedersehen (user)! 👋';
    const message = baseMessage
      .replace(/\(user\)/gi, `<@${member.id}>`)
      .replace(/\{user\}/gi, `<@${member.id}>`);

    await channel.send({ content: message }).catch(() => {});
  },
};
