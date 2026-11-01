import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  root: "web",
  plugins: [react()],
  build: { outDir: "../dist-web", emptyOutDir: true },
  server: { proxy: { "/api": "http://localhost:8787" } },
  test: { root: ".", include: ["test/**/*.test.ts"] },
} as any);
