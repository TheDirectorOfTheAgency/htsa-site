import { prefetchIntroClip } from "./intro-clip";
import type { VoiceSession } from "./voice-adapter";

const SKEW_MS = 15_000;

export class VoiceTokenError extends Error {
  constructor(readonly code: "busy" | "failed") {
    super(code);
    this.name = "VoiceTokenError";
  }
}

export function expiresAtMs(expiresAt: number): number {
  return expiresAt < 1e12 ? expiresAt * 1000 : expiresAt;
}

export function isTokenFresh(
  session: { expiresAt: number } | null,
  now = Date.now(),
  skew = SKEW_MS,
): boolean {
  if (!session) return false;
  return expiresAtMs(session.expiresAt) - skew > now;
}

export interface VoiceTokenCache {
  prefetch(): void;
  get(): Promise<VoiceSession>;
}

export function createVoiceTokenCache(options?: {
  body?: string;
  fetchImpl?: typeof fetch;
  now?: () => number;
}): VoiceTokenCache {
  const body = options?.body ?? "{}";
  const fetchImpl = options?.fetchImpl ?? fetch;
  const now = options?.now ?? (() => Date.now());
  let cached: VoiceSession | null = null;
  let inflight: Promise<VoiceSession> | null = null;

  const load = (): Promise<VoiceSession> => {
    if (cached && isTokenFresh(cached, now())) return Promise.resolve(cached);
    if (inflight) return inflight;
    inflight = fetchImpl("/api/voice-token", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
    })
      .then(async (res) => {
        if (res.status === 429) throw new VoiceTokenError("busy");
        const data = (await res.json().catch(() => null)) as {
          ok?: boolean;
          token?: string;
          expiresAt?: number;
          url?: string;
        } | null;
        if (!res.ok || !data?.ok || !data.token || typeof data.expiresAt !== "number" || !data.url) {
          throw new VoiceTokenError("failed");
        }
        const session: VoiceSession = {
          token: data.token,
          expiresAt: data.expiresAt,
          url: data.url,
        };
        cached = session;
        return session;
      })
      .finally(() => {
        inflight = null;
      });
    return inflight;
  };

  return {
    prefetch() {
      void load().catch(() => {});
    },
    get: () => load(),
  };
}

export function watchVoiceButton(button: HTMLElement, cache: VoiceTokenCache) {
  const prefetch = () => {
    cache.prefetch();
    void prefetchIntroClip();
  };
  button.addEventListener("pointerenter", prefetch);
  button.addEventListener("focus", prefetch);
  button.addEventListener("pointerdown", prefetch);
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) prefetch();
      },
      { rootMargin: "200px", threshold: 0.01 },
    );
    observer.observe(button);
  }
}
