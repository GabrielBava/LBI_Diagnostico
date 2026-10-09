import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// base "./" permite publicar o build em qualquer pasta (GitHub Pages, servidor estático, etc.)
export default defineConfig({
  base: "./",
  plugins: [react()],
  // Data/hora do build, exibida no selo de versão do cabeçalho.
  define: { __GERADO_EM__: JSON.stringify(new Date().toISOString()) },
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
});
