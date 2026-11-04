// 9 · V2 Apresentação: os slides do diagnóstico para apresentar ao cliente (rota
// /clientes/:id/v2, aberta numa aba nova pela 9.1). Palco 16:9 de 1280 × 720 escalado
// para caber na tela; setas, espaço, Home/End, toque (arrastar) e os pontos navegam;
// "Tópicos" abre o índice e F alterna a tela cheia.
// Sem download nem impressão: Ctrl/Cmd+P e Ctrl/Cmd+S são bloqueados, o menu do botão
// direito, copiar e arrastar também, e a impressão sai só com um aviso (v2.css).
// O valor do plano vem da 7 · Precificação e não pode ser alterado aqui; só as parcelas.
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType, type CSSProperties } from "react";
import { Navigate, useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, LayoutGrid, Maximize2, Minimize2, X } from "lucide-react";
import { dadosRelatorio } from "@/components/relatorio/dados";
import {
  SlideAlertas,
  SlideCapa,
  SlideDespesas,
  SlideEncerramento,
  SlideEstrela,
  SlideFluxo,
  SlideIndicadores,
  SlideOtimizacao,
  SlidePlano,
  SlidePotencial,
  SlidePrecificacao,
  SlideVisao,
  type DadosV2,
} from "@/components/v2/Slides";
import "@/components/v2/v2.css";
import { modelo503020, s } from "@/lib/calculos";
import { especificacao } from "@/lib/especificacao";
import { fmtData } from "@/lib/format";
import { COLUNAS_PLANO, mesclarCards, perfilFinanceiro, planoOtimizacao, planoPotencial } from "@/lib/plano";
import { lerConfig, useClientes } from "@/lib/storage";

interface DefSlide {
  id: string;
  titulo: string;
  Tela: ComponentType<{ x: DadosV2; nome: string }>;
}

const SLIDES: DefSlide[] = [
  { id: "capa", titulo: "Abertura", Tela: SlideCapa },
  { id: "visao", titulo: "Visão executiva", Tela: SlideVisao },
  { id: "indicadores", titulo: "Indicadores financeiros", Tela: SlideIndicadores },
  { id: "estrela", titulo: "Estrela LIFE", Tela: SlideEstrela },
  { id: "fluxo", titulo: "Fluxo de caixa", Tela: SlideFluxo },
  { id: "despesas", titulo: "Despesas por categoria", Tela: SlideDespesas },
  { id: "potencial", titulo: "Plano potencial", Tela: SlidePotencial },
  { id: "otimizacao", titulo: "Plano otimização", Tela: SlideOtimizacao },
  { id: "alertas", titulo: "Alertas críticos", Tela: SlideAlertas },
  { id: "plano", titulo: "Plano de ação estruturado", Tela: SlidePlano },
  { id: "precificacao", titulo: "Investimento e Dashplan", Tela: SlidePrecificacao },
  { id: "encerramento", titulo: "Próximo passo", Tela: SlideEncerramento },
];

/** Escala do palco (1280 × 720) para caber na janela. */
function useEscala() {
  const calcular = () => Math.min(window.innerWidth / 1300, window.innerHeight / 740);
  const [escala, setEscala] = useState(calcular);
  useEffect(() => {
    const aoMudar = () => setEscala(calcular());
    window.addEventListener("resize", aoMudar);
    return () => window.removeEventListener("resize", aoMudar);
  }, []);
  return escala;
}

