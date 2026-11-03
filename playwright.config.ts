import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  workers: 1,
  use: { baseURL: "http://localhost:3100" },
  webServer: { command: "pnpm dev -p 3100", url: "http://localhost:3100/login", reuseExistingServer: true, timeout: 60_000 },
});
