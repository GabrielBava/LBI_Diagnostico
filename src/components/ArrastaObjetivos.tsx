// Arrastar e soltar dos objetivos (3 · Objetivos): a faixa de categorias e o mecanismo de arraste.
// Usa Pointer Events (mouse, caneta e toque) com um "fantasma" que segue o ponteiro — o arrastar
// nativo do HTML5 não funciona no toque. As zonas de destino são elementos com data-zona="<tipo>".
// No toque, a categoria arrasta depois de segurar um instante (antes disso o dedo rola a página).
import { useCallback, useEffect, useRef, useState, type PointerEvent as EventoPonteiro, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X, type LucideIcon } from "lucide-react";
import { CAMPOS_OBJETIVO, ICONES_OBJETIVO, TIPOS_OBJETIVO } from "@/config/campos";
import { SubBloco } from "./ui";

/** O que está sendo arrastado ou selecionado: uma categoria (cria objetivo) ou um objetivo (troca de faixa). */
export type Carga = { tipo: "categoria"; categoria: string } | { tipo: "objetivo"; id: string };

export interface Arrasto {
  carga: Carga;
  /** Zona válida sob o ponteiro (ou null). */
  zona: string | null;
  toque: boolean;
}

/** Cor de cada faixa (bolinha do título). */
export const COR_TIPO: Record<string, string> = {
  Essencial: "bg-accent",
  Desejo: "bg-primary",
  Sonho: "bg-gold",
};

const campoCategoria = CAMPOS_OBJETIVO.find((c) => c.key === "categoria");
/** Categorias de objetivo, na ordem do cadastro, com o ícone de cada uma. */
export const CATEGORIAS: { nome: string; Icone?: LucideIcon }[] = (campoCategoria?.opcoes ?? Object.keys(ICONES_OBJETIVO)).map((nome) => ({
  nome,
  Icone: (campoCategoria?.icones ?? ICONES_OBJETIVO)[nome],
}));

/** Distância (px) para o movimento virar arraste. */
const LIMIAR = 6;
/** No toque, tempo (ms) segurando a categoria antes de arrastar. */
const SEGURAR_MS = 250;
/** Faixa (px) junto ao topo e ao rodapé da tela que rola a página durante o arraste. */
const BORDA = 70;
const VELOCIDADE = 18;

/** Altura coberta no topo pelo cabeçalho fixo (e pelo menu, no celular). */
function alturaTopo() {
  let topo = 0;
  document.querySelectorAll<HTMLElement>("body header, body nav").forEach((el) => {
    const pos = getComputedStyle(el).position;
    if (pos !== "sticky" && pos !== "fixed") return;
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight / 3 && r.bottom < window.innerHeight / 2) topo = Math.max(topo, r.bottom);
  });
  return topo;
}

/**
 * Arrastar com Pointer Events. `iniciar` vai no onPointerDown do item arrastável;
 * `aceita` diz se a zona recebe a carga; `aoSoltar` roda ao soltar numa zona válida.
 */
