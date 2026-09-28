import { describe, it, expect, vi } from "vitest";
import { handleVoiceToken } from "../functions/lib/handle-voice-token";

const env = {
  XAI_API_KEY: "test-key",
  XAI_VOICE_AGENT_ID: "agent_hL8eOtDRQ9nF50G5",
};

function postRequest(headers: Record<string, string> = {}) {
  return new Request("https://example.com/api/voice-token", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: "{}",
  });
}

describe("handleVoiceToken", () => {
  it("mints a token and returns url", async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          value: "ephemeral-test-token",
          expires_at: 1_750_000_000,
        }),
        { status: 200 },
      ),
    );

    const res = await handleVoiceToken({
      request: postRequest({ "CF-Connecting-IP": "203.0.113.1" }),
      env,
      fetch,
      now: () => 1_000_000,
      hits: new Map(),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      ok: true,
      token: "ephemeral-test-token",
      expiresAt: 1_750_000_000,
      url: "wss://api.x.ai/v1/realtime?agent_id=agent_hL8eOtDRQ9nF50G5",
    });

    expect(fetch).toHaveBeenCalledOnce();
    const [url, opts] = fetch.mock.calls[0];
    expect(url).toBe("https://api.x.ai/v1/realtime/client_secrets");
    expect(opts.headers.Authorization).toBe("Bearer test-key");
    expect(JSON.parse(opts.body)).toEqual({ expires_after: { seconds: 300 } });

    const text = JSON.stringify(body);
    expect(text).not.toContain("test-key");
  });

  it("returns config error when key or agent id missing", async () => {
    const fetch = vi.fn();
    const res = await handleVoiceToken({
      request: postRequest(),
      env: { XAI_API_KEY: "", XAI_VOICE_AGENT_ID: "agent_hL8eOtDRQ9nF50G5" },
      fetch,
      hits: new Map(),
    });
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ ok: false, error: "config" });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns token_failed on xAI 401", async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response("unauthorized", { status: 401 }),
    );

    const res = await handleVoiceToken({
      request: postRequest({ "CF-Connecting-IP": "203.0.113.2" }),
      env,
      fetch,
      now: () => 2_000_000,
      hits: new Map(),
    });

    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body).toEqual({ ok: false, error: "token_failed" });
    expect(JSON.stringify(body)).not.toContain("test-key");
    expect(fetch).toHaveBeenCalledOnce();
  });

  it("rate limits after five mints per IP per minute", async () => {
    const fetch = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({ value: "tok", expires_at: 1 }),
          { status: 200 },
        ),
      ),
    );
    const hits = new Map<string, number[]>();
    let now = 3_000_000;

    for (let i = 0; i < 5; i++) {
      const res = await handleVoiceToken({
        request: postRequest({ "CF-Connecting-IP": "198.51.100.7" }),
        env,
        fetch,
        now: () => now,
        hits,
      });
      expect(res.status).toBe(200);
    }

    const blocked = await handleVoiceToken({
      request: postRequest({ "CF-Connecting-IP": "198.51.100.7" }),
      env,
      fetch,
      now: () => now,
      hits,
    });

    expect(blocked.status).toBe(429);
    expect(await blocked.json()).toEqual({ ok: false, error: "rate_limited" });
    expect(fetch).toHaveBeenCalledTimes(5);
  });

  it("rejects GET with 405", async () => {
    const fetch = vi.fn();
    const res = await handleVoiceToken({
      request: new Request("https://example.com/api/voice-token", {
        method: "GET",
      }),
      env,
      fetch,
      hits: new Map(),
    });
    expect(res.status).toBe(405);
    expect(await res.json()).toEqual({ ok: false, error: "method" });
  });
});