export default function ApresentacaoV2() {
  const { id } = useParams();
  const cliente = useClientes().find((c) => c.id === id);
  const [atual, setAtual] = useState(0);
  const [direcao, setDirecao] = useState<"proximo" | "anterior">("proximo");
  const [indice, setIndice] = useState(false);
  const [telaCheia, setTelaCheia] = useState(false);
  const [aviso, setAviso] = useState("");
  const escala = useEscala();
  const toque = useRef<number | null>(null);
  const total = SLIDES.length;

  const ir = useCallback(
    (i: number) => {
      const alvo = Math.max(0, Math.min(total - 1, i));
      setAtual((a) => {
        if (alvo !== a) setDirecao(alvo > a ? "proximo" : "anterior");
        return alvo;
      });
      setIndice(false);
    },
    [total],
  );

  const avisar = (t: string) => {
    setAviso(t);
    window.setTimeout(() => setAviso(""), 2600);
  };

  // Título da aba, bloqueio de impressão/salvar/copiar e teclado.
  useEffect(() => {
    const anterior = document.title;
    document.title = `Apresentação V2 · ${cliente ? s(cliente.cadastro.nome) || "Cliente" : ""}`;
    document.body.classList.add("v2-sem-impressao");
    const teclas = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && ["p", "s"].includes(k)) {
        e.preventDefault();
        avisar("Esta apresentação não pode ser impressa nem salva.");
        return;
      }
      if (e.target instanceof HTMLElement && e.target.closest("[role='radiogroup']") && ["arrowleft", "arrowright"].includes(k)) return;
      if (["arrowright", "pagedown", " "].includes(k)) ir(atualRef.current + 1);
      else if (["arrowleft", "pageup"].includes(k)) ir(atualRef.current - 1);
      else if (k === "home") ir(0);
      else if (k === "end") ir(total - 1);
      else if (k === "f") alternarTelaCheia();
      else if (k === "escape") setIndice(false);
      else return;
      e.preventDefault();
    };
    const bloquear = (e: Event) => e.preventDefault();
    window.addEventListener("keydown", teclas);
    document.addEventListener("contextmenu", bloquear);
    document.addEventListener("copy", bloquear);
    document.addEventListener("dragstart", bloquear);
    const tela = () => setTelaCheia(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", tela);
    return () => {
      document.title = anterior;
      document.body.classList.remove("v2-sem-impressao");
      window.removeEventListener("keydown", teclas);
      document.removeEventListener("contextmenu", bloquear);
      document.removeEventListener("copy", bloquear);
      document.removeEventListener("dragstart", bloquear);
      document.removeEventListener("fullscreenchange", tela);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const atualRef = useRef(atual);
  atualRef.current = atual;

  const alternarTelaCheia = () => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    else void document.documentElement.requestFullscreen?.().catch(() => undefined);
  };

  const x = useMemo<DadosV2 | null>(() => {
    if (!cliente) return null;
    const cfgP = COLUNAS_PLANO.planoPotencial;
    const cfgO = COLUNAS_PLANO.planoOtimizacao;
    const cfg = lerConfig();
    return {
      d: dadosRelatorio(cliente),
      e: especificacao(cliente),
      m: modelo503020(cliente),
      perfil: perfilFinanceiro(cliente),
      // Respeita o que o consultor ocultou ou personalizou na etapa 6.
      potenciais: mesclarCards(cliente, "planoPotencial", planoPotencial(cliente), cfgP.chaves, cfgP.selo).filter((c) => !c.oculto),
      otimizacao: mesclarCards(cliente, "planoOtimizacao", planoOtimizacao(cliente), cfgO.chaves, cfgO.selo).filter((c) => !c.oculto),
      consultor: cfg.consultor || "Planejador",
      empresa: cfg.empresa || "Life Financial Planning",
      hoje: fmtData(new Date().toISOString()),
    };
  }, [cliente]);

  if (!cliente) return <Navigate to="/clientes" replace />;
  if (!cliente.coletaFinalizada || !x)
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-8 text-center text-sm text-muted-foreground">
        Finalize a coleta do cliente para gerar a apresentação V2.
      </div>
    );

  const nome = s(cliente.cadastro.nome) || "Cliente";
  const slide = SLIDES[atual];
  const Tela = slide.Tela;

  return (
    <div
      className="v2-root light"
      onTouchStart={(e) => (toque.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (toque.current === null) return;
        const dx = e.changedTouches[0].clientX - toque.current;
        toque.current = null;
        if (Math.abs(dx) > 60) ir(atual + (dx < 0 ? 1 : -1));
      }}
    >
      <div className="v2-palco" style={{ transform: `translate(-50%, -50%) scale(${escala})` }} role="region" aria-roledescription="apresentação" aria-label={`${slide.titulo}, slide ${atual + 1} de ${total}`}>
        <div key={slide.id} className={direcao === "proximo" ? "v2-entra-proximo absolute inset-0" : "v2-entra-anterior absolute inset-0"}>
          <Tela x={x} nome={nome} />
        </div>

        <div className="v2-rodape" style={atual === 0 || atual === total - 1 ? { color: "#fff" } : undefined}>
          <button type="button" className="v2-botao" onClick={() => setIndice(true)} aria-label="Tópicos da apresentação">
            <LayoutGrid className="h-4 w-4" aria-hidden="true" /> Tópicos
          </button>
          <div className="v2-pontos" role="tablist" aria-label="Slides">
            {SLIDES.map((sl, i) => (
              <button key={sl.id} type="button" role="tab" className="v2-ponto" aria-current={i === atual ? "step" : undefined} aria-label={sl.titulo} onClick={() => ir(i)}>
                <span className="v2-tip">{sl.titulo}</span>
              </button>
            ))}
          </div>
          <span className="w-[54px] text-right text-[12px] font-semibold tabular-nums" style={{ color: atual === 0 || atual === total - 1 ? "#e8d39a" : "var(--v2-mudo)" }}>
            {atual + 1} / {total}
          </span>
          <button type="button" className="v2-botao" onClick={() => ir(atual - 1)} disabled={atual === 0} aria-label="Slide anterior">
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button type="button" className="v2-botao" onClick={() => ir(atual + 1)} disabled={atual === total - 1} aria-label="Próximo slide">
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
          <button type="button" className="v2-botao" onClick={alternarTelaCheia} aria-label={telaCheia ? "Sair da tela cheia" : "Tela cheia"} title="Tela cheia (F)">
            {telaCheia ? <Minimize2 className="h-4 w-4" aria-hidden="true" /> : <Maximize2 className="h-4 w-4" aria-hidden="true" />}
          </button>
        </div>
        <div className="v2-progresso" style={{ width: `${((atual + 1) / total) * 100}%` }} />

        {/* Índice de tópicos */}
        {indice && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[rgba(13,18,48,.72)] p-14 backdrop-blur-sm" onClick={() => setIndice(false)}>
            <div className="v2-cascata w-full max-w-[900px] rounded-3xl bg-white p-8 shadow-2xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Tópicos">
              <div className="mb-5 flex items-center justify-between">
                <span className="v2-capitulo">Tópicos da apresentação</span>
                <button type="button" className="v2-botao" onClick={() => setIndice(false)} aria-label="Fechar tópicos">
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {SLIDES.map((sl, i) => (
                  <button
                    key={sl.id}
                    type="button"
                    onClick={() => ir(i)}
                    className={`v2-cartao flex items-center gap-3 px-4 py-3 text-left ${i === atual ? "v2-ativo" : ""}`}
                    style={{ "--i": i } as CSSProperties}
                  >
                    <span className="text-[20px] font-extrabold tabular-nums" style={{ color: "var(--v2-gold)" }}>
                      {String(i).padStart(2, "0")}
                    </span>
                    <span className="text-[14px] font-bold" style={{ color: "var(--v2-navy)" }}>
                      {sl.titulo}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      {aviso && (
        <div className="v2-aviso" role="status">
          {aviso}
        </div>
      )}
    </div>
  );
}
