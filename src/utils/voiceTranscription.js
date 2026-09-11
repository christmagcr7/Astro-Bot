const { EndBehaviorType } = require('@discordjs/voice');
const prism = require('prism-media');
const path = require('path');
const { Worker } = require('worker_threads');

const activeListeners = new WeakSet();
let requestId = 0;
const pendingRequests = new Map();
const transcriptionWorker = new Worker(path.join(__dirname, 'stt-worker.js'));

transcriptionWorker.on('message', ({ id, text, error }) => {
  const request = pendingRequests.get(id);
  if (!request) return;
  pendingRequests.delete(id);
  if (error) request.reject(new Error(error));
  else request.resolve(text);
});

transcriptionWorker.on('error', (error) => {
  for (const request of pendingRequests.values()) request.reject(error);
  pendingRequests.clear();
});

const pcmToMono16k = (pcm) => {
  const sourceSamples = pcm.length / 2;
  const sourceFrames = sourceSamples / 2;
  const target = new Float32Array(Math.floor(sourceFrames / 3));
  for (let index = 0; index < target.length; index += 1) {
    const sourceFrame = index * 3;
    const left = pcm.readInt16LE((sourceFrame * 2) * 2) / 32768;
    const right = pcm.readInt16LE(((sourceFrame * 2) + 1) * 2) / 32768;
    target[index] = (left + right) / 2;
  }
  return target;
};

const transcribe = (pcm) => new Promise((resolve, reject) => {
  const id = requestId++;
  const timeout = setTimeout(() => {
    pendingRequests.delete(id);
    reject(new Error('Speech-to-text timed out'));
  }, 15_000);
  pendingRequests.set(id, {
    resolve: (text) => {
      clearTimeout(timeout);
      resolve(text);
    },
    reject: (error) => {
      clearTimeout(timeout);
      reject(error);
    },
  });
  transcriptionWorker.postMessage({ id, audio: pcmToMono16k(pcm) });
});

const attachVoiceTranscription = (connection, guild, onText) => {
  if (!connection?.receiver || activeListeners.has(connection)) return;
  activeListeners.add(connection);

  const activeUsers = new Set();
  let lastTranscriptionAt = 0;
  let transcriptionBusy = false;

  connection.receiver.speaking.on('start', (userId) => {
    const member = guild.members.cache.get(userId);
    if (!member || member.user.bot || activeUsers.has(userId)) return;
    activeUsers.add(userId);

    const opusStream = connection.receiver.subscribe(userId, {
      end: {
        behavior: EndBehaviorType.AfterSilence,
        duration: 1000,
      },
    });
    const decoder = new prism.opus.Decoder({ frameSize: 960, channels: 2, rate: 48000 });
    const chunks = [];

    opusStream.pipe(decoder);
    let bufferedBytes = 0;
    decoder.on('data', (chunk) => {
      if (bufferedBytes < 2 * 1024 * 1024) {
        chunks.push(chunk);
        bufferedBytes += chunk.length;
      }
    });
    decoder.once('end', async () => {
      activeUsers.delete(userId);
      if (!chunks.length || bufferedBytes < 12_000 || transcriptionBusy || Date.now() - lastTranscriptionAt < 1500) return;
      lastTranscriptionAt = Date.now();
      transcriptionBusy = true;
      try {
        const audio = Buffer.concat(chunks);
        const text = await transcribe(audio);
        if (text) await onText(text, member);
      } catch (error) {
        console.error(`Speech-to-text failed in guild ${guild.id}:`, error.message);
      } finally {
        transcriptionBusy = false;
      }
    });
    opusStream.on('error', (error) => {
      activeUsers.delete(userId);
      console.error('Voice receive error:', error.message);
    });
  });
};

module.exports = { attachVoiceTranscription };
