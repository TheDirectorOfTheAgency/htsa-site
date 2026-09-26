# HTSA homepage — phase 1 plan

Phase 1 is this document only. Phase 2 implements it. Do not merge the PR. Do not touch the live Webflow site at https://hightickethomeservices.com/, its Webflow project, or the Skool community. Do not buy or paste the Mindly AI Framer template. Do not add analytics pixels, ads, or a countdown.

The layout pattern comes from the Mindly AI preview (https://oma-mindly.framer.website/) and the brand-reference shots named below. Rebuild the pattern in our own markup, CSS, and words. Do not copy Omakase images, copy, font files, SVG assets, or code.

Offer source of truth is the live site, fetched 2026-09-26. The dead stub on `main` (`index.html`) is not the offer. Its prices (`$497`, `$1,497`, `$25,000`) and its `$59,798` month figure must not appear.

## Locked decisions (do not reopen)

- Static Astro at the repo root on branch `mindly-astro`. One Cloudflare Pages Function at `functions/api/ask.ts`. No SSR adapter.
- Accent is Mounting Man yellow `#FDBE17` on black. Mindly orange is not used.
- The offer badge is static copy: **Coaching + community foyer**. It is not a timer and it does not say “limited time”.
- Hero image and hero video are labeled neutral placeholders. No stock photos, no face photos, no copied template media.
- `PHONE_E164` stays `null` until Q sets it. While null, all three call controls render the visible text **Number coming soon**, disabled, with no `tel:` href.
- Primary CTA text is exactly `ENTER THE SKOOL FOYER`. Every CTA uses exactly `https://www.skool.com/high-ticket-home-services-2405/about?ref=d0cdfe08b24e46c8a65c29fa0af73311`.
- Proof figures are exactly `$6,458.10`, `$59,632.98`, and `$512,022.13`.
- The packages block uses the WHOOP three-card **layout** and the live site’s **one door**. It does not invent a second or third price. The only public price range is six-week coaching `$2,000–$5,000`, with the live sentence that there is no single public price.
- Ask MoneyPenny sends one email to MoneyPenny. It never auto-replies to the visitor.
- No decision is left for Mr. Wayne. The third “tier” card is a boundary card, not a product, because the live site has one door.

## Page sections

Order is top to bottom. Body below the hero is white (`#FFFFFF`). Black sections are full-bleed interruptions, not a dark page.

| # | Section | Component | Reference | What it contains |
| --- | --- | --- | --- | --- |
| 1 | Floating pill nav | `Nav.astro` + `CallButton.astro` | Mindly hero (`mindly_hero.png`, `mindly_full.png` top). Phone icon idea from Samsara. | White pill, centered, fixed. Mark “HTSA” (original wordmark, not a copied logo). Links: Curriculum, Proof, Packages, Why us, Ask. `CallButton`. Yellow pill CTA with the exact foyer label and URL. |
| 2 | Hero | `Hero.astro`, `AskForm.astro`, `AssetSlot.astro` | Mindly hero, recolored. Yellow from `mountingman_hero.png`. | See hero anatomy below. |
| 3 | Proof strip | `ProofStrip.astro` | Samsara logo-bar position, directly under the hero, on white. | Three figures only, with live labels. Operator-proof line under them. |
| 4 | Origin | `Story.astro` | Relativity left-headline / right-paragraph split, on white. | Live headline “I Was the Agency Guy. Then I Got Tired of It.” and the origin paragraphs. |
| 5 | Fit | `Fit.astro` | White text block. | “Who This Is For” and “What You're Actually Buying”, live copy. |
| 6 | Curriculum | `Modules.astro` | White body, six light cards. | Modules 01–06, live titles and blurbs. |
| 7 | Field band | `FieldBand.astro` | Samsara black feature card (`samsara_body.png`): eyebrow, heavy headline, short paragraph. | Black band. Eyebrow `IN THE FIELD`. Headline from live positioning. Service line: Frame / mantel / porcelain / in-wall cable. Disclaimer that results are operator proof. |
| 8 | One door | `Packages.astro` | WHOOP black three-card section (`whoop_body.png`). | Full-bleed black. Three cards. No invented prices. See packages copy. |
| 9 | FAQ | `Faq.astro` | Mindly FAQ **placement only** (white, questions stacked). | Four questions whose answers are live sentences already locked below. No new claims. |
| 10 | Close | `ClosingPair.astro`, `AskForm.astro`, `CallButton.astro` | Palantir grey + black card pair (`palantir_body.png`). | Left grey card: Ask MoneyPenny (same form). Right black card: Call now (same call control). |
| 11 | Sticky call | `StickyCall.astro` | WHOOP sticky bottom pill, mobile only. | Fixed bottom pill. Hidden at `min-width: 768px`. |
| 12 | Footer | `Footer.astro` | Slim, not a second homepage. | “The Mounting Man” and “Hollywood Handyman is the teacher — not a second company.” No extra offers. |

### Hero anatomy (Mindly, our copy)

Top to bottom, centered, on a near-black field:

1. **Background.** CSS dot grid (radial-gradient, original). Behind the content, `AssetSlot` variant `image`: a full-bleed neutral panel `#141414` with the visible label `Hero image slot — Mr. Wayne supplies this asset`. No `<img>` until a file exists in repo. Do not download a photo.
2. **Offer badge.** Two-part pill, static. Left: `Coaching + community foyer`. Right: `Skool foyer`. No date, no timer, no “ends in”, no “limited”.
3. **Headline, two lines.** Line one, white: `You don't enroll in a course.` Line two: `You join ` + yellow accent `the Agency.`
4. **Subcopy, one sentence from the live hero.** `Six-week operator coaching for home service owners. Learn the marketing, positioning, and pricing systems used at The Mounting Man, then apply them in your own business. Coaching is $2,000–$5,000. Start in the Skool foyer.`
5. **Ask MoneyPenny card.** Dark translucent rounded rectangle (Mindly chat box). Fields: name (optional), email (required), message (required), honeypot. Submit posts to `/api/ask`. Thank-you state replaces the fields. Placeholder message: `Ask about the foyer or six-week coaching.` Do not use Mindly’s “Rewrite this response…” string.
6. **CTA row.** Yellow pill `ENTER THE SKOOL FOYER` with a simple arrow (CSS or an inline SVG we draw). Beside it, three overlapping **neutral discs** (yellow, white, charcoal — no photos, no initials of real people) and a Caveat note: `Start in the foyer. Coaching is a separate step.` Do not write “1k+” or “already ahead”.
7. **Video frame.** `AssetSlot` variant `video`. Rounded rectangle, ~16:9, max-width ~1040px, label `Hero video slot — Mr. Wayne supplies this asset`. A drawn play circle. No `<video>`, no iframe, no stock file.

### Packages copy (three cards, one price range)

Section title: `One door.` Intro, verbatim: `Six-week coaching is $2,000–$5,000. No single public price.`

| Card | Title | Body (live meaning, short) | Price line | Button |
| --- | --- | --- | --- | --- |
| 1 | Foyer | Skool is the foyer. Start there to see the academy. Entering the foyer does not buy the coaching engagement. | No price | `ENTER THE SKOOL FOYER` |
| 2 | Coaching | Six-week operator coaching. Direct access to the person who built The Mounting Man. You do the work in your business. Coaching is a separate next step. | `$2,000–$5,000` and `No single public price.` | Same foyer URL. Do not imply checkout. |
| 3 | Not included | `This is not a done-for-you marketing service or an installed AI operations team.` `The Mounting Man's results are operator proof, not a promise of your results.` | No price | No second product CTA. Text only. |

Card faces are light (WHOOP’s ONE / PEAK / LIFE cards sit on black). Do not name them ONE / PEAK / LIFE. Do not mark a card “most popular”.

### Proof strip, exact

| Figure | Label |
| --- | --- |
| `$6,458.10` | Best day, 2025-09-23 |
| `$59,632.98` | Best month, 2024-12 |
| `$512,022.13` | Best year, 2024 |

Under the figures, verbatim: `THE MOUNTING MAN — OPERATOR PROOF. Twin Cities TV mounting: Frame / mantel / porcelain / in-wall cable. Business results, not student results.`

Also keep, in the story section, the live week figure only as prose already on the live site: best week 2024-12-01–07, `$17,291.59`. It is not a fourth proof-strip stat. The stub’s `$59,798`, `$500K+`, `0 employees`, and `6X` must not be rendered.

### FAQ (answers are existing sentences)

1. **Is this done for you?** This is not a done-for-you marketing service or an installed AI operations team.
2. **Does the foyer include coaching?** Joining the Skool foyer does not purchase six-week coaching. Six-week coaching is a separate next step.
3. **What does coaching cost?** Six-week coaching is $2,000–$5,000. No single public price.
4. **Whose results are the dollar figures?** The Mounting Man's results are operator proof, not a promise of your results.

### Copy that must appear (verbatim)

- `YOU DON'T ENROLL IN A COURSE. YOU JOIN THE AGENCY.` may be split across the hero lines as specified above; the words stay.
- `Hollywood Handyman is the teacher — not a second company.`
- `You're not looking for hacks. You're not looking for someone to do it for you.`
- `This is not a done-for-you marketing service or an installed AI operations team. Joining the Skool foyer does not purchase six-week coaching. The Mounting Man's results are operator proof, not a promise of your results.`
- Module titles: `Pricing Architecture`, `Lead Generation Engine`, `Operations & Systems`, `Sales & Closing`, `Scaling & Hiring`, `Brand & Authority`, with the live one-sentence blurbs.

### Copy that must not appear

`limited time`, `countdown`, `offer ends`, `spots left`, `coupon`, `discount`, `% off`, `AI team` as something we install (the disclaimer sentence above is allowed), `done-for-you` as a promise (the disclaimer is allowed), stub prices, Mindly course copy, “Master Prompt Engineering”, “$499”.

## Design tokens

Put these in `src/styles/tokens.css` as custom properties. Components use the variables only.

### Color

| Token | Value | Use |
| --- | --- | --- |
| `--yellow` | `#FDBE17` | Accent phrase, primary buttons, badge edge, one avatar disc |
| `--yellow-ink` | `#1A1400` | Text on yellow |
| `--black` | `#0C0C0C` | Hero, packages, field band, call card |
| `--hero-slot` | `#141414` | Image placeholder fill |
| `--white` | `#FFFFFF` | Page body, nav pill, foyer card |
| `--ink` | `#141414` | Text on white |
| `--muted` | `#5E5E5E` | Secondary text on white |
| `--muted-on-dark` | `#C8C8C8` | Secondary text on black |
| `--grey-card` | `#E8E8E8` | Ask closing card (Palantir grey) |
| `--line` | `rgba(255,255,255,0.14)` | Hairlines on dark |
| `--line-dark` | `rgba(0,0,0,0.08)` | Hairlines on white |
| `--glass` | `rgba(20,20,20,0.72)` | Hero ask card |
| `--danger` | `#8F2D2D` | Form error text only |

No blue, purple, lime, or gradient fills. Yellow buttons are flat `#FDBE17`.

### Type

Load with `@fontsource` packages (OFL). Do not ship Omakase font files. Do not use Bebas Neue from the stub.

| Role | Family | Size | Weight | Line height | Tracking |
| --- | --- | --- | --- | --- | --- |
| Hero | Inter Tight | `clamp(2.75rem, 5.4vw, 4.75rem)` | 700 | 1.02 | `-0.03em` |
| Section title | Inter Tight | `clamp(2.25rem, 4vw, 3.5rem)` | 650 | 1.05 | `-0.03em` |
| Card title | Inter Tight | `1.5rem` | 650 | 1.15 | `-0.02em` |
| Body | Inter Tight | `1.0625rem` | 450 | 1.6 | `0` |
| Small | Inter Tight | `0.9375rem` | 450 | 1.5 | `0` |
| Eyebrow | IBM Plex Mono | `0.75rem` | 500 | 1.2 | `0.08em`, uppercase |
| Proof figure | Inter Tight | `clamp(1.75rem, 3vw, 2.75rem)` | 650 | 1 | `-0.03em`, tabular-nums |
| Note | Caveat | `1.35rem` | 500 | 1.2 | `0` |
| Button | Inter Tight | `0.875rem` | 650 | 1 | `0.04em` |

### Space

| Token | Value |
| --- | --- |
| `--space-1` | `4px` |
| `--space-2` | `8px` |
| `--space-3` | `12px` |
| `--space-4` | `16px` |
| `--space-5` | `24px` |
| `--space-6` | `32px` |
| `--space-7` | `48px` |
| `--space-8` | `64px` |
| `--space-9` | `96px` |
| Section padding Y | `96px` desktop, `64px` below 768px |
| Container | `min(1120px, calc(100% - 48px))` desktop; `calc(100% - 32px)` below 768px |
| Hero top padding | `112px` so content clears the fixed pill |
| Stack gap inside hero | `24px` between badge, headline, subcopy, form, CTA, video |

### Radius

| Token | Value | Use |
| --- | --- | --- |
| `--radius-pill` | `999px` | Nav, buttons, badge, sticky call, inputs |
| `--radius-card` | `20px` | Package cards, closing cards, modules |
| `--radius-frame` | `24px` | Video slot |
| `--radius-ask` | `18px` | Ask card |

### Elevation

Nav: `box-shadow: 0 8px 30px rgba(0,0,0,0.18)`. No other drop shadows except a 1px border on white cards.

## File tree

Phase 2 replaces the stub `index.html` on this branch only. `main` stays untouched. Delete `index.html` when `src/pages/index.astro` exists so Astro owns `/`.

```
/
  PLAN.md
  package.json
  package-lock.json
  astro.config.mjs
  tsconfig.json
  wrangler.toml
  .dev.vars.example
  .gitignore
  public/
    favicon.svg                 # original geometric mark, yellow on black
  src/
    config.ts                   # PHONE_E164, SKOOL_URL, SKOOL_CTA, proof figures
    layouts/Base.astro
    pages/index.astro
    styles/tokens.css
    styles/global.css
    components/
      Nav.astro
      Hero.astro
      AskForm.astro
      AssetSlot.astro
      CallButton.astro
      StickyCall.astro
      ProofStrip.astro
      Story.astro
      Fit.astro
      Modules.astro
      FieldBand.astro
      Packages.astro
      Faq.astro
      ClosingPair.astro
      Footer.astro
    lib/ask-contract.ts         # shared field names + limits, no I/O
  functions/
    api/ask.ts
    lib/handle-ask.ts           # pure handler, fetch injected, unit-tested
  tests/
    ask.test.ts
    visual.spec.ts
  playwright.config.ts
```

`src/config.ts`:

```ts
/** Q sets this to E.164, e.g. "+16125551212". null renders "Number coming soon". */
export const PHONE_E164: string | null = null;

export const SKOOL_URL =
  "https://www.skool.com/high-ticket-home-services-2405/about?ref=d0cdfe08b24e46c8a65c29fa0af73311";

export const SKOOL_CTA = "ENTER THE SKOOL FOYER";

export const PROOF = [
  { figure: "$6,458.10", label: "Best day, 2025-09-23" },
  { figure: "$59,632.98", label: "Best month, 2024-12" },
  { figure: "$512,022.13", label: "Best year, 2024" },
] as const;
```

`CallButton.astro` reads `PHONE_E164` once. If it is a non-empty string matching `^\+[1-9]\d{7,14}$`, render `<a href={"tel:" + PHONE_E164}>Call MoneyPenny</a>`. Otherwise render `<button type="button" disabled>Number coming soon</button>` and do not emit `tel:`.

### Astro and Cloudflare shape

- Astro 5, `output: 'static'`, no `@astrojs/cloudflare` adapter. The function is a Pages Function, not an Astro endpoint.
- `npm` is the package manager. Node 22.
- `astro.config.mjs` sets `site` only as a placeholder comment; canonical URL is whatever Pages preview Q gets. Do not hardcode the Webflow domain as the deploy target.
- `wrangler.toml`: `pages_build_output_dir = "dist"`, `compatibility_date = "2026-09-01"`. No secrets in the file.
- `.dev.vars.example` lists empty `AGENTMAIL_API_KEY`, `ASK_FROM_INBOX=agency-q@agentmail.to`, `ASK_TO_ADDRESS=agency-moneypenny@agentmail.to`. Real values stay in the Pages dashboard and in local `.dev.vars` (gitignored).
- `.gitignore`: `node_modules`, `dist`, `.astro`, `.env`, `.dev.vars`, `artifacts`, `.wrangler`. Keep ignoring `.vercel` if the stub ignore remains, but do not add a Vercel project.

### Scripts

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "test": "vitest run",
    "test:e2e": "playwright test",
    "gate": "npm run build && npm run test && node scripts/check-dist.mjs"
  }
}
```

`scripts/check-dist.mjs` reads `dist/index.html` and exits 1 when an acceptance string check fails (see gates). E2E is separate because it needs a browser; the acceptance list still requires it.

Dependencies to add, nothing else: `astro`, `typescript`, `@fontsource/inter-tight`, `@fontsource/ibm-plex-mono`, `@fontsource/caveat`, `vitest`, `@cloudflare/workers-types`, `playwright` (dev). Wrangler via `npx wrangler` for the optional manual pass, pinned as a devDependency.

## Pages Function contract

Route: `POST /api/ask` → `functions/api/ask.ts`.

`GET` and other methods: `405` and `{ "ok": false, "error": "method" }`.

### Request

`Content-Type: application/json`. Reject non-JSON with `400`.

```json
{
  "name": "optional string",
  "email": "required string",
  "message": "required string",
  "pageUrl": "optional string",
  "company": ""
}
```

| Field | Rule |
| --- | --- |
| `name` | Optional. Trim. Max 120. Empty becomes omitted in the email body as `(not given)`. |
| `email` | Required. Trim. Max 254. Must match `^[^\s@]+@[^\s@]+\.[^\s@]+$`. This address is Reply-To only. |
| `message` | Required. Trim. Length 1–4000. |
| `pageUrl` | Optional. If present, max 2000 and must start with `http://` or `https://`. Else use the `Referer` header when it is http(s), else `(unknown)`. |
| `company` | Honeypot. Rendered in the form, visually hidden (`position:absolute; left:-9999px`), `tabindex="-1"`, `autocomplete="off"`, label not shown to users but `aria-hidden="true"`. Humans leave it empty. |

