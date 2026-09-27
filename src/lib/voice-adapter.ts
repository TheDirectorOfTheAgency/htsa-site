export interface VoiceSession {
  token: string;
  expiresAt: number;
  url: string;
}

export interface VoiceAdapter {
  connect(session: VoiceSession): Promise<void>;
  hangUp(): void;
}

import { MONEYPENNY_WEB_INSTRUCTIONS } from "./moneypenny-prompt";

const VOICE_RULES = `
# This is a live voice call from the website
- Speak in short, natural sentences. No lists read aloud as numbers, no markdown.
- Open with one quick, energetic line and a question about their trade and city. Never ask for their name.
- If they want their website reviewed, tell them to paste the address into the chat box on the page, where you can read it and they can copy your notes.
`.trim();

const SESSION_UPDATE = {
  type: "session.update",
  session: {
    instructions: `${MONEYPENNY_WEB_INSTRUCTIONS}\n\n${VOICE_RULES}`,
    tools: [],
    enable_noise_suppression: true,
    reasoning: { effort: "none" },
    audio: {
      input: { format: { type: "audio/pcm", rate: 24000 } },
      output: { format: { type: "audio/pcm", rate: 24000 }, speed: 1.1 },
    },
  },
};

function base64FromInt16(buffer: Int16Array): string {
  const bytes = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function floatToInt16(float32: Float32Array): Int16Array {
  const int16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return int16;
}

// Turn-taking is done in the browser: the realtime session does not end the caller's
// turn on its own, so after speech followed by a short silence we commit the audio
// buffer and ask for a response. Mic audio is not sent while MoneyPenny is talking
// (half-duplex), so her own voice leaking into the mic can't trigger a turn.
const SPEECH_RMS = 0.018;
const SILENCE_MS = 850;
const MIN_SPEECH_MS = 250;

function rms(buf: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
  return Math.sqrt(sum / buf.length);
}

export function createWebSocketAdapter(
  stream: MediaStream,
  onReady: () => void,
): VoiceAdapter {
  let ws: WebSocket | null = null;
  let audioContext: AudioContext | null = null;
  let processor: ScriptProcessorNode | null = null;
  let source: MediaStreamAudioSourceNode | null = null;
  let playbackContext: AudioContext | null = null;
  let nextPlayTime = 0;
  let responding = false;
  let respondAt = 0;
  let speaking = false;
  let speechStart = 0;
  let lastVoice = 0;
  // The hosted agent greets on connect with its console persona. Cancel that greeting and
  // ask for a fresh one once our instructions are in place.
  let greeting: "await" | "cancelling" | "done" = "await";
  let greetTimer: ReturnType<typeof setTimeout> | null = null;

  const send = (msg: unknown) => {
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
  };

  const agentTalking = () => {
    // Never stay locked out if a response event goes missing.
    if (responding && performance.now() - respondAt > 20000) responding = false;
    return responding || (playbackContext !== null && playbackContext.currentTime < nextPlayTime);
  };

  const cleanup = () => {
    if (greetTimer) clearTimeout(greetTimer);
    processor?.disconnect();
    source?.disconnect();
    audioContext?.close();
    playbackContext?.close();
    stream.getTracks().forEach((t) => t.stop());
    if (ws && ws.readyState <= WebSocket.OPEN) {
      ws.close();
    }
    ws = null;
    audioContext = null;
    processor = null;
    source = null;
    playbackContext = null;
    nextPlayTime = 0;
    responding = false;
    speaking = false;
  };

  return {
    async connect(session: VoiceSession) {
      return new Promise<void>((resolve, reject) => {
        ws = new WebSocket(session.url, [`xai-client-secret.${session.token}`]);

        ws.onopen = () => {
          send(SESSION_UPDATE);
          onReady();
          greetTimer = setTimeout(() => {
            if (greeting === "await") {
              greeting = "done";
              send({ type: "response.create" });
            }
          }, 1500);

          audioContext = new AudioContext({ sampleRate: 24000 });
          playbackContext = new AudioContext({ sampleRate: 24000 });
          void audioContext.resume();
          void playbackContext.resume();
          source = audioContext.createMediaStreamSource(stream);
          processor = audioContext.createScriptProcessor(2048, 1, 1);

          processor.onaudioprocess = (event) => {
            if (!ws || ws.readyState !== WebSocket.OPEN) return;
            if (agentTalking()) {
              speaking = false;
              return;
            }
            const input = event.inputBuffer.getChannelData(0);
            send({
              type: "input_audio_buffer.append",
              audio: base64FromInt16(floatToInt16(input)),
            });

            const now = performance.now();
            if (rms(input) > SPEECH_RMS) {
              if (!speaking) {
                speaking = true;
                speechStart = now;
              }
              lastVoice = now;
            } else if (speaking && now - lastVoice > SILENCE_MS) {
              speaking = false;
              if (lastVoice - speechStart >= MIN_SPEECH_MS) {
                responding = true;
                respondAt = now;
                send({ type: "input_audio_buffer.commit" });
                send({ type: "response.create" });
              } else {
                send({ type: "input_audio_buffer.clear" });
              }
            }
          };

          source.connect(processor);
          processor.connect(audioContext.destination);
          resolve();
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data as string);
            if (data.type === "response.created" && greeting === "await") {
              greeting = "cancelling";
              if (greetTimer) clearTimeout(greetTimer);
              responding = true;
              respondAt = performance.now();
              send({ type: "response.cancel" });
            } else if (data.type === "response.done" && greeting === "cancelling") {
              greeting = "done";
              send({ type: "input_audio_buffer.clear" });
              send({ type: "response.create" });
            } else if (greeting === "cancelling") {
              // Drop the old greeting's audio.
            } else if (data.type === "response.created") {
              responding = true;
              respondAt = performance.now();
            } else if (data.type === "response.done") {
              responding = false;
              // Drop anything captured while she was talking before the caller's next turn.
              send({ type: "input_audio_buffer.clear" });
            } else if (data.type === "response.output_audio.delta" && data.delta && playbackContext) {
              playPcmDelta(data.delta, playbackContext, () => nextPlayTime, (t) => {
                nextPlayTime = t;
              });
            }
          } catch {
            // ignore non-JSON frames
          }
        };

        ws.onerror = () => {
          cleanup();
          reject(new Error("socket"));
        };

        ws.onclose = () => {
          cleanup();
        };
      });
    },

    hangUp() {
      cleanup();
    },
  };
}

function playPcmDelta(
  base64: string,
  ctx: AudioContext,
  getNext: () => number,
  setNext: (t: number) => void,
) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const int16 = new Int16Array(bytes.buffer);
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) {
    float32[i] = int16[i] / (int16[i] < 0 ? 0x8000 : 0x7fff);
  }

  const buffer = ctx.createBuffer(1, float32.length, 24000);
  buffer.copyToChannel(float32, 0);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);

  const start = Math.max(ctx.currentTime, getNext());
  source.start(start);
  setNext(start + buffer.duration);
}
