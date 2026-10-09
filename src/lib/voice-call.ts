import { createUnlockedAudio } from "./audio-unlock";
import { playIntroClip, type IntroClip } from "./intro-clip";
import { createWebSocketAdapter, type VoiceAdapter, type VoiceTool, type VoiceToolCall } from "./voice-adapter";
import type { VoiceTokenCache } from "./voice-token-cache";

const MIC_CONSTRAINTS: MediaStreamConstraints = {
  audio: {
    channelCount: 1,
    sampleRate: 24000,
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
};

export interface BeginVoiceCallOptions {
  cache: VoiceTokenCache;
  playback: AudioContext;
  intro: IntroClip;
  onLive: () => void;
  instructions?: string;
  tools?: VoiceTool[];
  onToolCall?: (call: VoiceToolCall) => Promise<unknown>;
}

export interface VoiceCall {
  hangUp(): void;
  ready: Promise<void>;
}

export function beginVoiceCall(options: BeginVoiceCallOptions): VoiceCall {
  let adapter: VoiceAdapter | null = null;
  let stream: MediaStream | null = null;
  let stopped = false;

  const stop = () => {
    if (stopped) return;
    stopped = true;
    options.intro.stop();
    adapter?.hangUp();
    stream?.getTracks().forEach((track) => track.stop());
    if (!adapter && options.playback.state !== "closed") void options.playback.close();
  };

  const ready = (async () => {
    const micPromise = navigator.mediaDevices.getUserMedia(MIC_CONSTRAINTS).then((next) => {
      stream = next;
      if (stopped) {
        next.getTracks().forEach((track) => track.stop());
        return;
      }
      adapter?.attachMic(next);
    });

    const socketPromise = options.cache.get().then(async (session) => {
      if (stopped) return;
      adapter = createWebSocketAdapter({
        playback: options.playback,
        intro: options.intro,
        instructions: options.instructions,
        tools: options.tools,
        onToolCall: options.onToolCall,
        onReady: () => {
          if (!stopped) options.onLive();
        },
      });
      if (stream) adapter.attachMic(stream);
      await adapter.connect(session);
    });

    await Promise.all([micPromise, socketPromise]);
    if (stopped) stop();
  })();

  return { hangUp: stop, ready };
}

export function armVoiceGesture(): { playback: AudioContext; intro: IntroClip } {
  const playback = createUnlockedAudio();
  const intro = playIntroClip(playback);
  return { playback, intro };
}
