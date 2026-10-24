import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@settings": fileURLToPath(new URL("./settings.ts", import.meta.url)),
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(new URL("./tests/fixtures/server-only.ts", import.meta.url)),
    },
  },
  test: {
    include: ["{src,tests}/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["tests/e2e/**"],
    environment: "node",
    restoreMocks: true,
    clearMocks: true,
    setupFiles: ["./tests/setup.ts"],
  },
});
