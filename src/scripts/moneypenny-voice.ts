import { createWebSocketAdapter, type VoiceAdapter } from "../lib/voice-adapter";

const MSG_MIC_BLOCKED =
  "The microphone is blocked. Allow the microphone for this site, then try again.";
const MSG_NO_WEBSOCKET =
  "This browser can't start a voice call. Use a current version of Chrome, Safari, or Firefox.";
const MSG_BUSY = "MoneyPenny is busy. Wait a minute, then try again.";
const MSG_GENERIC = "MoneyPenny didn't connect. Try again in a moment.";

type State = "idle" | "connecting" | "live" | "error";

export function initMoneyPennyVoice(root: HTMLElement) {
  const micBtn = root.querySelector<HTMLButtonElement>(".btn-mic");
  const endBtn = root.querySelector<HTMLButtonElement>(".btn-end");
  const retryBtn = root.querySelector<HTMLButtonElement>(".btn-retry");
  const errorText = root.querySelector<HTMLElement>("[data-error-text]");

  let adapter: VoiceAdapter | null = null;
  let stream: MediaStream | null = null;
  let state: State = "idle";

  const setState = (next: State) => {
    state = next;
    root.dataset.state = next;
  };

  const showError = (message: string) => {
    if (errorText) errorText.textContent = message;
    setState("error");
  };

  const hangUp = () => {
    adapter?.hangUp();
    adapter = null;
    stream?.getTracks().forEach((t) => t.stop());
    stream = null;
    setState("idle");
  };

  const startCall = async () => {
    if (state !== "idle") return;

    if (typeof WebSocket === "undefined") {
      showError(MSG_NO_WEBSOCKET);
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      showError(MSG_MIC_BLOCKED);
      return;
    }

    setState("connecting");

    try {
      const [mic, tokenRes] = await Promise.all([
        navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            sampleRate: 24000,
            echoCancellation: true,
            noiseSuppression: true,
          },
        }),
        fetch("/api/voice-token", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: "{}",
        }),
      ]);

      stream = mic;

      if (tokenRes.status === 429) {
        stream.getTracks().forEach((t) => t.stop());
        stream = null;
        showError(MSG_BUSY);
        return;
      }

      const data = await tokenRes.json();
      if (!data.ok) {
        stream.getTracks().forEach((t) => t.stop());
        stream = null;
        showError(MSG_GENERIC);
        return;
      }

      adapter = createWebSocketAdapter(stream, () => setState("live"));
      await adapter.connect({
        token: data.token,
        expiresAt: data.expiresAt,
        url: data.url,
      });
    } catch (err) {
      stream?.getTracks().forEach((t) => t.stop());
      stream = null;
      adapter = null;

      const name = err instanceof DOMException ? err.name : "";
      if (name === "NotAllowedError" || name === "NotFoundError") {
        showError(MSG_MIC_BLOCKED);
      } else if (typeof WebSocket === "undefined") {
        showError(MSG_NO_WEBSOCKET);
      } else {
        showError(MSG_GENERIC);
      }
    }
  };

  micBtn?.addEventListener("click", startCall);
  endBtn?.addEventListener("click", hangUp);
  retryBtn?.addEventListener("click", () => setState("idle"));
}
