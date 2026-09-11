const { ChannelType, EmbedBuilder } = require('discord.js');
const config = require('../config');
const { speakInAiSupport } = require('../utils/aiSupport');
const { getAiAnswer } = require('../utils/aiKnowledge');

const questions = [
  'Wie heißt du und wie alt bist du?',
  'Für welchen Bereich möchtest du dich bewerben?',
  'Welche Erfahrungen bringst du mit?',
  'Warum möchtest du unser Team unterstützen?',
  'Wie viel Zeit kannst du pro Woche investieren?',
];

const getApplyChannel = (guild) => guild.channels.cache.find((channel) => (
  [ChannelType.GuildText, ChannelType.GuildAnnouncement].includes(channel.type)
  && ['apply', 'bewerbung'].some((name) => channel.name.toLowerCase().includes(name))
));

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    if (message.author.bot) return;

    if (!message.channel.isDMBased()) {
      if (!message.guild || !message.channel.name.toLowerCase().includes('support')) return;
      const answer = getAiAnswer(message.content);
      await speakInAiSupport(message.guild, answer).catch((error) => {
        console.error('AI Support answer failed:', error.message);
      });
      return;
    }

    const session = client.applicationSessions.get(message.author.id);
    if (!session) return;

    const answer = message.content.trim();
    if (!answer) return;

    session.answers.push(answer);
    const nextQuestion = questions[session.answers.length];

    if (nextQuestion) {
      await message.author.send(`**Frage ${session.answers.length + 1}/${questions.length}:** ${nextQuestion}`).catch(() => {});
      return;
    }

    const guild = client.guilds.cache.get(session.guildId);
    const applyChannel = guild ? getApplyChannel(guild) : null;
    const applicationEmbed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle('📝 Neue Bewerbung')
      .setDescription(`Bewerbung von ${message.author}`)
      .addFields(...questions.map((question, index) => ({
        name: question,
        value: session.answers[index].slice(0, 1024),
        inline: false,
      })))
      .setTimestamp();

    if (applyChannel) {
      await applyChannel.send({ embeds: [applicationEmbed] }).catch(() => {});
    }

    client.applicationSessions.delete(message.author.id);
    await message.author.send('✅ Deine Bewerbung wurde an das Team gesendet. Du bekommst eine Rückmeldung, sobald sie geprüft wurde.').catch(() => {});
  },
};

module.exports.questions = questions;
