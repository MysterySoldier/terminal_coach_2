import crypto from "crypto";
import fs from "fs";
import path from "path";

import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

function stampServiceWorkerPlugin(): Plugin {
  return {
    name: "coach-echo-stamp-sw",
    apply: "build",
    closeBundle() {
      const distDir = path.resolve(__dirname, "dist");
      const swPath = path.join(distDir, "sw.js");
      const indexPath = path.join(distDir, "index.html");
      const assetsDir = path.join(distDir, "assets");
      if (!fs.existsSync(swPath) || !fs.existsSync(indexPath)) return;

      const indexHtml = fs.readFileSync(indexPath, "utf8");
      const assetFiles = fs.existsSync(assetsDir)
        ? fs
            .readdirSync(assetsDir)
            .filter((f) => /\.(js|css)$/.test(f))
            .sort()
            .map((f) => `/assets/${f}`)
        : [];

      const rawSw = fs.readFileSync(swPath, "utf8");
      const manifestPath = path.join(distDir, "manifest.webmanifest");
      const rawManifest = fs.existsSync(manifestPath)
        ? fs.readFileSync(manifestPath, "utf8")
        : "";
      const buildId = crypto
        .createHash("sha256")
        .update(indexHtml)
        .update(assetFiles.join(","))
        .update(rawSw)
        .update(rawManifest)
        .digest("hex")
        .slice(0, 12);

      const assetListLiteral = assetFiles.map((u) => JSON.stringify(u)).join(",\n  ");
      const stampedSw = rawSw
        .replace("__COACH_ECHO_BUILD_ID__", buildId)
        .replace("/* __COACH_ECHO_BUILD_ASSETS__ */", assetListLiteral);
      fs.writeFileSync(swPath, stampedSw, "utf8");

      if (fs.existsSync(assetsDir)) {
        for (const f of fs.readdirSync(assetsDir)) {
          if (f.endsWith(".js")) {
            const jsPath = path.join(assetsDir, f);
            const jsContent = fs.readFileSync(jsPath, "utf8");
            if (jsContent.includes("__COACH_ECHO_APP_BUILD_ID__")) {
              fs.writeFileSync(
                jsPath,
                jsContent.replace(/__COACH_ECHO_APP_BUILD_ID__/g, buildId),
                "utf8",
              );
            }
          }
        }
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), stampServiceWorkerPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Expose both VITE_* (Vite default) and EXPO_PUBLIC_* (Rork's cross-platform
  // public-env convention, written by tools like getOrCreateAuthConfig).
  envPrefix: ["VITE_", "EXPO_PUBLIC_"],
}));
