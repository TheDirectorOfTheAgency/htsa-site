const TAP = "moneypenny:tap";
const SOCKET = "moneypenny:socket-open";
const FIRST_AUDIO = "moneypenny:first-audio-byte";

function logDelta(label: string, start: string, end: string, measure: string) {
  try {
    performance.measure(measure, start, end);
    const entry = performance.getEntriesByName(measure).at(-1);
    const ms = entry ? Math.round(entry.duration) : null;
    console.log(`[moneypenny] ${label}${ms === null ? "" : ` +${ms}ms`}`);
  } catch {
    console.log(`[moneypenny] ${label}`);
  }
}

export function markTap() {
  performance.clearMarks(TAP);
  performance.clearMarks(SOCKET);
  performance.clearMarks(FIRST_AUDIO);
  performance.clearMeasures("moneypenny:tap-to-socket");
  performance.clearMeasures("moneypenny:tap-to-first-audio");
  performance.mark(TAP);
  console.log("[moneypenny] tap");
}

export function markSocketOpen() {
  performance.mark(SOCKET);
  logDelta("socket open", TAP, SOCKET, "moneypenny:tap-to-socket");
}

export function markFirstAudio() {
  performance.mark(FIRST_AUDIO);
  logDelta("first audio byte", TAP, FIRST_AUDIO, "moneypenny:tap-to-first-audio");
}
