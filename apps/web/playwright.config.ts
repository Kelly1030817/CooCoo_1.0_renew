import { defineConfig, devices } from "@playwright/test";

const viewport = { width: 390, height: 844 } as const;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  expect: { timeout: 15_000 },
  reporter: "list",
  use: {
    headless: true,
    locale: "zh-TW",
    viewport,
    screenshot: "off",
    video: "off",
    trace: "off",
  },
  webServer: [
    {
      command: "bun run dev -- --host 127.0.0.1 --port 5173 --strictPort",
      url: "http://127.0.0.1:5173",
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: "bun run dev -- --host 127.0.0.1 --port 5174 --strictPort",
      url: "http://127.0.0.1:5174",
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        VITE_SUPABASE_URL: "http://127.0.0.1:54321",
        VITE_SUPABASE_PUBLISHABLE_KEY:
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQwMDAwMDAwfQ.e2e",
      },
    },
  ],
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport,
        locale: "zh-TW",
        baseURL: "http://127.0.0.1:5173",
      },
      testIgnore: /auth-recovery\.spec\.ts/,
    },
    {
      name: "auth-recovery",
      use: {
        ...devices["Desktop Chrome"],
        viewport,
        locale: "zh-TW",
        baseURL: "http://127.0.0.1:5174",
      },
      testMatch: /auth-recovery\.spec\.ts/,
    },
  ],
});
