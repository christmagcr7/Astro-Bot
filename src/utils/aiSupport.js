const {
  joinVoiceChannel,
  getVoiceConnection,
  VoiceConnectionStatus,
  entersState,
  createAudioPlayer,
  createAudioResource,
  StreamType,
  AudioPlayerStatus,
} = require('@discordjs/voice');
const googleTTS = require('google-tts-api');
const ffmpegPath = require('ffmpeg-static');
const { spawn } = require('child_process');
const https = require('https');
const { attachVoiceTranscription } = require('./voiceTranscription');
const { getAiAnswer } = require('./aiKnowledge');

const players = new Map();
const speechQueues = new Map();

const findAiSupportChannel = (guild) => guild.channels.cache.find((channel) => (
  channel.isVoiceBased() && channel.name.toLowerCase().includes('ai support')
));

const joinAiSupport = async (guild) => {
  const channel = findAiSupportChannel(guild);
  if (!channel) return null;

  const botMember = guild.members.me || await guild.members.fetchMe().catch(() => null);
  const permissions = botMember && channel.permissionsFor(botMember);
  if (!permissions?.has('ViewChannel') || !permissions.has('Connect') || !permissions.has('Speak')) {
    console.warn(`AI Support permissions missing in guild ${guild.id}`);
    return null;
  }

  const existing = getVoiceConnection(guild.id);
  if (existing && existing.joinConfig.channelId === channel.id) return existing;
  existing?.destroy();

  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: guild.id,
    adapterCreator: guild.voiceAdapterCreator,
    selfDeaf: false,
    selfMute: false,
  });

  connection.on('error', (error) => {
    console.error(`AI Support voice connection error in guild ${guild.id}:`, error.message);
  });

  try {
    await entersState(connection, VoiceConnectionStatus.Ready, 10_000);
    console.log(`AI Support voice connected: ${guild.name} / ${channel.name}`);
    attachVoiceTranscription(connection, guild, async (text, member) => {
      const answer = getAiAnswer(text);
      console.log(`AI Support question from ${member.user.tag}: ${text}`);
      await speakInAiSupport(guild, answer).catch((error) => {
        console.error(`AI Support answer failed in guild ${guild.id}:`, error.message);
      });
    });
  } catch (error) {
    console.error(`AI Support voice connection timeout in guild ${guild.id}:`, error.message);
    connection.destroy();
    return null;
  }

  return connection;
};

const speakInAiSupport = async (guild, text) => {
  const currentQueue = speechQueues.get(guild.id) || Promise.resolve();
  const nextSpeech = currentQueue
    .catch(() => {})
    .then(async () => {
      const connection = getVoiceConnection(guild.id) || await joinAiSupport(guild);
      if (!connection) return false;
      await entersState(connection, VoiceConnectionStatus.Ready, 10_000);

      let player = players.get(guild.id);
      if (!player) {
        player = createAudioPlayer();
        player.on('error', (error) => console.error(`AI Support TTS error in guild ${guild.id}:`, error.message));
        connection.subscribe(player);
        players.set(guild.id, player);
      }

      const audioUrl = googleTTS.getAudioUrl(text.slice(0, 180), {
        lang: 'de',
        slow: false,
        host: 'https://translate.google.com',
      });
      const ffmpeg = spawn(ffmpegPath, [
        '-i', 'pipe:0',
        '-f', 's16le',
        '-ar', '48000',
        '-ac', '2',
        'pipe:1',
      ], { windowsHide: true });

      await new Promise((resolve, reject) => {
        const request = https.get(audioUrl, (response) => {
          response.on('error', reject);
          response.pipe(ffmpeg.stdin);
        });
        request.setTimeout(10_000, () => {
          request.destroy(new Error('TTS download timed out'));
        });
        request.on('error', reject);
        ffmpeg.once('error', reject);
        ffmpeg.stdin.once('error', reject);
        ffmpeg.stdout.once('readable', resolve);
      });

      player.play(createAudioResource(ffmpeg.stdout, { inputType: StreamType.Raw }));
      await new Promise((resolve) => {
        const finish = () => {
          player.off(AudioPlayerStatus.Idle, finish);
          resolve();
        };
        player.once(AudioPlayerStatus.Idle, finish);
        setTimeout(finish, 20_000);
      });
      return true;
    });

  speechQueues.set(guild.id, nextSpeech);
  await nextSpeech.finally(() => {
    if (speechQueues.get(guild.id) === nextSpeech) speechQueues.delete(guild.id);
  });
  return nextSpeech;
};

module.exports = { findAiSupportChannel, joinAiSupport, speakInAiSupport };
