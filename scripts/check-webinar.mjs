import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import {
  handleWebinarApply,
  validateApplication,
} from "../functions/api/webinar-apply.ts";

const landing = readFileSync(new URL("../dist/webinar/index.html", import.meta.url), "utf8");
const apply = readFileSync(new URL("../dist/webinar/apply/index.html", import.meta.url), "utf8");
const fn = readFileSync(new URL("../functions/api/webinar-apply.ts", import.meta.url), "utf8");
const home = readFileSync(new URL("../dist/index.html", import.meta.url), "utf8");

const requiredLanding = [
  "The high-ticket system I use at The Mounting Man. Live, with me.",
  "In about 90 minutes I'll walk you through how I get found by clients in the wealthier neighborhoods and book the jobs worth taking.",
  "A written 30-day plan for your trade and your service area.",
  "I built The Mounting Man with no employees, and I still do the installs.",
  "$6,458.10",
  "$17,456.84",
  "$59,798.23",
  "$512,022.13",
  "Those are my numbers and my proof. They're not a promise about yours.",
  "Owner-operators who are good at the trade and ready to do the business side themselves.",
  "If you want someone to do it all for you, this isn't it.",
  "High Ticket Service Academy Six-Week Coaching Program",
  "done with you, not done for you",
  "$1,997 paid in full",
  "Launch pricing",
  "Apply for the free webinar",
  'href="/webinar/apply"',
  "[WEBINAR DATE]",
  "[ZOOM LINK]",
  "[SIX-WEEK JOIN LINK]",
  'content="noindex, nofollow"',
];

const questions = [
  "What trade or service do you run, and what's the job you most want to sell more of?",
  "What city or area do you serve, and which neighborhoods do you most want to work in?",
  "Roughly where is the business today in annual revenue?",
  "Who does the work right now?",
  "What's running today for marketing?",
  "For six weeks, can you show up to a weekly live call and put in a few hours each week making changes to your own profile, pages, ads, and phone process?",
  "If you got in, what's the first thing you'd change in week one, and why now?",
  "Under $100k",
  "$100k–$250k",
  "$250k–$500k",
  "$500k–$1M",
  "Over $1M",
  "Prefer not to say",
  "Just me",
  "Me plus a helper or two",
  "I have a crew and I run the business side",
  "Someone else runs it day to day",
  "Google Business Profile",
  "A website",
  "City or service pages",
  "Google Ads",
  "Facebook or other ads",
  "Nothing yet",
  "Yes, I'll do the work",
  "Probably, depends on the season",
  "No, I'm looking for someone to do it for me",
  'content="noindex, nofollow"',
  "Application received",
];

const internalOnly = ["Strong fit", "Red flags", "Borderline cases", "Revenue band"];
const bannedLanding = ["$497", "founding", "countdown", "payment plan", "59,632.98", "skool.com", "Get the workshop"];

function missing(haystack, needles) {
  return needles.filter((needle) => !haystack.includes(needle));
}

const problems = [];
const landingText = landing.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
const copyNeedles = requiredLanding.filter((s) => !s.startsWith("href=") && !s.startsWith("content="));
const markupNeedles = requiredLanding.filter((s) => s.startsWith("href=") || s.startsWith("content="));
const landingMissing = [
  ...missing(landingText, copyNeedles),
  ...missing(landing, markupNeedles),
];
if (landingMissing.length) problems.push(["landing missing", landingMissing]);
if (landing.includes("hero.jpg") || apply.includes("hero.jpg")) problems.push(["webinar still uses hero.jpg"]);
if (!landing.includes('src="/images/hero-marshall.webp"')) problems.push(["missing live hero image"]);
const applyMissing = missing(apply, questions);
if (applyMissing.length) problems.push(["apply missing", applyMissing]);

const bannedHits = bannedLanding.filter((needle) => landing.toLowerCase().includes(needle.toLowerCase()) || apply.toLowerCase().includes(needle.toLowerCase()));
if (bannedHits.length) problems.push(["banned copy", bannedHits]);

const leaks = internalOnly.filter((needle) => landing.includes(needle) || apply.includes(needle) || fn.includes(needle));
if (leaks.length) problems.push(["internal notes leaked", leaks]);

if (!fn.includes("WEBINAR_APPLICATIONS")) problems.push(["function missing KV binding name"]);
if (/mailchimp\.com|api\.mailchimp|sendgrid|resend\.com|mailto:/i.test(fn)) {
  problems.push(["function mentions a notification channel"]);
}

const valid = validateApplication({
  trade: "TV mounting, in-wall wire hides",
  area: "Twin Cities, Edina and Wayzata",
  revenue: "$250k–$500k",
  who: "Just me",
  marketing: ["Google Business Profile", "Nothing yet"],
  sixWeeks: "No, I'm looking for someone to do it for me",
  weekOne: "Fix the Google profile this week because calls are slow.",
});
if (!valid.ok) problems.push(["valid application rejected", valid]);

const incomplete = validateApplication({ trade: "Mounting" });
if (incomplete.ok) problems.push(["incomplete application accepted"]);

const stored = [];
const kv = {
  async put(key, value) {
    stored.push([key, value]);
  },
};
const goodBody = {
  trade: "Plumbing, water heaters",
  area: "Austin, west side",
  revenue: "Under $100k",
  who: "Me plus a helper or two",
  marketing: ["A website"],
  sixWeeks: "Yes, I'll do the work",
  weekOne: "Answer every lead in five minutes.",
};
const saved = await handleWebinarApply(
  new Request("https://preview.example/api/webinar-apply", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(goodBody),
  }),
  { WEBINAR_APPLICATIONS: kv },
);
if (saved.status !== 201 || stored.length !== 1) problems.push(["kv put failed", saved.status, stored.length]);

const unconfigured = await handleWebinarApply(
  new Request("https://preview.example/api/webinar-apply", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(goodBody),
  }),
  {},
);
const unconfiguredBody = await unconfigured.json();
if (unconfigured.status !== 503 || unconfiguredBody.binding !== "WEBINAR_APPLICATIONS" || unconfiguredBody.ok !== false) {
  problems.push(["missing binding did not fail closed", unconfigured.status, unconfiguredBody]);
}

if (home.includes("/webinar")) problems.push(["homepage mentions /webinar"]);

// Live-source guards: the deployed homepage must stay byte-for-byte the live one,
// and the Astro public/ copy of the webinar must match the deployed dist/ copy.
const LIVE_HOME_SHA256 = "a820ab7ece634540cf20849a6dad8e00e96761f876d2319282eff7f04be4f0f6";
const homeSha = createHash("sha256").update(readFileSync(new URL("../dist/index.html", import.meta.url))).digest("hex");
if (homeSha !== LIVE_HOME_SHA256) problems.push(["dist/index.html changed from live", homeSha]);
for (const f of ["webinar/index.html", "webinar/apply/index.html", "webinar/styles.css", "_headers", "images/hero-marshall.webp", "images/hero-marshall-900.webp"]) {
  const a = readFileSync(new URL("../dist/" + f, import.meta.url));
  const b = readFileSync(new URL("../public/" + f, import.meta.url));
  if (!a.equals(b)) problems.push(["dist and public differ", f]);
}

if (problems.length) {
  console.error(JSON.stringify(problems, null, 2));
  process.exit(1);
}

console.log("webinar lock check passed");
