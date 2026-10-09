type Msg = { role: "user" | "assistant"; content: string };

const MSG_BUSY = "I'm getting a lot of questions right now. Give me a minute, then send that again.";
const MSG_FAIL = "That didn't go through. Try sending it again.";

function linkify(el: HTMLElement, text: string) {
  el.textContent = "";
  const re = /(https?:\/\/[^\s)]+)/g;
  let last = 0;
  for (const m of text.matchAll(re)) {
    const i = m.index ?? 0;
    if (i > last) el.append(text.slice(last, i));
    const url = m[1].replace(/[.,;!?]+$/, "");
    const a = document.createElement("a");
    a.href = url;
    a.textContent = url;
    if (!url.startsWith(location.origin)) {
      a.target = "_blank";
      a.rel = "noopener";
    }
    el.append(a);
    last = i + url.length;
  }
  if (last < text.length) el.append(text.slice(last));
}

type Facts = {
  url: string;
  ok: boolean;
  error?: string;
  title?: string;
  description?: string;
  h1?: string[];
  h2Count?: number;
  https?: boolean;
  tel?: boolean;
  schema?: boolean;
  reviews?: boolean;
  images?: number;
  imagesNoAlt?: number;
  words?: number;
};

const URL_HINT = /\b((?:https?:\/\/)?(?:[a-z0-9-]+\.)+[a-z]{2,})(?:\/\S*)?/i;

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function factRows(f: Facts): [boolean | null, string][] {
  if (!f.ok) return [[false, f.error ?? "Couldn't read the page."]];
  const rows: [boolean | null, string][] = [];
  rows.push([f.title && f.title !== "(none)" ? true : false, `Title tag: ${f.title && f.title !== "(none)" ? `"${f.title}"` : "missing"}`]);
  rows.push([f.description && f.description !== "(none)" ? true : false, `Meta description: ${f.description && f.description !== "(none)" ? `"${f.description.slice(0, 140)}${f.description.length > 140 ? "…" : ""}"` : "missing"}`]);
  rows.push([f.h1 && f.h1.length === 1 ? true : false, `Main headline (H1): ${f.h1 && f.h1.length ? `"${f.h1[0]}"${f.h1.length > 1 ? ` plus ${f.h1.length - 1} more` : ""}` : "missing"}`]);
  rows.push([!!f.tel, `Tap-to-call phone link: ${f.tel ? "yes" : "no"}`]);
  rows.push([!!f.schema, `Local business schema: ${f.schema ? "found" : "not found"}`]);
  rows.push([!!f.reviews, `Reviews or testimonials mentioned: ${f.reviews ? "yes" : "no"}`]);
  rows.push([f.imagesNoAlt === 0, `Images: ${f.images ?? 0}, missing alt text: ${f.imagesNoAlt ?? 0}`]);
  rows.push([!!f.https, `Secure (HTTPS): ${f.https ? "yes" : "no"}`]);
  rows.push([null, `Words on the page: about ${f.words ?? 0}`]);
  return rows;
}

function renderFacts(f: Facts): { el: HTMLElement; text: string } {
  const box = document.createElement("div");
  box.className = "sitecheck";
  const h = document.createElement("p");
  h.className = "sitecheck__head";
  h.textContent = `Site check: ${hostOf(f.url)}`;
  box.append(h);
  const ul = document.createElement("ul");
  const lines = [`Site check: ${hostOf(f.url)}`];
  for (const [ok, label] of factRows(f)) {
    const li = document.createElement("li");
    li.className = ok === null ? "is-info" : ok ? "is-ok" : "is-bad";
    li.textContent = label;
    ul.append(li);
    lines.push(`${ok === null ? "-" : ok ? "✓" : "✗"} ${label}`);
  }
  box.append(ul);
  return { el: box, text: lines.join("\n") };
}

export function initMoneyPennyChat(root: HTMLElement) {
  const log = root.querySelector<HTMLElement>("[data-chat-log]")!;
  const form = root.querySelector<HTMLFormElement>("[data-chat-form]")!;
  const input = root.querySelector<HTMLTextAreaElement>("[data-chat-input]")!;
  const send = form.querySelector<HTMLButtonElement>(".btn-send")!;
  const history: Msg[] = [];
  let busy = false;

  const scroll = () => {
    log.scrollTop = log.scrollHeight;
  };

  const bubble = (who: "mp" | "you", text: string) => {
    const wrap = document.createElement("div");
    wrap.className = `msg msg--${who}`;
    const p = document.createElement("p");
    p.className = "msg__text";
    linkify(p, text);
    wrap.append(p);
    log.append(wrap);
    scroll();
    return { wrap, p };
  };

  const addCopy = (wrap: HTMLElement, getText: () => string) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "msg__copy";
    btn.textContent = "Copy";
    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(getText());
        btn.textContent = "Copied";
      } catch {
        btn.textContent = "Select the text to copy";
      }
      setTimeout(() => (btn.textContent = "Copy"), 1800);
    });
    wrap.append(btn);
  };

  const grow = () => {
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 160)}px`;
  };
  input.addEventListener("input", grow);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      form.requestSubmit();
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text || busy) return;
    busy = true;
    send.disabled = true;
    input.value = "";
    grow();
    bubble("you", text);
    history.push({ role: "user", content: text });

    const { wrap, p } = bubble("mp", "");
    wrap.classList.add("msg--typing");
    const hint = text.match(URL_HINT);
    const reading = hint && !/skool\.com/i.test(hint[1]) ? hint[1].replace(/^https?:\/\//i, "").replace(/^www\./, "") : "";
    if (reading) p.textContent = `Reading ${reading}…`;
    let reply = "";
    let raw = "";
    let factsText = "";
    let factsDone = false;
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: history.slice(-24) }),
      });
      if (res.status === 429) throw new Error("busy");
      if (!res.ok || !res.body) throw new Error("fail");
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        raw += dec.decode(value, { stream: true });
        if (!factsDone) {
          if (raw.startsWith("\u001eFACTS ")) {
            const nl = raw.indexOf("\n");
            if (nl === -1) continue;
            try {
              const facts = JSON.parse(raw.slice(7, nl)) as Facts;
              const rendered = renderFacts(facts);
              factsText = rendered.text;
              wrap.insertBefore(rendered.el, p);
              p.textContent = "Checking it against what high-ticket customers look for…";
            } catch {
              // ignore a malformed facts line
            }
            raw = raw.slice(nl + 1);
          }
          factsDone = true;
          if (!raw) continue;
        }
        reply = raw;
        p.textContent = reply;
        scroll();
      }
      reply = reply.trim();
      if (!reply) throw new Error("fail");
      linkify(p, reply);
      history.push({ role: "assistant", content: reply });
      addCopy(wrap, () => (factsText ? `${factsText}\n\n${reply}` : reply));
    } catch (err) {
      history.pop();
      p.textContent = err instanceof Error && err.message === "busy" ? MSG_BUSY : MSG_FAIL;
      if (!input.value) input.value = text;
      grow();
    } finally {
      wrap.classList.remove("msg--typing");
      busy = false;
      send.disabled = false;
      scroll();
    }
  });

}