export function useArrasto({ aoSoltar, aceita }: { aoSoltar: (carga: Carga, zona: string) => void; aceita: (carga: Carga, zona: string) => boolean }) {
  const [arrasto, setArrasto] = useState<Arrasto | null>(null);
  const fantasma = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0 });
  const ativo = useRef(false);
  const bloqueadoAte = useRef(0);
  const encerrar = useRef<((soltou: boolean) => void) | null>(null);
  // Os ouvintes da janela vivem o arraste todo: leem sempre as funções mais recentes.
  const funcoes = useRef({ aoSoltar, aceita });
  funcoes.current = { aoSoltar, aceita };

  useEffect(() => () => encerrar.current?.(false), []);

  const iniciar = (e: EventoPonteiro<HTMLElement>, carga: Carga, { segurar = false }: { segurar?: boolean } = {}) => {
    if (encerrar.current || !e.isPrimary || (e.pointerType === "mouse" && e.button !== 0)) return;
    const id = e.pointerId;
    const x0 = e.clientX;
    const y0 = e.clientY;
    const toque = e.pointerType !== "mouse";
    const esperar = segurar && toque;
    pos.current = { x: x0, y: y0 };
    let arrastando = false;
    let zona: string | null = null;
    let topo = 0;
    let quadro = 0;
    let espera = 0;

    const zonaEm = (x: number, y: number) => {
      const z = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-zona]")?.dataset.zona ?? null;
      return z && funcoes.current.aceita(carga, z) ? z : null;
    };
    const atualizar = () => {
      const { x, y } = pos.current;
      if (fantasma.current) fantasma.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      const z = zonaEm(x, y);
      if (z !== zona) {
        zona = z;
        setArrasto({ carga, zona, toque });
      }
    };
    // Perto do topo ou do rodapé da tela, a página rola sozinha (as faixas ficam umas embaixo das outras).
    const rolar = () => {
      const { y } = pos.current;
      const h = window.innerHeight;
      let v = 0;
      if (y < topo + BORDA && y < y0 - LIMIAR) v = -VELOCIDADE * Math.min(1, (topo + BORDA - y) / BORDA);
      else if (y > h - BORDA && y > y0 + LIMIAR) v = VELOCIDADE * Math.min(1, (y - (h - BORDA)) / BORDA);
      if (Math.abs(v) >= 1) {
        window.scrollBy(0, Math.round(v));
        atualizar();
      }
      quadro = requestAnimationFrame(rolar);
    };
    const comecar = () => {
      arrastando = true;
      ativo.current = true;
      topo = alturaTopo();
      window.getSelection()?.removeAllRanges();
      zona = zonaEm(pos.current.x, pos.current.y);
      setArrasto({ carga, zona, toque });
      quadro = requestAnimationFrame(rolar);
    };
    const mover = (ev: PointerEvent) => {
      if (ev.pointerId !== id) return;
      pos.current = { x: ev.clientX, y: ev.clientY };
      if (!arrastando) {
        const dist = Math.hypot(ev.clientX - x0, ev.clientY - y0);
        if (esperar) {
          // Ainda segurando: mexeu o dedo antes da hora, então é rolagem.
          if (dist > 10) fim(false);
          return;
        }
        if (dist < LIMIAR) return;
        comecar();
      }
      ev.preventDefault();
      atualizar();
    };
    const soltar = (ev: PointerEvent) => {
      if (ev.pointerId !== id) return;
      pos.current = { x: ev.clientX, y: ev.clientY };
      if (arrastando) zona = zonaEm(ev.clientX, ev.clientY);
      fim(true);
    };
    const cancelarPonteiro = (ev: PointerEvent) => ev.pointerId === id && fim(false);
    const cancelar = () => fim(false);
    const tecla = (ev: KeyboardEvent) => {
      if (ev.key !== "Escape" || !arrastando) return;
      ev.preventDefault();
      ev.stopPropagation();
      fim(false);
    };
    function fim(soltou: boolean) {
      window.clearTimeout(espera);
      cancelAnimationFrame(quadro);
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", soltar);
      window.removeEventListener("pointercancel", cancelarPonteiro);
      window.removeEventListener("keydown", tecla, true);
      window.removeEventListener("blur", cancelar);
      encerrar.current = null;
      if (!arrastando) return;
      ativo.current = false;
      // O clique que o navegador dispara ao soltar não deve selecionar nada.
      bloqueadoAte.current = performance.now() + 400;
      setArrasto(null);
      if (soltou && zona) funcoes.current.aoSoltar(carga, zona);
    }

    window.addEventListener("pointermove", mover, { passive: false });
    window.addEventListener("pointerup", soltar);
    window.addEventListener("pointercancel", cancelarPonteiro);
    window.addEventListener("keydown", tecla, true);
    window.addEventListener("blur", cancelar);
    encerrar.current = fim;
    if (esperar)
      espera = window.setTimeout(() => {
        comecar();
        atualizar();
      }, SEGURAR_MS);
  };

  // Área com "segurar e arrastar" no toque: depois que o arraste começa, o dedo não rola a página.
  // (O ouvinte precisa existir antes do toque e não ser passivo para poder cancelar a rolagem.)
  const bloquear = useCallback((ev: TouchEvent) => {
    if (ativo.current && ev.cancelable) ev.preventDefault();
  }, []);
  const area = useRef<HTMLElement | null>(null);
  const areaToque = useCallback(
    (el: HTMLElement | null) => {
      area.current?.removeEventListener("touchmove", bloquear);
      area.current = el;
      el?.addEventListener("touchmove", bloquear, { passive: false });
    },
    [bloquear],
  );

  /** O fantasma que segue o ponteiro (fica acima do dedo no toque). */
  const desenharFantasma = (conteudo: ReactNode) =>
    arrasto &&
    createPortal(
      <>
        {/* Durante o arraste: cursor de "agarrando" em tudo e sem selecionar texto. */}
        <style>{"body, body * { cursor: grabbing !important; user-select: none !important; -webkit-user-select: none !important; }"}</style>
        <div
          ref={fantasma}
          aria-hidden="true"
          className="pointer-events-none fixed left-0 top-0 z-[70]"
          style={{ transform: `translate3d(${pos.current.x}px, ${pos.current.y}px, 0)` }}
        >
          <div className={arrasto.toque ? "-translate-x-1/2 -translate-y-[calc(100%+24px)]" : "translate-x-3 translate-y-3"}>{conteudo}</div>
        </div>
      </>,
      document.body,
    );

  return {
    arrasto,
    iniciar,
    areaToque,
    desenharFantasma,
    /** true logo depois de um arraste (ignora o clique que vem junto com o soltar). */
    cliqueBloqueado: () => performance.now() < bloqueadoAte.current,
  };
}

