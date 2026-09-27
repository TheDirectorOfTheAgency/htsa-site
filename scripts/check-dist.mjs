import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const distHtml = readFileSync("dist/index.html", "utf8");
const configSrc = readFileSync("src/config.ts", "utf8");

const required = [
  "https://www.skool.com/high-ticket-home-services-2405/about?ref=d0cdfe08b24e46c8a65c29fa0af73311",
  "Book a call with Marshall",
  "Or talk to MoneyPenny",
  "The last moat",
  "Every operator needs a MoneyPenny.",
  "AI can take the corner office. It can't mount the TV.",
  "AI can do a lot. It still can't do your job. Get paid like it.",
  "Line to come, mapped from live Skool.",
  "$6,458.10",
  "$59,632.98",
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
  "$59,798",
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

const allowedFigures = new Set(["$6,458.10", "$59,632.98", "$512,022.13"]);
for (const amount of distHtml.match(/\$\d[\d,]*(?:\.\d+)?/g) ?? []) {
  if (!allowedFigures.has(amount)) {
    console.error(`Unapproved figure on the home page: ${amount}`);
    process.exit(1);
  }
}
for (const retired of ["5,000+ TVs", "650+ reviews", "$17,291"]) {
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
for (const text of ["$97", "$497", "$1,997", "$1,497", "$59,798", "$5,175", "5,000+ TVs", "650+ reviews", "$2,000"]) {
  if (demoHtml.includes(text)) {
    console.error(`Demo page contains unapproved price: ${text}`);
    process.exit(1);
  }
}

console.log("check-dist: ok");
