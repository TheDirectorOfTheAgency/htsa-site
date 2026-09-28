export interface VoiceSession {
  token: string;
  expiresAt: number;
  url: string;
}

export interface VoiceAdapter {
  connect(session: VoiceSession): Promise<void>;
  hangUp(): void;
}

const SESSION_UPDATE = {
  type: "session.update",
  session: {
    audio: {
      input: { format: { type: "audio/pcm", rate: 24000 } },
      output: { format: { type: "audio/pcm", rate: 24000 } },
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

  const cleanup = () => {
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
  };

  return {
    async connect(session: VoiceSession) {
      return new Promise<void>((resolve, reject) => {
        ws = new WebSocket(session.url, [`xai-client-secret.${session.token}`]);

        ws.onopen = () => {
          ws!.send(JSON.stringify(SESSION_UPDATE));
          onReady();

          audioContext = new AudioContext({ sampleRate: 24000 });
          playbackContext = new AudioContext({ sampleRate: 24000 });
          source = audioContext.createMediaStreamSource(stream);
          processor = audioContext.createScriptProcessor(4096, 1, 1);

          processor.onaudioprocess = (event) => {
            if (!ws || ws.readyState !== WebSocket.OPEN) return;
            const input = event.inputBuffer.getChannelData(0);
            const pcm16 = floatToInt16(input);
            ws.send(
              JSON.stringify({
                type: "input_audio_buffer.append",
                audio: base64FromInt16(pcm16),
              }),
            );
          };

          source.connect(processor);
          processor.connect(audioContext.destination);
          resolve();
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data as string);
            if (data.type === "response.output_audio.delta" && data.delta) {
              playPcmDelta(data.delta, playbackContext!, () => nextPlayTime, (t) => {
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
