type AudioContextCtor = typeof AudioContext;

function audioCtor(): AudioContextCtor | null {
  if (typeof AudioContext !== "undefined") return AudioContext;
  const legacy = (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext;
  return legacy ?? null;
}

/** Create and resume an AudioContext in the same turn as the tap. iOS and visionOS Safari stay silent otherwise. */
export function createUnlockedAudio(): AudioContext {
  const Ctor = audioCtor();
  if (!Ctor) throw new Error("audio");
  // Use the hardware sample rate. The adapter resamples the microphone to 24 kHz.
  const ctx = new Ctor();
  const buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start(0);
  void ctx.resume().catch(() => {
    // A rejected resume must not reject the tap. Playback still starts on the next resume().
  });
  return ctx;
}
