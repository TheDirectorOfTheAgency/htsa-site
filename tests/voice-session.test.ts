import { describe, expect, it } from "vitest";
import { MONEYPENNY_CONSOLE_PROMPT } from "../src/lib/moneypenny-prompt";
import { DEMO_SALES_INSTRUCTIONS, DEMO_SOFT_CLOSE, demoInstructions } from "../src/lib/demo-session";
import { buildSessionUpdate } from "../src/lib/voice-adapter";
import { isTokenFresh } from "../src/lib/voice-token-cache";
import { DEFAULT_CHAT_MODEL } from "../functions/lib/handle-chat";

describe("voice session update", () => {
  it("asks for server VAD and does not push the long console prompt", () => {
    const update = buildSessionUpdate();
    const text = JSON.stringify(update);
    expect(update.session.turn_detection).toEqual({ type: "server_vad" });
    expect(update.session.instructions).toBeUndefined();
    expect(update.session.tools).toBeUndefined();
    expect(text).not.toContain("negative keywords");
    expect(MONEYPENNY_CONSOLE_PROMPT).toContain("negative keywords");
    expect(MONEYPENNY_CONSOLE_PROMPT.length).toBeGreaterThan(4000);
  });

  it("sends the short demo instructions and tools only when asked", () => {
    const update = buildSessionUpdate({
      instructions: demoInstructions(false),
      tools: [{ type: "function", name: "site_analysis", description: "check", parameters: { type: "object" } }],
    });
    const text = JSON.stringify(update);
    expect(text).toContain("server_vad");
    expect(text).toContain(DEMO_SOFT_CLOSE);
    expect(text).toContain("site_analysis");
    expect(text).not.toContain("negative keywords");
  });
});

describe("demo sales instructions", () => {
  it("keeps pricing on a call and only the approved proof figures", () => {
    const text = `${DEMO_SALES_INSTRUCTIONS}\n${demoInstructions(true)}`;
    expect(text).toContain("Join the Skool foyer");
    expect(text).not.toContain("call with Marshall");
    expect(text).not.toContain("Book a call");
    expect(text).not.toContain("talk to Marshall");
    expect(text).toContain("$6,458.10");
    expect(text).toContain("best month $59,798.23");
    expect(text).toContain("$512,022.13");
    expect(text).toContain("never done-for-you");
    expect(text).toContain("North Loop TV Mounting");
    expect(text).toContain("$59,632.98, $5,175");
    expect(text).not.toContain("$59,798.23, $5,175");
    expect(MONEYPENNY_CONSOLE_PROMPT).toContain("best month was $59,798.23");
    expect(MONEYPENNY_CONSOLE_PROMPT).toContain("Join the Skool foyer");
    expect(MONEYPENNY_CONSOLE_PROMPT).not.toContain("$59,632");
    expect(MONEYPENNY_CONSOLE_PROMPT).not.toContain("$2,000");
    expect(MONEYPENNY_CONSOLE_PROMPT).not.toContain("call with Marshall");
    expect(MONEYPENNY_CONSOLE_PROMPT).not.toContain("Book a call");
    expect(text).toContain("$5,175");
    expect(text).toContain("5,000+ TVs");
    expect(text).toContain("650+ reviews");
    expect(text).toContain("Retired claims, never say these");
    expect(text).not.toContain("$2,000");
    expect(text).not.toContain("$17,291");
    for (const price of ["$97", "$497", "$1,497", "$15,000"]) {
      expect(text).not.toContain(price);
    }
  });
});

describe("voice token freshness", () => {
  it("treats a token inside the skew window as stale", () => {
    const now = 1_800_000_000_000;
    expect(isTokenFresh({ expiresAt: Math.floor(now / 1000) + 10 }, now)).toBe(false);
    expect(isTokenFresh({ expiresAt: Math.floor(now / 1000) + 60 }, now)).toBe(true);
  });
});

describe("chat model fallback", () => {
  it("matches the model handle-chat uses", () => {
    expect(DEFAULT_CHAT_MODEL).toBe("grok-4.20-0309-non-reasoning");
  });
});
