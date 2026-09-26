import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";

mkdirSync("artifacts", { recursive: true });

test("full page screenshots", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.screenshot({
    path: "artifacts/home-1440x900.png",
    fullPage: true,
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.screenshot({
    path: "artifacts/home-390x844.png",
    fullPage: true,
  });
});

test("voice idle state", async ({ page }) => {
  await page.goto("/#moneypenny");
  const voice = page.locator("#moneypenny");
  await expect(voice).toHaveAttribute("data-state", "idle");
  await expect(voice.getByText("Talk to MoneyPenny")).toBeVisible();
  await expect(voice.locator('[data-panel="idle"] .btn-mic')).toBeVisible();
});

test("voice connecting state", async ({ page }) => {
  await page.route("**/api/voice-token", async (route) => {
    await new Promise(() => {});
  });

  await page.goto("/#moneypenny");
  await page.locator('#moneypenny [data-panel="idle"] .btn-mic').click();
  const voice = page.locator("#moneypenny");
  await expect(voice).toHaveAttribute("data-state", "connecting");
  await expect(voice.getByText("Connecting to MoneyPenny…")).toBeVisible();
  await page.screenshot({ path: "artifacts/voice-connecting.png" });
});

test("voice error unsupported browser", async ({ page }) => {
  await page.addInitScript(() => {
    // @ts-expect-error test shim
    delete window.WebSocket;
  });
  await page.goto("/#moneypenny");
  await page.locator('#moneypenny [data-panel="idle"] .btn-mic').click();
  const voice = page.locator("#moneypenny");
  await expect(voice).toHaveAttribute("data-state", "error");
  await expect(
    voice.getByText(
      "This browser can't start a voice call. Use a current version of Chrome, Safari, or Firefox.",
    ),
  ).toBeVisible();
  await page.screenshot({ path: "artifacts/voice-error.png" });
});

test("voice error mic blocked", async ({ page }) => {
  await page.addInitScript(() => {
    const denied = new DOMException("denied", "NotAllowedError");
    navigator.mediaDevices.getUserMedia = () => Promise.reject(denied);
  });
  await page.goto("/#moneypenny");
  await page.locator('#moneypenny [data-panel="idle"] .btn-mic').click();
  const voice = page.locator("#moneypenny");
  await expect(voice).toHaveAttribute("data-state", "error");
  await expect(
    voice.getByText(
      "The microphone is blocked. Allow the microphone for this site, then try again.",
    ),
  ).toBeVisible();
});
