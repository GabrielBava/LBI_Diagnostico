import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// base "./" permite publicar o build em qualquer pasta (GitHub Pages, servidor estático, etc.)
export default defineConfig({
  base: "./",
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
});
