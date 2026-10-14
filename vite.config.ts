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
  build: {
    // As páginas do V1 · Institucional (src/assets/v1) vão embutidas no código: o HTML único abre sem arquivos ao lado.
    assetsInlineLimit: (arquivo) => (arquivo.includes("/assets/v1/") ? true : undefined),
  },
});
