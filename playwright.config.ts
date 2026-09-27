import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests",
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4321",
    trace: "off",
  },
  webServer: {
    command: "npm run preview -- --host 127.0.0.1 --port 4321",
    port: 4321,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      testMatch: "visual.spec.ts",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "webkit",
      testMatch: "webkit-voice.spec.ts",
      use: { ...devices["Desktop Safari"] },
    },
  ],
});
