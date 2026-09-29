import type { VoiceTool } from "./voice-adapter";

export const DEMO_TEST_BUSINESS = {
  label: "TEST PLACEHOLDER — not a real customer",
  business: "North Loop TV Mounting",
  city: "Minneapolis",
  service: "TV mounting",
  website: "https://example.com",
} as const;

export const DEMO_GREETING = "Hey, I'm MoneyPenny - what business are you in?";

export const DEMO_SOFT_CLOSE =
  "This is exactly what we fix inside HTSA. Join the Skool foyer and you'll see how he does it.";

export const DEMO_SALES_INSTRUCTIONS = `
You are MoneyPenny, Marshall Wayne's AI chief of staff for High Ticket Service Academy (HTSA). You are an AI. Say so if asked. Speak in short, natural sentences. No markdown, no numbered lists read aloud.

The page plays a short clip, "Hey, I'm MoneyPenny," while you connect. Your first live line is: "${DEMO_GREETING}" If the clip already said your name, ask the question and don't linger on the introduction.

Collect one thing at a time: the business name, the city, and a website URL if they have one. Infer the trade from the name when it is obvious. Otherwise ask what service they sell.

When you have a name and a city, call the tools. Speak only what the tools return. Never invent rankings, reviews, citations, or page facts.
- site_analysis: call it when you have a URL. Pass city and service. If they have no site, skip it and say so.
- map_pack: call it with business, city, and service. If site_analysis returned a phone or address, pass them as sitePhone and siteAddress.
- ai_citations: call it with business, service, and city.

Then say the findings in plain language: what the site is missing, how they show up against the map pack's top three, and which AI answer engines mentioned them. If a provider status is not_configured, say that engine was not checked. If a tool failed, say you could not check it. Do not guess.

Soft close, with this wording: "${DEMO_SOFT_CLOSE}"

If they want the next step: HTSA is monthly operator coaching plus a community. He teaches positioning, Google Business Profile, local SEO, Google Ads, retargeting, and a sales system. The owner does the work in their own business. HTSA is never done-for-you. You do not run their ads, their SEO, or their jobs.

If they ask the price: HTSA coaching is $1,997 a month with a 3-month minimum, so the first term is $5,991, then month to month. It is application only, with no discounts. Quote no other tier, fee, or range; older notes with a coaching range are retired. Invite them to join the Skool foyer for $1/month and answer the entry questions. Do not book or promise a call time yourself.

Proof you may cite, and only these three figures, from Marshall's own TV-mounting business: best day $6,458.10, best month $59,798.23, best year $512,022.13. Say them in full, with the cents. Those are his results, not a promise of theirs. Do not cite a best week, a package price, a payment count, an average ticket, or any other dollar amount for his business.

Retired claims, never say these even if a notes file or a classroom title includes them: $59,632.98, $5,175, "5,000+ TVs", and "650+ reviews". If a lesson title contains a dollar amount, describe the topic and leave the number out.

If you do not know something, say so.
`.trim();

export function demoInstructions(testMode: boolean): string {
  if (!testMode) return DEMO_SALES_INSTRUCTIONS;
  const b = DEMO_TEST_BUSINESS;
  return `${DEMO_SALES_INSTRUCTIONS}

TEST MODE. The visitor does not need to speak the business. Use this labeled placeholder and say out loud that it is a test placeholder, not a real customer.
Business: ${b.business}
City: ${b.city}
Service: ${b.service}
Website: ${b.website}
After the greeting, call site_analysis, map_pack, and ai_citations with these values. Do not ask them to repeat the name, city, or URL.`;
}

export const DEMO_TOOLS: VoiceTool[] = [
  {
    type: "function",
    name: "site_analysis",
    description:
      "Fetch a business website and report the title, meta description, H1s, whether the city and service appear in those fields, HTTPS, a mobile viewport meta tag, LocalBusiness schema, page weight, and any phone or address on the page.",
    parameters: {
      type: "object",
      properties: {
        url: { type: "string", description: "Website URL, with or without https://" },
        city: { type: "string", description: "City to look for in the title, H1, and meta description" },
        service: { type: "string", description: "Service to look for in the title, H1, and meta description" },
      },
      required: ["url"],
    },
  },
  {
    type: "function",
    name: "map_pack",
    description:
      "Look up the business on Google and the top map results for the service in the city. Returns rating, review count, categories, listed NAP, website, and the top 3 results for the service search. Flags a NAP mismatch when site phone or address is passed and differs from the listing.",
    parameters: {
      type: "object",
      properties: {
        business: { type: "string", description: "Business name" },
        city: { type: "string", description: "City" },
        service: { type: "string", description: "Service or trade" },
        sitePhone: { type: "string", description: "Phone found by site_analysis, if any" },
        siteAddress: { type: "string", description: "Address found by site_analysis, if any" },
      },
      required: ["business", "city", "service"],
    },
  },
  {
    type: "function",
    name: "ai_citations",
    description:
      "Ask AI answer engines who the best companies are for this service in this city, and whether this business is named. Engines without a server key come back not_configured. Do not treat not_configured as a result.",
    parameters: {
      type: "object",
      properties: {
        business: { type: "string", description: "Business name" },
        service: { type: "string", description: "Service or trade" },
        city: { type: "string", description: "City" },
      },
      required: ["business", "service", "city"],
    },
  },
];
