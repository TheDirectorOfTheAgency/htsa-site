import { field, guardDemoPost, isGuardResponse, json, optionalField, readLimited } from "./demo-http";
import { inspectUrl, ipv4Parts, isPrivateAddress, normalizeHost } from "./public-url";

const MAX_BYTES = 500_000;
const TIMEOUT_MS = 8_000;
const MAX_REDIRECTS = 3;

export interface KeywordHit {
  term: string;
  inTitle: boolean;
  inH1: boolean;
  inMeta: boolean;
}

export interface SiteAnalysisReport {
  ok: boolean;
  error?: string;
  url?: string;
  finalUrl?: string;
  title?: string;
  metaDescription?: string;
  h1?: string[];
  https?: boolean;
  mobileViewport?: boolean;
  localBusinessSchema?: boolean;
  pageWeightBytes?: number;
  truncated?: boolean;
  phone?: string | null;
  address?: string | null;
  keywords?: {
    city: KeywordHit | null;
    service: KeywordHit | null;
  };
}

const decode = (value: string) =>
  value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, num) => String.fromCodePoint(Number(num)))
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();

const strip = (value: string) => decode(value.replace(/<[^>]+>/g, " "));

function all(html: string, re: RegExp, limit: number): string[] {
  const out: string[] = [];
  for (const match of html.matchAll(re)) {
    const text = strip(match[1] ?? "");
    if (text) out.push(text.slice(0, 180));
    if (out.length >= limit) break;
  }
  return out;
}

function metaContent(html: string, name: string): string {
  const re = new RegExp(
    `<meta[^>]+(?:name|property)=["']${name}["'][^>]*content=["']([^"']*)["']|<meta[^>]+content=["']([^"']*)["'][^>]*(?:name|property)=["']${name}["']`,
    "i",
  );
  const match = html.match(re);
  return decode(match?.[1] || match?.[2] || "");
}

function hasViewport(html: string): boolean {
  const tag = html.match(/<meta[^>]+name=["']viewport["'][^>]*>/i)?.[0] ?? html.match(/<meta[^>]+content=["'][^"']*width\s*=\s*device-width[^"']*["'][^>]*>/i)?.[0];
  if (!tag) return false;
  return /width\s*=\s*device-width/i.test(tag);
}

function hasLocalBusiness(html: string): boolean {
  if (/itemtype=["']https?:\/\/schema\.org\/(?:LocalBusiness|[A-Za-z]*(?:Business|Contractor)|Electrician|Plumber|Locksmith|HousePainter)["']/i.test(html)) {
    return true;
  }
  return /"@type"\s*:\s*(?:"(?:LocalBusiness|[A-Za-z]*(?:Business|Contractor)|Electrician|Plumber|HVACBusiness|RoofingContractor|Locksmith|HousePainter)"|\[[^\]]*"LocalBusiness"[^\]]*\])/i.test(
    html,
  );
}

function findPhone(html: string): string | null {
  const tel = html.match(/href=["']tel:([^"']+)["']/i);
  if (tel?.[1]) {
    try {
      return decode(decodeURIComponent(tel[1])).slice(0, 40);
    } catch {
      return decode(tel[1]).slice(0, 40);
    }
  }
  const text = strip(html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " "));
  const match = text.match(/(?:\+?1[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]\d{3}[\s.-]\d{4}/);
  return match ? match[0].trim().slice(0, 40) : null;
}

function addressFromJson(value: unknown, depth = 0): string | null {
  if (!value || depth > 8) return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = addressFromJson(item, depth + 1);
      if (found) return found;
    }
    return null;
  }
  if (typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const street = record.streetAddress;
  if (typeof street === "string" && street.trim()) {
    const parts = [street, record.addressLocality, record.addressRegion, record.postalCode]
      .filter((part): part is string => typeof part === "string" && part.trim().length > 0)
      .join(", ");
    return parts.slice(0, 180);
  }
  if (typeof record.address === "string") {
    const text = record.address.replace(/\s+/g, " ").trim();
    if (text.length > 8 && text.length < 180) return text;
  }
  for (const nested of Object.values(record)) {
    if (nested && typeof nested === "object") {
      const found = addressFromJson(nested, depth + 1);
      if (found) return found;
    }
  }
  return null;
}

function findAddress(html: string): string | null {
  for (const match of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const found = addressFromJson(JSON.parse(match[1]));
      if (found) return found;
    } catch {
      // ignore broken JSON-LD
    }
  }
  const tag = html.match(/<address[^>]*>([\s\S]*?)<\/address>/i);
  if (tag?.[1]) {
    const text = strip(tag[1]);
    if (text.length > 8 && text.length < 180) return text;
  }
  return null;
}

function keywordHit(term: string | undefined, title: string, h1: string[], meta: string): KeywordHit | null {
  if (!term) return null;
  const needle = term.toLowerCase().replace(/\s+/g, " ").trim();
  const has = (value: string) => value.toLowerCase().replace(/\s+/g, " ").includes(needle);
  return {
    term,
    inTitle: has(title),
    inH1: h1.some((line) => has(line)),
    inMeta: has(meta),
  };
}

