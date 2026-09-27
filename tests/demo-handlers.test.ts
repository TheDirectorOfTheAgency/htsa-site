import { describe, expect, it, vi } from "vitest";
import { handleAiCitations } from "../functions/lib/ai-citations";
import { handleMapPack, napAddressMismatch, napPhoneMismatch } from "../functions/lib/map-pack";
import { inspectUrl } from "../functions/lib/public-url";
import { handleSiteAnalysis } from "../functions/lib/site-analysis";

const html = `<!doctype html>
<html><head>
<title>TV mounting in Minneapolis | North Loop</title>
<meta name="description" content="TV mounting for Minneapolis homes">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script type="application/ld+json">
{"@type":"LocalBusiness","name":"North Loop","address":{"streetAddress":"123 Main St","addressLocality":"Minneapolis","addressRegion":"MN"}}
</script>
</head><body>
<h1>TV mounting in Minneapolis</h1>
<a href="tel:+16125550100">Call</a>
</body></html>`;

function post(path: string, body: unknown, ip = "203.0.113.20") {
  return new Request(`https://example.com${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", "CF-Connecting-IP": ip },
    body: JSON.stringify(body),
  });
}

describe("public url guard", () => {
  it("blocks private, local, and non-http targets", () => {
    for (const raw of [
      "http://127.0.0.1/",
      "http://10.1.2.3/admin",
      "http://192.168.1.9/",
      "http://169.254.169.254/latest",
      "http://localhost/secret",
      "http://metadata.google.internal/",
      "http://0177.0.0.1/",
      "file:///etc/passwd",
      "http://user:pass@example.com/",
      "https://example.com:8080/",
    ]) {
      expect(inspectUrl(raw).ok, raw).toBe(false);
    }
    expect(inspectUrl("https://example.com/pricing").ok).toBe(true);
  });
});

describe("handleSiteAnalysis", () => {
  it("does not fetch a private address", async () => {
    const fetch = vi.fn();
    const res = await handleSiteAnalysis({
      request: post("/api/demo/site-analysis", { url: "http://127.0.0.1/" }),
      fetch,
      hits: new Map(),
      resolve: async () => ["93.184.216.34"],
    });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ ok: false, error: "blocked_url" });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("blocks a public hostname that resolves to a private address", async () => {
    const fetch = vi.fn();
    const res = await handleSiteAnalysis({
      request: post("/api/demo/site-analysis", { url: "https://rebind.example/" }),
      fetch,
      hits: new Map(),
      resolve: async () => ["10.0.0.8"],
    });
    expect(res.status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("does not follow a redirect onto a private host", async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response(null, { status: 302, headers: { location: "http://192.168.0.5/secret" } }),
    );
    const res = await handleSiteAnalysis({
      request: post("/api/demo/site-analysis", { url: "https://example.com/start" }),
      fetch,
      hits: new Map(),
      resolve: async () => ["93.184.216.34"],
    });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ ok: false, error: "blocked_url" });
    expect(fetch).toHaveBeenCalledOnce();
  });

  it("reports on-page facts and keyword hits", async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response(html, {
        status: 200,
        headers: { "content-type": "text/html; charset=utf-8" },
      }),
    );
    const res = await handleSiteAnalysis({
      request: post("/api/demo/site-analysis", {
        url: "example.com/tv",
        city: "Minneapolis",
        service: "TV mounting",
      }),
      fetch,
      hits: new Map(),
      resolve: async () => ["93.184.216.34"],
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.https).toBe(true);
    expect(body.title).toContain("Minneapolis");
    expect(body.h1).toEqual(["TV mounting in Minneapolis"]);
    expect(body.mobileViewport).toBe(true);
    expect(body.localBusinessSchema).toBe(true);
    expect(body.pageWeightBytes).toBeGreaterThan(100);
    expect(body.phone).toContain("612");
    expect(body.address).toContain("123 Main St");
    expect(body.keywords.city).toMatchObject({ inTitle: true, inH1: true, inMeta: true });
    expect(body.keywords.service).toMatchObject({ inTitle: true, inH1: true, inMeta: true });
    expect(body.keywords.service.inTitle).toBe(true);
  });

  it("rate limits per IP", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response("no", { status: 500, headers: { "content-type": "text/plain" } }));
    const hits = new Map<string, number[]>();
    for (let i = 0; i < 10; i++) {
      const res = await handleSiteAnalysis({
        request: post("/api/demo/site-analysis", { url: "https://example.com" }, "198.51.100.40"),
        fetch,
        hits,
        now: () => 1_000_000,
        resolve: async () => ["93.184.216.34"],
      });
      expect(res.status).not.toBe(429);
    }
    const blocked = await handleSiteAnalysis({
      request: post("/api/demo/site-analysis", { url: "https://example.com" }, "198.51.100.40"),
      fetch,
      hits,
      now: () => 1_000_000,
      resolve: async () => ["93.184.216.34"],
    });
    expect(blocked.status).toBe(429);
  });
});

describe("handleMapPack", () => {
  it("does not call Google when the key is missing", async () => {
    const fetch = vi.fn();
    const res = await handleMapPack({
      request: post("/api/demo/map-pack", { business: "North Loop TV Mounting", city: "Minneapolis", service: "TV mounting" }),
      env: {},
      fetch,
      hits: new Map(),
    });
    expect(await res.json()).toEqual({ ok: false, error: "not_configured" });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns the listing, top 3, and a NAP mismatch without leaking the key", async () => {
    const fetch = vi.fn().mockImplementation(async (_url: string, init?: RequestInit) => {
      const query = JSON.parse(String(init?.body)).textQuery as string;
      const places = query.startsWith("North")
        ? [
            {
              displayName: { text: "North Loop TV Mounting" },
              formattedAddress: "500 Oak Ave, Minneapolis, MN",
              nationalPhoneNumber: "(612) 555-0199",
              rating: 4.8,
              userRatingCount: 120,
              primaryType: "tv_mounting_service",
              primaryTypeDisplayName: { text: "TV mounting service" },
              types: ["tv_mounting_service", "point_of_interest"],
              websiteUri: "https://example.com",
            },
          ]
        : [
            { displayName: { text: "Alpha Mounts" }, rating: 4.9, userRatingCount: 80 },
            { displayName: { text: "Beta Mounts" }, rating: 4.2, userRatingCount: 10 },
            { displayName: { text: "Gamma Mounts" }, rating: 4.4, userRatingCount: 33 },
          ];
      return new Response(JSON.stringify({ places }), { status: 200 });
    });
    const res = await handleMapPack({
      request: post("/api/demo/map-pack", {
        business: "North Loop TV Mounting",
        city: "Minneapolis",
        service: "TV mounting",
        sitePhone: "(612) 555-0100",
        siteAddress: "123 Main St, Minneapolis",
      }),
      env: { GOOGLE_MAPS_API_KEY: "maps-secret" },
      fetch,
      hits: new Map(),
    });
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.business.rating).toBe(4.8);
    expect(body.business.reviewCount).toBe(120);
    expect(body.business.primaryCategory).toBe("TV mounting service");
    expect(body.business.phone).toBe("(612) 555-0199");
    expect(body.napMismatch.flagged).toBe(true);
    expect(body.napMismatch.phone).toBe(true);
    expect(body.competitors).toHaveLength(3);
    expect(body.competitorQuery).toBe("TV mounting in Minneapolis");
    expect(JSON.stringify(body)).not.toContain("maps-secret");
    const headers = fetch.mock.calls[0][1].headers as Record<string, string>;
    expect(headers["X-Goog-Api-Key"]).toBe("maps-secret");
  });

  it("treats the same phone and a longer address as a match", () => {
    expect(napPhoneMismatch("(612) 555-0100", "612.555.0100")).toBe(false);
    expect(napPhoneMismatch("(612) 555-0100", "612-555-0199")).toBe(true);
    expect(napAddressMismatch("123 Main St, Minneapolis", "123 Main Street, Minneapolis, MN")).toBe(false);
    expect(napAddressMismatch("123 Main St, Minneapolis", "999 Oak Avenue, Minneapolis")).toBe(true);
  });
});

describe("handleAiCitations", () => {
  it("reports every missing provider as not configured and does not invent companies", async () => {
    const fetch = vi.fn();
    const res = await handleAiCitations({
      request: post("/api/demo/ai-citations", { business: "North Loop TV Mounting", service: "TV mounting", city: "Minneapolis" }),
      env: {},
      fetch,
      hits: new Map(),
    });
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.query).toBe("Who are the best TV mounting companies in Minneapolis?");
    expect(body.providers.map((p: { provider: string; status: string }) => [p.provider, p.status])).toEqual([
      ["grok", "not_configured"],
      ["chatgpt", "not_configured"],
      ["claude", "not_configured"],
      ["gemini", "not_configured"],
    ]);
    expect(body.providers.every((provider: { companies?: unknown }) => provider.companies === undefined)).toBe(true);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("uses chat completions, then the responses web search, and only keeps grounded names", async () => {
    const fetch = vi.fn().mockImplementation(async (url: string) => {
      if (String(url).includes("/chat/completions")) return new Response("gone", { status: 410 });
      if (String(url).includes("/responses")) {
        return new Response(
          JSON.stringify({
            output: [
              { type: "web_search_call" },
              {
                type: "message",
                content: [
                  {
                    type: "output_text",
                    text: '{"companies":["North Loop TV Mounting","Other Mounts"],"summary":"A roundup named both."}',
                  },
                ],
              },
            ],
          }),
          { status: 200 },
        );
      }
      throw new Error(String(url));
    });
    const res = await handleAiCitations({
      request: post("/api/demo/ai-citations", { business: "North Loop TV Mounting", service: "TV mounting", city: "Minneapolis" }),
      env: { XAI_API_KEY: "xai-test-key", XAI_CHAT_MODEL: "grok-test" },
      fetch,
      hits: new Map(),
    });
    const body = await res.json();
    const grok = body.providers[0];
    expect(grok).toMatchObject({ provider: "grok", status: "ok", mentioned: true, search: "web" });
    expect(grok.companies).toEqual(["North Loop TV Mounting", "Other Mounts"]);
    expect(body.providers[1].status).toBe("not_configured");
    expect(JSON.stringify(body)).not.toContain("xai-test-key");
    expect(String(fetch.mock.calls[0][0])).toContain("/chat/completions");
    const chatBody = JSON.parse(fetch.mock.calls[0][1].body);
    expect(chatBody.model).toBe("grok-test");
  });

  it("does not return unsourced company names", async () => {
    const fetch = vi.fn().mockImplementation(async (url: string) => {
      if (String(url).includes("/chat/completions")) {
        return new Response(
          JSON.stringify({ choices: [{ message: { content: '{"companies":["Invented Co"],"summary":"guess"}' } }] }),
          { status: 200 },
        );
      }
      return new Response(
        JSON.stringify({
          output: [{ type: "message", content: [{ type: "output_text", text: '{"companies":["Invented Co"],"summary":"guess"}' }] }],
        }),
        { status: 200 },
      );
    });
    const res = await handleAiCitations({
      request: post("/api/demo/ai-citations", { business: "North Loop TV Mounting", service: "TV mounting", city: "Minneapolis" }),
      env: { XAI_API_KEY: "xai-test-key" },
      fetch,
      hits: new Map(),
    });
    const grok = (await res.json()).providers[0];
    expect(grok.status).toBe("error");
    expect(grok.search).toBe("unavailable");
    expect(grok.companies).toBeUndefined();
    expect(JSON.stringify(grok)).not.toContain("Invented Co");
  });
});
