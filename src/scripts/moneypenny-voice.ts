import { armVoiceGesture, beginVoiceCall, type VoiceCall } from "../lib/voice-call";
import { VoiceTokenError, createVoiceTokenCache, watchVoiceButton } from "../lib/voice-token-cache";
import { markTap } from "../lib/voice-timing";

const MSG_MIC_BLOCKED =
  "The microphone is blocked. Allow the microphone for this site, then try again.";
const MSG_NO_WEBSOCKET =
  "This browser can't start a voice call. Use a current version of Chrome, Safari, or Firefox.";
const MSG_BUSY = "MoneyPenny is busy. Wait a minute, then try again.";
const MSG_GENERIC = "MoneyPenny didn't connect. Try again in a moment.";

type State = "idle" | "connecting" | "live" | "error";

export function initMoneyPennyVoice(root: HTMLElement) {
  const micBtn = root.querySelector<HTMLButtonElement>('[data-panel="idle"] .btn-mic');
  const endBtn = root.querySelector<HTMLButtonElement>(".btn-end");
  const retryBtn = root.querySelector<HTMLButtonElement>(".btn-retry");
  const errorText = root.querySelector<HTMLElement>("[data-error-text]");
  const cache = createVoiceTokenCache();

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

  const startCall = () => {
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

    let playback: ReturnType<typeof armVoiceGesture>;
    try {
      playback = armVoiceGesture();
    } catch {
      showError(MSG_GENERIC);
      return;
    }

    call = beginVoiceCall({
      cache,
      playback: playback.playback,
      intro: playback.intro,
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

  if (micBtn) watchVoiceButton(micBtn, cache);
  micBtn?.addEventListener("click", startCall);
  endBtn?.addEventListener("click", hangUp);
  retryBtn?.addEventListener("click", () => {
    cancelled = true;
    call?.hangUp();
    call = null;
    setState("idle");
  });
}
