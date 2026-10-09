import type { IntroClip } from "./intro-clip";
import { markFirstAudio, markSocketOpen } from "./voice-timing";

export interface VoiceSession {
  token: string;
  expiresAt: number;
  url: string;
}

export interface VoiceTool {
  type: "function";
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface VoiceToolCall {
  name: string;
  callId: string;
  args: unknown;
}

export interface VoiceAdapter {
  connect(session: VoiceSession): Promise<void>;
  attachMic(stream: MediaStream): void;
  hangUp(): void;
}

export interface VoiceAdapterOptions {
  playback: AudioContext;
  onReady: () => void;
  intro?: IntroClip;
  instructions?: string;
  tools?: VoiceTool[];
  onToolCall?: (call: VoiceToolCall) => Promise<unknown>;
}

interface SessionUpdate {
  type: "session.update";
  session: Record<string, unknown>;
}

/** Homepage sessions send audio format and server VAD only. The long prompt stays on the xAI agent. */
export function buildSessionUpdate(options?: {
  instructions?: string;
  tools?: VoiceTool[];
}): SessionUpdate {
  const session: Record<string, unknown> = {
    turn_detection: { type: "server_vad" },
    enable_noise_suppression: true,
    audio: {
      input: { format: { type: "audio/pcm", rate: 24000 } },
      output: { format: { type: "audio/pcm", rate: 24000 }, speed: 1.1 },
    },
  };
  if (!options?.instructions && !options?.tools?.length) {
    session.reasoning = { effort: "none" };
  }
  if (options?.instructions) session.instructions = options.instructions;
  if (options?.tools?.length) session.tools = options.tools;
  return { type: "session.update", session };
}

function base64FromInt16(buffer: Int16Array): string {
  const bytes = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
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

function resample(input: Float32Array, fromRate: number, toRate: number): Float32Array {
  if (fromRate === toRate) return input;
  const ratio = fromRate / toRate;
  const outLen = Math.max(1, Math.floor(input.length / ratio));
  const out = new Float32Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const pos = i * ratio;
    const i0 = Math.floor(pos);
    const i1 = Math.min(i0 + 1, input.length - 1);
    const t = pos - i0;
    out[i] = input[i0] * (1 - t) + input[i1] * t;
  }
  return out;
}

function decodePcm(base64: string, ctx: AudioContext): AudioBuffer | null {
  let binary = "";
  try {
    binary = atob(base64);
  } catch {
    return null;
  }
  if (binary.length < 2) return null;
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const samples = Math.floor(bytes.byteLength / 2);
  const int16 = new Int16Array(bytes.buffer, 0, samples);
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) {
    float32[i] = int16[i] / (int16[i] < 0 ? 0x8000 : 0x7fff);
  }
  const buffer = ctx.createBuffer(1, float32.length, 24000);
  buffer.copyToChannel(float32, 0);
  return buffer;
}

const MAX_QUEUED_CHUNKS = 80;

