import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
export default defineConfig({
  root: "demo",
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: "@millerjem/fleet-capability-cards/styles.css",
        replacement: fileURLToPath(
          new URL("./dist/styles.css", import.meta.url),
        ),
      },
      {
        find: "@millerjem/fleet-capability-cards",
        replacement: fileURLToPath(new URL("./dist/index.js", import.meta.url)),
      },
    ],
  },
  build: { outDir: "../demo-dist", emptyOutDir: true },
  server: { port: 4180 },
});
