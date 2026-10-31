// Peças do Diagnóstico em PDF: logo, folha (cabeçalho e rodapé), capa,
// abertura de capítulo, sumário, tabelas, cartões e caixas do modelo LIFE.
import { useId, type CSSProperties, type ReactNode } from "react";
import { RELATORIO, type CapituloRelatorio } from "@/config/relatorio";

export const COR = {
  azul: "#141c3b",
  azulMedio: "#293866",
  azulClaro: "#3d63ab",
  ouro: "#c7a340",
  verde: "#268c5c",
  vermelho: "#c43d3d",
  laranja: "#db9426",
  cinza: "#787c8a",
};

/** Sequência de cores das séries (barras e roscas), na ordem do modelo. */
export const SERIES = [
  COR.azulMedio,
  COR.ouro,
  COR.verde,
  "#c0603a",
  "#7b52ab",
  COR.azulClaro,
  COR.vermelho,
  COR.laranja,
  "#2a9d8f",
  "#8a8f9c",
  "#a65e8f",
  "#5b7d3a",
];

// ---------------------------------------------------------------------
//  Logo "Grupo Life Brasil" (desenhado em texto, com o coração em SVG)
// ---------------------------------------------------------------------
export function LogoLife() {
  // Id próprio por logo: o gradiente do coração não depende de outra página.
  const id = `rel-coracao-${useId().replace(/:/g, "")}`;
  return (
    <span className="rel-logo" aria-label="Grupo Life Brasil">
      <span className="rel-logo-leve">Grupo</span>
      <span className="rel-logo-forte">Life</span>
      <span className="rel-logo-leve">Brasil</span>
      <svg className="rel-logo-coracao" viewBox="0 0 12 12" aria-hidden="true">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#d6533b" />
            <stop offset="0.55" stopColor="#e35f39" />
            <stop offset="1" stopColor="#f08a3a" />
          </linearGradient>
        </defs>
        <path d="M0 12V4a4 4 0 0 1 8 0a4 4 0 0 1 0 8z" fill={`url(#${id})`} />
      </svg>
    </span>
  );
}

// ---------------------------------------------------------------------
//  Folha (página A4 paisagem)
// ---------------------------------------------------------------------
export interface InfoRodape {
  cliente: string;
  /** "Plataforma LIFE v10.0.0 · 14/09/2026" */
  plataforma: string;
}

function Rodape({ info, numero, total }: { info: InfoRodape; numero: number; total: number }) {
  return (
    <footer className="rel-rodape">
      <p className="rel-rodape-aviso">{RELATORIO.aviso}</p>
      <p className="rel-rodape-plataforma">{info.plataforma}</p>
      <div className="rel-rodape-base">
        <span>{RELATORIO.sistema}</span>
        <span>{info.cliente}</span>
        <span>
          {numero} / {total}
        </span>
      </div>
    </footer>
  );
}

/** Cabeçalho: logo + capítulo à esquerda, "CAP. 0X — TÍTULO" à direita. */
function Cabecalho({ esquerda, direita }: { esquerda: string; direita: string }) {
  return (
    <header className="rel-cab">
      <div className="rel-cab-esq">
        <LogoLife />
        <span className="rel-cab-capitulo">{esquerda}</span>
      </div>
      <span className="rel-cab-dir">{direita}</span>
    </header>
  );
}

export const rotuloCapitulo = (cap: CapituloRelatorio) => `CAPÍTULO ${cap.numero}`;
export const cabecalhoCapitulo = (cap: CapituloRelatorio) => `CAP. ${cap.numero} — ${cap.titulo}`;

