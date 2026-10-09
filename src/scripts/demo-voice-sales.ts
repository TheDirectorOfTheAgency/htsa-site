import { DEMO_TOOLS, demoInstructions } from "../lib/demo-session";
import { armVoiceGesture, beginVoiceCall, type VoiceCall } from "../lib/voice-call";
import type { VoiceToolCall } from "../lib/voice-adapter";
import { VoiceTokenError, createVoiceTokenCache, watchVoiceButton } from "../lib/voice-token-cache";
import { markTap } from "../lib/voice-timing";

const MSG_MIC_BLOCKED =
  "The microphone is blocked. Allow the microphone for this site, then try again.";
const MSG_NO_WEBSOCKET =
  "This browser can't start a voice call. Use a current version of Chrome, Safari, or Firefox.";
const MSG_BUSY = "MoneyPenny is busy. Wait a minute, then try again.";
const MSG_GENERIC = "MoneyPenny didn't connect. Try again in a moment.";

type State = "idle" | "connecting" | "live" | "error";

const TOOL_PATHS: Record<string, string> = {
  site_analysis: "/api/demo/site-analysis",
  map_pack: "/api/demo/map-pack",
  ai_citations: "/api/demo/ai-citations",
};

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function clear(node: HTMLElement) {
  node.replaceChildren();
}

function row(label: string, value: string) {
  const line = el("p", "fact");
  line.append(el("span", "fact__label", label));
  line.append(document.createTextNode(value));
  return line;
}

