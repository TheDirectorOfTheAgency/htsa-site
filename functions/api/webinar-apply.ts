/**
 * POST /api/webinar-apply
 *
 * Cloudflare Pages Function. Stores one free-webinar application.
 *
 * KV binding name: WEBINAR_APPLICATIONS
 * Create a KV namespace on the Pages project `htsa-preview` and bind it
 * under that name. If the binding is missing, this route returns 503 and
 * writes nothing.
 *
 * No Mailchimp. No email. No notifications.
 */

export const REVENUE_OPTIONS = [
  "Under $100k",
  "$100k–$250k",
  "$250k–$500k",
  "$500k–$1M",
  "Over $1M",
  "Prefer not to say",
] as const;

export const WHO_OPTIONS = [
  "Just me",
  "Me plus a helper or two",
  "I have a crew and I run the business side",
  "Someone else runs it day to day",
] as const;

export const MARKETING_OPTIONS = [
  "Google Business Profile",
  "A website",
  "City or service pages",
  "Google Ads",
  "Facebook or other ads",
  "Nothing yet",
] as const;

export const SIX_WEEKS_OPTIONS = [
  "Yes, I'll do the work",
  "Probably, depends on the season",
  "No, I'm looking for someone to do it for me",
] as const;

export interface ApplicationAnswers {
  trade: string;
  area: string;
  revenue: (typeof REVENUE_OPTIONS)[number];
  who: (typeof WHO_OPTIONS)[number];
  marketing: (typeof MARKETING_OPTIONS)[number][];
  sixWeeks: (typeof SIX_WEEKS_OPTIONS)[number];
  weekOne: string;
}

interface Env {
  WEBINAR_APPLICATIONS?: {
    put(key: string, value: string): Promise<void>;
  };
}

type Validation =
  | { ok: true; value: ApplicationAnswers }
  | { ok: false; errors: Record<string, string> };

const TEXT_MAX = 2000;
const WEEK_MAX = 4000;

function asRecord(input: unknown): Record<string, unknown> | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  return input as Record<string, unknown>;
}

function cleanText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > max) return null;
  return trimmed;
}

function oneOf<T extends string>(value: unknown, options: readonly T[]): T | null {
  if (typeof value !== "string") return null;
  return options.includes(value as T) ? (value as T) : null;
}

export function validateApplication(input: unknown): Validation {
  const body = asRecord(input);
  const errors: Record<string, string> = {};
  if (!body) {
    return { ok: false, errors: { form: "Send the seven answers as JSON." } };
  }

  const trade = cleanText(body.trade, TEXT_MAX);
  const area = cleanText(body.area, TEXT_MAX);
  const weekOne = cleanText(body.weekOne, WEEK_MAX);
  const revenue = oneOf(body.revenue, REVENUE_OPTIONS);
  const who = oneOf(body.who, WHO_OPTIONS);
  const sixWeeks = oneOf(body.sixWeeks, SIX_WEEKS_OPTIONS);

  if (!trade) errors.trade = "Answer this one.";
  if (!area) errors.area = "Answer this one.";
  if (!revenue) errors.revenue = "Pick one.";
  if (!who) errors.who = "Pick one.";
  if (!sixWeeks) errors.sixWeeks = "Pick one.";
  if (!weekOne) errors.weekOne = "Answer this one.";

  let marketing: ApplicationAnswers["marketing"] = [];
  if (!Array.isArray(body.marketing)) {
    errors.marketing = "Pick at least one.";
  } else {
    const unique = [...new Set(body.marketing)];
    const allowed = unique.every((item) =>
      MARKETING_OPTIONS.includes(item as (typeof MARKETING_OPTIONS)[number]),
    );
    if (!allowed || unique.length === 0) errors.marketing = "Pick at least one.";
    else marketing = unique as ApplicationAnswers["marketing"];
  }

  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    value: { trade: trade!, area: area!, revenue: revenue!, who: who!, marketing, sixWeeks: sixWeeks!, weekOne: weekOne! },
  };
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export async function handleWebinarApply(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") {
    return json({ ok: false, message: "Use POST." }, 405);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, message: "Send JSON.", errors: { form: "Send the seven answers as JSON." } }, 400);
  }

  const parsed = validateApplication(payload);
  if (!parsed.ok) {
    return json({ ok: false, message: "Check the questions and try again.", errors: parsed.errors }, 400);
  }

  const kv = env.WEBINAR_APPLICATIONS;
  if (!kv || typeof kv.put !== "function") {
    return json(
      {
        ok: false,
        error: "storage_unconfigured",
        binding: "WEBINAR_APPLICATIONS",
        message:
          "This preview cannot store applications yet. Add the KV binding WEBINAR_APPLICATIONS on the Pages project. Nothing was saved.",
      },
      503,
    );
  }

  const id = crypto.randomUUID();
  const submittedAt = new Date().toISOString();
  const record = { id, submittedAt, ...parsed.value };

  try {
    await kv.put(`application:${id}`, JSON.stringify(record));
  } catch {
    return json(
      {
        ok: false,
        error: "storage_failed",
        binding: "WEBINAR_APPLICATIONS",
        message: "The application could not be stored. Nothing was saved.",
      },
      500,
    );
  }

  return json({ ok: true, id }, 201);
}

export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
  return handleWebinarApply(context.request, context.env);
}

export async function onRequest(context: { request: Request; env: Env }): Promise<Response> {
  if (context.request.method === "POST") return onRequestPost(context);
  return json({ ok: false, message: "Use POST." }, 405);
}