If the honeypot is non-empty: respond `200` `{ "ok": true }` and **do not** call AgentMail.

If validation fails: `400` `{ "ok": false, "error": "validation" }`. Do not include field values in the response.

Body larger than 16 KB: `400` `{ "ok": false, "error": "validation" }`.

### Env

Read only from the Pages `env` argument. If any of the three is missing or blank, respond `500` `{ "ok": false, "error": "config" }` and do not call fetch.

| Name | Role | Expected value (set by Q, not hardcoded as a fallback) |
| --- | --- | --- |
| `AGENTMAIL_API_KEY` | Bearer secret | Pages secret |
| `ASK_FROM_INBOX` | `inbox_id` path segment | `agency-q@agentmail.to` |
| `ASK_TO_ADDRESS` | `to` | `agency-moneypenny@agentmail.to` |

### AgentMail call

Checked against https://docs.agentmail.to/api-reference/inboxes/messages/send on 2026-09-26.

```
POST https://api.agentmail.to/v0/inboxes/{inbox_id}/messages/send
Authorization: Bearer ${AGENTMAIL_API_KEY}
Content-Type: application/json
```

`inbox_id` is `env.ASK_FROM_INBOX`, URL-encoded once.

```json
{
  "to": "<ASK_TO_ADDRESS>",
  "reply_to": "<visitor email>",
  "subject": "HTSA site: Ask MoneyPenny",
  "text": "Name: ...\nEmail: ...\nMessage: ...\nPage: ...\nTimestamp: <ISO-8601 UTC>\n"
}
```

