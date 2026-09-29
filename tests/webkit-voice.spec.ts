import { expect, test, type Page } from "@playwright/test";

async function installVoiceShims(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as {
      __sockets: {
        url: string;
        protocols: unknown;
        readyState: number;
        sent: string[];
        onopen: ((ev: unknown) => void) | null;
        onmessage: ((ev: { data: string }) => void) | null;
        onerror: ((ev: unknown) => void) | null;
        onclose: ((ev: unknown) => void) | null;
      }[];
      __audio: { starts: number; stops: number };
    };
    w.__sockets = [];
    w.__audio = { starts: 0, stops: 0 };

    const origCreateBufferSource = AudioContext.prototype.createBufferSource;
    Object.defineProperty(AudioContext.prototype, "createBufferSource", {
      configurable: true,
      writable: true,
      value: function (this: AudioContext) {
        const node = origCreateBufferSource.call(this);
        const start = node.start.bind(node);
        const stop = node.stop.bind(node);
        node.start = ((...args: Parameters<AudioBufferSourceNode["start"]>) => {
          w.__audio.starts += 1;
          return start(...args);
        }) as AudioBufferSourceNode["start"];
        node.stop = ((...args: Parameters<AudioBufferSourceNode["stop"]>) => {
          w.__audio.stops += 1;
          try {
            return stop(...args);
          } catch {
            return undefined;
          }
        }) as AudioBufferSourceNode["stop"];
        return node;
      },
    });

    // Headless WebKit has no microphone. Keep the real playback context and
    // replace only the capture graph so ScriptProcessor never touches a device.
    AudioContext.prototype.createMediaStreamSource = function () {
      return { connect() {}, disconnect() {} } as unknown as MediaStreamAudioSourceNode;
    };
    AudioContext.prototype.createScriptProcessor = function () {
      return {
        connect() {},
        disconnect() {},
        onaudioprocess: null,
      } as unknown as ScriptProcessorNode;
    };

    function FakeWebSocket(this: (typeof w.__sockets)[number], url: string, protocols?: unknown) {
      this.url = String(url);
      this.protocols = protocols;
      this.readyState = 0;
      this.sent = [];
      this.onopen = null;
      this.onmessage = null;
      this.onerror = null;
      this.onclose = null;
      w.__sockets.push(this);
      queueMicrotask(() => {
        this.readyState = 1;
        this.onopen?.({ type: "open" });
      });
    }
    FakeWebSocket.prototype.send = function (this: (typeof w.__sockets)[number], data: string) {
      this.sent.push(String(data));
    };
    FakeWebSocket.prototype.close = function (this: (typeof w.__sockets)[number]) {
      this.readyState = 3;
      this.onclose?.({ type: "close" });
    };
    (FakeWebSocket as unknown as { OPEN: number }).OPEN = 1;
    (FakeWebSocket as unknown as { CONNECTING: number }).CONNECTING = 0;
    (FakeWebSocket as unknown as { CLOSING: number }).CLOSING = 2;
    (FakeWebSocket as unknown as { CLOSED: number }).CLOSED = 3;
    window.WebSocket = FakeWebSocket as unknown as typeof WebSocket;

    const gum = () => Promise.resolve(new MediaStream());
    const MediaDevicesCtor = (window as unknown as { MediaDevices?: { prototype: MediaDevices } }).MediaDevices;
    if (MediaDevicesCtor) MediaDevicesCtor.prototype.getUserMedia = gum;
    if (navigator.mediaDevices) navigator.mediaDevices.getUserMedia = gum;
  });
}

function tokenBody() {
  return JSON.stringify({
    ok: true,
    token: "ephemeral-test-token",
    expiresAt: Math.floor(Date.now() / 1000) + 280,
    url: "wss://api.x.ai/v1/realtime?agent_id=from-env",
  });
}

const silence = btoa(String.fromCharCode(...new Uint8Array(480)));

