export interface VoiceTokenEnv {
  XAI_API_KEY?: string;
  XAI_VOICE_AGENT_ID?: string;
  XAI_DEMO_AGENT_ID?: string;
}

export interface HandleVoiceTokenOptions {
  request: Request;
  env: VoiceTokenEnv;
  fetch: typeof fetch;
  now?: () => number;
  hits?: Map<string, number[]>;
}

const MINT_URL = "https://api.x.ai/v1/realtime/client_secrets";
const WINDOW_MS = 60_000;
const MAX_MINTS = 5;

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function clientIp(request: Request): string {
  const cf = request.headers.get("CF-Connecting-IP");
  if (cf) return cf;
  const xff = request.headers.get("X-Forwarded-For");
  if (xff) return xff.split(",")[0].trim();
  return "unknown";
}

async function wantsDemo(request: Request): Promise<boolean> {
  const text = await request.clone().text();
  if (!text.trim()) return false;
  try {
    const body = JSON.parse(text) as { demo?: unknown };
    return body?.demo === true;
  } catch {
    return false;
  }
}

function isRateLimited(
  ip: string,
  now: number,
  hits: Map<string, number[]>,
): boolean {
  const cutoff = now - WINDOW_MS;
  const timestamps = (hits.get(ip) ?? []).filter((t) => t > cutoff);

  if (timestamps.length >= MAX_MINTS) {
    hits.set(ip, timestamps);
    return true;
  }

  timestamps.push(now);
  hits.set(ip, timestamps);
  return false;
}

export async function handleVoiceToken({
  request,
  env,
  fetch: fetchFn,
  now = () => Date.now(),
  hits = new Map<string, number[]>(),
}: HandleVoiceTokenOptions): Promise<Response> {
  if (request.method !== "POST") {
    return json(405, { ok: false, error: "method" });
  }

  const apiKey = env.XAI_API_KEY?.trim();
  const demo = await wantsDemo(request);
  const agentId = demo
    ? env.XAI_DEMO_AGENT_ID?.trim() || env.XAI_VOICE_AGENT_ID?.trim()
    : env.XAI_VOICE_AGENT_ID?.trim();

  if (!apiKey || !agentId) {
    return json(500, { ok: false, error: "config" });
  }

  const ip = clientIp(request);
  if (isRateLimited(ip, now(), hits)) {
    return json(429, { ok: false, error: "rate_limited" });
  }

  try {
    const xaiRes = await fetchFn(MINT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expires_after: { seconds: 300 } }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!xaiRes.ok) {
      return json(502, { ok: false, error: "token_failed" });
    }

    const data = (await xaiRes.json()) as {
      value?: string;
      expires_at?: number;
    };

    if (!data.value || typeof data.expires_at !== "number") {
      return json(502, { ok: false, error: "token_failed" });
    }

    const url = `wss://api.x.ai/v1/realtime?agent_id=${encodeURIComponent(agentId)}`;

    return json(200, {
      ok: true,
      token: data.value,
      expiresAt: data.expires_at,
      url,
    });
  } catch {
    return json(502, { ok: false, error: "token_failed" });
  }
}