- Subject is exactly `HTSA site: Ask MoneyPenny`.
- `reply_to` is the visitor email (string form is valid; docs type it as Addresses).
- Do not set `html`, `cc`, `bcc`, `labels`, `attachments`, or `track_opens`.
- One request only. No second call. No message to the visitor. No draft-send endpoint. MoneyPenny handles the inbox as draft-only outside this function.
- Timeout the fetch at 10 seconds (`AbortSignal.timeout(10000)`).
- AgentMail `200` with `message_id` and `thread_id`: respond `200` `{ "ok": true }`. Do not return `message_id` to the browser.
- AgentMail non-200, network error, or timeout: `502` `{ "ok": false, "error": "send_failed" }`. Do not forward AgentMail’s body.

### Page behavior

`AskForm.astro` is used in the hero and in the grey closing card. Each instance is independent.

- Submit with `fetch("/api/ask", { method: "POST", headers: { "content-type": "application/json" }, body })`.
- `pageUrl` is `location.href`.
- Disable the button while the request is in flight.
- `ok: true`: replace the form with `MoneyPenny has it. She'll reply from here.` No claim about response time.
- Anything else: leave the fields and show `That didn't send. Check email and message, then try again.`
- No client-side email to anyone. No `mailto:` fallback that auto-sends.

