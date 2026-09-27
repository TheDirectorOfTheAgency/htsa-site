import { MONEYPENNY_WEB_INSTRUCTIONS } from "../../src/lib/moneypenny-prompt";
import { findUrl, snapshot } from "./site-snapshot";

export interface ChatEnv {
  XAI_API_KEY?: string;
  XAI_CHAT_MODEL?: string;
}

const CHAT_URL = "https://api.x.ai/v1/chat/completions";
export const DEFAULT_CHAT_MODEL = "grok-4.20-0309-non-reasoning";
// Website critiques get a model that thinks before it writes.
const CRITIQUE_MODEL = "grok-4.20-0309-reasoning";
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 12;
const MAX_TURNS = 24;
const MAX_CHARS = 2_000;

const TEXT_RULES = `
# This is the text chat on the website
- The visitor is typing, not talking. The page already introduced you, so never introduce yourself or say "Hi, I'm MoneyPenny". Your first sentence answers what they wrote.
- Write like a sharp salesperson texting: short paragraphs, and bullet points when you give steps or a list of fixes. Keep most replies under 180 words. Make the advice specific enough that they'd want to copy it and keep it.
- Never make up a specific price, minimum, or dollar figure for the visitor's business or trade. Tell them how to set it, not what it is. The only dollar figures you may state are Mr. Wayne's verified numbers above.
- Anyone can paste their website address. When a WEBSITE SNAPSHOT is provided, critique it like a high-ticket marketer: does the page lead with their highest-ticket services, does it speak to the wealthy customers they want, is there proof (reviews, photos of premium work, numbers), is the phone number clickable, and what basic SEO gaps show on the page (title tag, meta description, headings naming the service and city, local business schema, image alt text). Give the three to five most important fixes, in order. Only say what the snapshot supports. The website tells you their trade and market, so never ask for those after a critique; end by asking how they get customers today (Google Ads, Local Services Ads, Facebook Ads, Facebook Marketplace, TaskRabbit, Thumbtack, Angi).
- If they ask about their Google rankings, say you can only see the page itself here, and that ranking work is part of what The Agency covers.
- If a visitor hasn't said their trade and city yet and hasn't shared a website, ask, or invite them to paste their website for a quick critique.
`.trim();

// The page already greets the visitor in text, so drop the spoken opening-line section.
const BASE = MONEYPENNY_WEB_INSTRUCTIONS.replace(/# Opening line[\s\S]*?(?=\n# )/, "").replace(
  "you say so once in your opening line and whenever asked",
  "the page already tells visitors you are an AI; confirm it whenever asked",
);

type Msg = { role: "user" | "assistant"; content: string };

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function clientIp(request: Request): string {
  return (
    request.headers.get("CF-Connecting-IP") ??
    request.headers.get("X-Forwarded-For")?.split(",")[0].trim() ??
    "unknown"
  );
}

function limited(ip: string, now: number, hits: Map<string, number[]>): boolean {
  const recent = (hits.get(ip) ?? []).filter((t) => t > now - WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

function clean(body: unknown): Msg[] | null {
  const raw = (body as { messages?: unknown })?.messages;
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const msgs: Msg[] = [];
  for (const m of raw.slice(-MAX_TURNS)) {
    const role = (m as Msg)?.role;
    const content = (m as Msg)?.content;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") return null;
    const trimmed = content.trim().slice(0, MAX_CHARS);
    if (trimmed) msgs.push({ role, content: trimmed });
  }
  if (!msgs.length || msgs[msgs.length - 1].role !== "user") return null;
  return msgs;
}

export async function handleChat(opts: {
  request: Request;
  env: ChatEnv;
  fetch: typeof fetch;
  hits: Map<string, number[]>;
}): Promise<Response> {
  const { request, env, fetch: fetchFn, hits } = opts;
  if (request.method !== "POST") return json(405, { ok: false, error: "method" });
  const apiKey = env.XAI_API_KEY?.trim();
  if (!apiKey) return json(500, { ok: false, error: "config" });
  if (limited(clientIp(request), Date.now(), hits)) return json(429, { ok: false, error: "rate_limited" });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json(400, { ok: false, error: "bad_request" });
  }
  const msgs = clean(body);
  if (!msgs) return json(400, { ok: false, error: "bad_request" });

  const system: { role: "system"; content: string }[] = [
    { role: "system", content: `${BASE}\n\n${TEXT_RULES}` },
  ];
  const url = findUrl(msgs[msgs.length - 1].content);
  let factsLine = "";
  if (url) {
    const snap = await snapshot(url, fetchFn);
    system.push({ role: "system", content: snap.prompt });
    factsLine = `\u001eFACTS ${JSON.stringify(snap.facts)}\n`;
  }

  const upstream = await fetchFn(CHAT_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: url ? CRITIQUE_MODEL : env.XAI_CHAT_MODEL?.trim() || DEFAULT_CHAT_MODEL,
      messages: [...system, ...msgs],
      stream: true,
      max_tokens: url ? 2500 : 900,
      temperature: 0.6,
    }),
  });
  if (!upstream.ok || !upstream.body) return json(502, { ok: false, error: "upstream" });

  // Re-emit only the text deltas as a plain text stream.
  const enc = new TextEncoder();
  const dec = new TextDecoder();
  let buf = "";
  const out = upstream.body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      start(controller) {
        if (factsLine) controller.enqueue(enc.encode(factsLine));
      },
      transform(chunk, controller) {
        buf += dec.decode(chunk, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          const t = line.trim();
          if (!t.startsWith("data:")) continue;
          const data = t.slice(5).trim();
          if (data === "[DONE]") continue;
          try {
            const delta = JSON.parse(data)?.choices?.[0]?.delta?.content;
            if (typeof delta === "string" && delta) controller.enqueue(enc.encode(delta));
          } catch {
            // partial or non-JSON line
          }
        }
      },
    }),
  );
  return new Response(out, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
      "x-website-reviewed": url ? "1" : "0",
    },
  });
}
