import { DEFAULT_CHAT_MODEL } from "./handle-chat";
import { field, guardDemoPost, isGuardResponse, json, readLimited } from "./demo-http";

export interface CitationProviderResult {
  provider: "grok" | "chatgpt" | "claude" | "gemini";
  status: "ok" | "not_configured" | "error";
  mentioned?: boolean;
  companies?: string[];
  query: string;
  search?: "web" | "unavailable";
  error?: string;
}

const JSON_RULES =
  'Use live web search if you can. Reply with JSON only, no markdown: {"companies":["Exact Business Name"],"summary":"one sentence"}. List only businesses the search results actually name. If you cannot search the live web, set summary to SEARCH_UNAVAILABLE and companies to [].';

function question(service: string, city: string): string {
  return `Who are the best ${service} companies in ${city}?`;
}

function norm(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function parseCompanies(text: string): string[] {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return [];
  try {
    const data = JSON.parse(text.slice(start, end + 1)) as { companies?: unknown; summary?: unknown };
    if (data.summary === "SEARCH_UNAVAILABLE") return [];
    if (!Array.isArray(data.companies)) return [];
    return data.companies
      .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      .map((item) => item.trim().slice(0, 120))
      .slice(0, 8);
  } catch {
    return [];
  }
}

export function businessMentioned(business: string, companies: string[], text: string): boolean {
  const needle = norm(business);
  if (needle.length < 3) return false;
  if (companies.some((company) => norm(company).includes(needle))) return true;
  return norm(text).includes(needle);
}

interface Extracted {
  text: string;
  searched: boolean;
  unavailable: boolean;
}

export function extractAnswer(payload: unknown): Extracted {
  if (!payload || typeof payload !== "object") return { text: "", searched: false, unavailable: false };
  const record = payload as Record<string, unknown>;

  const choice = (record.choices as { message?: { content?: unknown } }[] | undefined)?.[0]?.message?.content;
  if (typeof choice === "string") {
    const citations = record.citations;
    return {
      text: choice,
      searched: Array.isArray(citations) && citations.length > 0,
      unavailable: choice.includes("SEARCH_UNAVAILABLE"),
    };
  }

  let text = "";
  let searched = false;
  const output = record.output;
  if (Array.isArray(output)) {
    for (const item of output) {
      if (!item || typeof item !== "object") continue;
      const row = item as Record<string, unknown>;
      if (row.type === "web_search_call" || row.type === "web_search_tool_result") searched = true;
      const content = row.content;
      if (!Array.isArray(content)) continue;
      for (const part of content) {
        if (!part || typeof part !== "object") continue;
        const block = part as Record<string, unknown>;
        if (typeof block.text === "string") text += block.text;
        const annotations = block.annotations;
        if (Array.isArray(annotations) && annotations.some((ann) => (ann as { type?: string })?.type === "url_citation")) {
          searched = true;
        }
      }
    }
  }

  const contentBlocks = (record.content as unknown[]) ?? [];
  if (Array.isArray(record.content)) {
    for (const block of contentBlocks) {
      if (!block || typeof block !== "object") continue;
      const row = block as Record<string, unknown>;
      if (row.type === "server_tool_use" || row.type === "web_search_tool_result") searched = true;
      if (row.type === "text" && typeof row.text === "string") text += row.text;
    }
  }

  const candidates = record.candidates as { content?: { parts?: { text?: string }[] }; groundingMetadata?: unknown }[] | undefined;
  if (Array.isArray(candidates) && candidates[0]) {
    if (candidates[0].groundingMetadata) searched = true;
    for (const part of candidates[0].content?.parts ?? []) {
      if (typeof part.text === "string") text += part.text;
    }
  }

  return { text, searched, unavailable: text.includes("SEARCH_UNAVAILABLE") };
}

function groundedResult(
  provider: CitationProviderResult["provider"],
  query: string,
  business: string,
  extracted: Extracted,
): CitationProviderResult | null {
  if (!extracted.searched || extracted.unavailable) return null;
  const companies = parseCompanies(extracted.text);
  return {
    provider,
    status: "ok",
    mentioned: businessMentioned(business, companies, extracted.text),
    companies,
    query,
    search: "web",
  };
}

async function postJson(fetchFn: typeof fetch, url: string, headers: Record<string, string>, body: unknown): Promise<{ status: number; payload: unknown } | null> {
  try {
    const res = await fetchFn(url, {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(12_000),
    });
    const read = await readLimited(res, 200_000);
    let payload: unknown = null;
    try {
      payload = JSON.parse(read.text);
    } catch {
      payload = null;
    }
    return { status: res.status, payload };
  } catch {
    return null;
  }
}

async function askWithSearch(
  fetchFn: typeof fetch,
  attempts: { url: string; headers: Record<string, string>; body: unknown }[],
  provider: CitationProviderResult["provider"],
  query: string,
  business: string,
): Promise<CitationProviderResult> {
  let sawHttp = false;
  for (const attempt of attempts) {
    const result = await postJson(fetchFn, attempt.url, attempt.headers, attempt.body);
    if (!result) continue;
    sawHttp = true;
    if (result.status < 200 || result.status >= 300) continue;
    const grounded = groundedResult(provider, query, business, extractAnswer(result.payload));
    if (grounded) return grounded;
  }
  return {
    provider,
    status: "error",
    query,
    search: "unavailable",
    error: sawHttp ? "search_unavailable" : "upstream",
  };
}

function prompt(query: string): string {
  return `${JSON_RULES}\n\n${query}`;
}

async function askGrok(fetchFn: typeof fetch, apiKey: string, model: string, query: string, business: string): Promise<CitationProviderResult> {
  const headers = { Authorization: `Bearer ${apiKey}` };
  const user = prompt(query);
  return askWithSearch(
    fetchFn,
    [
      {
        url: "https://api.x.ai/v1/chat/completions",
        headers,
        body: {
          model,
          temperature: 0,
          messages: [
            { role: "system", content: JSON_RULES },
            { role: "user", content: query },
          ],
          tools: [{ type: "web_search" }],
        },
      },
      {
        url: "https://api.x.ai/v1/responses",
        headers,
        body: {
          model,
          temperature: 0,
          input: [{ role: "user", content: user }],
          tools: [{ type: "web_search" }],
        },
      },
    ],
    "grok",
    query,
    business,
  );
}

async function askOpenAI(fetchFn: typeof fetch, apiKey: string, model: string, query: string, business: string): Promise<CitationProviderResult> {
  const headers = { Authorization: `Bearer ${apiKey}` };
  const input = [{ role: "user", content: prompt(query) }];
  return askWithSearch(
    fetchFn,
    [
      {
        url: "https://api.openai.com/v1/responses",
        headers,
        body: { model, input, tools: [{ type: "web_search" }] },
      },
      {
        url: "https://api.openai.com/v1/responses",
        headers,
        body: { model, input, tools: [{ type: "web_search_preview" }] },
      },
    ],
    "chatgpt",
    query,
    business,
  );
}

async function askAnthropic(fetchFn: typeof fetch, apiKey: string, model: string, query: string, business: string): Promise<CitationProviderResult> {
  return askWithSearch(
    fetchFn,
    [
      {
        url: "https://api.anthropic.com/v1/messages",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: {
          model,
          max_tokens: 800,
          tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 3 }],
          messages: [{ role: "user", content: prompt(query) }],
        },
      },
    ],
    "claude",
    query,
    business,
  );
}

