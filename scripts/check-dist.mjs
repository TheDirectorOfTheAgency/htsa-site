import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const distHtml = readFileSync("dist/index.html", "utf8");
const configSrc = readFileSync("src/config.ts", "utf8");

const required = [
  "https://www.skool.com/high-ticket-home-services-2405/about?ref=d0cdfe08b24e46c8a65c29fa0af73311",
  "ENTER THE SKOOL FOYER",
  "$6,458.10",
  "$59,632.98",
  "$512,022.13",
  "Hero image slot",
  "player.vimeo.com/video/806355796",
  "A tiny Minneapolis TV mounting business.",
  "I have no employees.",
  "$17,291.59",
  "This is not a done-for-you marketing service or an installed AI operations team.",
  "Talk to MoneyPenny",
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
    } else {
      const content = readFileSync(path, "utf8");
      if (content.includes("XAI_API_KEY")) {
        console.error(`XAI_API_KEY found in ${path}`);
        process.exit(1);
      }
      if (/xai-[A-Za-z0-9]{20,}/.test(content)) {
        console.error(`Suspicious xAI key pattern in ${path}`);
        process.exit(1);
      }
    }
  }
}

walk("dist");
console.log("check-dist: ok");
