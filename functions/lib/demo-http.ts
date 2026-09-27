export function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
    },
  });
}

export function clientIp(request: Request): string {
  return (
    request.headers.get("CF-Connecting-IP") ??
    request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

export const DEMO_WINDOW_MS = 60_000;
export const DEMO_MAX = 10;

export function demoLimited(ip: string, now: number, hits: Map<string, number[]>): boolean {
  const recent = (hits.get(ip) ?? []).filter((t) => t > now - DEMO_WINDOW_MS);
  if (recent.length >= DEMO_MAX) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

export const demoHits = new Map<string, number[]>();

export async function guardDemoPost(
  request: Request,
  hits: Map<string, number[]>,
  now = Date.now(),
): Promise<{ body: unknown } | Response> {
  if (request.method !== "POST") return json(405, { ok: false, error: "method" });
  if (demoLimited(clientIp(request), now, hits)) return json(429, { ok: false, error: "rate_limited" });
  const text = await request.text();
  if (text.length > 8_000) return json(400, { ok: false, error: "bad_request" });
  if (!text.trim()) return { body: {} };
  try {
    return { body: JSON.parse(text) as unknown };
  } catch {
    return json(400, { ok: false, error: "bad_request" });
  }
}

export function isGuardResponse(value: { body: unknown } | Response): value is Response {
  return value instanceof Response;
}

export function field(body: unknown, key: string, max: number): string | null {
  if (!body || typeof body !== "object") return null;
  const value = (body as Record<string, unknown>)[key];
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/[\u0000-\u001f]+/g, " ").trim();
  if (!cleaned || cleaned.length > max) return null;
  return cleaned;
}

export function optionalField(body: unknown, key: string, max: number): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const value = (body as Record<string, unknown>)[key];
  if (value == null || value === "") return undefined;
  return field(body, key, max) ?? undefined;
}

export async function readLimited(res: Response, maxBytes: number): Promise<{ text: string; bytes: number; truncated: boolean }> {
  const reader = res.body?.getReader();
  if (!reader) return { text: "", bytes: 0, truncated: false };
  const dec = new TextDecoder();
  let bytes = 0;
  let text = "";
  let truncated = false;
  while (bytes < maxBytes) {
    const { done, value } = await reader.read();
    if (done) break;
    if (bytes + value.byteLength > maxBytes) {
      const slice = value.subarray(0, maxBytes - bytes);
      text += dec.decode(slice, { stream: true });
      bytes += slice.byteLength;
      truncated = true;
      break;
    }
    bytes += value.byteLength;
    text += dec.decode(value, { stream: true });
  }
  text += dec.decode();
  await reader.cancel().catch(() => {});
  return { text, bytes, truncated };
}