export function createWebSocketAdapter(options: VoiceAdapterOptions): VoiceAdapter {
  let ws: WebSocket | null = null;
  let processor: ScriptProcessorNode | null = null;
  let micSource: MediaStreamAudioSourceNode | null = null;
  let mute: GainNode | null = null;
  const playback = options.playback;
  const sources = new Set<AudioBufferSourceNode>();
  let nextPlayTime = 0;
  let responseActive = false;
  let handedOff = false;
  let markedAudio = false;
  let closed = false;
  let socketOpen = false;
  const queued: string[] = [];
  const pendingTools = new Map<string, Promise<void>>();
  let responseFinished = false;
  let needCreate = false;
  let epoch = 0;

  const send = (msg: unknown) => {
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
  };

  const handoff = () => {
    if (handedOff) return;
    handedOff = true;
    try {
      options.intro?.stop();
    } catch {
      // clip already stopped
    }
  };

  const flushPlayback = () => {
    handoff();
    for (const source of sources) {
      try {
        source.stop();
      } catch {
        // already ended
      }
    }
    sources.clear();
    nextPlayTime = playback.currentTime;
  };

  const enqueue = (audio: string) => {
    if (socketOpen && ws && ws.readyState === WebSocket.OPEN) {
      send({ type: "input_audio_buffer.append", audio });
      return;
    }
    queued.push(audio);
    if (queued.length > MAX_QUEUED_CHUNKS) queued.shift();
  };

  const flushQueue = () => {
    for (const audio of queued) send({ type: "input_audio_buffer.append", audio });
    queued.length = 0;
  };

  const waitForPlayback = () => {
    const delay = Math.max(0, nextPlayTime - playback.currentTime);
    if (delay <= 0.05) return Promise.resolve();
    return new Promise<void>((resolve) => {
      window.setTimeout(resolve, delay * 1000);
    });
  };

  const maybeContinue = async (seen: number) => {
    if (seen !== epoch || !needCreate || !responseFinished) return;
    if (pendingTools.size) {
      await Promise.all([...pendingTools.values()]);
      if (seen !== epoch || !needCreate) return;
    }
    await waitForPlayback();
    if (seen !== epoch || !needCreate || pendingTools.size) return;
    needCreate = false;
    responseFinished = false;
    send({ type: "response.create" });
  };

  const bargeIn = () => {
    epoch += 1;
    needCreate = false;
    flushPlayback();
    if (responseActive) {
      responseActive = false;
      send({ type: "response.cancel" });
    }
  };

  const schedulePcm = (base64: string) => {
    if (!markedAudio) {
      markedAudio = true;
      markFirstAudio();
    }
    handoff();
    void playback.resume();
    const buffer = decodePcm(base64, playback);
    if (!buffer) return;
    const source = playback.createBufferSource();
    source.buffer = buffer;
    source.connect(playback.destination);
    const startAt = Math.max(playback.currentTime, nextPlayTime);
    source.start(startAt);
    nextPlayTime = startAt + buffer.duration;
    sources.add(source);
    source.onended = () => sources.delete(source);
  };

  const handleTool = (event: { name?: string; call_id?: string; arguments?: unknown }) => {
    const name = event.name;
    const callId = event.call_id;
    if (!name || !callId) return;
    needCreate = true;
    const seen = epoch;
    let args: unknown = {};
    try {
      args = typeof event.arguments === "string" ? JSON.parse(event.arguments) : (event.arguments ?? {});
    } catch {
      args = {};
    }
    const task = (async () => {
      let output: unknown;
      try {
        output = options.onToolCall
          ? await options.onToolCall({ name, callId, args })
          : { ok: false, error: "unsupported" };
      } catch {
        output = { ok: false, error: "tool_failed" };
      }
      send({
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id: callId,
          output: JSON.stringify(output ?? { ok: false }),
        },
      });
    })().finally(() => {
      pendingTools.delete(callId);
    });
    pendingTools.set(callId, task);
    void task.then(() => maybeContinue(seen));
  };

  const cleanup = () => {
    if (closed) return;
    closed = true;
    socketOpen = false;
    handoff();
    flushPlayback();
    processor?.disconnect();
    micSource?.disconnect();
    mute?.disconnect();
    if (playback.state !== "closed") void playback.close();
    if (ws && ws.readyState <= WebSocket.OPEN) ws.close();
    ws = null;
    processor = null;
    micSource = null;
    mute = null;
  };

  return {
    connect(session) {
      return new Promise<void>((resolve, reject) => {
        let settled = false;
        const finish = (err?: Error) => {
          if (settled) return;
          settled = true;
          if (err) reject(err);
          else resolve();
        };

        ws = new WebSocket(session.url, [`xai-client-secret.${session.token}`]);

        ws.onopen = () => {
          if (closed) {
            finish(new Error("socket"));
            return;
          }
          socketOpen = true;
          markSocketOpen();
          send(
            buildSessionUpdate({
              instructions: options.instructions,
              tools: options.tools,
            }),
          );
          flushQueue();
          options.onReady();
          finish();
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data as string) as {
              type?: string;
              delta?: string;
              name?: string;
              call_id?: string;
              arguments?: unknown;
            };
            if (data.type === "input_audio_buffer.speech_started") {
              bargeIn();
            } else if (data.type === "response.created") {
              responseActive = true;
              responseFinished = false;
            } else if (
              data.type === "response.done" ||
              data.type === "response.cancelled" ||
              data.type === "response.canceled"
            ) {
              responseActive = false;
              responseFinished = true;
              void maybeContinue(epoch);
            } else if (data.type === "response.output_audio.delta" && data.delta) {
              schedulePcm(data.delta);
            } else if (data.type === "response.function_call_arguments.done") {
              handleTool(data);
            }
          } catch {
            // ignore non-JSON frames
          }
        };

        ws.onerror = () => {
          cleanup();
          finish(new Error("socket"));
        };

        ws.onclose = () => {
          const wasOpen = socketOpen;
          cleanup();
          if (!wasOpen) finish(new Error("socket"));
        };
      });
    },

    attachMic(stream) {
      if (closed || processor) return;
      micSource = playback.createMediaStreamSource(stream);
      processor = playback.createScriptProcessor(2048, 1, 1);
      mute = playback.createGain();
      mute.gain.value = 0;
      processor.onaudioprocess = (event) => {
        if (closed) return;
        const input = event.inputBuffer.getChannelData(0);
        const samples = resample(input, playback.sampleRate, 24000);
        enqueue(base64FromInt16(floatToInt16(samples)));
      };
      micSource.connect(processor);
      processor.connect(mute);
      mute.connect(playback.destination);
    },

    hangUp() {
      cleanup();
    },
  };
}
