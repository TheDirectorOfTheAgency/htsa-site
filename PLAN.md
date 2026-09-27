# HTSA homepage — phase 1 plan

Phase 1 is this document only. Phase 2 implements it. Do not merge the PR. Do not touch the live Webflow site at https://hightickethomeservices.com/, its Webflow project, or the Skool community. Do not buy or paste the Mindly AI Framer template. Do not add analytics pixels, ads, or a countdown.

The layout pattern comes from the Mindly AI preview (https://oma-mindly.framer.website/) and the brand-reference shots named below. Rebuild the pattern in our own markup, CSS, and words. Do not copy Omakase images, copy, font files, SVG assets, or code.

Offer source of truth is the live site, fetched 2026-09-26. The dead stub on `main` (`index.html`) is not the offer. Its prices (`$497`, `$1,497`, `$25,000`) must not appear. The incorrect best-month figure `$59,632.98` must not appear. The verified December 2024 total collected is `$59,798.23`.

## Locked decisions (do not reopen)

- Static Astro at the repo root on branch `mindly-astro`. One Cloudflare Pages Function at `functions/api/voice-token.ts`. No SSR adapter. No AgentMail function and no email form.
- Accent is Mounting Man yellow `#FDBE17` on black. Mindly orange is not used.
- The offer badge is static copy: **Coaching + community foyer**. It is not a timer and it does not say “limited time”.
- Hero image and hero video are labeled neutral placeholders. No stock photos, no face photos, no copied template media.
- `PHONE_E164` stays `null` until Q sets it. While null, all three call controls render the visible text **Number coming soon**, disabled, with no `tel:` href.
- Primary CTA text is exactly `ENTER THE SKOOL FOYER`. Every CTA uses exactly `https://www.skool.com/high-ticket-home-services-2405/about?ref=d0cdfe08b24e46c8a65c29fa0af73311`.
- Proof figures are exactly `$6,458.10`, `$59,798.23`, and `$512,022.13`.
- The packages block uses the WHOOP three-card **layout** and the live site’s **one door**. It does not invent a second or third price. The only public price range is six-week coaching `$2,000–$5,000`, with the live sentence that there is no single public price.
- The hero chat box is a live voice session with MoneyPenny, the xAI Voice Agent `agent_hL8eOtDRQ9nF50G5` (Draft; the console deployment works while Draft). Transport is the realtime WebSocket, not an embed. The browser never receives `XAI_API_KEY`.
- No decision is left for Mr. Wayne. The third “tier” card is a boundary card, not a product, because the live site has one door.

## Page sections

Order is top to bottom. Body below the hero is white (`#FFFFFF`). Black sections are full-bleed interruptions, not a dark page.

| # | Section | Component | Reference | What it contains |
| --- | --- | --- | --- | --- |
| 1 | Floating pill nav | `Nav.astro` + `CallButton.astro` | Mindly hero (`mindly_hero.png`, `mindly_full.png` top). Phone icon idea from Samsara. | White pill, centered, fixed. Mark “HTSA” (original wordmark, not a copied logo). Links: Curriculum, Proof, Packages, Why us, Talk (`#moneypenny`). `CallButton`. Yellow pill CTA with the exact foyer label and URL. |
| 2 | Hero | `Hero.astro`, `MoneyPennyVoice.astro`, `AssetSlot.astro` | Mindly hero, recolored. Yellow from `mountingman_hero.png`. | See hero anatomy below. |
| 3 | Proof strip | `ProofStrip.astro` | Samsara logo-bar position, directly under the hero, on white. | Three figures only, with live labels. Operator-proof line under them. |
| 4 | Origin | `Story.astro` | Relativity left-headline / right-paragraph split, on white. | Live headline “I Was the Agency Guy. Then I Got Tired of It.” and the origin paragraphs. |
| 5 | Fit | `Fit.astro` | White text block. | “Who This Is For” and “What You're Actually Buying”, live copy. |
| 6 | Curriculum | `Modules.astro` | White body, six light cards. | Modules 01–06, live titles and blurbs. |
| 7 | Field band | `FieldBand.astro` | Samsara black feature card (`samsara_body.png`): eyebrow, heavy headline, short paragraph. | Black band. Eyebrow `IN THE FIELD`. Headline from live positioning. Service line: Frame / mantel / porcelain / in-wall cable. Disclaimer that results are operator proof. |
| 8 | One door | `Packages.astro` | WHOOP black three-card section (`whoop_body.png`). | Full-bleed black. Three cards. No invented prices. See packages copy. |
| 9 | FAQ | `Faq.astro` | Mindly FAQ **placement only** (white, questions stacked). | Four questions whose answers are live sentences already locked below. No new claims. |
| 10 | Close | `ClosingPair.astro`, `CallButton.astro` | Palantir grey + black card pair (`palantir_body.png`). | Left grey card: “Talk to MoneyPenny”, an in-page link to `#moneypenny`. It does not mount a second voice session. Right black card: Call now (same phone `CallButton`). |
| 11 | Sticky call | `StickyCall.astro` | WHOOP sticky bottom pill, mobile only. | Fixed bottom pill. Hidden at `min-width: 768px`. |
| 12 | Footer | `Footer.astro` | Slim, not a second homepage. | “The Mounting Man” and “Hollywood Handyman is the teacher — not a second company.” No extra offers. |

### Hero anatomy (Mindly, our copy)

Top to bottom, centered, on a near-black field:

1. **Background.** CSS dot grid (radial-gradient, original). Behind the content, `AssetSlot` variant `image`: a full-bleed neutral panel `#141414` with the visible label `Hero image slot — Mr. Wayne supplies this asset`. No `<img>` until a file exists in repo. Do not download a photo.
2. **Offer badge.** Two-part pill, static. Left: `Coaching + community foyer`. Right: `Skool foyer`. No date, no timer, no “ends in”, no “limited”.
3. **Headline, two lines.** Line one, white: `You don't enroll in a course.` Line two: `You join ` + yellow accent `the Agency.`
4. **Subcopy, one sentence from the live hero.** `Six-week operator coaching for home service owners. Learn the marketing, positioning, and pricing systems used at The Mounting Man, then apply them in your own business. Coaching is $2,000–$5,000. Start in the Skool foyer.`
5. **Talk to MoneyPenny card.** One `MoneyPennyVoice` mount, `id="moneypenny"`. Same dark translucent rounded rectangle as the Mindly chat box. No name, email, or message fields. No honeypot. See “MoneyPenny voice” below. Do not use Mindly’s “Rewrite this response…” string.
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
| `$59,798.23` | Best month, 2024-12 |
| `$512,022.13` | Best year, 2024 |

Under the figures, verbatim: `THE MOUNTING MAN — OPERATOR PROOF. Twin Cities TV mounting: Frame / mantel / porcelain / in-wall cable. Business results, not student results.`

Also keep, in the story section, the live week figure only as prose already on the live site: best week 2024-12-01–07, `$17,291.59`. It is not a fourth proof-strip stat. The incorrect month figure `$59,632.98`, plus `$500K+`, `0 employees`, and `6X`, must not be rendered.

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

`limited time`, `countdown`, `offer ends`, `spots left`, `coupon`, `discount`, `% off`, `AI team` as something we install (the disclaimer sentence above is allowed), `done-for-you` as a promise (the disclaimer is allowed), stub prices, Mindly course copy, “Master Prompt Engineering”, “$499”. No email inputs, no `mailto:`, no AgentMail, and no `XAI_API_KEY` in the built site.

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
| Stack gap inside hero | `24px` between badge, headline, subcopy, voice card, CTA, video |

### Radius

| Token | Value | Use |
| --- | --- | --- |
| `--radius-pill` | `999px` | Nav, buttons, badge, sticky call, inputs |
| `--radius-card` | `20px` | Package cards, closing cards, modules |
| `--radius-frame` | `24px` | Video slot |
| `--radius-ask` | `18px` | MoneyPenny voice card |

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
    config.ts                   # PHONE_E164, SKOOL_URL, SKOOL_CTA, proof figures, voice config names
    layouts/Base.astro
    pages/index.astro
    styles/tokens.css
    styles/global.css
    components/
      Nav.astro
      Hero.astro
      MoneyPennyVoice.astro
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
    scripts/moneypenny-voice.ts # client island: states, mic, adapter calls
    lib/voice-adapter.ts        # websocket transport behind a swappable interface
  functions/
    api/voice-token.ts
    lib/handle-voice-token.ts   # pure handler, fetch injected, unit-tested
  tests/
    voice-token.test.ts
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
  { figure: "$59,798.23", label: "Best month, 2024-12" },
  { figure: "$512,022.13", label: "Best year, 2024" },
] as const;