async function askGemini(fetchFn: typeof fetch, apiKey: string, model: string, query: string, business: string): Promise<CitationProviderResult> {
  return askWithSearch(
    fetchFn,
    [
      {
        url: `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        headers: { "x-goog-api-key": apiKey },
        body: {
          contents: [{ role: "user", parts: [{ text: prompt(query) }] }],
          tools: [{ google_search: {} }],
        },
      },
    ],
    "gemini",
    query,
    business,
  );
}

export interface CitationEnv {
  XAI_API_KEY?: string;
  XAI_CHAT_MODEL?: string;
  OPENAI_API_KEY?: string;
  OPENAI_CHAT_MODEL?: string;
  ANTHROPIC_API_KEY?: string;
  ANTHROPIC_CHAT_MODEL?: string;
  GEMINI_API_KEY?: string;
  GEMINI_CHAT_MODEL?: string;
}

export async function handleAiCitations(opts: {
  request: Request;
  env: CitationEnv;
  fetch: typeof fetch;
  hits: Map<string, number[]>;
  now?: () => number;
}): Promise<Response> {
  const guarded = await guardDemoPost(opts.request, opts.hits, opts.now?.() ?? Date.now());
  if (isGuardResponse(guarded)) return guarded;
  const business = field(guarded.body, "business", 120);
  const service = field(guarded.body, "service", 80);
  const city = field(guarded.body, "city", 80);
  if (!business || !service || !city) return json(400, { ok: false, error: "bad_request" });
  const query = question(service, city);
  const xai = opts.env.XAI_API_KEY?.trim();
  const openai = opts.env.OPENAI_API_KEY?.trim();
  const anthropic = opts.env.ANTHROPIC_API_KEY?.trim();
  const gemini = opts.env.GEMINI_API_KEY?.trim();
  const model = opts.env.XAI_CHAT_MODEL?.trim() || DEFAULT_CHAT_MODEL;

  const [grok, chatgpt, claude, geminiResult] = await Promise.all([
    xai
      ? askGrok(opts.fetch, xai, model, query, business)
      : Promise.resolve<CitationProviderResult>({ provider: "grok", status: "not_configured", query }),
    openai
      ? askOpenAI(opts.fetch, openai, opts.env.OPENAI_CHAT_MODEL?.trim() || "gpt-4.1-mini", query, business)
      : Promise.resolve<CitationProviderResult>({ provider: "chatgpt", status: "not_configured", query }),
    anthropic
      ? askAnthropic(opts.fetch, anthropic, opts.env.ANTHROPIC_CHAT_MODEL?.trim() || "claude-sonnet-4-5", query, business)
      : Promise.resolve<CitationProviderResult>({ provider: "claude", status: "not_configured", query }),
    gemini
      ? askGemini(opts.fetch, gemini, opts.env.GEMINI_CHAT_MODEL?.trim() || "gemini-2.5-flash", query, business)
      : Promise.resolve<CitationProviderResult>({ provider: "gemini", status: "not_configured", query }),
  ]);

  return json(200, { ok: true, query, providers: [grok, chatgpt, claude, geminiResult] });
}
