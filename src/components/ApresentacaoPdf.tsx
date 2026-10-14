// Visualizador da apresentação institucional (V1): as páginas do PDF viram imagens
// (scripts/gerar-v1.py → src/assets/v1). Navegação por botões, miniaturas e teclado (← →),
// tela cheia para apresentar ao cliente e os links do PDF como áreas clicáveis.
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2, Minimize2 } from "lucide-react";
import dados from "@/assets/v1/paginas.json";

const imagens = import.meta.glob("/src/assets/v1/*.webp", { eager: true, import: "default" }) as Record<string, string>;

interface Link {
  url: string;
  x: number;
  y: number;
  w: number;
  h: number;
}
const PAGINAS = (dados.paginas as { arquivo: string; largura: number; altura: number; links: Link[] }[])
  .map((p) => ({ ...p, src: imagens[`/src/assets/v1/${p.arquivo}`] }))
  .filter((p) => !!p.src);

const botaoSeta =
  "absolute top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-white backdrop-blur transition hover:bg-black/70 disabled:pointer-events-none disabled:opacity-0";

export function ApresentacaoPdf() {
  const [atual, setAtual] = useState(0);
  const [telaCheia, setTelaCheia] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  const miniaturas = useRef<HTMLDivElement>(null);
  const total = PAGINAS.length;
  const ir = useCallback((i: number) => setAtual(Math.max(0, Math.min(total - 1, i))), [total]);

  // Tela cheia: a do navegador quando existe; senão (ex.: iPhone), a página inteira com a apresentação por cima.
  const alternarTelaCheia = async () => {
    if (telaCheia) {
      if (document.fullscreenElement) await document.exitFullscreen().catch(() => undefined);
      setTelaCheia(false);
      return;
    }
    setTelaCheia(true);
    if (raiz.current?.requestFullscreen) await raiz.current.requestFullscreen().catch(() => undefined);
  };
  useEffect(() => {
    const aoMudar = () => {
      if (!document.fullscreenElement) setTelaCheia(false);
    };
    document.addEventListener("fullscreenchange", aoMudar);
    return () => document.removeEventListener("fullscreenchange", aoMudar);
  }, []);

  // Teclado na tela cheia: setas, espaço, Home/End e Esc.
  useEffect(() => {
    if (!telaCheia) return;
    const teclas = (e: KeyboardEvent) => {
      if (["ArrowRight", "PageDown", " "].includes(e.key)) ir(atual + 1);
      else if (["ArrowLeft", "PageUp"].includes(e.key)) ir(atual - 1);
      else if (e.key === "Home") ir(0);
      else if (e.key === "End") ir(total - 1);
      else if (e.key === "Escape" && !document.fullscreenElement) setTelaCheia(false);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", teclas);
    const corpo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", teclas);
      document.body.style.overflow = corpo;
    };
  }, [telaCheia, atual, ir, total]);

  // A miniatura da página atual fica visível na faixa.
  useEffect(() => {
    miniaturas.current?.querySelector<HTMLElement>(`[data-pagina='${atual}']`)?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [atual]);

  if (!total) return <p className="text-sm text-muted-foreground">Nenhuma página da apresentação encontrada.</p>;
  const pagina = PAGINAS[atual];

  return (
    <div
      ref={raiz}
      role="region"
      aria-roledescription="apresentação"
      aria-label={`Apresentação institucional, página ${atual + 1} de ${total}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (telaCheia) return;
        if (e.key === "ArrowRight") ir(atual + 1);
        else if (e.key === "ArrowLeft") ir(atual - 1);
        else return;
        e.preventDefault();
      }}
      className={
        telaCheia
          ? "fixed inset-0 z-[60] flex flex-col bg-black outline-none"
          : "space-y-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
      }
    >
      <div className={telaCheia ? "relative flex min-h-0 flex-1 items-center justify-center" : "relative overflow-hidden rounded-xl border border-border bg-black"}>
        {/* Na tela cheia a página cabe inteira (largura limitada pela altura livre), e os links seguem a imagem. */}
        <div
          className="relative mx-auto"
          style={{
            aspectRatio: `${pagina.largura} / ${pagina.altura}`,
            width: telaCheia ? `min(100%, calc((100vh - 72px) * ${pagina.largura / pagina.altura}))` : "100%",
          }}
        >
          <img src={pagina.src} alt={`Página ${atual + 1} de ${total} da apresentação institucional`} className="h-full w-full select-none object-contain" draggable={false} />
          {pagina.links.map((l, i) => (
            <a
              key={i}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Abrir link da apresentação"
              title="Abrir link"
              className="absolute rounded-sm hover:bg-white/10"
              style={{ left: `${l.x}%`, top: `${l.y}%`, width: `${l.w}%`, height: `${l.h}%` }}
            />
          ))}
        </div>
        <button type="button" onClick={() => ir(atual - 1)} disabled={atual === 0} aria-label="Página anterior" className={`${botaoSeta} left-3`}>
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button type="button" onClick={() => ir(atual + 1)} disabled={atual === total - 1} aria-label="Próxima página" className={`${botaoSeta} right-3`}>
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className={`flex items-center gap-3 ${telaCheia ? "px-4 py-3 text-white" : ""}`}>
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground" aria-live="polite">
          {atual + 1} / {total}
        </span>
        <div ref={miniaturas} className={`flex min-w-0 flex-1 gap-2 overflow-x-auto py-1 ${telaCheia ? "hidden sm:flex" : ""}`}>
          {PAGINAS.map((p, i) => (
            <button
              key={p.arquivo}
              type="button"
              data-pagina={i}
              onClick={() => ir(i)}
              aria-label={`Ir para a página ${i + 1}`}
              aria-current={i === atual ? "page" : undefined}
              className={`h-11 shrink-0 overflow-hidden rounded-md border-2 transition ${i === atual ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"}`}
              style={{ aspectRatio: `${p.largura} / ${p.altura}` }}
            >
              <img src={p.src} alt="" className="h-full w-full object-cover" draggable={false} />
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={alternarTelaCheia}
          className={`no-print inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md px-3 text-xs font-semibold transition ${
            telaCheia ? "bg-white/15 text-white hover:bg-white/25" : "bg-gold text-primary-foreground hover:brightness-105"
          }`}
        >
          {telaCheia ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          {telaCheia ? "Sair" : "Apresentar"}
        </button>
      </div>
    </div>
  );
}