/** Console Voice Agent. Not a secret. The API key is never a field here. */
export const VOICE_AGENT_ID = "agent_hL8eOtDRQ9nF50G5";

export const VOICE_REALTIME_URL =
  "wss://api.x.ai/v1/realtime?agent_id=agent_hL8eOtDRQ9nF50G5";
```

The Pages Function does not trust a client-supplied id. It reads `XAI_VOICE_AGENT_ID` at runtime and builds that same URL. `.dev.vars.example` sets `XAI_VOICE_AGENT_ID=agent_hL8eOtDRQ9nF50G5`. The static page may show the agent id. It must not show the API key.

`CallButton.astro` reads `PHONE_E164` once. If it is a non-empty string matching `^\+[1-9]\d{7,14}$`, render `<a href={"tel:" + PHONE_E164}>Call MoneyPenny</a>`. Otherwise render `<button type="button" disabled>Number coming soon</button>` and do not emit `tel:`.

### Astro and Cloudflare shape

- Astro 5, `output: 'static'`, no `@astrojs/cloudflare` adapter. The function is a Pages Function, not an Astro endpoint.
- `npm` is the package manager. Node 22.
- `astro.config.mjs` sets `site` only as a placeholder comment; canonical URL is whatever Pages preview Q gets. Do not hardcode the Webflow domain as the deploy target.
- `wrangler.toml`: `pages_build_output_dir = "dist"`, `compatibility_date = "2026-09-01"`. No secrets in the file.
- `.dev.vars.example` lists empty `XAI_API_KEY` and `XAI_VOICE_AGENT_ID=agent_hL8eOtDRQ9nF50G5`. The real key stays in the Pages dashboard and in local `.dev.vars` (gitignored). Do not commit a key.
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

## MoneyPenny voice

Checked against xAI’s public docs on 2026-09-26:

- Voice overview and speech-to-speech: https://docs.x.ai/developers/model-capabilities/audio/speech-to-speech
- Ephemeral tokens: https://docs.x.ai/developers/model-capabilities/audio/ephemeral-tokens
- REST `POST /v1/realtime/client_secrets`: https://docs.x.ai/developers/rest-api-reference/inference/voice

Console Deployment pull (read-only, 2026-09-26), agent **MoneyPenny (Chief of Staff of The Agency)**:

- Agent id: `agent_hL8eOtDRQ9nF50G5`. Status Draft. The console snippet connects while the agent is still Draft. Do not publish the agent from this repo.
- There is no web embed widget.
- Server-side sample connects with a Bearer key:

  `wss://api.x.ai/v1/realtime?agent_id=agent_hL8eOtDRQ9nF50G5`

  plus `Authorization: Bearer $XAI_API_KEY`. That header form is for a server process. The browser must not use it.

