import { field, guardDemoPost, isGuardResponse, json, optionalField, readLimited } from "./demo-http";

const PLACES_URL = "https://places.googleapis.com/v1/places:searchText";
const FIELD_MASK = [
  "places.displayName",
  "places.formattedAddress",
  "places.nationalPhoneNumber",
  "places.rating",
  "places.userRatingCount",
  "places.types",
  "places.primaryType",
  "places.primaryTypeDisplayName",
  "places.websiteUri",
].join(",");

const GENERIC_TYPES = new Set([
  "point_of_interest",
  "establishment",
  "store",
  "premise",
  "political",
  "geocode",
  "route",
  "street_address",
]);

interface Place {
  displayName?: { text?: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  rating?: number;
  userRatingCount?: number;
  types?: string[];
  primaryType?: string;
  primaryTypeDisplayName?: { text?: string };
  websiteUri?: string;
}

const ABBREV: Record<string, string> = {
  st: "street",
  ave: "avenue",
  blvd: "boulevard",
  rd: "road",
  dr: "drive",
  ln: "lane",
  hwy: "highway",
  n: "north",
  s: "south",
  e: "east",
  w: "west",
  ste: "suite",
  apt: "apartment",
};

export function normAddr(value: string): string {
  return value
    .toLowerCase()
    .replace(/[.,#]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => ABBREV[word] ?? word)
    .join(" ");
}

export function phoneDigits(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
}

export function napPhoneMismatch(site: string, listed: string): boolean {
  const a = phoneDigits(site);
  const b = phoneDigits(listed);
  if (a.length < 7 || b.length < 7) return false;
  return a !== b;
}

export function napAddressMismatch(site: string, listed: string): boolean {
  const a = normAddr(site);
  const b = normAddr(listed);
  if (!a || !b) return false;
  const num = (value: string) => value.match(/\b(\d{2,6})\b/)?.[1] ?? null;
  const na = num(a);
  const nb = num(b);
  if (na && nb && na !== nb) return true;
  if (a.includes(b) || b.includes(a)) return false;
  const at = a.split(" ");
  const bt = new Set(b.split(" "));
  const shared = at.filter((token) => bt.has(token)).length;
  return shared / Math.min(at.length, bt.size) < 0.6;
}

function humanize(type: string): string {
  return type.replace(/_/g, " ");
}

function summarize(place: Place) {
  const primary = place.primaryTypeDisplayName?.text || (place.primaryType ? humanize(place.primaryType) : null);
  const secondary = (place.types ?? [])
    .filter((type) => type !== place.primaryType && !GENERIC_TYPES.has(type))
    .slice(0, 4)
    .map(humanize);
  return {
    name: place.displayName?.text ?? null,
    rating: typeof place.rating === "number" ? place.rating : null,
    reviewCount: typeof place.userRatingCount === "number" ? place.userRatingCount : null,
    primaryCategory: primary,
    secondaryCategories: secondary,
    phone: place.nationalPhoneNumber ?? null,
    address: place.formattedAddress ?? null,
    website: place.websiteUri ?? null,
  };
}

function normName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function pickBusiness(places: Place[], business: string): { place: Place | null; nameMatch: boolean } {
  if (!places.length) return { place: null, nameMatch: false };
  const needle = normName(business);
  const hit = places.find((place) => {
    const name = normName(place.displayName?.text ?? "");
    return name.includes(needle) || (needle.includes(name) && name.length >= 4);
  });
  return { place: hit ?? places[0], nameMatch: Boolean(hit) };
}

async function searchPlaces(fetchFn: typeof fetch, apiKey: string, textQuery: string, pageSize: number): Promise<Place[] | null> {
  const res = await fetchFn(PLACES_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify({ textQuery, pageSize, languageCode: "en" }),
    signal: AbortSignal.timeout(8_000),
  });
  if (!res.ok) {
    await res.body?.cancel().catch(() => {});
    return null;
  }
  const read = await readLimited(res, 200_000);
  try {
    const data = JSON.parse(read.text) as { places?: Place[] };
    return data.places ?? [];
  } catch {
    return null;
  }
}

export async function handleMapPack(opts: {
  request: Request;
  env: { GOOGLE_MAPS_API_KEY?: string };
  fetch: typeof fetch;
  hits: Map<string, number[]>;
  now?: () => number;
}): Promise<Response> {
  const guarded = await guardDemoPost(opts.request, opts.hits, opts.now?.() ?? Date.now());
  if (isGuardResponse(guarded)) return guarded;
  const business = field(guarded.body, "business", 120);
  const city = field(guarded.body, "city", 80);
  const service = field(guarded.body, "service", 80);
  if (!business || !city || !service) return json(400, { ok: false, error: "bad_request" });
  const sitePhone = optionalField(guarded.body, "sitePhone", 40);
  const siteAddress = optionalField(guarded.body, "siteAddress", 180);
  const apiKey = opts.env.GOOGLE_MAPS_API_KEY?.trim();
  if (!apiKey) return json(200, { ok: false, error: "not_configured" });

  const businessQuery = `${business} ${city}`.slice(0, 200);
  const competitorQuery = `${service} in ${city}`.slice(0, 200);
  try {
    const [businessPlaces, competitorPlaces] = await Promise.all([
      searchPlaces(opts.fetch, apiKey, businessQuery, 5),
      searchPlaces(opts.fetch, apiKey, competitorQuery, 3),
    ]);
    if (!businessPlaces && !competitorPlaces) return json(200, { ok: false, error: "upstream" });
    const picked = pickBusiness(businessPlaces ?? [], business);
    const listing = picked.place ? summarize(picked.place) : null;
    const phoneFlag = sitePhone && listing?.phone ? napPhoneMismatch(sitePhone, listing.phone) : null;
    const addressFlag = siteAddress && listing?.address ? napAddressMismatch(siteAddress, listing.address) : null;
    const napMismatch =
      phoneFlag === null && addressFlag === null
        ? null
        : { phone: phoneFlag, address: addressFlag, flagged: phoneFlag === true || addressFlag === true };
    return json(200, {
      ok: true,
      businessQuery,
      competitorQuery,
      business: listing
        ? { found: true, nameMatch: picked.nameMatch, ...listing }
        : { found: false, nameMatch: false, error: businessPlaces ? "not_found" : "upstream" },
      competitors: competitorPlaces
        ? competitorPlaces.slice(0, 3).map((place) => {
            const row = summarize(place);
            return { name: row.name, rating: row.rating, reviewCount: row.reviewCount };
          })
        : null,
      competitorError: competitorPlaces ? undefined : "upstream",
      napMismatch,
    });
  } catch {
    return json(200, { ok: false, error: "upstream" });
  }
}
