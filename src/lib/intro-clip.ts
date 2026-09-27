export interface IntroClip {
  stop(): void;
}

const INTRO_SRC = "/audio/moneypenny-hey.mp3";

let clipPromise: Promise<ArrayBuffer | null> | null = null;

/**
 * Warm the "Hey, I'm MoneyPenny" clip. A missing file resolves to null.
 * Never assign the URL to an HTMLAudioElement: WebKit crashes if that load 404s
 * while an AudioContext is running.
 */
export function prefetchIntroClip(src = INTRO_SRC): Promise<ArrayBuffer | null> {
  if (!clipPromise) {
    clipPromise = fetch(src)
      .then(async (res) => {
        if (!res.ok) {
          clipPromise = null;
          return null;
        }
        const bytes = await res.arrayBuffer();
        if (bytes.byteLength < 44) {
          clipPromise = null;
          return null;
        }
        return bytes;
      })
      .catch(() => {
        clipPromise = null;
        return null;
      });
  }
  return clipPromise;
}

/**
 * Play the clip through an already-unlocked AudioContext.
 * Missing file, decode error, or a closed context is a no-op so the live call still starts.
 */
export function playIntroClip(ctx: AudioContext, src = INTRO_SRC): IntroClip {
  let stopped = false;
  let source: AudioBufferSourceNode | null = null;
  void ctx.resume().catch(() => {});
  void prefetchIntroClip(src)
    .then(async (bytes) => {
      if (stopped || !bytes || ctx.state === "closed") {
        if (!bytes && !stopped) console.info("[moneypenny] intro clip unavailable");
        return;
      }
      const audio = await ctx.decodeAudioData(bytes.slice(0));
      if (stopped || ctx.state === "closed") return;
      source = ctx.createBufferSource();
      source.buffer = audio;
      source.connect(ctx.destination);
      source.start(0);
    })
    .catch(() => {
      if (!stopped) console.info("[moneypenny] intro clip unavailable");
    });
  return {
    stop() {
      if (stopped) return;
      stopped = true;
      try {
        source?.stop();
      } catch {
        // already ended
      }
    },
  };
}