What the public docs specify for a browser:

- Mint: `POST https://api.x.ai/v1/realtime/client_secrets` with `Authorization: Bearer $XAI_API_KEY` and JSON `{ "expires_after": { "seconds": 300 } }`. The ephemeral-token page says this body does not accept `session` or `expires_after.anchor`. Do not send `agent_id` in the mint body. `agent_id` is a query parameter on the WebSocket URL, which is how the console selects the saved agent.
- Success body: `{ "value": "<ephemeral token>", "expires_at": <unix seconds> }`.
- Browser connect, because a browser cannot set WebSocket headers:

  `new WebSocket(url, ["xai-client-secret." + token])`

  `url` is `wss://api.x.ai/v1/realtime?agent_id=` plus the env agent id.
- After the socket opens, `session.update` may set `audio.input.format` and `audio.output.format`. Docs default is `audio/pcm` at `24000`. Do not send `instructions`, `voice`, `tools`, or `turn_detection`. Those stay on the saved agent.
- With the default JSON audio transport, mic audio is `input_audio_buffer.append` (base64 PCM16) and playback is `response.output_audio.delta` (base64 PCM16), played as each delta arrives. Do not send the console sample’s `conversation.item.create` “Hello!” or a manual `response.create`. The saved agent’s turn detection commits the mic audio.
- Do not copy the console TypeScript or Python samples into the repo. They use the `ws` package and a server API key.