/** Página de conteúdo (fundo branco, cabeçalho, título com traço dourado e rodapé). */
export function FolhaConteudo({
  cabecalho,
  titulo,
  continuacao,
  subtitulo,
  info,
  numero,
  total,
  junto,
  children,
}: {
  cabecalho: { esquerda: string; direita: string };
  /** Sem título, o conteúdo começa mais acima (como nas páginas de continuação do modelo). */
  titulo?: string;
  continuacao?: boolean;
  subtitulo?: string;
  info: InfoRodape;
  numero: number;
  total: number;
  /** Menos espaço entre os blocos. */
  junto?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="rel-folha">
      <div className="rel-faixa" />
      <Cabecalho {...cabecalho} />
      <div className={`rel-corpo ${titulo ? "" : "rel-corpo-sem-titulo"}`}>
        {titulo && (
          <>
            <h2 className="rel-titulo">
              {titulo}
              {continuacao && <span className="rel-titulo-cont"> (continuação)</span>}
            </h2>
            <div className="rel-titulo-traco" />
            {subtitulo && <p className="rel-subtitulo">{subtitulo}</p>}
          </>
        )}
        <div className={`rel-conteudo ${junto ? "rel-conteudo-junto" : ""}`} style={titulo ? undefined : { marginTop: 0 }}>
          {children}
        </div>
      </div>
      <Rodape info={info} numero={numero} total={total} />
    </section>
  );
}

/** Abertura de capítulo: metade creme com o título, metade azul com a frase. */
export function FolhaAbertura({ capitulo, frase, info, numero, total }: { capitulo: CapituloRelatorio; frase: string; info: InfoRodape; numero: number; total: number }) {
  return (
    <section className="rel-folha rel-folha-azul">
      <div className="rel-abertura-topo" />
      <div className="rel-abertura-base" />
      <div className="rel-faixa" />
      <div className="rel-abertura-texto">
        <div className="rel-abertura-capitulo">{rotuloCapitulo(capitulo)}</div>
        <h2 className="rel-abertura-titulo">{capitulo.titulo}</h2>
        <div className="rel-abertura-regua" />
      </div>
      <p className="rel-abertura-frase">{frase}</p>
      <Rodape info={info} numero={numero} total={total} />
    </section>
  );
}

/** Capa azul-marinho com faixas douradas. */
export function FolhaCapa({ cliente, emitido, email, plataforma, assinatura }: { cliente: string; emitido: string; email: string; plataforma: string; assinatura: string }) {
  const c = RELATORIO.capa;
  return (
    <section className="rel-folha rel-capa">
      <div className="rel-faixa" />
      <div className="rel-capa-conteudo">
        <LogoLife />
        <div className="rel-capa-sistema">{RELATORIO.sistema}</div>
        <div className="rel-capa-regua" />
        <div className="rel-capa-sub">{c.subtitulo}</div>
        <h1 className="rel-capa-titulo">
          {c.titulo.map((l) => (
            <div key={l}>{l}</div>
          ))}
        </h1>
        <div className="rel-capa-lema">{c.lema}</div>
      </div>
      <div className="rel-capa-cliente">
        <div className="rel-capa-rotulo">{c.rotuloCliente}</div>
        <div className="rel-capa-nome">{cliente}</div>
        <div className="rel-capa-linha">
          <div>Emitido em {emitido}</div>
          {email && <div>{email}</div>}
        </div>
        <div className="rel-capa-plataforma">{plataforma.toUpperCase()}</div>
        <div className="rel-capa-assina">{assinatura}</div>
      </div>
      <div className="rel-faixa rel-faixa-base" />
    </section>
  );
}

