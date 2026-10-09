// Junta o build (dist/) em UM arquivo HTML que abre direto no navegador,
// sem instalar nada: html/Diagnostico-LIFE.html
// Uso: npm run html
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(raiz, "dist");
let html = readFileSync(join(dist, "index.html"), "utf8");

// <script type="module" src="./assets/x.js"> -> script embutido
html = html.replace(/<script type="module" crossorigin src="\.\/(assets\/[^"]+\.js)"><\/script>/g, (_, arq) => {
  const js = readFileSync(join(dist, arq), "utf8").replace(/<\/script/gi, "<\\/script");
  return `<script type="module">\n${js}\n</script>`;
});

// <link rel="stylesheet" href="./assets/x.css"> -> estilo embutido
html = html.replace(/<link rel="stylesheet" crossorigin href="\.\/(assets\/[^"]+\.css)">/g, (_, arq) => {
  return `<style>\n${readFileSync(join(dist, arq), "utf8")}\n</style>`;
});

// favicon -> data URI
const icone = readFileSync(join(dist, "favicon.svg"), "utf8");
html = html.replace('href="./favicon.svg"', `href="data:image/svg+xml,${encodeURIComponent(icone)}"`);

if (/src="\.\/assets|href="\.\/assets/.test(html)) throw new Error("Sobrou referência a arquivo externo em assets/");

const saida = join(raiz, "html", "Diagnostico-LIFE.html");
mkdirSync(dirname(saida), { recursive: true });
writeFileSync(saida, html);
console.log(`Gerado ${saida} (${Math.round(html.length / 1024)} KB)`);