### Component

`MoneyPennyVoice.astro` plus `src/scripts/moneypenny-voice.ts`. One instance, in the hero. The script talks only to `VoiceAdapter` in `src/lib/voice-adapter.ts`:

```ts
export interface VoiceSession {
  token: string;
  expiresAt: number;
  url: string;
}

export interface VoiceAdapter {
  connect(session: VoiceSession): Promise<void>;
  hangUp(): void;
}
```

Phase 2 ships one adapter, `websocket`. The interface stays so a later transport can replace `connect` without changing the Astro markup or the states.

On socket `open`, send exactly one `session.update`:

```json
{
  "type": "session.update",
  "session": {
    "audio": {
      "input": { "format": { "type": "audio/pcm", "rate": 24000 } },
      "output": { "format": { "type": "audio/pcm", "rate": 24000 } }
    }
  }
}
```

Capture mic audio at 24000 Hz, mono, PCM16 little-endian, and append it with `input_audio_buffer.append`. Play `response.output_audio.delta` immediately. Ignore `response.output_audio_transcript.delta`. Do not render a transcript. Do not put a persona, instructions, or tools in the page.

### States

The root element carries `data-state`. Only one state is visible.

| State | `data-state` | What the visitor sees |
| --- | --- | --- |
| Idle | `idle` | Label `Talk to MoneyPenny`. A mic button, at least 44px. Short line: `A live voice conversation. Coaching stays in the Skool foyer.` |
| Connecting | `connecting` | `Connecting to MoneyPenny…` The mic button is disabled. |
| Live | `live` | `MoneyPenny is live.` An end-call button labeled `End call`. |
| Error | `error` | The mic-blocked message, the unsupported-browser message, the busy message, or the generic connect message. A button `Try again` returns to idle. |

Mic is requested only after the click. Do not call `getUserMedia` on load.

Fallback copy, exact:

- Mic blocked (`NotAllowedError` / `NotFoundError`) or no `navigator.mediaDevices`: `The microphone is blocked. Allow the microphone for this site, then try again.`
- No `WebSocket` in the browser: `This browser can't start a voice call. Use a current version of Chrome, Safari, or Firefox.`

Click flow: set `connecting`, then in parallel request the mic and `POST /api/voice-token` with an empty JSON body. On `{ ok: true }`, `adapter.connect({ token, expiresAt, url })`. After the socket opens and the audio `session.update` is sent, set `live`. End call closes the socket, stops mic tracks, and returns to `idle`. A second click while `connecting` or `live` does nothing. A `429` shows `MoneyPenny is busy. Wait a minute, then try again.` Other token or socket failures use the browser messages above when the mic or WebSocket is the problem; otherwise `MoneyPenny didn't connect. Try again in a moment.`

### Pages Function

Route: `POST /api/voice-token` → `functions/api/voice-token.ts`.

`GET` and other methods: `405` `{ "ok": false, "error": "method" }`.

No request fields. Ignore any body. Do not accept an API key, agent id, or method from the browser.

### Env

Read only from the Pages `env` argument. If any value is missing or blank, respond `500` `{ "ok": false, "error": "config" }` and do not call xAI.

| Name | Role |
| --- | --- |
| `XAI_API_KEY` | Bearer secret. Server only. Never written to the response, logs, or `dist/`. |
| `XAI_VOICE_AGENT_ID` | Must be `agent_hL8eOtDRQ9nF50G5` for this deployment. Used only to build the WebSocket URL. Not sent in the mint body. |

### Rate limit

Before the xAI call, allow **5 mints per IP per 60 seconds**. IP is the `CF-Connecting-IP` header, otherwise the first hop of `X-Forwarded-For`, otherwise one shared `unknown` bucket. Keep timestamps in a module-level `Map` inside the isolate. On the 6th request in the window, respond `429` `{ "ok": false, "error": "rate_limited" }` and do not call xAI. Count the attempt when the mint is about to start, including attempts that later fail at xAI. Inject the map and the clock into `handleVoiceToken` so tests do not sleep and do not share state. This cap is per isolate. It is there to stop a preview tab from looping the mint endpoint. It is not a global Cloudflare rate-limit product.

