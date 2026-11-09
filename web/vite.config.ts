import { defineConfig } from "vite";

// The page reads data/processed/ (latest.json, meta.json, history/) at runtime.
// Serving it as Vite's public dir copies it into dist/ on every build.
export default defineConfig({
  base: "./",
  publicDir: "../data/processed",
  build: { outDir: "dist", emptyOutDir: true },
});