function yesNo(value: boolean) {
  return value ? "Yes" : "No";
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function setStatus(card: HTMLElement | null, text: string) {
  const status = card?.querySelector<HTMLElement>("[data-status]");
  if (status) status.textContent = text;
}

function keywordLines(parent: HTMLElement, label: string, hit: { term: string; inTitle: boolean; inH1: boolean; inMeta: boolean } | null) {
  if (!hit) {
    parent.append(row(label, "Not checked"));
    return;
  }
  parent.append(row(`${label} in title`, yesNo(hit.inTitle)));
  parent.append(row(`${label} in H1`, yesNo(hit.inH1)));
  parent.append(row(`${label} in meta`, yesNo(hit.inMeta)));
}

function renderSite(card: HTMLElement, data: Record<string, unknown>) {
  const body = card.querySelector<HTMLElement>("[data-body]");
  if (!body) return;
  clear(body);
  if (data.ok !== true) {
    setStatus(card, data.error === "blocked_url" ? "That address can't be checked." : "Could not read the site.");
    return;
  }
  setStatus(card, "Read from the live page.");
  body.append(row("Title", String(data.title || "(none)")));
  body.append(row("Meta", String(data.metaDescription || "(none)")));
  const h1 = Array.isArray(data.h1) ? data.h1.filter((item) => typeof item === "string") : [];
  body.append(row("H1", h1.length ? h1.join(" · ") : "(none)"));
  body.append(row("HTTPS", yesNo(data.https === true)));
  body.append(row("Mobile viewport", yesNo(data.mobileViewport === true)));
  body.append(row("LocalBusiness schema", yesNo(data.localBusinessSchema === true)));
  if (typeof data.pageWeightBytes === "number") {
    body.append(row("Page weight", `${formatBytes(data.pageWeightBytes)}${data.truncated ? " (capped)" : ""}`));
  }
  const keywords = data.keywords as { city?: { term: string; inTitle: boolean; inH1: boolean; inMeta: boolean } | null; service?: { term: string; inTitle: boolean; inH1: boolean; inMeta: boolean } | null } | undefined;
  keywordLines(body, "City", keywords?.city ?? null);
  keywordLines(body, "Service", keywords?.service ?? null);
  if (typeof data.phone === "string" && data.phone) body.append(row("Phone on site", data.phone));
  if (typeof data.address === "string" && data.address) body.append(row("Address on site", data.address));
}

function renderMap(mapCard: HTMLElement, competitorCard: HTMLElement, data: Record<string, unknown>) {
  const mapBody = mapCard.querySelector<HTMLElement>("[data-body]");
  const compBody = competitorCard.querySelector<HTMLElement>("[data-body]");
  if (!mapBody || !compBody) return;
  clear(mapBody);
  clear(compBody);
  if (data.ok !== true) {
    const message = data.error === "not_configured" ? "Not checked. Places is not configured." : "Could not check the map pack.";
    setStatus(mapCard, message);
    setStatus(competitorCard, message);
    return;
  }
  setStatus(mapCard, typeof data.businessQuery === "string" ? data.businessQuery : "Listing");
  const business = (data.business ?? {}) as Record<string, unknown>;
  if (business.found !== true) {
    mapBody.append(row("Listing", "No listing returned."));
  } else {
    mapBody.append(row("Name", String(business.name ?? "(none)")));
    mapBody.append(row("Name match", business.nameMatch === true ? "Yes" : "Closest result"));
    mapBody.append(row("Rating", typeof business.rating === "number" ? String(business.rating) : "No rating listed"));
    mapBody.append(row("Reviews", typeof business.reviewCount === "number" ? String(business.reviewCount) : "Review count not listed"));
    mapBody.append(row("Primary category", String(business.primaryCategory ?? "Not listed")));
    const secondary = Array.isArray(business.secondaryCategories) ? business.secondaryCategories.join(", ") : "";
    if (secondary) mapBody.append(row("Also listed as", secondary));
    mapBody.append(row("Phone", String(business.phone ?? "Not listed")));
    mapBody.append(row("Address", String(business.address ?? "Not listed")));
    mapBody.append(row("Website", String(business.website ?? "Not listed")));
  }
  const nap = data.napMismatch as { flagged?: boolean; phone?: boolean | null; address?: boolean | null } | null;
  if (!nap) mapBody.append(row("NAP", "No site phone or address to compare."));
  else if (nap.flagged) mapBody.append(row("NAP", `Mismatch${nap.phone ? " on phone" : ""}${nap.address ? " on address" : ""}.`));
  else mapBody.append(row("NAP", "Matches the site on the fields we could compare."));

  setStatus(competitorCard, typeof data.competitorQuery === "string" ? data.competitorQuery : "Top 3");
  const competitors = Array.isArray(data.competitors) ? data.competitors : null;
  if (!competitors) {
    compBody.append(row("Snapshot", "Could not load the top 3."));
    return;
  }
  if (!competitors.length) {
    compBody.append(row("Snapshot", "No results returned."));
    return;
  }
  competitors.forEach((item, index) => {
    const rowData = item as Record<string, unknown>;
    const rating = typeof rowData.rating === "number" ? String(rowData.rating) : "no rating";
    const reviews = typeof rowData.reviewCount === "number" ? `${rowData.reviewCount} reviews` : "review count not listed";
    compBody.append(row(String(index + 1), `${String(rowData.name ?? "Unnamed")} — ${rating}, ${reviews}`));
  });
}

function renderCitations(card: HTMLElement, data: Record<string, unknown>) {
  const body = card.querySelector<HTMLElement>("[data-body]");
  if (!body) return;
  clear(body);
  if (data.ok !== true) {
    setStatus(card, "Could not check AI citations.");
    return;
  }
  setStatus(card, typeof data.query === "string" ? data.query : "Citations");
  const providers = Array.isArray(data.providers) ? data.providers : [];
  for (const item of providers) {
    const provider = item as Record<string, unknown>;
    const name = String(provider.provider ?? "engine");
    if (provider.status === "not_configured") {
      body.append(row(name, "Not checked"));
      continue;
    }
    if (provider.status !== "ok") {
      body.append(row(name, "Could not check"));
      continue;
    }
    const mentioned = provider.mentioned === true ? "Mentioned" : "Not mentioned";
    const companies = Array.isArray(provider.companies) ? provider.companies.filter((c) => typeof c === "string") : [];
    body.append(row(name, companies.length ? `${mentioned}. Named: ${companies.join(", ")}` : mentioned));
  }
}

async function runTool(root: HTMLElement, call: VoiceToolCall): Promise<unknown> {
  const path = TOOL_PATHS[call.name];
  const cardFor = (name: string) => root.querySelector<HTMLElement>(`[data-card="${name}"]`);
  if (!path) return { ok: false, error: "unknown_tool" };
  if (call.name === "site_analysis") setStatus(cardFor("site"), "Checking…");
  if (call.name === "map_pack") {
    setStatus(cardFor("map"), "Checking…");
    setStatus(cardFor("competitors"), "Checking…");
  }
  if (call.name === "ai_citations") setStatus(cardFor("citations"), "Checking…");

  const args = call.args && typeof call.args === "object" ? call.args : {};
  let data: Record<string, unknown> = { ok: false, error: "bad_response" };
  try {
    const res = await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(args),
    });
    const parsed = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    data = parsed ?? { ok: false, error: res.status === 429 ? "rate_limited" : "bad_response" };
    if (res.status === 429) data = { ok: false, error: "rate_limited" };
  } catch {
    data = { ok: false, error: "unreachable" };
  }

  const siteCard = cardFor("site");
  const mapCard = cardFor("map");
  const competitorCard = cardFor("competitors");
  const citationCard = cardFor("citations");
  if (call.name === "site_analysis" && siteCard) renderSite(siteCard, data);
  if (call.name === "map_pack" && mapCard && competitorCard) renderMap(mapCard, competitorCard, data);
  if (call.name === "ai_citations" && citationCard) renderCitations(citationCard, data);
  if (data.error === "rate_limited") {
    const target = call.name === "map_pack" ? cardFor("map") : cardFor(call.name === "ai_citations" ? "citations" : "site");
    if (target) setStatus(target, "Too many checks. Wait a minute.");
  }
  return data;
}