`functions/api/ask.ts` is a thin `onRequestPost` (and `onRequest` that rejects non-POST) calling `handleAsk({ request, env, fetch })`. Tests import `handleAsk` and pass a mock `fetch`. That keeps the gate free of a live key and free of wrangler when Vitest is enough.

Optional manual check, not a gate: `npx wrangler pages dev dist --compatibility-date=2026-09-01` with `.dev.vars` present, then POST a fixture. The mock must still be the automated gate so CI does not hit AgentMail.

## Mobile behavior

Breakpoint: `768px`.

| Surface | Desktop (≥768) | Phone (390px wide is the check) |
| --- | --- | --- |
| Pill nav | Logo, five links, call control, foyer CTA. May wrap inside the pill; the pill stays inset `16px` from the viewport edges. | Drop the five text links. Keep logo, call control, and foyer CTA. Links remain in a `<details>` disclosure inside the pill so Curriculum / Proof / Packages / Why us / Ask still exist. |
| Hero type | Two lines if the viewport allows. | Same words, wrap freely, no horizontal scroll. |
| Ask card | Max-width `640px`, centered. | Full container width. Inputs are at least `44px` tall. |
| CTA row | Button, discs, and note on one row. | Stack: button, then discs + note. |
| Video slot | Max-width `1040px`. | Full container width, radius kept. |
| Proof | Three columns. | One column, figures stacked, dividers horizontal. |
| Story / fit | Two columns from `960px` up. | One column. |
| Modules | Two columns, then three from `960px`. | One column. |
| Packages | Three cards in a row. | One column, gap `16px`. |
| Closing pair | Two equal cards, grey then black. | Stack, Ask on top, Call under it. |
| Sticky call | `display: none`. | `position: fixed; bottom: max(16px, env(safe-area-inset-bottom)); left: 16px; right: 16px; z-index: 40`. Same `CallButton` rules. |
| Page bottom | Normal footer padding. | Extra `padding-bottom: 88px` so the sticky control does not cover the call card or the footer. |