export function analyzeHtml(html: string, finalUrl: string, bytes: number, truncated: boolean, city?: string, service?: string): SiteAnalysisReport {
  const title = all(html, /<title[^>]*>([\s\S]*?)<\/title>/gi, 1)[0] ?? "";
  const meta = metaContent(html, "description");
  const h1 = all(html, /<h1[^>]*>([\s\S]*?)<\/h1>/gi, 6);
  const declared = Number(html.length);
  return {
    ok: true,
    url: finalUrl,
    finalUrl,
    title,
    metaDescription: meta,
    h1,
    https: finalUrl.startsWith("https://"),
    mobileViewport: hasViewport(html),
    localBusinessSchema: hasLocalBusiness(html),
    pageWeightBytes: bytes || declared,
    truncated,
    phone: findPhone(html),
    address: findAddress(html),
    keywords: {
      city: keywordHit(city, title, h1, meta),
      service: keywordHit(service, title, h1, meta),
    },
  };
}

async function resolveHost(host: string, fetchFn: typeof fetch): Promise<string[]> {
  const ips: string[] = [];
  for (const type of ["A", "AAAA"]) {
    const res = await fetchFn(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(host)}&type=${type}`,
      {
        headers: { accept: "application/dns-json" },
        signal: AbortSignal.timeout(4_000),
      },
    );
    if (!res.ok) continue;
    const data = (await res.json()) as { Answer?: { data?: string }[] };
    for (const answer of data.Answer ?? []) {
      if (typeof answer.data === "string") ips.push(answer.data.replace(/\.$/, ""));
    }
  }
  return ips.filter((ip) => ipv4Parts(ip) !== null || ip.includes(":"));
}

async function classifyHost(
  url: URL,
  resolve: (host: string) => Promise<string[]>,
): Promise<"ok" | "blocked" | "dns"> {
  const host = normalizeHost(url.hostname);
  if (inspectUrl(url.toString()).ok === false || isPrivateAddress(host)) return "blocked";
  if (ipv4Parts(host) || host.includes(":")) return "ok";
  let ips: string[] = [];
  try {
    ips = await resolve(host);
  } catch {
    return "dns";
  }
  if (!ips.length) return "dns";
  if (ips.some((ip) => isPrivateAddress(ip))) return "blocked";
  return "ok";
}

export async function handleSiteAnalysis(opts: {
  request: Request;
  fetch: typeof fetch;
  hits: Map<string, number[]>;
  now?: () => number;
  resolve?: (host: string) => Promise<string[]>;
}): Promise<Response> {
  const guarded = await guardDemoPost(opts.request, opts.hits, opts.now?.() ?? Date.now());
  if (isGuardResponse(guarded)) return guarded;
  const urlRaw = field(guarded.body, "url", 2_000);
  if (!urlRaw) return json(400, { ok: false, error: "bad_request" });
  const inspected = inspectUrl(urlRaw);
  if (!inspected.ok) return json(400, { ok: false, error: inspected.error });
  const city = optionalField(guarded.body, "city", 80);
  const service = optionalField(guarded.body, "service", 80);
  const resolve = opts.resolve ?? ((host: string) => resolveHost(host, opts.fetch));

  let current = inspected.url;
  try {
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      const allowed = await classifyHost(current, resolve);
      if (allowed === "blocked") return json(400, { ok: false, error: "blocked_url" });
      if (allowed === "dns") return json(200, { ok: false, error: "unreachable", url: current.toString() });
      const res = await opts.fetch(current.toString(), {
        redirect: "manual",
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; HTSA-Demo/1.0; +https://hightickethomeservices.com/)",
          Accept: "text/html,application/xhtml+xml",
        },
      });
      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get("location");
        await res.body?.cancel().catch(() => {});
        if (!location || hop === MAX_REDIRECTS) return json(200, { ok: false, error: "unreachable", url: current.toString() });
        current = new URL(location, current);
        continue;
      }
      const type = res.headers.get("content-type") ?? "";
      if (!type.includes("html")) {
        await res.body?.cancel().catch(() => {});
        return json(200, { ok: false, error: "not_html", url: current.toString() });
      }
      const read = await readLimited(res, MAX_BYTES);
      const declared = Number(res.headers.get("content-length") ?? "");
      const weight = Number.isFinite(declared) && declared > read.bytes ? declared : read.bytes;
      const report = analyzeHtml(read.text, current.toString(), weight, read.truncated || (Number.isFinite(declared) && declared > read.bytes), city, service);
      report.finalUrl = current.toString();
      report.https = current.protocol === "https:";
      return json(200, report as unknown as Record<string, unknown>);
    }
  } catch {
    return json(200, { ok: false, error: "unreachable", url: current.toString() });
  }
  return json(200, { ok: false, error: "unreachable", url: current.toString() });
}