export function Sumario() {
  return (
    <div className="rel-sumario">
      {RELATORIO.capitulos.map((cap) => (
        <div key={cap.numero} className="rel-sumario-item">
          <span className="rel-sumario-num">{cap.numero}</span>
          <span className="rel-sumario-nome">{cap.sumario}</span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------
//  Tabela com cabeçalho azul-marinho e linhas zebradas
// ---------------------------------------------------------------------
export interface ColunaTabela {
  titulo: string;
  /** Largura (ex.: "18%"). */
  largura?: string;
  /** Classes das células: "dir", "centro", "forte", "vermelho"... */
  classe?: string;
}

export interface CelulaTabela {
  texto: ReactNode;
  classe?: string;
}

export function Tabela({ colunas, linhas, compacta }: { colunas: ColunaTabela[]; linhas: (ReactNode | CelulaTabela)[][]; compacta?: boolean }) {
  const ehCelula = (c: ReactNode | CelulaTabela): c is CelulaTabela => typeof c === "object" && c !== null && "texto" in (c as object);
  return (
    <table className={`rel-tabela ${compacta ? "rel-tabela-compacta" : ""}`}>
      <colgroup>
        {colunas.map((c) => (
          <col key={c.titulo} style={c.largura ? { width: c.largura } : undefined} />
        ))}
      </colgroup>
      <thead>
        <tr>
          {colunas.map((c) => (
            <th key={c.titulo} className={c.classe?.includes("dir") ? "dir" : c.classe?.includes("centro") ? "centro" : undefined}>
              {c.titulo}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {linhas.map((l, i) => (
          <tr key={i}>
            {l.map((c, j) => {
              const cel = ehCelula(c) ? c : { texto: c };
              return (
                <td key={j} className={[colunas[j]?.classe, cel.classe].filter(Boolean).join(" ") || undefined}>
                  {cel.texto}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ---------------------------------------------------------------------
//  Cartões de indicador (barra lateral colorida)
// ---------------------------------------------------------------------
export interface DadosCartao {
  rotulo: string;
  valor: string;
  nota?: string;
  cor: string;
}

export function Cartoes({ itens, colunas, baixo }: { itens: DadosCartao[]; colunas?: number; baixo?: boolean }) {
  const n = colunas ?? itens.length;
  // Valores longos diminuem a fonte para caber no cartão (6 cartões por linha).
  const tamanho = (v: string) => (n >= 6 ? (v.length > 14 ? "rel-cartao-valor-pequeno" : v.length > 11 ? "rel-cartao-valor-medio" : "") : v.length > 22 ? "rel-cartao-valor-medio" : "");
  return (
    <div className="rel-cartoes" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
      {itens.map((c) => (
        <div key={c.rotulo} className={`rel-cartao ${baixo ? "rel-cartao-baixo" : ""}`} style={{ "--cor": c.cor } as CSSProperties}>
          <div className="rel-cartao-rotulo">{c.rotulo}</div>
          <div className={`rel-cartao-valor ${tamanho(c.valor)}`}>{c.valor}</div>
          {c.nota && <div className="rel-cartao-nota">{c.nota}</div>}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------
//  Caixas de destaque (azul-marinho ou dourada) e bloco decisório
// ---------------------------------------------------------------------
export function Caixa({ rotulo, children, ouro }: { rotulo: string; children: ReactNode; ouro?: boolean }) {
  return (
    <div className={`rel-caixa ${ouro ? "rel-caixa-ouro" : ""}`}>
      <div className="rel-caixa-rotulo">{rotulo}</div>
      <div className="rel-caixa-texto">{children}</div>
    </div>
  );
}

export interface DadosBloco {
  objetivo: string;
  realidade: string;
  ajuste: string;
}

export function BlocoDecisorio({ titulo, bloco, compacto }: { titulo: string; bloco: DadosBloco; compacto?: boolean }) {
  const r = RELATORIO.bloco;
  return (
    <div>
      <div className="rel-bloco-titulo">{titulo}</div>
      <div className={`rel-bloco ${compacto ? "rel-bloco-compacto" : ""}`}>
        <div className="rel-bloco-cartao">
          <div className="rel-bloco-rotulo">{r.objetivo}</div>
          <div className="rel-bloco-texto">{bloco.objetivo}</div>
        </div>
        <div className="rel-bloco-cartao realidade">
          <div className="rel-bloco-rotulo">{r.realidade}</div>
          <div className="rel-bloco-texto">{bloco.realidade}</div>
        </div>
        <div className="rel-bloco-cartao ajuste">
          <div className="rel-bloco-rotulo">{r.ajuste}</div>
          <div className="rel-bloco-texto">{bloco.ajuste}</div>
        </div>
      </div>
    </div>
  );
}

/** Painel creme com título (envolve os gráficos). */
export function Painel({ titulo, sub, children }: { titulo: string; sub?: string; children: ReactNode }) {
  return (
    <div className="rel-painel">
      <div className="rel-painel-titulo">{titulo}</div>
      {sub && <div className="rel-painel-sub">{sub}</div>}
      {children}
    </div>
  );
}

export const Vazio = ({ children }: { children: ReactNode }) => <div className="rel-painel-vazio">{children}</div>;