No horizontal overflow at 390px. Focus states use a `2px` solid `--yellow` outline with `2px` offset. Buttons and links are keyboard reachable. The disabled call control stays visible and is not `display:none`. Color contrast: `#1A1400` on `#FDBE17`, white on `#0C0C0C`.

## Acceptance gates

Phase 2 is done when every command below exits 0 on a clean checkout. Run them in this order.

1. **Install and build**

   ```bash
   npm ci && npm run build
   ```

   `dist/index.html` exists. `functions/api/ask.ts` is still in the repo (Pages reads it from the project root, not from `dist`).

2. **Dist string checks** (`node scripts/check-dist.mjs`, also invoked by `npm run gate`)

   `dist/index.html` must contain:

   - `https://www.skool.com/high-ticket-home-services-2405/about?ref=d0cdfe08b24e46c8a65c29fa0af73311`
   - `ENTER THE SKOOL FOYER`
   - `$6,458.10`
   - `$59,632.98`
   - `$512,022.13`
   - `Number coming soon`
   - `Hero image slot`
   - `Hero video slot`
   - `Coaching + community foyer`
   - `This is not a done-for-you marketing service or an installed AI operations team.`

   `dist/index.html` must not contain, case-insensitive:

   - `limited time`
   - `countdown`
   - `offer ends`
   - `$497`
   - `$1,497`
   - `$25,000`
   - `$59,798`
   - `tel:`

   `tel:` is forbidden only while `PHONE_E164` is null. The check reads `src/config.ts`. If the constant is still `null`, fail on `tel:`. If Q later sets a valid E.164 string, the check instead requires `href="tel:` plus that string and does not require `Number coming soon`.

