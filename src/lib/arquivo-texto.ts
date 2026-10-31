// Leitura de arquivos de transcrição no navegador (sem bibliotecas):
// .txt e .md (texto puro), .vtt e .srt (legendas: tira números e marcações de
// tempo e mantém quem fala) e .docx (Word: é um zip; lê word/document.xml).

export const EXTENSOES_TRANSCRICAO = [".txt", ".md", ".vtt", ".srt", ".docx"];
export const ACEITE_TRANSCRICAO = EXTENSOES_TRANSCRICAO.join(",");

export const contarPalavras = (texto: string) => (texto.match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu) ?? []).length;

const extensao = (nome: string) => {
  const i = nome.lastIndexOf(".");
  return i >= 0 ? nome.slice(i).toLowerCase() : "";
};

/** Lê o arquivo e devolve o texto limpo. Lança Error com mensagem para o usuário. */
export async function lerArquivoTranscricao(arquivo: File): Promise<string> {
  const ext = extensao(arquivo.name);
  if (ext === ".doc") throw new Error("Arquivo .doc antigo: abra no Word e salve como .docx ou .txt.");
  if (ext === ".pdf") throw new Error("PDF não é lido aqui: copie o texto do PDF e use \"Colar texto\".");
  if (!EXTENSOES_TRANSCRICAO.includes(ext)) throw new Error(`Formato não aceito (${ext || "sem extensão"}). Use .txt, .md, .vtt, .srt ou .docx.`);
  if (arquivo.size > 30 * 1024 * 1024) throw new Error("Arquivo grande demais (mais de 30 MB).");
  const bytes = new Uint8Array(await arquivo.arrayBuffer());
  let texto: string;
  if (ext === ".docx") texto = await textoDocx(bytes);
  else {
    const bruto = decodificar(bytes);
    texto = ext === ".vtt" || ext === ".srt" ? limparLegenda(bruto) : bruto;
  }
  texto = arrumarEspacos(texto);
  if (!texto) throw new Error("O arquivo não tem texto.");
  return texto;
}

/** UTF-8; se não for UTF-8 válido, Windows-1252 (arquivos antigos do Windows). */
function decodificar(bytes: Uint8Array) {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes).replace(/^﻿/, "");
  } catch {
    return new TextDecoder("windows-1252").decode(bytes);
  }
}

const arrumarEspacos = (t: string) =>
  t
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t ]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

// ---------------------------------------------------------------------
//  Legendas (.vtt e .srt)
// ---------------------------------------------------------------------
const TEMPO = /^\s*(\d{1,2}:)?\d{1,2}:\d{2}[.,]\d{1,3}\s*-->\s*(\d{1,2}:)?\d{1,2}:\d{2}[.,]\d{1,3}.*$/;

/**
 * Tira cabeçalho, números das falas e marcações de tempo; "<v Nome>texto" vira
 * "Nome: texto". Falas seguidas da mesma pessoa viram um parágrafo só.
 */
export function limparLegenda(bruto: string): string {
  const blocos = bruto.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").split(/\n\s*\n/);
  const falas: { quem?: string; texto: string }[] = [];
  for (const bloco of blocos) {
    const linhas = bloco.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!linhas.length) continue;
    // Cabeçalho e blocos de metadados do WebVTT.
    if (/^(WEBVTT|NOTE|STYLE|REGION)\b/.test(linhas[0])) continue;
    const iTempo = linhas.findIndex((l) => TEMPO.test(l));
    // Com marcação de tempo, só o que vem depois dela; sem marcação, tira os números soltos.
    const conteudo = iTempo >= 0 ? linhas.slice(iTempo + 1) : linhas.filter((l) => !/^\d+$/.test(l));
    for (const linha of conteudo) {
      let quem: string | undefined;
      const voz = linha.match(/<v(?:\.[^\s>]+)?\s+([^>]+)>/i);
      if (voz) quem = voz[1].trim();
      let texto = linha
        .replace(/<\d{1,2}:\d{2}(:\d{2})?[.,]\d{1,3}>/g, "") // tempo dentro da fala (karaokê)
        .replace(/<[^>]+>/g, "") // <v>, <c>, <i>, <b>…
        .replace(/\{\\[^}]*\}/g, "") // {\an8} do .srt
        .replace(/&nbsp;/g, " ")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .trim();
      if (!texto) continue;
      // "Nome: fala" (Zoom, Meet).
      const m = quem ? null : texto.match(/^([^:\d][^:]{0,59}):\s+(.*)$/);
      if (m && !/https?$/i.test(m[1])) {
        quem = m[1].trim();
        texto = m[2].trim();
      }
      // "- fala" (diálogo sem nome): começa um parágrafo novo.
      const dialogo = !quem && /^-\s+/.test(texto);
      if (dialogo) texto = texto.replace(/^-\s+/, "");
      const ultima = falas[falas.length - 1];
      const continua =
        ultima &&
        !dialogo &&
        (quem
          ? ultima.quem === quem
          : // Sem nome: continua a fala anterior (sem nome, quebra parágrafos longos no fim de uma frase).
            !!ultima.quem || !(ultima.texto.length > 600 && /[.!?…]$/.test(ultima.texto)));
      if (continua) ultima.texto = `${ultima.texto} ${texto}`;
      else falas.push({ quem, texto });
    }
  }
  return falas.map((f) => (f.quem ? `${f.quem}: ${f.texto}` : f.texto)).join("\n");
}