export function initDemoVoice(root: HTMLElement) {
  const button = root.querySelector<HTMLButtonElement>("[data-start]");
  const retryBtn = root.querySelector<HTMLButtonElement>("[data-retry]");
  const errorText = root.querySelector<HTMLElement>("[data-error-text]");
  const page = root.closest("main") ?? document.body;
  const testMode = new URLSearchParams(location.search).get("test") === "1";
  const cache = createVoiceTokenCache({ body: JSON.stringify({ demo: true }) });

  let call: VoiceCall | null = null;
  let state: State = "idle";
  let cancelled = false;

  const setState = (next: State) => {
    state = next;
    root.dataset.state = next;
  };

  const showError = (message: string) => {
    if (errorText) errorText.textContent = message;
    setState("error");
  };

  const hangUp = () => {
    cancelled = true;
    call?.hangUp();
    call = null;
    setState("idle");
  };

  const start = () => {
    if (state !== "idle") return;
    if (typeof WebSocket === "undefined") {
      showError(MSG_NO_WEBSOCKET);
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      showError(MSG_MIC_BLOCKED);
      return;
    }
    cancelled = false;
    markTap();
    setState("connecting");
    root.dataset.audioUnlocked = "1";
    let armed: ReturnType<typeof armVoiceGesture>;
    try {
      armed = armVoiceGesture();
    } catch {
      showError(MSG_GENERIC);
      return;
    }
    call = beginVoiceCall({
      cache,
      playback: armed.playback,
      intro: armed.intro,
      instructions: demoInstructions(testMode),
      tools: DEMO_TOOLS,
      onToolCall: (toolCall) => runTool(page as HTMLElement, toolCall),
      onLive: () => {
        if (!cancelled) setState("live");
      },
    });
    void call.ready.catch((err: unknown) => {
      const active = call;
      call = null;
      if (cancelled) {
        setState("idle");
        return;
      }
      cancelled = true;
      active?.hangUp();
      const name = err instanceof DOMException ? err.name : "";
      if (name === "NotAllowedError" || name === "NotFoundError") showError(MSG_MIC_BLOCKED);
      else if (err instanceof VoiceTokenError && err.code === "busy") showError(MSG_BUSY);
      else showError(MSG_GENERIC);
    });
  };

  if (button) watchVoiceButton(button, cache);
  button?.addEventListener("click", start);
  root.querySelectorAll<HTMLButtonElement>("[data-end]").forEach((btn) => {
    btn.addEventListener("click", hangUp);
  });
  retryBtn?.addEventListener("click", () => {
    cancelled = true;
    call?.hangUp();
    call = null;
    setState("idle");
  });
}
