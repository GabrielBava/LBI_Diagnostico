// Slides da V2 · Apresentação (etapa 9). Cada slide recebe os dados já calculados
// (os mesmos do diagnóstico em PDF) e é montado de novo ao entrar: as animações de
// entrada, as barras e os números contando acontecem a cada visita.
// Detalhes aparecem ao passar o mouse (ou ao focar com o teclado) nos cartões.
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import {
  AlertOctagon,
  ArrowUpRight,
  BadgeCheck,
  CalendarClock,
  CreditCard,
  Gem,
  HeartHandshake,
  LineChart,
  MessageCircle,
  PiggyBank,
  QrCode,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Estrela } from "@/components/Estrela";
import type { DadosRelatorio } from "@/components/relatorio/dados";
import { PARCELAS, DESCONTO_PIX } from "@/config/especificacao";
import { cartao, fmtPercentual, type Especificacao } from "@/lib/especificacao";
import { porEstado, type PilarEstrela } from "@/lib/estrela";
import { fmtBRL, fmtPct } from "@/lib/format";
import type { CardMesclado } from "@/lib/plano";
import type { modelo503020 } from "@/lib/calculos";
import logo from "@/assets/v2/logo-life-planejamento.webp";
import dashplan from "@/assets/v2/dashplan.webp";

/** Tudo o que os slides usam (montado uma vez na página). */
export interface DadosV2 {
  d: DadosRelatorio;
  e: Especificacao;
  m: ReturnType<typeof modelo503020>;
  perfil: { nome: string; descricao: string };
  potenciais: CardMesclado[];
  otimizacao: CardMesclado[];
  consultor: string;
  empresa: string;
  hoje: string;
}

const NAVY = "var(--v2-navy)";
const ouro = { color: "var(--v2-gold)" };
const ordem = (i: number) => ({ "--i": i }) as CSSProperties;

// ---------------------------------------------------------------------
//  Peças comuns
// ---------------------------------------------------------------------
export function Topo({ capitulo }: { capitulo?: string }) {
  return (
    <div className="v2-topo">
      <img src={logo} alt="Grupo Life Brasil · Planejamento" className="v2-logo" draggable={false} />
      {capitulo && <span className="v2-capitulo">{capitulo}</span>}
    </div>
  );
}

function Titulo({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div>
      <h2 className="v2-titulo">{children}</h2>
      {sub && <p className="v2-subtitulo">{sub}</p>}
    </div>
  );
}

/** Número que conta do zero até o valor ao entrar no slide. */
function useContagem(alvo: number, ms = 900) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setV(alvo);
    let quadro = 0;
    const inicio = performance.now();
    const passo = (t: number) => {
      const p = Math.min(1, (t - inicio) / ms);
      setV(alvo * (1 - Math.pow(1 - p, 3)));
      if (p < 1) quadro = requestAnimationFrame(passo);
    };
    quadro = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(quadro);
  }, [alvo, ms]);
  return v;
}

function Contador({ valor, formato }: { valor: number; formato: (v: number) => string }) {
  const v = useContagem(valor);
  return <>{formato(v)}</>;
}

/** Anel da nota LIFE (0 a 100). */
function Anel({ nota, tamanho = 180, claro = false }: { nota?: number; tamanho?: number; claro?: boolean }) {
  const r = tamanho / 2 - 12;
  const c = 2 * Math.PI * r;
  const v = useContagem(nota ?? 0, 1100);
  return (
    <svg width={tamanho} height={tamanho} viewBox={`0 0 ${tamanho} ${tamanho}`} role="img" aria-label={nota === undefined ? "Nota LIFE sem dados" : `Nota LIFE ${nota} de 100`}>
      <defs>
        <linearGradient id="v2-anel" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#c9a23f" />
          <stop offset="100%" stopColor="#ea6a2a" />
        </linearGradient>
      </defs>
      <circle cx={tamanho / 2} cy={tamanho / 2} r={r} fill="none" stroke={claro ? "rgba(255,255,255,.14)" : "#ece7da"} strokeWidth="12" />
      <circle
        cx={tamanho / 2}
        cy={tamanho / 2}
        r={r}
        fill="none"
        stroke="url(#v2-anel)"
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - v / 100)}
        transform={`rotate(-90 ${tamanho / 2} ${tamanho / 2})`}
      />
      <text x="50%" y="48%" textAnchor="middle" dominantBaseline="middle" fontSize={tamanho * 0.3} fontWeight="800" fill={claro ? "#fff" : "#141b3d"}>
        {nota === undefined ? "—" : Math.round(v)}
      </text>
      <text x="50%" y="68%" textAnchor="middle" fontSize={tamanho * 0.075} fontWeight="700" letterSpacing="2" fill={claro ? "#e8d39a" : "#c9a23f"}>
        NOTA LIFE
      </text>
    </svg>
  );
}

const COR_NIVEL: Record<string, { fundo: string; texto: string; rotulo: string }> = {
  Alta: { fundo: "rgba(214,69,69,.1)", texto: "var(--v2-vermelho)", rotulo: "Crítico" },
  Média: { fundo: "rgba(217,144,42,.12)", texto: "var(--v2-ambar)", rotulo: "Alerta" },
  Baixa: { fundo: "rgba(20,27,61,.07)", texto: "var(--v2-navy)", rotulo: "Atenção" },
};
const COR_ESTADO: Record<PilarEstrela["status"], { cor: string; rotulo: string }> = {
  critico: { cor: "var(--v2-vermelho)", rotulo: "Crítico" },
  atencao: { cor: "var(--v2-ambar)", rotulo: "Moderado" },
  ok: { cor: "var(--v2-verde)", rotulo: "Saudável" },
  "sem-dados": { cor: "var(--v2-mudo)", rotulo: "Sem dados" },
};

