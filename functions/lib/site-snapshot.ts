// Fetches a visitor's public web page and reduces it to the facts MoneyPenny needs
// for a critique. Only http(s), only public hostnames, capped size and time.

const MAX_BYTES = 500_000;
const TIMEOUT_MS = 8_000;

const URL_RE = /\b((?:https?:\/\/)?(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s<>"']*)?)/i;

export function findUrl(text: string): string | null {
  const m = text.match(URL_RE);
  if (!m) return null;
  let raw = m[1].replace(/[),.;!?]+$/, "");
  if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;
  try {
    const u = new URL(raw);
    if (!["http:", "https:"].includes(u.protocol)) return null;
    const h = u.hostname.toLowerCase();
    if (
      h === "localhost" ||
      h.endsWith(".local") ||
      h.endsWith(".internal") ||
      /^(\d{1,3}\.){3}\d{1,3}$/.test(h) ||
      h.includes(":")
    ) {
      return null;
    }
    // The Skool foyer link is ours to hand out, not a site to review.
    if (h.endsWith("skool.com")) return null;
    return u.toString();
  } catch {
    return null;
  }
}

const decode = (s: string) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();

const strip = (s: string) => decode(s.replace(/<[^>]+>/g, " "));

function all(html: string, re: RegExp, limit: number): string[] {
  const out: string[] = [];
  for (const m of html.matchAll(re)) {
    const t = strip(m[1] ?? "");
    if (t) out.push(t.slice(0, 160));
    if (out.length >= limit) break;
  }
  return out;
}

export interface SiteFacts {
  url: string;
  ok: boolean;
  error?: string;
  title?: string;
  description?: string;
  h1?: string[];
  h2Count?: number;
  https?: boolean;
  tel?: boolean;
  schema?: boolean;
  reviews?: boolean;
  images?: number;
  imagesNoAlt?: number;
  words?: number;
}

export async function snapshot(
  url: string,
  fetchFn: typeof fetch,
): Promise<{ prompt: string; facts: SiteFacts }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetchFn(url, {
      redirect: "follow",
      signal: ctrl.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; TheAgency-MoneyPenny/1.0; website review)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    const type = res.headers.get("content-type") ?? "";
    if (!type.includes("html")) {
      return {
        prompt: `WEBSITE SNAPSHOT: ${url} returned ${res.status} with content type "${type}", not a web page. Tell the visitor you could not read it.`,
        facts: { url, ok: false, error: "That address didn't return a web page." },
      };
    }
    const reader = res.body?.getReader();
    let html = "";
    if (reader) {
      const dec = new TextDecoder();
      let total = 0;
      while (total < MAX_BYTES) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        html += dec.decode(value, { stream: true });
      }
      reader.cancel().catch(() => {});
    }
    const finalUrl = res.url || url;
    const title = all(html, /<title[^>]*>([\s\S]*?)<\/title>/gi, 1)[0] ?? "(none)";
    const metaDesc =
      html.match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i)?.[1] ??
      html.match(/<meta[^>]+content=["']([^"']*)["'][^>]*name=["']description["']/i)?.[1] ??
      "(none)";
    const h1 = all(html, /<h1[^>]*>([\s\S]*?)<\/h1>/gi, 5);
    const h2 = all(html, /<h2[^>]*>([\s\S]*?)<\/h2>/gi, 15);
    const imgs = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
    const imgsNoAlt = imgs.filter((t) => !/\balt=["'][^"']+["']/i.test(t)).length;
    const hasTel = /href=["']tel:/i.test(html);
    const hasSchema = /"@type"\s*:\s*"(LocalBusiness|HomeAndConstructionBusiness|[A-Za-z]*Contractor|Electrician|Plumber|HVACBusiness|RoofingContractor|Locksmith|MovingCompany|HousePainter)"/i.test(html);
    const hasReviewsWord = /reviews?|testimonials?|stars?/i.test(html);
    const text = strip(
      html
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<noscript[\s\S]*?<\/noscript>/gi, " "),
    );
    const words = text ? text.split(" ").length : 0;
    const facts: SiteFacts = {
      url: finalUrl,
      ok: res.ok,
      error: res.ok ? undefined : `The site answered with an error (HTTP ${res.status}).`,
      title,
      description: decode(metaDesc),
      h1,
      h2Count: h2.length,
      https: finalUrl.startsWith("https://"),
      tel: hasTel,
      schema: hasSchema,
      reviews: hasReviewsWord,
      images: imgs.length,
      imagesNoAlt: imgsNoAlt,
      words,
    };
    const prompt = [
      `WEBSITE SNAPSHOT (fetched just now from ${finalUrl}, HTTP ${res.status}). Base every website observation only on this snapshot. Do not claim to know their rankings, traffic, or anything not shown here.`,
      `Title tag: ${title}`,
      `Meta description: ${decode(metaDesc)}`,
      `H1 headings: ${h1.length ? h1.join(" | ") : "(none)"}`,
      `H2 headings: ${h2.length ? h2.join(" | ") : "(none)"}`,
      `Uses HTTPS: ${finalUrl.startsWith("https://") ? "yes" : "no"}`,
      `Click-to-call phone link: ${hasTel ? "yes" : "no"}`,
      `Local business schema markup: ${hasSchema ? "yes" : "not found"}`,
      `Mentions reviews or testimonials: ${hasReviewsWord ? "yes" : "no"}`,
      `Images: ${imgs.length}, missing alt text: ${imgsNoAlt}`,
      `Approximate visible word count: ${words}`,
      `Visible text (first part): ${text.slice(0, 5000)}`,
    ].join("\n");
    return { prompt, facts };
  } catch (err) {
    const reason = err instanceof Error && err.name === "AbortError" ? "timed out" : "could not be reached";
    return {
      prompt: `WEBSITE SNAPSHOT: ${url} ${reason}. Tell the visitor you couldn't load it and ask them to double-check the address.`,
      facts: { url, ok: false, error: `The site ${reason}.` },
    };
  } finally {
    clearTimeout(timer);
  }
}
