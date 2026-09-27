import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const distHtml = readFileSync("dist/index.html", "utf8");
const configSrc = readFileSync("src/config.ts", "utf8");

const required = [
  "https://www.skool.com/high-ticket-home-services-2405/about?ref=d0cdfe08b24e46c8a65c29fa0af73311",
  "ENTER THE SKOOL FOYER",
  "A tiny Minneapolis TV mounting business.",
  "I have no employees.",
  "Hero image slot",
  "player.vimeo.com/video/806355796",
  "Watch the video, then bring your questions to MoneyPenny",
  "Start in the foyer. Coaching is a separate step.",
  "/heatmaps/samsung-frame-installation.webp",
  "/heatmaps/mantel-mount-installation.webp",
  "/heatmaps/corporate-tv-mounting.webp",
  "/heatmaps/tv-mounting-minneapolis.webp",
  "/heatmaps/tv-mounting.webp",
  "/heatmaps/tv-mounting-near-me.webp",
  "The last moat",
  "AI can take the corner office. It can't mount the TV.",
  "Every operator needs a MoneyPenny.",
  "Before the modules",
  "5 lessons, including AI vs. The Trades",
  "Beginners track",
  "7 lessons",
  "Positioning (James Bond or Average Joe)",
  "Google My Business Domination",
  "Core 30 (High Level SEO Strategy)",
  "Paid Traffic Foundations",
  "Retargeting &amp; Omnipresence",
  "Conversion &amp; Sales Systems",
  "Profit Math: Tying It Together",
  "$6,458.10",
  "$17,291.59",
  "$59,798.23",
  "$512,022.13",
  "Talk to MoneyPenny",
  "MoneyPenny, Marshall Wayne's AI right hand: blonde, dark round glasses, confident and direct.",
  "/images/moneypenny-profile.png",
  'rel="dns-prefetch" href="https://api.x.ai"',
  'rel="preconnect" href="https://api.x.ai"',
];

const forbidden = [
  "limited time",
  "countdown",
  "offer ends",
  "$497",
  "$1,497",
  "$25,000",
  "$59,632",
  "$5,175",
  "5,000+ TVs",
  "650+ reviews",
  "Book a call",
  "call with Marshall",
  "Module 0",
  'type="email"',
  "AGENTMAIL",
  "XAI_API_KEY",
];

for (const text of required) {
  if (!distHtml.includes(text)) {
    console.error(`Missing required string: ${text}`);
    process.exit(1);
  }
}

const lower = distHtml.toLowerCase();
for (const text of forbidden) {
  if (lower.includes(text.toLowerCase())) {
    console.error(`Forbidden string found: ${text}`);
    process.exit(1);
  }
}

const allowedFigures = new Set([
  "$6,458.10",
  "$17,291.59",
  "$2,152",
  "$59,798.23",
  "$512,022.13",
]);
for (const amount of distHtml.match(/\$\d[\d,]*(?:\.\d+)?/g) ?? []) {
  if (!allowedFigures.has(amount)) {
    console.error(`Unapproved figure on the home page: ${amount}`);
    process.exit(1);
  }
}
for (const retired of ["5,000+ TVs", "650+ reviews", "$59,632.98"]) {
  if (distHtml.includes(retired)) {
    console.error(`Retired claim on the home page: ${retired}`);
    process.exit(1);
  }
}

const phoneMatch = configSrc.match(
  /export const PHONE_E164[^=]*=\s*(null|"[^"]+")/,
);
const phone = phoneMatch?.[1];

if (phone === "null") {
  if (distHtml.includes("tel:")) {
    console.error("tel: found while PHONE_E164 is null");
    process.exit(1);
  }
} else if (phone?.startsWith('"')) {
  const e164 = phone.slice(1, -1);
  if (!distHtml.includes(`href="tel:${e164}"`)) {
    console.error(`Expected tel link for ${e164}`);
    process.exit(1);
  }
}

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      walk(path);
    } else if (/\.(html|js|css|svg|json|txt|mjs)$/.test(path)) {
      const content = readFileSync(path, "utf8");
      if (content.includes("XAI_API_KEY")) {
        console.error(`XAI_API_KEY found in ${path}`);
        process.exit(1);
      }
      if (/xai-[A-Za-z0-9]{20,}/.test(content)) {
        console.error(`Suspicious xAI key pattern in ${path}`);
        process.exit(1);
      }
      if (content.includes("agent_hL8eOtDRQ9nF50G5")) {
        console.error(`Voice agent id hardcoded in ${path}`);
        process.exit(1);
      }
      const lowered = content.toLowerCase();
      for (const phrase of ["book a call", "call with marshall"]) {
        if (lowered.includes(phrase)) {
          console.error(`Marshall-call CTA found in ${path}: ${phrase}`);
          process.exit(1);
        }
      }
    }
  }
}

walk("dist");

const demoHtml = readFileSync("dist/demo/voice-sales/index.html", "utf8");
if (!demoHtml.includes('name="robots" content="noindex, nofollow"')) {
  console.error("Demo page is missing noindex");
  process.exit(1);
}
if (!demoHtml.includes("North Loop TV Mounting")) {
  console.error("Demo page is missing the test placeholder");
  process.exit(1);
}
for (const text of ["$97", "$497", "$1,997", "$1,497", "$59,632", "$5,175", "5,000+ TVs", "650+ reviews", "$2,000", "Book a call", "call with Marshall"]) {
  if (demoHtml.includes(text)) {
    console.error(`Demo page contains unapproved price: ${text}`);
    process.exit(1);
  }
}

console.log("check-dist: ok");