3. **Function unit tests**

   ```bash
   npm test
   ```

   Vitest, `tests/ask.test.ts`, mock `fetch`. Required cases:

   - Valid body → one POST to `https://api.agentmail.to/v0/inboxes/agency-q%40agentmail.to/messages/send`, bearer header, JSON `to` equal to `agency-moneypenny@agentmail.to`, `reply_to` equal to the visitor, subject `HTSA site: Ask MoneyPenny`, text containing name, email, message, page URL, and an ISO timestamp. Response `{ ok: true }` with status 200. `fetch` called once.
   - Visitor address is not the `to` field.
   - Missing email, missing message, bad email → 400 `{ ok: false, error: "validation" }`, fetch not called.
   - Honeypot `company: "http://spam.test"` → 200 `{ ok: true }`, fetch not called.
   - Missing `AGENTMAIL_API_KEY` → 500 `{ ok: false, error: "config" }`, fetch not called.
   - Mocked AgentMail 403 → 502 `{ ok: false, error: "send_failed" }`, fetch still once.
   - `GET` → 405.

4. **Playwright screenshots**

   ```bash
   npm run build && npx playwright test
   ```

   `playwright.config.ts` uses `astro preview` (or `vite preview` via Astro) on 127.0.0.1. `tests/visual.spec.ts` saves:

   - `artifacts/home-1440x900.png` at viewport `1440x900`
   - `artifacts/home-390x844.png` at viewport `390x844`

   Full page, not just the first viewport. The phone shot must show the sticky control. `artifacts/` is gitignored. Copy both PNGs to `/opt/cursor/artifacts/` when that directory exists so the PR walkthrough can attach them.

5. **Forbidden-scope check**

   ```bash
   git diff --name-only origin/main...HEAD
   ```

   The diff stays inside this repo and this branch. It must not include Webflow exports, Skool edits, Framer files, ad pixels, or environment secret values.

Q deploys the `mindly-astro` branch to a Cloudflare Pages **preview** URL. Production is not this task. The Webflow site stays on its current host.

## Phase 2 order

1. Scaffold Astro, tokens, layout, config, and the string-check script.
2. Build sections in the order in the table, with live copy pasted from this plan.
3. Wire `AskForm` and `handleAsk` with tests.
4. Pass `npm run gate`, then Playwright, then commit on `mindly-astro` and update the draft PR. Do not merge.