function Vazio({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-[var(--v2-linha)] text-[15px] text-[var(--v2-mudo)]">
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------
//  Capa
// ---------------------------------------------------------------------
export function SlideCapa({ x, nome }: { x: DadosV2; nome: string }) {
  return (
    <div className="v2-slide !p-0">
      <div className="grid h-full grid-cols-[1.25fr_1fr]">
        <div className="v2-cascata flex flex-col justify-between px-16 py-14">
          <img src={logo} alt="Grupo Life Brasil · Planejamento" className="h-[64px] w-auto self-start" style={ordem(0)} draggable={false} />
          <div style={ordem(1)}>
            <div className="v2-capitulo">Diagnóstico financeiro · Apresentação V2</div>
            <h1 className="mt-4 text-[60px] font-extrabold leading-[1.02] tracking-tight" style={{ color: NAVY }}>
              Plano de Vida
              <br />
              Financeira
            </h1>
            <p className="mt-5 text-[18px] font-medium text-[var(--v2-mudo)]">Atual · Necessário · Diferença · Decisão</p>
          </div>
          <div style={ordem(2)} className="border-t border-[var(--v2-linha)] pt-6">
            <div className="text-[11px] font-bold uppercase tracking-[0.2em]" style={ouro}>
              Preparado para
            </div>
            <div className="mt-1 text-[30px] font-bold" style={{ color: NAVY }}>
              {nome}
            </div>
            <div className="mt-1 text-[14px] text-[var(--v2-mudo)]">
              {x.hoje} · Planejador {x.consultor}
            </div>
          </div>
        </div>
        <div className="relative flex flex-col items-center justify-center gap-6 overflow-hidden" style={{ background: "linear-gradient(160deg,#141b3d 0%,#232c5c 70%,#2c2350 100%)" }}>
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-30" style={{ background: "radial-gradient(circle,#ea6a2a 0%,transparent 70%)" }} />
          <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full opacity-25" style={{ background: "radial-gradient(circle,#c9a23f 0%,transparent 70%)" }} />
          <div className="v2-cascata relative flex flex-col items-center gap-5 text-center">
            <div style={ordem(1)}>
              <Anel nota={x.d.notaLife} tamanho={230} claro />
            </div>
            <div style={ordem(2)} className="max-w-[360px]">
              <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--v2-gold-claro)]">Momento financeiro</div>
              <div className="mt-1 text-[24px] font-bold text-white">{x.perfil.nome}</div>
              <p className="mt-1 text-[13.5px] leading-snug text-white/70">{x.perfil.descricao}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
//  01 · Visão executiva
// ---------------------------------------------------------------------
export function SlideVisao({ x }: { x: DadosV2 }) {
  const linhas = x.d.visao;
  return (
    <div className="v2-slide">
      <Topo capitulo="01 · Visão executiva" />
      <Titulo sub="Atual, necessário e a diferença que pede uma decisão. Passe o mouse para ver o que avaliar.">Atual x Necessário x Decisão</Titulo>
      <div className="mt-6 grid flex-1 grid-cols-[250px_1fr] gap-6">
        <div className="v2-cascata flex flex-col items-center justify-center gap-3 rounded-2xl bg-[var(--v2-creme)] p-5 text-center">
          <div style={ordem(0)}>
            <Anel nota={x.d.notaLife} tamanho={170} />
          </div>
          <div style={ordem(1)}>
            <div className="text-[11px] font-bold uppercase tracking-[0.18em]" style={ouro}>
              Momento
            </div>
            <div className="text-[18px] font-bold" style={{ color: NAVY }}>
              {x.perfil.nome}
            </div>
          </div>
        </div>
        <div className="v2-cascata flex flex-col gap-2.5">
          <div style={ordem(0)} className="grid grid-cols-[1.5fr_1fr_1fr_1fr_110px] gap-3 px-4 text-[10.5px] font-bold uppercase tracking-[0.14em] text-[var(--v2-mudo)]">
            <span>Dimensão</span>
            <span className="text-right">Atual</span>
            <span className="text-right">Necessário</span>
            <span className="text-right">Diferença</span>
            <span className="text-center">Prioridade</span>
          </div>
          {linhas.map((l, i) => {
            const cor = COR_NIVEL[l.prioridade] ?? { fundo: "rgba(20,27,61,.05)", texto: "var(--v2-mudo)", rotulo: "—" };
            return (
              <div key={l.dimensao} tabIndex={0} className="v2-cartao v2-revela px-4 py-3 outline-none" style={ordem(i + 1)}>
                <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_110px] items-center gap-3 text-[14px]">
                  <span className="font-bold" style={{ color: NAVY }}>
                    {l.dimensao}
                  </span>
                  <span className="text-right tabular-nums">{l.atual}</span>
                  <span className="text-right tabular-nums">{l.necessario}</span>
                  <span className="text-right font-bold tabular-nums" style={{ color: l.diferenca === "—" ? undefined : "var(--v2-vermelho)" }}>
                    {l.diferenca}
                  </span>
                  <span className="flex justify-center">
                    <span className="v2-selo" style={{ background: cor.fundo, color: cor.texto }}>
                      {l.prioridade}
                    </span>
                  </span>
                </div>
                <div className="v2-extra flex items-center justify-between gap-4 text-[13px]">
                  <span className="text-[var(--v2-tinta)]">
                    <strong style={ouro}>Decisão a avaliar:</strong> {l.decisao}
                  </span>
                  <span className="shrink-0 text-[var(--v2-mudo)]">Prazo: {l.prazo}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
//  02 · Indicadores financeiros
// ---------------------------------------------------------------------
export function SlideIndicadores({ x }: { x: DadosV2 }) {
  const { d } = x;
  const cards: { icone: LucideIcon; rotulo: string; valor: number; formato: (v: number) => string; sub: string; explica: string; cor: string }[] = [
    {
      icone: Gem,
      rotulo: "Patrimônio líquido",
      valor: d.p.liquido,
      formato: (v) => fmtBRL(v),
      sub: `Bens ${fmtBRL(d.p.ativos)} − dívidas ${fmtBRL(d.p.passivos)}`,
      explica: "Tudo o que você tem menos tudo o que deve. É o ponto de partida da construção de patrimônio.",
      cor: NAVY,
    },
    {
      icone: PiggyBank,
      rotulo: d.f.sobra < 0 ? "Déficit mensal" : "Superávit mensal",
      valor: Math.abs(d.f.sobra),
      formato: (v) => fmtBRL(v),
      sub: d.f.renda > 0 ? `Taxa de poupança ${fmtPct(Math.max(0, d.f.taxaPoupanca), 1)}` : "Renda não informada",
      explica: "O que sobra da renda depois das despesas. É o motor do plano: sem superávit, não há acumulação.",
      cor: d.f.sobra < 0 ? "var(--v2-vermelho)" : "var(--v2-verde)",
    },
    {
      icone: ShieldCheck,
      rotulo: "Falta no seguro de vida",
      valor: d.temProtecao ? d.pr.gap : 0,
      formato: (v) => (d.temProtecao ? fmtBRL(v) : "Não informado"),
      sub: d.temProtecao ? `Necessário ${fmtBRL(d.pr.necessario)} · hoje ${fmtBRL(d.pr.atual)}` : "Proteção ainda não avaliada",
      explica: "Capital que manteria o padrão de vida da família, a educação dos filhos e o inventário se a renda faltar.",
      cor: "var(--v2-vermelho)",
    },
    {
      icone: Wallet,
      rotulo: "Reserva de emergência",
      valor: d.r.atual,
      formato: (v) => fmtBRL(v),
      sub: d.r.meta > 0 ? `Meta ${fmtBRL(d.r.meta)} (${d.r.mesesMeta} meses de despesas)` : "Informe as despesas",
      explica: "Dinheiro com liquidez para imprevistos, sem recorrer a crédito caro nem mexer nos investimentos de longo prazo.",
      cor: "var(--v2-ambar)",
    },
    {
      icone: LineChart,
      rotulo: "Progresso da aposentadoria",
      valor: Math.min(1, d.progresso) * 100,
      formato: (v) => (d.temFuturo ? `${Math.round(v)}%` : "Não informado"),
      sub: d.temFuturo ? `Meta de ${fmtBRL(d.fu.alvo)} aos ${d.fu.idadeAposentadoria} anos` : "Informe a renda desejada",
      explica: "Quanto do patrimônio necessário para viver de renda já está construído hoje.",
      cor: NAVY,
    },
    {
      icone: TrendingUp,
      rotulo: "Renda passiva (4% a.a.)",
      valor: d.rendaHoje,
      formato: (v) => `${fmtBRL(v)}/mês`,
      sub: d.temFuturo ? `Alvo de ${fmtBRL(d.fu.rendaDesejada)}/mês` : "Renda que os investimentos de hoje gerariam",
      explica: "A renda mensal que o patrimônio investido de hoje sustentaria, retirando 4% ao ano.",
      cor: "var(--v2-verde)",
    },
  ];
  return (
    <div className="v2-slide">
      <Topo capitulo="02 · Indicadores financeiros" />
      <Titulo sub="Os números que sustentam o diagnóstico. Passe o mouse para entender cada um.">Indicadores financeiros atuais</Titulo>
      <div className="v2-cascata mt-7 grid flex-1 grid-cols-3 grid-rows-2 gap-4">
        {cards.map((c, i) => {
          const I = c.icone;
          return (
            <div key={c.rotulo} tabIndex={0} className="v2-cartao v2-revela flex flex-col overflow-hidden p-5 outline-none" style={ordem(i)}>
              <span className="absolute inset-y-4 left-0 w-1 rounded-r" style={{ background: c.cor }} />
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--v2-mudo)]">{c.rotulo}</span>
                <I className="h-5 w-5" style={{ color: "var(--v2-gold)" }} aria-hidden="true" />
              </div>
              <div className="mt-3 text-[30px] font-extrabold tabular-nums leading-none" style={{ color: NAVY }}>
                <Contador valor={c.valor} formato={c.formato} />
              </div>
              <div className="mt-2 text-[12.5px] text-[var(--v2-mudo)]">{c.sub}</div>
              <div className="v2-extra text-[12.5px] leading-snug text-[var(--v2-tinta)]">{c.explica}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
//  03 · Estrela LIFE
// ---------------------------------------------------------------------
export function SlideEstrela({ x }: { x: DadosV2 }) {
  const est = x.d.estrela;
  const [sub, setSub] = useState(false);
  const [foco, setFoco] = useState<string>();
  const lista = porEstado(est.pilares);
  return (
    <div className="v2-slide">
      <Topo capitulo="03 · Estrela LIFE" />
      <div className="mt-2 grid flex-1 grid-cols-[1.05fr_1fr] gap-8">
        <div className="v2-cascata flex min-h-0 flex-col">
          <div style={ordem(0)} className="flex items-end justify-between gap-4">
            <Titulo>Estrela LIFE</Titulo>
            <button type="button" className="v2-botao mb-1" aria-pressed={sub} onClick={() => setSub(!sub)}>
              {sub ? "Ver os 8 pilares" : "Ver os sub-pilares"}
            </button>
          </div>
          <div style={ordem(1)} className="light mt-2 flex flex-1 items-center justify-center">
            <div className="w-full max-w-[520px]">
              <Estrela dados={est} subPilares={sub} selecionado={foco} onSelecionar={(p) => setFoco(p === foco ? undefined : p)} />
            </div>
          </div>
        </div>
        <div className="v2-cascata flex min-h-0 flex-col justify-center gap-2">
          <div style={ordem(0)} className="mb-1 flex items-baseline justify-between">
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--v2-mudo)]">Resumo do diagnóstico</span>
            <span className="text-[13px] font-bold" style={{ color: NAVY }}>
              Total {est.temDados ? est.total : "—"} <span className="text-[var(--v2-mudo)]">/ {est.maximo}</span>
            </span>
          </div>
          {lista.map((p, i) => {
            const cor = COR_ESTADO[p.status];
            return (
              <div
                key={p.id}
                tabIndex={0}
                onMouseEnter={() => setFoco(p.id)}
                onFocus={() => setFoco(p.id)}
                onMouseLeave={() => setFoco(undefined)}
                className={`v2-cartao v2-revela px-4 py-2.5 outline-none ${foco === p.id ? "v2-ativo" : ""}`}
                style={ordem(i + 1)}
              >
                <div className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: cor.cor }} />
                  <span className="min-w-0 flex-1 truncate text-[14px] font-bold" style={{ color: NAVY }}>
                    {p.nome}
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: cor.cor }}>
                    {cor.rotulo}
                  </span>
                  <span className="w-[64px] text-right text-[15px] font-extrabold tabular-nums" style={{ color: NAVY }}>
                    {p.nota}
                    <span className="text-[12px] font-semibold text-[var(--v2-mudo)]"> / {p.maximo}</span>
                  </span>
                </div>
                <div className="v2-extra text-[12.5px] leading-snug text-[var(--v2-tinta)]">{p.descricao}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
//  04 · Fluxo de caixa
// ---------------------------------------------------------------------
const COR_PARTE: Record<string, string> = { Necessidades: "#2f5bd3", Desejos: "#ea6a2a", Poupança: "#1f9d6b" };

export function SlideFluxo({ x }: { x: DadosV2 }) {
  const { f } = x.d;
  const m = x.m;
  const [foco, setFoco] = useState<string>();
  const total = Math.max(m.renda, m.despesas, 1);
  return (
    <div className="v2-slide">
      <Topo capitulo="04 · Fluxo de caixa" />
      <Titulo sub="Quanto entra, quanto sai e quanto sobra: o motor do seu plano.">Fluxo de caixa mensal</Titulo>
      <div className="v2-cascata mt-6 grid grid-cols-3 gap-4">
        {[
          { rotulo: "Receita mensal", valor: f.renda, cor: "var(--v2-verde)" },
          { rotulo: "Despesa mensal", valor: f.despesas, cor: "var(--v2-vermelho)" },
          {
            rotulo: f.sobra < 0 ? "Déficit" : "Superávit",
            valor: Math.abs(f.sobra),
            cor: f.sobra < 0 ? "var(--v2-vermelho)" : NAVY,
            extra: f.renda > 0 ? ` · ${fmtPct(Math.abs(f.taxaPoupanca), 1)} da renda` : "",
          },
        ].map((k, i) => (
          <div key={k.rotulo} className="v2-cartao overflow-hidden p-5" style={ordem(i)}>
            <span className="absolute inset-y-4 left-0 w-1 rounded-r" style={{ background: k.cor }} />
            <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--v2-mudo)]">{k.rotulo}</div>
            <div className="mt-2 text-[32px] font-extrabold tabular-nums" style={{ color: NAVY }}>
              <Contador valor={k.valor} formato={(v) => fmtBRL(v)} />
              {"extra" in k && <span className="text-[14px] font-semibold text-[var(--v2-mudo)]">{k.extra}</span>}
            </div>
          </div>
        ))}
      </div>
      <div className="v2-cascata mt-7 flex flex-1 flex-col">
        <div style={ordem(0)} className="flex items-baseline justify-between">
          <span className="text-[13px] font-bold" style={{ color: NAVY }}>
            Para onde vai a renda (modelo 50-30-20)
          </span>
          <span className="text-[12px] text-[var(--v2-mudo)]">Passe o mouse em cada parte</span>
        </div>
        <div style={ordem(1)} className="relative mt-3 flex h-14 w-full overflow-hidden rounded-2xl bg-[#efeadf]">
          {m.partes.map((p) => {
            const larg = (p.atual / total) * 100;
            if (larg <= 0) return null;
            return (
              <div
                key={p.id}
                onMouseEnter={() => setFoco(p.id)}
                onMouseLeave={() => setFoco(undefined)}
                className="v2-barra flex h-full items-center justify-center text-[13px] font-bold text-white transition-[filter]"
                style={{ width: `${larg}%`, background: COR_PARTE[p.id], borderRadius: 0, filter: foco && foco !== p.id ? "saturate(.35) opacity(.6)" : undefined }}
              >
                {larg > 8 && fmtPct(p.pct)}
              </div>
            );
          })}
        </div>
        <div className="mt-5 grid grid-cols-3 gap-4">
          {m.partes.map((p, i) => {
            const ok = !p.foraDoModelo;
            return (
              <div
                key={p.id}
                onMouseEnter={() => setFoco(p.id)}
                onMouseLeave={() => setFoco(undefined)}
                className={`v2-cartao p-4 ${foco === p.id ? "v2-ativo" : ""}`}
                style={ordem(i + 2)}
              >
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded" style={{ background: COR_PARTE[p.id] }} />
                  <span className="text-[14px] font-bold" style={{ color: NAVY }}>
                    {p.label} ({Math.round(p.meta * 100)})
                  </span>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-[22px] font-extrabold tabular-nums" style={{ color: NAVY }}>
                    {fmtBRL(p.atual)}
                  </span>
                  <span className="text-[13px] font-bold tabular-nums" style={{ color: ok ? "var(--v2-verde)" : "var(--v2-ambar)" }}>
                    {fmtPct(p.pct)}
                  </span>
                </div>
                <div className="mt-1 text-[12px] text-[var(--v2-mudo)]">
                  Ideal {fmtBRL(p.ideal)} · {ok ? "dentro da meta" : p.id === "Poupança" ? `${fmtBRL(-p.diferenca)} abaixo` : `${fmtBRL(p.diferenca)} acima`}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
//  05 · Despesas por categoria
// ---------------------------------------------------------------------
export function SlideDespesas({ x }: { x: DadosV2 }) {
  const cats = x.d.categorias.slice(0, 8);
  const maior = Math.max(...cats.map((c) => c.valor), 1);
  const renda = x.d.f.renda;
  return (
    <div className="v2-slide">
      <Topo capitulo="05 · Despesas por categoria" />
      <Titulo sub="As maiores categorias de despesa do mês. Passe o mouse para ver o que entra em cada uma.">Despesas por categoria</Titulo>
      <div className="mt-6 grid flex-1 grid-cols-[1fr_270px] gap-6">
        {cats.length ? (
          <div className="v2-cascata flex flex-col justify-center gap-2">
            {cats.map((c, i) => {
              const [nome, detalhe] = c.nome.includes(" (") ? [c.nome.slice(0, c.nome.indexOf(" (")), c.nome.slice(c.nome.indexOf(" (") + 2, -1)] : [c.nome, ""];
              return (
                <div key={c.nome} tabIndex={0} className="v2-cartao v2-revela px-4 py-2.5 outline-none" style={ordem(i)}>
                  <div className="flex items-center gap-4">
                    <span className="w-[290px] shrink-0 truncate text-[14px] font-bold" style={{ color: NAVY }}>
                      {nome}
                    </span>
                    <div className="h-3 flex-1 overflow-hidden rounded-full bg-[#efeadf]">
                      <div className="v2-barra" style={{ width: `${(c.valor / maior) * 100}%`, background: i === 0 ? "linear-gradient(90deg,#c9a23f,#ea6a2a)" : "#141b3d" }} />
                    </div>
                    <span className="w-[110px] text-right text-[14px] font-bold tabular-nums" style={{ color: NAVY }}>
                      {fmtBRL(c.valor)}
                    </span>
                    <span className="w-[48px] text-right text-[12px] tabular-nums text-[var(--v2-mudo)]">{renda > 0 ? fmtPct(c.valor / renda) : ""}</span>
                  </div>
                  {detalhe && <div className="v2-extra pl-1 text-[12.5px] text-[var(--v2-mudo)]">Inclui: {detalhe}</div>}
                </div>
              );
            })}
          </div>
        ) : (
          <Vazio>Nenhuma despesa informada.</Vazio>
        )}
        <div className="v2-cascata flex flex-col gap-4">
          {[
            { rotulo: "Total de despesas", valor: x.d.f.despesas, sub: renda > 0 ? `${fmtPct(x.d.f.despesas / renda)} da renda` : "" },
            { rotulo: "Despesas fixas", valor: x.d.f.fixas, sub: "Se repetem todo mês" },
            { rotulo: "Despesas variáveis", valor: x.d.f.variaveis, sub: "Mudam conforme o uso" },
          ].map((k, i) => (
            <div key={k.rotulo} className="v2-cartao p-4" style={ordem(i + 2)}>
              <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--v2-mudo)]">{k.rotulo}</div>
              <div className="mt-1 text-[24px] font-extrabold tabular-nums" style={{ color: NAVY }}>
                <Contador valor={k.valor} formato={(v) => fmtBRL(v)} />
              </div>
              <div className="text-[12px] text-[var(--v2-mudo)]">{k.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
//  06 / 07 · Plano potencial e plano otimização (cartões com verso no mouse)
// ---------------------------------------------------------------------
function GradeCartoes({
  cards,
  frente,
  verso,
  selo,
  vazio,
}: {
  cards: CardMesclado[];
  frente: string;
  verso: { chave: string; rotulo: string }[];
  selo?: (c: CardMesclado) => ReactNode;
  vazio: string;
}) {
  const lista = cards.slice(0, 6);
  if (!lista.length) return <Vazio>{vazio}</Vazio>;
  return (
    <div className={`v2-cascata mt-6 grid flex-1 gap-4 ${lista.length > 3 ? "grid-cols-3 grid-rows-2" : "grid-cols-3 grid-rows-1"}`}>
      {lista.map((c, i) => (
        <div key={c.id} tabIndex={0} className="v2-cartao v2-revela flex flex-col overflow-hidden p-5 outline-none" style={ordem(i)}>
          <div className="flex flex-wrap items-center gap-1.5">
            {c.area && (
              <span className="v2-selo" style={{ background: "rgba(20,27,61,.06)", color: NAVY }}>
                {c.area}
              </span>
            )}
            {selo?.(c)}
          </div>
          <div className="mt-2.5 text-[16px] font-bold leading-snug" style={{ color: NAVY }}>
            {c.titulo}
          </div>
          <p className="mt-1.5 line-clamp-3 text-[13px] leading-snug text-[var(--v2-mudo)]">{c.textos[frente]}</p>
          <div className="v2-extra space-y-1.5 text-[12.5px] leading-snug">
            {verso.map((v) =>
              c.textos[v.chave] ? (
                <p key={v.chave}>
                  <strong style={ouro}>{v.rotulo}:</strong> {c.textos[v.chave]}
                </p>
              ) : null,
            )}
          </div>
          <span className="v2-dica-mouse mt-auto pt-2">Passe o mouse para ver mais</span>
        </div>
      ))}
    </div>
  );
}

export function SlidePotencial({ x }: { x: DadosV2 }) {
  return (
    <div className="v2-slide">
      <Topo capitulo="06 · Plano potencial" />
      <Titulo sub="Oportunidades identificadas no diagnóstico e como podemos atuar juntos.">Plano potencial</Titulo>
      <GradeCartoes
        cards={x.potenciais}
        frente="oportunidade"
        verso={[
          { chave: "comoAtuar", rotulo: "Como podemos atuar" },
          { chave: "objetivo", rotulo: "Objetivo" },
        ]}
        selo={(c) =>
          c.produto ? (
            <span className="v2-selo" style={{ background: "rgba(201,162,63,.15)", color: "#8a6a1f" }}>
              {c.produto}
            </span>
          ) : null
        }
        vazio="Nenhuma oportunidade selecionada para a apresentação."
      />
    </div>
  );
}

export function SlideOtimizacao({ x }: { x: DadosV2 }) {
  return (
    <div className="v2-slide">
      <Topo capitulo="07 · Plano otimização" />
      <Titulo sub="O que você já faz bem e como deixar ainda melhor.">Plano otimização</Titulo>
      <GradeCartoes
        cards={x.otimizacao}
        frente="descricao"
        verso={[
          { chave: "motivo", rotulo: "Por que importa" },
          { chave: "comoMelhorar", rotulo: "Como melhorar" },
        ]}
        selo={() => (
          <span className="v2-selo" style={{ background: "rgba(31,157,107,.12)", color: "var(--v2-verde)" }}>
            <BadgeCheck className="h-3 w-3" aria-hidden="true" /> Ponto forte
          </span>
        )}
        vazio="Nenhum ponto forte selecionado para a apresentação."
      />
    </div>
  );
}

// ---------------------------------------------------------------------
//  08 · Alertas críticos
// ---------------------------------------------------------------------
export function SlideAlertas({ x }: { x: DadosV2 }) {
  const alertas = x.d.alertas.slice(0, 6);
  const resto = x.d.alertas.length - alertas.length;
  return (
    <div className="v2-slide">
      <Topo capitulo="08 · Alertas críticos" />
      <Titulo sub={`Os pontos que pedem atenção primeiro${resto > 0 ? ` (mais ${resto} no diagnóstico completo)` : ""}.`}>Alertas críticos</Titulo>
      {alertas.length ? (
        <div className="v2-cascata mt-6 grid flex-1 grid-cols-2 grid-rows-3 gap-3.5">
          {alertas.map((a, i) => {
            const cor = COR_NIVEL[a.nivel] ?? COR_NIVEL.Média;
            return (
              <div key={`${a.titulo}-${i}`} tabIndex={0} className="v2-cartao v2-revela flex gap-4 overflow-hidden p-4 outline-none" style={ordem(i)}>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ background: cor.fundo, color: cor.texto }}>
                  <AlertOctagon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <span className="v2-selo" style={{ background: cor.fundo, color: cor.texto }}>
                    {cor.rotulo}
                  </span>
                  <div className="mt-1 text-[15px] font-bold leading-snug" style={{ color: NAVY }}>
                    {a.titulo}
                  </div>
                  <div className="v2-recorte mt-1 text-[12.5px] leading-snug text-[var(--v2-mudo)]">{a.descricao}</div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Vazio>Nenhum alerta com os dados preenchidos.</Vazio>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
//  09 · Plano de ação estruturado
// ---------------------------------------------------------------------
const PRAZOS = [
  { titulo: "Curto prazo", janela: "até 3 meses", icone: Target },
  { titulo: "Médio prazo", janela: "3 a 12 meses", icone: CalendarClock },
  { titulo: "Longo prazo", janela: "acima de 12 meses", icone: TrendingUp },
];
const COR_PRIORIDADE: Record<string, string> = { Alta: "var(--v2-vermelho)", Média: "var(--v2-ambar)", Baixa: "var(--v2-verde)" };

export function SlidePlano({ x }: { x: DadosV2 }) {
  const plano = x.d.plano;
  return (
    <div className="v2-slide">
      <Topo capitulo="09 · Plano de ação estruturado" />
      <Titulo sub={x.d.planoAutomatico ? "Primeiras ações sugeridas, organizadas por prazo." : "As ações combinadas, organizadas por prazo e prioridade."}>Plano de ação estruturado</Titulo>
      <div className="v2-cascata mt-6 grid flex-1 grid-cols-3 gap-5">
        {PRAZOS.map((pz, i) => {
          const acoes = plano.filter((a) => a.prazo === pz.titulo);
          const vis = acoes.slice(0, 4);
          const I = pz.icone;
          return (
            <div key={pz.titulo} className="flex min-h-0 flex-col rounded-2xl bg-[var(--v2-creme)] p-4" style={ordem(i)}>
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-white" style={{ color: "var(--v2-gold)" }}>
                  <I className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <div className="text-[15px] font-bold" style={{ color: NAVY }}>
                    {pz.titulo}
                  </div>
                  <div className="text-[11.5px] text-[var(--v2-mudo)]">{pz.janela}</div>
                </div>
                <span className="ml-auto text-[22px] font-extrabold tabular-nums" style={{ color: NAVY }}>
                  {acoes.length}
                </span>
              </div>
              <div className="mt-3 flex flex-col gap-2">
                {vis.map((a, j) => (
                  <div key={`${a.acao}-${j}`} className="v2-cartao flex gap-2.5 px-3 py-2.5">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: COR_PRIORIDADE[a.prioridade] ?? "var(--v2-mudo)" }} />
                    <div className="min-w-0">
                      <div className="line-clamp-2 text-[12.5px] font-semibold leading-snug" style={{ color: NAVY }}>
                        {a.acao}
                      </div>
                      <div className="text-[11px] text-[var(--v2-mudo)]">
                        {a.area} · prioridade {a.prioridade.toLowerCase()}
                      </div>
                    </div>
                  </div>
                ))}
                {!vis.length && <div className="rounded-xl border border-dashed border-[var(--v2-linha)] p-3 text-[12px] text-[var(--v2-mudo)]">Sem ações neste prazo.</div>}
                {acoes.length > vis.length && (
                  <div className="text-[12px] font-semibold" style={ouro}>
                    + {acoes.length - vis.length} {acoes.length - vis.length === 1 ? "ação" : "ações"} no plano completo
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
//  10 · Precificação + Dashplan
// ---------------------------------------------------------------------
const RECURSOS_DASHPLAN: { icone: LucideIcon; texto: string }[] = [
  { icone: Wallet, texto: "Lançamentos e fluxo do mês num só lugar" },
  { icone: Target, texto: "Plano e metas: essencial, desejo e sonho" },
  { icone: TrendingUp, texto: "Simulador do futuro e da independência" },
  { icone: MessageCircle, texto: "Conversa direta com o seu planejador" },
];

export function SlidePrecificacao({ x }: { x: DadosV2 }) {
  const { e } = x;
  // Parcelas escolhidas na hora (começa na condição da 7.1); o valor do plano não muda aqui.
  const [parcelas, setParcelas] = useState(e.parcelas > 1 ? e.parcelas : 12);
  const c = cartao(e.valor, parcelas);
  return (
    <div className="v2-slide">
      <Topo capitulo="10 · Investimento e Dashplan" />
      <div className="mt-2 grid flex-1 grid-cols-[1fr_1.08fr] gap-8">
        <div className="v2-cascata flex min-h-0 flex-col">
          <div style={ordem(0)}>
            <Titulo>Seu planejamento</Titulo>
          </div>
          <div style={ordem(1)} className="mt-4 rounded-2xl bg-[var(--v2-creme)] p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[16px] font-bold" style={{ color: NAVY }}>
                {e.modelo.nome}
              </span>
              <span className="v2-selo" style={{ background: "#fff", color: NAVY }}>
                {e.modelo.duracao} · até {e.modelo.reunioes} reuniões
              </span>
            </div>
            <p className="mt-1 text-[12.5px] leading-snug text-[var(--v2-mudo)]">{e.modelo.resumo}</p>
          </div>
          <div style={ordem(2)} className="mt-4 grid grid-cols-2 gap-3">
            {/* Pix ou boleto */}
            <div tabIndex={0} className={`v2-cartao v2-revela flex flex-col p-4 outline-none ${e.condicao === "pix" ? "v2-ativo" : ""}`}>
              <div className="flex items-center gap-2">
                <QrCode className="h-4 w-4" style={ouro} aria-hidden="true" />
                <span className="text-[12px] font-bold uppercase tracking-[0.12em]" style={{ color: NAVY }}>
                  Pix ou boleto
                </span>
              </div>
              {e.pix.economia > 0 && (
                <span className="v2-selo mt-2 self-start" style={{ background: "rgba(31,157,107,.12)", color: "var(--v2-verde)" }}>
                  {fmtPercentual(DESCONTO_PIX)} de desconto
                </span>
              )}
              <div className="mt-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--v2-mudo)]">À vista</div>
              <div className="whitespace-nowrap text-[26px] font-extrabold tabular-nums leading-tight" style={{ color: NAVY }}>
                {fmtBRL(e.pix.total, true)}
              </div>
              <div className="v2-extra text-[12px] text-[var(--v2-mudo)]">
                {e.pix.economia > 0 ? `Economia de ${fmtBRL(e.pix.economia, true)} sobre ${fmtBRL(e.valor, true)}.` : "Pagamento único à vista."}
              </div>
            </div>
            {/* Cartão parcelado */}
            <div tabIndex={-1} className={`v2-cartao flex flex-col p-4 ${e.condicao === "cartao" ? "v2-ativo" : ""}`}>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" style={ouro} aria-hidden="true" />
                <span className="text-[12px] font-bold uppercase tracking-[0.12em]" style={{ color: NAVY }}>
                  Cartão de crédito
                </span>
              </div>
              <div className="mt-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--v2-mudo)]">
                {parcelas === 1 ? "À vista no cartão" : `Em ${parcelas} parcelas`}
              </div>
              <div key={parcelas} className="v2-valor-troca whitespace-nowrap text-[26px] font-extrabold tabular-nums leading-tight" style={{ color: NAVY }}>
                {parcelas === 1 ? fmtBRL(c.total, true) : `${parcelas}× ${fmtBRL(c.parcela, true)}`}
              </div>
              <div key={`t${parcelas}`} className="v2-valor-troca text-[12px] tabular-nums text-[var(--v2-mudo)]">
                Total {fmtBRL(c.total, true)}
              </div>
            </div>
          </div>
          <div style={ordem(3)} className="mt-4">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--v2-mudo)]">Escolha as parcelas</div>
            <div role="radiogroup" aria-label="Parcelas no cartão" className="flex flex-wrap gap-1">
              {PARCELAS.map((p) => (
                <button key={p} type="button" role="radio" aria-checked={parcelas === p} onClick={() => setParcelas(p)} className="v2-parcela">
                  {p}x
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="v2-cascata flex min-h-0 flex-col">
          <div style={ordem(1)} className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" style={ouro} aria-hidden="true" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em]" style={ouro}>
              Ferramenta de apoio inclusa
            </span>
          </div>
          <div style={{ ...ordem(2), color: NAVY }} className="mt-1 text-[24px] font-bold leading-tight">
            Dashplan: o seu planejamento no dia a dia
          </div>
          <div style={ordem(3)} className="relative mt-3 flex flex-1 items-center justify-center">
            <div className="absolute inset-x-6 bottom-2 top-8 rounded-[28px] opacity-60" style={{ background: "radial-gradient(60% 60% at 50% 55%,rgba(201,162,63,.25),transparent 70%)" }} />
            <img src={dashplan} alt="Dashplan: tela Meu Futuro" className="v2-dashplan relative max-h-[330px] w-auto drop-shadow-2xl" draggable={false} />
          </div>
          <div style={ordem(4)} className="mt-2 grid grid-cols-2 gap-2">
            {RECURSOS_DASHPLAN.map((r) => {
              const I = r.icone;
              return (
                <div key={r.texto} className="v2-cartao flex items-center gap-2.5 px-3 py-2">
                  <I className="h-4 w-4 shrink-0" style={ouro} aria-hidden="true" />
                  <span className="text-[12px] font-semibold leading-snug" style={{ color: NAVY }}>
                    {r.texto}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
//  Encerramento
// ---------------------------------------------------------------------
export function SlideEncerramento({ x, nome }: { x: DadosV2; nome: string }) {
  const passos = [
    { icone: HeartHandshake, titulo: "Decidir juntos", texto: "Escolher o modelo e a condição que fazem sentido para você." },
    { icone: BadgeCheck, titulo: "Formalizar", texto: "Assinar a precificação e receber o diagnóstico completo em PDF." },
    { icone: ArrowUpRight, titulo: "Começar o plano", texto: "Primeira reunião de implementação e acesso ao Dashplan." },
  ];
  return (
    <div className="v2-slide !p-0">
      <div className="relative flex h-full flex-col items-center justify-center overflow-hidden px-20 text-center" style={{ background: "linear-gradient(160deg,#141b3d 0%,#232c5c 70%,#2c2350 100%)" }}>
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full opacity-30" style={{ background: "radial-gradient(circle,#ea6a2a 0%,transparent 70%)" }} />
        <div className="absolute -bottom-32 -left-24 h-96 w-96 rounded-full opacity-20" style={{ background: "radial-gradient(circle,#c9a23f 0%,transparent 70%)" }} />
        <div className="v2-cascata relative flex flex-col items-center">
          <div style={ordem(0)} className="rounded-2xl bg-white px-6 py-3">
            <img src={logo} alt="Grupo Life Brasil · Planejamento" className="h-[54px] w-auto" draggable={false} />
          </div>
          <div style={ordem(1)} className="mt-8 text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--v2-gold-claro)]">
            Próximo passo
          </div>
          <h2 style={ordem(2)} className="mt-3 text-[44px] font-extrabold leading-tight text-white">
            {nome.split(" ")[0]}, vamos construir esse plano juntos?
          </h2>
          <div style={ordem(3)} className="mt-10 grid w-full max-w-[980px] grid-cols-3 gap-5">
            {passos.map((p, i) => {
              const I = p.icone;
              return (
                <div key={p.titulo} className="v2-cartao border-white/10 bg-white/[0.06] p-5 text-left" style={{ borderColor: "rgba(255,255,255,.12)" }}>
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-xl text-[15px] font-extrabold" style={{ background: "linear-gradient(135deg,#c9a23f,#ea6a2a)", color: "#fff" }}>
                      {i + 1}
                    </span>
                    <I className="h-5 w-5 text-[var(--v2-gold-claro)]" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-[17px] font-bold text-white">{p.titulo}</div>
                  <div className="mt-1 text-[13px] leading-snug text-white/70">{p.texto}</div>
                </div>
              );
            })}
          </div>
          <div style={ordem(4)} className="mt-10 text-[14px] text-white/70">
            {x.consultor} · {x.empresa}
          </div>
        </div>
      </div>
    </div>
  );
}
