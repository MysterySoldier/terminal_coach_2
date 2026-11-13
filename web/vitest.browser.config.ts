import fs from "node:fs";
import path from "path";

import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

const systemChrome = fs.existsSync("/usr/bin/google-chrome") ? "/usr/bin/google-chrome" : undefined;

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "react-router-dom",
      "lucide-react",
      "@nkzw/create-context-hook",
      "clsx",
      "tailwind-merge",
    ],
  },
  test: {
    globals: true,
    include: ["src/**/*.browser.{test,spec}.{ts,tsx}"],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(
        systemChrome
          ? { launchOptions: { executablePath: systemChrome, args: ["--no-sandbox"] } }
          : undefined,
      ),
      instances: [{ browser: "chromium" }],
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