test("webkit plays realtime audio from a gesture-unlocked context", async ({ page }) => {
  const logs: string[] = [];
  page.on("pageerror", (err) => logs.push(`PAGEERROR ${err.message}`));
  page.on("console", (msg) => logs.push(`${msg.type()}: ${msg.text()}`));
  await installVoiceShims(page);
  await page.route("**/api/voice-token", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: tokenBody() }),
  );
  await page.route("**/audio/moneypenny-hey.mp3", (route) => route.fulfill({ status: 404, body: "" }));
  await page.route(/vimeo/, (route) => route.abort());

  await page.goto("/#moneypenny");
  await expect(page.locator('link[rel="preconnect"][href="https://api.x.ai"]')).toHaveCount(1);
  await expect(page.locator('link[rel="dns-prefetch"][href="https://api.x.ai"]')).toHaveCount(1);

  const button = page.locator('#moneypenny [data-panel="idle"] .btn-mic');
  await button.click();
  await expect(page.locator("#moneypenny")).toHaveAttribute("data-audio-unlocked", "1");
  await page.waitForFunction(() => {
    const sockets = (window as unknown as { __sockets: { readyState: number; sent: string[] }[] }).__sockets;
    return sockets.some((socket) => socket.readyState === 1 && socket.sent.length > 0);
  });

  const opened = await page.evaluate(() => {
    const socket = (window as unknown as { __sockets: { url: string; sent: string[] }[] }).__sockets[0];
    return { url: socket.url, sent: socket.sent.join("\n") };
  });
  expect(opened.url).toContain("wss://api.x.ai/v1/realtime");
  expect(opened.sent).toContain('"type":"server_vad"');
  expect(opened.sent).not.toContain("negative keywords");
  expect(opened.sent).not.toContain("response.create");

  await page.waitForTimeout(1600);
  const afterWait = await page.evaluate(
    () => (window as unknown as { __sockets: { sent: string[] }[] }).__sockets[0].sent.join("\n"),
  );
  expect(afterWait).not.toContain("response.create");
  expect(afterWait).not.toContain("response.cancel");

  await page.waitForFunction(() => (window as unknown as { __audio: { starts: number } }).__audio.starts >= 1);
  const startsBefore = await page.evaluate(() => (window as unknown as { __audio: { starts: number } }).__audio.starts);
  await page.evaluate((delta) => {
    const socket = (window as unknown as { __sockets: { onmessage: ((ev: { data: string }) => void) | null }[] }).__sockets[0];
    socket.onmessage?.({ data: JSON.stringify({ type: "response.created" }) });
    socket.onmessage?.({ data: JSON.stringify({ type: "response.output_audio.delta", delta }) });
  }, silence);
  await page.waitForFunction(
    (before) => (window as unknown as { __audio: { starts: number } }).__audio.starts > before,
    startsBefore,
  );

  await page.evaluate(() => {
    const socket = (window as unknown as { __sockets: { onmessage: ((ev: { data: string }) => void) | null }[] }).__sockets[0];
    socket.onmessage?.({ data: JSON.stringify({ type: "input_audio_buffer.speech_started" }) });
  });
  const afterBarge = await page.evaluate(() => {
    const audio = (window as unknown as { __audio: { stops: number } }).__audio;
    const sent = (window as unknown as { __sockets: { sent: string[] }[] }).__sockets[0].sent.join("\n");
    const marks = performance.getEntriesByType("mark").map((entry) => entry.name);
    return { stops: audio.stops, sent, marks };
  });
  expect(afterBarge.sent).toContain("response.cancel");
  expect(afterBarge.stops).toBeGreaterThan(0);
  expect(afterBarge.marks).toEqual(
    expect.arrayContaining(["moneypenny:tap", "moneypenny:socket-open", "moneypenny:first-audio-byte"]),
  );
  expect(logs.some((line) => line.includes("[moneypenny] tap"))).toBe(true);
  expect(logs.some((line) => line.includes("[moneypenny] socket open"))).toBe(true);
  expect(logs.some((line) => line.includes("[moneypenny] first audio byte"))).toBe(true);
  const pageErrors = logs.filter(
    (line) =>
      line.startsWith("PAGEERROR") &&
      !line.includes("Failed to start the audio device") &&
      !line.includes("AudioDestinationNode"),
  );
  expect(pageErrors).toEqual([]);
});

test("webkit treats a missing intro clip as a no-op", async ({ page }) => {
  const logs: string[] = [];
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  page.on("console", (msg) => logs.push(msg.text()));
  await installVoiceShims(page);
  await page.route("**/api/voice-token", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: tokenBody() }),
  );
  await page.route("**/audio/moneypenny-hey.mp3", (route) => route.fulfill({ status: 404, body: "" }));
  await page.route(/vimeo/, (route) => route.abort());
  await page.goto("/#moneypenny");
  await page.locator('#moneypenny [data-panel="idle"] .btn-mic').click();
  await expect(page.locator("#moneypenny")).toHaveAttribute("data-audio-unlocked", "1");
  await page.waitForFunction(() => (window as unknown as { __sockets: unknown[] }).__sockets.length > 0);
  await expect.poll(() => logs.some((line) => line.includes("[moneypenny] intro clip unavailable"))).toBe(true);
  expect(errors).toEqual([]);
  await expect(page.locator("#moneypenny")).toHaveAttribute("data-state", "live");
});

test("webkit demo page greets from the tap and keeps the test business on screen", async ({ page }) => {
  await installVoiceShims(page);
  await page.route("**/api/voice-token", async (route) => {
    const body = route.request().postData() ?? "";
    expect(body).toContain('"demo":true');
    await route.fulfill({ status: 200, contentType: "application/json", body: tokenBody() });
  });
  await page.route("**/audio/moneypenny-hey.mp3", (route) => route.fulfill({ status: 404, body: "" }));

  await page.goto("/demo/voice-sales?test=1");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.getByText("North Loop TV Mounting")).toBeVisible();
  await expect(page.getByText("TEST PLACEHOLDER")).toBeVisible();
  await page.getByRole("button", { name: "Talk to MoneyPenny" }).click();
  await page.waitForFunction(() => {
    const sockets = (window as unknown as { __sockets: { sent: string[] }[] }).__sockets;
    return sockets.some((socket) => socket.sent.some((frame) => frame.includes("site_analysis")));
  });
  const sent = await page.evaluate(
    () => (window as unknown as { __sockets: { sent: string[] }[] }).__sockets[0].sent.join("\n"),
  );
  expect(sent).toContain("server_vad");
  expect(sent).toContain("Join the Skool foyer and you'll see how he does it.");
  expect(sent).not.toContain("call with Marshall");
  expect(sent).not.toContain("Book a call");
  expect(sent).toContain("Retired claims, never say these");
  expect(sent).toContain("best month $59,798.23");
  expect(sent).toContain("$59,632.98, $5,175");
  expect(sent).toContain("5,000+ TVs");
  expect(sent).toContain("650+ reviews");
  expect(sent).not.toContain("$497");
  expect(sent).toContain("$1,997 a month");
  expect(sent).not.toContain("$2,000");
  await expect(page.locator("#demo-voice")).toHaveAttribute("data-audio-unlocked", "1");
});
