const { parentPort } = require('worker_threads');

let transcriberPromise;

const getTranscriber = () => {
  if (!transcriberPromise) {
    transcriberPromise = import('@huggingface/transformers').then(({ pipeline }) => (
      pipeline('automatic-speech-recognition', 'onnx-community/whisper-tiny', { dtype: 'q8' })
    ));
  }
  return transcriberPromise;
};

parentPort.on('message', async ({ id, audio }) => {
  try {
    const transcriber = await getTranscriber();
    const result = await transcriber(new Float32Array(audio), {
      sampling_rate: 16000,
      language: 'german',
      task: 'transcribe',
    });
    parentPort.postMessage({ id, text: result.text?.trim() || null });
  } catch (error) {
    parentPort.postMessage({ id, error: error.message });
  }
});
