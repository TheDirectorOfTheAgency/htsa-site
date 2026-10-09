# Live source for www.hightickethomeservices.com (preview branch, do not merge)

## Where production comes from
- Cloudflare Pages project `htsa-preview` serves both htsa-preview.pages.dev and www.hightickethomeservices.com.
- Production (branch `main` on Pages) is a **direct upload**. It is not built from this repo. Latest production deployment when this branch was made: `7674f979` (2026-10-06, "Sharp MoneyPenny portrait").
- `main` in this repo is an old static TV-mounting page. It is stale and is not what's live.
- The working copy that production was uploaded from lives on Mr. Wayne's M1 Mac (`.../Codex/2026-09-30/task-3/moneypenny-release`). This branch is a copy of it taken 2026-10-09.

## What's in this branch
| Path | What it is |
|---|---|
| `dist/` | The deployed site. Every one of its 111 files was byte-identical to what www serves on 2026-10-09 (homepage sha256 `a820ab7e…`, /six-week/ `062c3387…`). Backup files (`*.bak*`) and macOS Finder duplicates (`* 2*`) were left out. |
| `functions/` | Pages Functions as deployed (`api/chat.ts`, `api/voice-token.ts`, `api/demo/*`, `lib/*`) plus the new `api/webinar-apply.ts`. `lib/handle-chat.ts` imports `src/lib/moneypenny-prompt.ts`, so `src/` is needed at deploy time. |
| `src/`, `public/` | The Astro source as it sits next to `dist/`. **It is behind `dist/`.** An `astro build` of it gives the older "The Agency" homepage. Since 2026-10-01 the live homepage and /six-week/ have been edited directly in `dist/` and by `merge_home.py` and `build_six_week.py`. |
| `merge_home.py`, `build_six_week.py` | The scripts that regenerate `dist/index.html` and `dist/six-week/index.html`. |
| `package.json`, `package-lock.json`, `astro.config.mjs` | Reconstructed Astro 6.3.7 setup (static output) from the same M1 folder. It needs Node 22. |
| `wrangler.toml` | Project name and the public `XAI_VOICE_AGENT_ID`. Secrets (XAI_API_KEY etc.) are Pages secrets and are not in this repo. |

## Free webinar pages (from PR #7, unchanged)
- `dist/webinar/index.html`, `dist/webinar/apply/index.html`, `dist/webinar/styles.css`, `dist/_headers` (noindex for /webinar only). The same files are mirrored in `public/` for Astro.
- The hero uses `/images/hero-marshall.webp` + `-900.webp`. These files are already on the live site and are byte-identical.
- `functions/api/webinar-apply.ts` validates the 7 answers and stores them in KV binding `WEBINAR_APPLICATIONS`. That binding exists on the Pages **preview** environment only. If it's missing, the route returns 503 and saves nothing.
- `node scripts/check-webinar.mjs` (Node 22) checks the copy and the form. It also checks that `dist/index.html` is still the live homepage and that the `dist/` and `public/` copies match.

## Rules
Preview deploys only, with a non-main branch name. Don't merge this, and don't deploy it to `main` or production, without Mr. Wayne's OK.
