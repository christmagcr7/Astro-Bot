const fs = require('fs');
const path = require('path');
const { findAiSupportChannel, joinAiSupport, speakInAiSupport } = require('../utils/aiSupport');

module.exports = {
  name: 'voiceStateUpdate',
  async execute(oldState, newState) {
    const settingsPath = path.join(__dirname, '..', '..', 'data', `${newState.guild.id}.json`);
    let settings = {};
    if (fs.existsSync(settingsPath)) {
      try {
        settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      } catch {
        settings = {};
      }
    }

    const aiSupportChannel = findAiSupportChannel(newState.guild);
    const supportVoiceChannelIds = [
      settings.supportVoiceId,
      settings.aiSupportVoiceId || aiSupportChannel?.id,
      settings.supportWaitroomId,
      '1544320340925096006',
    ].filter(Boolean);
    const supportNotificationChannelId = settings.supportNotificationId || '1544319828532273282';

    const member = newState.member;
    if (!member) return;

    if (member.user.bot) return;

    const joinedSupportVoice = !supportVoiceChannelIds.includes(oldState.channelId)
      && supportVoiceChannelIds.includes(newState.channelId);
    if (!joinedSupportVoice) return;

    const guild = newState.guild;
    const isAiSupportChannel = newState.channelId === settings.aiSupportVoiceId
      || newState.channelId === aiSupportChannel?.id;
    if (isAiSupportChannel) {
      await joinAiSupport(guild);
      await speakInAiSupport(guild, `Hallo ${member.displayName}. Ich bin der Astro AI Support. Du kannst deine Frage im Support Chat schreiben, und ich antworte dir per Sprache.`);
    }

    const supportChannel = guild.channels.cache.get(supportNotificationChannelId) || await guild.channels.fetch(supportNotificationChannelId).catch(() => null);

    if (!supportChannel) {
      console.warn(`Support notification channel ${supportNotificationChannelId} not found in guild ${guild.id}`);
      return;
    }

    const permissions = supportChannel.permissionsFor(guild.members.me);
    if (!permissions || !permissions.has('SendMessages')) {
      console.warn(`Bot lacks SendMessages permission in support channel ${supportNotificationChannelId}`);
      return;
    }

    await supportChannel.send({
      content: `📣 AI-Support benötigt: ${member} ist im Sprachchat <#${newState.channelId}>. Bitte schnell helfen!`,
    }).catch((error) => {
      console.error('Failed to send support voice alert:', error);
    });
  },
};
