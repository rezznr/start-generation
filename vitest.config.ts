import { defineConfig } from "vitest/config";

process.loadEnvFile(".env.local");

export default defineConfig({
  test: { include: ["tests/**/*.test.ts"], testTimeout: 30_000 },
});