### xAI call

```
POST https://api.x.ai/v1/realtime/client_secrets
Authorization: Bearer ${XAI_API_KEY}
Content-Type: application/json

{ "expires_after": { "seconds": 300 } }
```

Timeout 10 seconds. One call. No `session` field.

- xAI 200 with a non-empty string `value` and a number `expires_at`: respond `200`

  ```json
  {
    "ok": true,
    "token": "<value>",
    "expiresAt": 1750000000,
    "url": "wss://api.x.ai/v1/realtime?agent_id=agent_hL8eOtDRQ9nF50G5"
  }
  ```

  `token` is the ephemeral `value` only. `url` is built from `XAI_VOICE_AGENT_ID` with `encodeURIComponent`. Do not return the API key. Do not echo xAI’s raw body if it contains anything else.

- xAI non-200, network error, or timeout: `502` `{ "ok": false, "error": "token_failed" }`. Do not forward xAI’s body.

`functions/api/voice-token.ts` is a thin `onRequestPost` (and `onRequest` that rejects non-POST) calling `handleVoiceToken({ request, env, fetch, now, hits })`. Tests import `handleVoiceToken` and pass a mock `fetch`. The gate does not call xAI and does not need a live key.

Optional manual check, not a gate: `npx wrangler pages dev dist` with `.dev.vars` present. The mock remains the automated gate.

## Mobile behavior

Breakpoint: `768px`.

| Surface | Desktop (≥768) | Phone (390px wide is the check) |
| --- | --- | --- |
| Pill nav | Logo, five links, call control, foyer CTA. May wrap inside the pill; the pill stays inset `16px` from the viewport edges. | Drop the five text links. Keep logo, call control, and foyer CTA. Links remain in a `<details>` disclosure inside the pill so Curriculum / Proof / Packages / Why us / Talk still exist. |
| Hero type | Two lines if the viewport allows. | Same words, wrap freely, no horizontal scroll. |
| Voice card | Max-width `640px`, centered. Mic and end-call controls at least 44px. | Full container width. Same control size. The sticky phone pill must not cover the mic button; hero content ends above it. |
| CTA row | Button, discs, and note on one row. | Stack: button, then discs + note. |
| Video slot | Max-width `1040px`. | Full container width, radius kept. |
| Proof | Three columns. | One column, figures stacked, dividers horizontal. |
| Story / fit | Two columns from `960px` up. | One column. |
| Modules | Two columns, then three from `960px`. | One column. |
| Packages | Three cards in a row. | One column, gap `16px`. |
| Closing pair | Two equal cards, grey then black. | Stack, Talk on top, Call under it. |
| Sticky call | `display: none`. | `position: fixed; bottom: max(16px, env(safe-area-inset-bottom)); left: 16px; right: 16px; z-index: 40`. Same `CallButton` rules. |
| Page bottom | Normal footer padding. | Extra `padding-bottom: 88px` so the sticky control does not cover the call card or the footer. |

No horizontal overflow at 390px. Focus states use a `2px` solid `--yellow` outline with `2px` offset. Buttons and links are keyboard reachable. The disabled call control stays visible and is not `display:none`. Color contrast: `#1A1400` on `#FDBE17`, white on `#0C0C0C`.

## Acceptance gates

Phase 2 is done when every command below exits 0 on a clean checkout. Run them in this order.

1. **Install and build**

   ```bash
   npm ci && npm run build
   ```

   `dist/index.html` exists. `functions/api/voice-token.ts` is still in the repo (Pages reads it from the project root, not from `dist`). `functions/api/ask.ts` does not exist.