// ---------------------------------------------------------------------
//  Word (.docx): leitor de zip mínimo + word/document.xml
// ---------------------------------------------------------------------
const u16 = (b: Uint8Array, i: number) => b[i] | (b[i + 1] << 8);
const u32 = (b: Uint8Array, i: number) => (b[i] | (b[i + 1] << 8) | (b[i + 2] << 16) | (b[i + 3] << 24)) >>> 0;

/** Extrai um arquivo de dentro de um zip (método 0 = guardado, 8 = deflate). */
export async function extrairDoZip(zip: Uint8Array, caminho: string): Promise<Uint8Array> {
  if (u32(zip, 0) !== 0x04034b50) throw new Error("O arquivo não é um .docx válido (não é um zip).");
  // Fim do diretório central: procura de trás para frente (o comentário pode ter até 64 KB).
  let fim = -1;
  for (let i = zip.length - 22; i >= Math.max(0, zip.length - 22 - 65535); i--) {
    if (u32(zip, i) === 0x06054b50) {
      fim = i;
      break;
    }
  }
  if (fim < 0) throw new Error("O .docx parece corrompido (zip incompleto).");
  const total = u16(zip, fim + 10);
  let p = u32(zip, fim + 16);
  const decodNome = new TextDecoder();
  for (let k = 0; k < total && p + 46 <= zip.length; k++) {
    if (u32(zip, p) !== 0x02014b50) break;
    const metodo = u16(zip, p + 10);
    const tamanho = u32(zip, p + 20);
    const lenNome = u16(zip, p + 28);
    const lenExtra = u16(zip, p + 30);
    const lenComentario = u16(zip, p + 32);
    const local = u32(zip, p + 42);
    const nome = decodNome.decode(zip.subarray(p + 46, p + 46 + lenNome));
    p += 46 + lenNome + lenExtra + lenComentario;
    if (nome !== caminho) continue;
    if (u32(zip, local) !== 0x04034b50) throw new Error("O .docx parece corrompido.");
    const inicio = local + 30 + u16(zip, local + 26) + u16(zip, local + 28);
    const dados = zip.subarray(inicio, inicio + tamanho);
    if (metodo === 0) return dados;
    if (metodo !== 8) throw new Error("Compressão do .docx não suportada. Salve de novo pelo Word ou use .txt.");
    if (typeof DecompressionStream === "undefined") throw new Error("Este navegador não abre .docx. Atualize o navegador ou use .txt.");
    const fluxo = new Blob([dados]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    return new Uint8Array(await new Response(fluxo).arrayBuffer());
  }
  throw new Error(`O .docx não tem ${caminho}.`);
}

const NS_WORD = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";

/** Texto do Word: um parágrafo por linha (tabulações e quebras de linha mantidas). */
export async function textoDocx(bytes: Uint8Array): Promise<string> {
  const xml = new TextDecoder().decode(await extrairDoZip(bytes, "word/document.xml"));
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.getElementsByTagName("parsererror").length) throw new Error("Não foi possível ler o conteúdo do .docx.");
  const corpo = doc.getElementsByTagNameNS(NS_WORD, "body")[0] ?? doc.documentElement;
  const ehParagrafo = (e: Element) => e.namespaceURI === NS_WORD && e.localName === "p";
  const percorrer = (no: Element, partes: string[]) => {
    for (const filho of Array.from(no.children)) {
      if (filho.namespaceURI !== NS_WORD) {
        // Caixas de texto vêm em duas versões (mc:Choice e mc:Fallback): fica só a primeira.
        if (filho.localName !== "Fallback") percorrer(filho, partes);
        continue;
      }
      switch (filho.localName) {
        case "t":
          partes.push(filho.textContent ?? "");
          break;
        case "tab":
          partes.push("\t");
          break;
        case "br":
        case "cr":
          partes.push("\n");
          break;
        case "p": // parágrafo dentro de caixa de texto
          partes.push("\n");
          percorrer(filho, partes);
          break;
        case "delText": // texto apagado no controle de alterações
        case "instrText": // códigos de campo
          break;
        default:
          percorrer(filho, partes);
      }
    }
  };
  const dentroDeOutro = (p: Element) => {
    for (let pai = p.parentElement; pai; pai = pai.parentElement) if (ehParagrafo(pai)) return true;
    return false;
  };
  const paragrafos: string[] = [];
  for (const p of Array.from(corpo.getElementsByTagNameNS(NS_WORD, "p"))) {
    // Parágrafos de caixas de texto já entram no parágrafo de fora.
    if (dentroDeOutro(p)) continue;
    const partes: string[] = [];
    percorrer(p, partes);
    paragrafos.push(partes.join(""));
  }
  return paragrafos.join("\n");
}