/** Visual do fantasma: ícone + nome, e o destino quando está sobre uma faixa. */
export function Fantasma({ Icone, titulo, zona }: { Icone?: LucideIcon; titulo: string; zona: string | null }) {
  return (
    <div className="flex max-w-[240px] rotate-2 items-center gap-2 rounded-lg border border-primary bg-card px-3 py-2 text-xs font-semibold text-foreground shadow-2xl shadow-black/40 ring-2 ring-primary/30">
      {Icone && (
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-border bg-input text-muted-foreground">
          <Icone className="h-4 w-4" strokeWidth={1.6} aria-hidden="true" />
        </span>
      )}
      <span className="min-w-0">
        <span className="block truncate">{titulo}</span>
        <span className="block text-[10px] font-medium text-muted-foreground">{zona ? `Soltar em ${zona}` : "Leve até uma faixa"}</span>
      </span>
    </div>
  );
}

const foco = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background";

/**
 * Faixa "Categorias": cada ícone arrasta até Essencial, Desejo ou Sonho.
 * Clicar (ou Enter/Espaço) seleciona; aí aparecem os botões "Colocar em…" e as faixas viram alvo de clique.
 */
export function FaixaCategorias({
  selecionada,
  arrastando,
  onSelecionar,
  onColocar,
  iniciar,
  areaToque,
  cliqueBloqueado,
}: {
  selecionada: string | null;
  /** Categoria sendo arrastada agora (realce discreto no ícone de origem). */
  arrastando: string | null;
  onSelecionar: (categoria: string | null) => void;
  onColocar: (tipo: string) => void;
  iniciar: (e: EventoPonteiro<HTMLElement>, carga: Carga, opcoes?: { segurar?: boolean }) => void;
  areaToque: (el: HTMLElement | null) => void;
  cliqueBloqueado: () => boolean;
}) {
  const bandeja = useRef<HTMLDivElement>(null);
  const focarBandeja = useRef(false);
  // Selecionou pelo teclado: o foco vai para os botões de destino.
  useEffect(() => {
    if (selecionada && focarBandeja.current) bandeja.current?.querySelector("button")?.focus();
    focarBandeja.current = false;
  }, [selecionada]);

  return (
    <SubBloco className="no-print" titulo="Categorias">
      <p className="-mt-1 mb-3 text-xs text-muted-foreground">
        Arraste a categoria até <strong className="font-semibold text-foreground">Essencial</strong>,{" "}
        <strong className="font-semibold text-foreground">Desejo</strong> ou <strong className="font-semibold text-foreground">Sonho</strong>. Se preferir,
        toque nela e escolha onde colocar.
      </p>
      <div
        ref={areaToque}
        role="group"
        aria-label="Categorias de objetivo"
        className="grid grid-cols-2 gap-2 min-[400px]:grid-cols-3 sm:grid-cols-5 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-10"
      >
        {CATEGORIAS.map(({ nome, Icone }) => {
          const ativa = selecionada === nome;
          return (
            <button
              key={nome}
              type="button"
              aria-pressed={ativa}
              title={`Arraste ${nome} até uma faixa ou clique para escolher`}
              onPointerDown={(e) => iniciar(e, { tipo: "categoria", categoria: nome }, { segurar: true })}
              onContextMenu={(e) => e.preventDefault()}
              onClick={(e) => {
                if (cliqueBloqueado()) return;
                focarBandeja.current = e.detail === 0 && !ativa;
                onSelecionar(ativa ? null : nome);
              }}
              className={`flex h-11 cursor-grab select-none items-center gap-1.5 rounded-lg border px-2 text-[11px] font-medium transition [-webkit-touch-callout:none] active:cursor-grabbing min-[400px]:h-[72px] min-[400px]:flex-col min-[400px]:justify-center min-[400px]:gap-1.5 min-[400px]:px-1 ${foco} ${
                ativa
                  ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary/40"
                  : arrastando === nome
                    ? "border-primary/60 bg-primary/5 text-foreground"
                    : "border-border bg-input text-muted-foreground hover:border-primary/50 hover:text-foreground"
              }`}
            >
              {Icone && <Icone className="h-5 w-5 shrink-0 min-[400px]:h-6 min-[400px]:w-6" strokeWidth={1.5} aria-hidden="true" />}
              <span className="w-full min-w-0 hyphens-auto break-words text-left leading-tight min-[400px]:text-center">{nome}</span>
            </button>
          );
        })}
      </div>
      {selecionada && (
        <div
          ref={bandeja}
          role="group"
          aria-label={`Onde colocar ${selecionada}`}
          className="aparecer mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-primary/40 bg-primary/5 p-2.5"
        >
          <span className="text-xs text-muted-foreground">
            Colocar <strong className="font-semibold text-foreground">{selecionada}</strong> em:
          </span>
          {TIPOS_OBJETIVO.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onColocar(t.id)}
              className={`inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-card px-3.5 text-xs font-semibold text-foreground transition hover:border-primary/60 hover:text-primary ${foco}`}
            >
              <span className={`h-2.5 w-2.5 rounded-full ${COR_TIPO[t.id] ?? "bg-muted"}`} aria-hidden="true" />
              {t.titulo}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onSelecionar(null)}
            className={`ml-auto inline-flex h-9 items-center gap-1 rounded-md px-2.5 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground ${foco}`}
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" /> Cancelar
          </button>
        </div>
      )}
    </SubBloco>
  );
}