2. **Dist string checks** (`node scripts/check-dist.mjs`, also invoked by `npm run gate`)

   `dist/index.html` must contain:

   - `https://www.skool.com/high-ticket-home-services-2405/about?ref=d0cdfe08b24e46c8a65c29fa0af73311`
   - `ENTER THE SKOOL FOYER`
   - `$6,458.10`
   - `$59,798.23`
   - `$512,022.13`
   - `Number coming soon`
   - `Hero image slot`
   - `Hero video slot`
   - `Coaching + community foyer`
   - `This is not a done-for-you marketing service or an installed AI operations team.`
   - `Talk to MoneyPenny`

   `dist/index.html` must not contain, case-insensitive:

   - `limited time`
   - `countdown`
   - `offer ends`
   - `$497`
   - `$1,497`
   - `$25,000`
   - `$59,632.98`
   - `tel:`
   - `type="email"`
   - `AGENTMAIL`
   - `XAI_API_KEY`

   The whole `dist/` tree must not contain `XAI_API_KEY` or a string matching `xai-[A-Za-z0-9]{20,}`. The ephemeral token is minted at request time and must not be baked into the build.

   `tel:` is forbidden only while `PHONE_E164` is null. The check reads `src/config.ts`. If the constant is still `null`, fail on `tel:`. If Q later sets a valid E.164 string, the check instead requires `href="tel:` plus that string and does not require `Number coming soon`.

3. **Token function unit tests**

   ```bash
   npm test
   ```

   Vitest, `tests/voice-token.test.ts`, mock `fetch`. Required cases:

   - Env agent id `agent_hL8eOtDRQ9nF50G5`, key `test-key` → one POST to `https://api.x.ai/v1/realtime/client_secrets`, bearer `test-key`, JSON body exactly `{ "expires_after": { "seconds": 300 } }` (no `session`, no `agent_id`). Mock xAI `{ "value": "ephemeral-test-token", "expires_at": 1750000000 }` → response `200` with `token` `ephemeral-test-token`, `expiresAt` `1750000000`, and `url` `wss://api.x.ai/v1/realtime?agent_id=agent_hL8eOtDRQ9nF50G5`. `fetch` called once. Response body does not contain `test-key`.
   - Missing `XAI_API_KEY` or missing agent id → `500` `{ "ok": false, "error": "config" }`, fetch not called.
   - Mocked xAI `401` → `502` `{ "ok": false, "error": "token_failed" }`, fetch once, response does not contain the key or the xAI error body.
   - Same IP, six calls inside one minute (injected clock) → the sixth returns `429` `{ "ok": false, "error": "rate_limited" }` and `fetch` was called five times.
   - `GET` → `405`.

4. **Playwright screenshots and voice states**

   ```bash
   npm run build && npx playwright test
   ```

   `playwright.config.ts` uses `astro preview` (or `vite preview` via Astro) on 127.0.0.1. `tests/visual.spec.ts` saves:

   - `artifacts/home-1440x900.png` at viewport `1440x900`
   - `artifacts/home-390x844.png` at viewport `390x844`

   Full page, not just the first viewport. The phone shot must show the sticky control. `artifacts/` is gitignored. Copy both PNGs to `/opt/cursor/artifacts/` when that directory exists so the PR walkthrough can attach them.

   The same spec also renders the voice states without a live xAI session or a microphone:

   - Idle, on first load: visible text `Talk to MoneyPenny` and a mic button. `data-state="idle"`.
   - Connecting: stub `POST /api/voice-token` to a request that never finishes, click the mic, expect `Connecting to MoneyPenny…` and `data-state="connecting"`. Screenshot `artifacts/voice-connecting.png`.
   - Error, unsupported browser: `page.addInitScript` deletes `window.WebSocket`, reload, click the mic, expect `This browser can't start a voice call. Use a current version of Chrome, Safari, or Firefox.` and `data-state="error"`. Screenshot `artifacts/voice-error.png`.
   - Error, mic blocked: reject `getUserMedia` with `NotAllowedError` and expect `The microphone is blocked. Allow the microphone for this site, then try again.`

5. **Forbidden-scope check**

   ```bash
   git diff --name-only origin/main...HEAD
   ```

   The diff stays inside this repo and this branch. It must not include Webflow exports, Skool edits, Framer files, ad pixels, or environment secret values.

Q deploys the `mindly-astro` branch to a Cloudflare Pages **preview** URL. Production is not this task. The Webflow site stays on its current host.

## Phase 2 order

1. Scaffold Astro, tokens, layout, config, and the string-check script.
2. Build sections in the order in the table, with live copy pasted from this plan.
3. Wire `MoneyPennyVoice`, the websocket adapter, and `handleVoiceToken` (including the per-IP mint cap) with tests.
4. Pass `npm run gate`, then Playwright, then commit on `mindly-astro` and update the draft PR. Do not merge.
