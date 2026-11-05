// Slides da V2 · Apresentação (etapa 9). Cada slide recebe os dados já calculados
// (os mesmos do diagnóstico em PDF) e é montado de novo ao entrar: as animações de
// entrada, as barras e os números contando acontecem a cada visita.
// Detalhes aparecem ao passar o mouse (ou ao focar com o teclado) nos cartões.
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import {
  AlertOctagon,
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  CalendarClock,
  CreditCard,
  Gem,
  HeartHandshake,
  LineChart,
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
import { DESCONTO_PIX, VALIDADE_DIAS } from "@/config/especificacao";
import { fmtPercentual, type Especificacao } from "@/lib/especificacao";
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
/** Cabeçalho do slide. Com `onLogo`, o logo vira botão (no slide do investimento, atualiza os valores). */
export function Topo({ capitulo, onLogo }: { capitulo?: string; onLogo?: () => void }) {
  const imagem = <img src={logo} alt="Grupo Life Brasil · Planejamento" className="v2-logo" draggable={false} />;
  return (
    <div className="v2-topo">
      {onLogo ? (
        <button type="button" onClick={onLogo} className="v2-logo-botao" title="Atualizar os valores" aria-label="Atualizar os valores da apresentação">
          {imagem}
        </button>
      ) : (
        imagem
      )}
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

/** Faixas da nota LIFE (as mesmas do estado dos pilares: crítico < 45%, atenção < 75%, saudável a partir de 75%). */
const FAIXAS_NOTA = [
  { ate: 45, cor: "#d64545", rotulo: "Crítico" },
  { ate: 75, cor: "#d9902a", rotulo: "Atenção" },
  { ate: 100, cor: "#1f9d6b", rotulo: "Saudável" },
];
const faixaDaNota = (pct: number) => FAIXAS_NOTA.find((f) => pct < f.ate) ?? FAIXAS_NOTA[FAIXAS_NOTA.length - 1];

/** Medidor da nota LIFE: meia-lua com as três faixas e o ponteiro na nota (mostra se está ou não na faixa ideal). */
function Medidor({ nota, maximo }: { nota?: number; maximo: number }) {
  const pct = nota === undefined ? 0 : Math.max(0, Math.min(100, (nota / Math.max(1, maximo)) * 100));
  const v = useContagem(pct, 1200);
  const L = 250;
  const R = 92;
  const cx = L / 2;
  const cy = 120;
  const ponto = (f: number, raio = R) => {
    const t = Math.PI * (1 - f);
    return [cx + raio * Math.cos(t), cy - raio * Math.sin(t)] as const;
  };
  const arco = (f0: number, f1: number) => {
    const [x0, y0] = ponto(f0);
    const [x1, y1] = ponto(f1);
    return `M ${x0} ${y0} A ${R} ${R} 0 0 1 ${x1} ${y1}`;
  };
  const [px, py] = ponto(v / 100, R - 24);
  const faixa = faixaDaNota(pct);
  let inicio = 0;
  return (
    <div className="flex flex-col items-center">
      <svg width={L} height={140} viewBox={`0 0 ${L} 140`} role="img" aria-label={nota === undefined ? "Nota LIFE sem dados" : `Nota LIFE ${nota} de ${maximo}, faixa ${faixa.rotulo}`}>
        {FAIXAS_NOTA.map((f) => {
          const d = arco(inicio / 100 + 0.006, f.ate / 100 - 0.006);
          const ativa = nota !== undefined && f === faixa;
          inicio = f.ate;
          return <path key={f.rotulo} d={d} fill="none" stroke={f.cor} strokeWidth={ativa ? 18 : 14} strokeOpacity={ativa ? 1 : 0.28} strokeLinecap="butt" />;
        })}
        {[0, 45, 75, 100].map((t) => {
          const [tx, ty] = ponto(t / 100, R + 16);
          return (
            <text key={t} x={tx} y={ty + 3} textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#6b7080">
              {t}
            </text>
          );
        })}
        {nota !== undefined && (
          <>
            <line x1={cx} y1={cy} x2={px} y2={py} stroke="#141b3d" strokeWidth="4" strokeLinecap="round" />
            <circle cx={cx} cy={cy} r="8" fill="#141b3d" />
            <circle cx={cx} cy={cy} r="3" fill="#c9a23f" />
          </>
        )}
      </svg>
      <div className="-mt-1 flex items-baseline gap-1">
        <span className="text-[40px] font-extrabold leading-none tabular-nums" style={{ color: NAVY }}>
          {nota === undefined ? "—" : Math.round((v / 100) * maximo)}
        </span>
        <span className="text-[14px] font-semibold text-[var(--v2-mudo)]">/ {maximo}</span>
      </div>
      <div className="mt-1 text-[10.5px] font-bold uppercase tracking-[0.2em]" style={ouro}>
        Nota LIFE
      </div>
      {nota !== undefined && (
        <span className="v2-selo mt-2 normal-case" style={{ background: `${faixa.cor}1f`, color: faixa.cor, letterSpacing: 0, fontSize: 12 }}>
          {faixa.rotulo}
          {pct < 75 ? " · faixa ideal a partir de 75" : " · na faixa ideal"}
        </span>
      )}
    </div>
  );
}

/** Cor do momento financeiro (perfil): déficit e endividado em vermelho, consumidor em âmbar, os que poupam em verde. */
const COR_MOMENTO: Record<string, string> = {
  "Em déficit": "#d64545",
  Endividado: "#d64545",
  Consumidor: "#d9902a",
  Equilibrado: "#232c5c",
  Poupador: "#1f9d6b",
  "Construtor de patrimônio": "#1f9d6b",
};

/** Texto em caixa alta vira frase (só a primeira letra maiúscula); siglas como LIFE e INSS continuam. */
const SIGLAS = new Set(["LIFE", "INSS", "FGTS", "PGBL", "VGBL", "IR", "IRPF", "CLT", "PJ", "MEI"]);
const frase = (t: string) => {
  const r = t
    .split(" ")
    .map((p) => (p.length > 1 && p === p.toUpperCase() && /\p{L}/u.test(p) && !SIGLAS.has(p) ? p.toLowerCase() : p))
    .join(" ");
  return r.charAt(0).toUpperCase() + r.slice(1);
};

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
    <div className="v2-slide !p-0" style={{ background: "#fff" }}>
      <div className="v2-cascata flex h-full flex-col justify-between px-20 pb-24 pt-16">
        <img src={logo} alt="Grupo Life Brasil · Planejamento" className="h-[66px] w-auto self-start" style={ordem(0)} draggable={false} />
        <div style={ordem(1)}>
          <div className="v2-capitulo">Diagnóstico financeiro · Apresentação V2</div>
          <h1 className="mt-5 text-[76px] font-extrabold leading-[1.02] tracking-tight" style={{ color: NAVY }}>
            Plano de Vida Financeira
          </h1>
          <p className="mt-5 text-[20px] font-medium text-[var(--v2-mudo)]">Atual · Necessário · Diferença · Decisão</p>
          <div className="mt-7 h-1.5 w-28 rounded-full" style={{ background: "linear-gradient(90deg,#c9a23f,#ea6a2a)" }} />
        </div>
        <div style={ordem(2)} className="flex items-end justify-between gap-8 border-t border-[var(--v2-linha)] pt-6">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.2em]" style={ouro}>
              Preparado para
            </div>
            <div className="mt-1 text-[32px] font-bold" style={{ color: NAVY }}>
              {nome}
            </div>
          </div>
          <div className="text-right text-[14px] text-[var(--v2-mudo)]">
            {x.hoje}
            <br />
            Planejador {x.consultor}
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
  const corMomento = COR_MOMENTO[x.perfil.nome] ?? "#6b7080";
  return (
    <div className="v2-slide">
      <Topo capitulo="01 · Visão executiva" />
      <Titulo sub="Atual, necessário e a diferença que pede uma decisão. Passe o mouse para ver o que avaliar.">Atual x Necessário x Decisão</Titulo>
      <div className="mt-5 grid flex-1 grid-cols-[270px_1fr] gap-6">
        <div className="v2-cascata flex flex-col gap-3">
          <div style={ordem(0)} className="flex flex-1 flex-col items-center justify-center rounded-2xl bg-[var(--v2-creme)] px-4 py-3">
            <Medidor nota={x.d.notaLife} maximo={x.d.estrela.maximo} />
          </div>
          <div
            style={{ ...ordem(1), borderColor: corMomento, background: `${corMomento}12` }}
            className="v2-momento relative overflow-hidden rounded-2xl border-l-[5px] px-4 py-3"
          >
            <div className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.18em]" style={{ color: corMomento }}>
              <span className="v2-pulsa h-2 w-2 rounded-full" style={{ background: corMomento }} /> Momento financeiro
            </div>
            <div className="mt-0.5 text-[22px] font-extrabold leading-tight" style={{ color: corMomento }}>
              {x.perfil.nome}
            </div>
            <p className="mt-0.5 text-[12px] leading-snug text-[var(--v2-tinta)]">{x.perfil.descricao}</p>
          </div>
        </div>
        <div className="v2-cascata flex flex-col gap-2.5">
          <div style={ordem(0)} className="grid grid-cols-[1.5fr_1fr_1fr_1fr_110px] gap-3 px-4 text-[12px] font-semibold text-[var(--v2-mudo)]">
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
                    {frase(l.dimensao)}
                  </span>
                  <span className="text-right tabular-nums">{l.atual}</span>
                  <span className="text-right tabular-nums">{l.necessario}</span>
                  <span className="text-right font-bold tabular-nums" style={{ color: l.diferenca === "—" ? undefined : "var(--v2-vermelho)" }}>
                    {l.diferenca}
                  </span>
                  <span className="flex justify-center">
                    <span className="v2-selo normal-case" style={{ background: cor.fundo, color: cor.texto, letterSpacing: 0, fontSize: 12 }}>
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
      icone: Banknote,
      rotulo: "Receita líquida atual",
      valor: d.f.renda,
      formato: (v) => (d.f.renda > 0 ? `${fmtBRL(v)}/mês` : "Não informada"),
      sub: d.f.renda > 0 ? "Renda líquida mensal da família" : "Informe a renda",
      explica: "Tudo o que entra por mês já sem impostos e descontos: salários, pró-labore, aluguéis e outras rendas.",
      cor: "var(--v2-verde)",
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
      icone: Gem,
      rotulo: "Patrimônio líquido",
      valor: d.p.liquido,
      formato: (v) => fmtBRL(v),
      sub: `Bens ${fmtBRL(d.p.ativos)} − dívidas ${fmtBRL(d.p.passivos)}`,
      explica: "Tudo o que você tem menos tudo o que deve. É o ponto de partida da construção de patrimônio.",
      cor: NAVY,
    },
  ];
  return (
    <div className="v2-slide">
      <Topo capitulo="02 · Indicadores financeiros" />
      <Titulo sub="Os números que sustentam o diagnóstico. Passe o mouse para entender cada um.">Indicadores Financeiros Atuais</Titulo>
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
      <Titulo sub="Quanto entra, quanto sai e quanto sobra: o motor do seu plano.">Fluxo de Caixa Mensal</Titulo>
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
      <Titulo sub="As maiores categorias de despesa do mês. Passe o mouse para ver o que entra em cada uma.">Despesas por Categoria</Titulo>
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
      <Titulo sub="Oportunidades identificadas no diagnóstico e como podemos atuar juntos.">Plano Potencial</Titulo>
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
      <Titulo sub="O que você já faz bem e como deixar ainda melhor.">Plano Otimização</Titulo>
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
      <Titulo sub={`Os pontos que pedem atenção primeiro${resto > 0 ? ` (mais ${resto} no diagnóstico completo)` : ""}.`}>Alertas Críticos</Titulo>
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
      <Titulo sub={x.d.planoAutomatico ? "Primeiras ações sugeridas, organizadas por prazo." : "As ações combinadas, organizadas por prazo e prioridade."}>Plano de Ação Estruturado</Titulo>
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
//  10 · Life Planejamento: investimento, metodologia e Dashplan
// ---------------------------------------------------------------------
/** Metodologia Life: a etapa de mapeamento e as quatro de implementação, com as entregas de cada uma. */
const METODOLOGIA: { titulo: string; entregas: string }[] = [
  { titulo: "Diagnóstico e Organização", entregas: "Diagnóstico Inicial, App Configurado, Mapa de Organização." },
  { titulo: "Definição de Objetivos", entregas: "Mapa de Objetivos, Plano de Aportes, Simulações, Soluções Financeiras." },
  { titulo: "Proteção e Sucessão", entregas: "Plano de Gestão de Riscos, Análise Sucessória, Relatório de Reserva de Emergência." },
  { titulo: "Investimentos e Previdência", entregas: "Plano de Investimentos, Projeção de Aposentadoria, Relatório de Otimização Fiscal." },
  { titulo: "Aquisição de Bens", entregas: "Análise Comparativa para Aquisição de Bens." },
];

/** Chave da fase (Mapeamento / Implementação) sobre as etapas. */
function Fase({ rotulo, className = "" }: { rotulo: string; className?: string }) {
  const linha = { borderColor: "rgba(201,162,63,.6)" };
  return (
    <div className={`flex items-start gap-2 ${className}`}>
      <span className="mt-[10px] h-2.5 flex-1 rounded-tl-lg border-l-[1.5px] border-t-[1.5px]" style={linha} />
      <span className="text-[13.5px] font-bold leading-5" style={{ color: NAVY }}>
        {rotulo}
      </span>
      <span className="mt-[10px] h-2.5 flex-1 rounded-tr-lg border-r-[1.5px] border-t-[1.5px]" style={linha} />
    </div>
  );
}

function Metodologia() {
  const [foco, setFoco] = useState(0);
  return (
    <div>
      <div className="grid grid-cols-5 gap-2">
        <Fase rotulo="Mapeamento" />
        <Fase rotulo="Implementação" className="col-span-4" />
      </div>
      <div className="mt-1.5 grid grid-cols-5 gap-2 rounded-2xl border border-[var(--v2-linha)] bg-[var(--v2-creme)] p-2" onMouseLeave={() => setFoco(0)}>
        {METODOLOGIA.map((m, i) => {
          const ativo = foco === i;
          return (
            <div
              key={m.titulo}
              tabIndex={0}
              onMouseEnter={() => setFoco(i)}
              onFocus={() => setFoco(i)}
              className={`v2-etapa flex flex-col gap-1.5 outline-none ${ativo ? "v2-etapa-ativa" : ""}`}
            >
              <div className="v2-etapa-titulo grid h-[46px] place-items-center rounded-xl px-2 text-center text-[12px] font-bold leading-tight">{m.titulo}</div>
              <div className="v2-etapa-corpo flex-1 rounded-xl px-2.5 py-2">
                <div className="v2-etapa-num text-[17px] font-extrabold leading-none">{String(i + 1).padStart(2, "0")}.</div>
                <p className="mt-1 text-[10.5px] leading-[1.35] text-[var(--v2-mudo)]">{m.entregas}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SlidePrecificacao({ x, atualizar }: { x: DadosV2; atualizar?: () => void }) {
  const { e } = x;
  // Valores e parcelas vêm da 7 · Precificação (aqui não se escolhe parcela nem se dá desconto).
  const c = e.cartao;
  return (
    <div className="v2-slide">
      <Topo capitulo="10 · Investimento e Dashplan" onLogo={atualizar} />
      <div className="mt-1 grid min-h-0 flex-1 grid-cols-[390px_1fr] gap-8">
        <div className="v2-cascata flex min-h-0 flex-col">
          <div style={ordem(0)}>
            <Titulo sub="O investimento no seu planejamento financeiro.">Life Planejamento</Titulo>
          </div>
          <div className="mt-4 flex flex-1 flex-col justify-center gap-4">
            {/* Pix ou boleto */}
            <div style={ordem(1)} tabIndex={0} className={`v2-cartao flex flex-col p-5 outline-none ${e.condicao === "pix" ? "v2-ativo" : ""}`}>
              <div className="flex items-center gap-2">
                <QrCode className="h-4 w-4" style={ouro} aria-hidden="true" />
                <span className="text-[12px] font-bold uppercase tracking-[0.12em]" style={{ color: NAVY }}>
                  Pix ou boleto
                </span>
                {e.pix.economia > 0 && (
                  <span className="v2-selo ml-auto" style={{ background: "rgba(31,157,107,.12)", color: "var(--v2-verde)" }}>
                    {fmtPercentual(DESCONTO_PIX)} de desconto
                  </span>
                )}
              </div>
              <div className="mt-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--v2-mudo)]">À vista</div>
              <div className="whitespace-nowrap text-[34px] font-extrabold tabular-nums leading-tight" style={{ color: NAVY }}>
                {fmtBRL(e.pix.total, true)}
              </div>
              <div className="mt-0.5 text-[12.5px] text-[var(--v2-mudo)]">
                {e.pix.economia > 0 ? `Economia de ${fmtBRL(e.pix.economia, true)} no pagamento à vista.` : "Pagamento único à vista."}
              </div>
            </div>
            {/* Cartão de crédito (parcelas da 7.1) */}
            <div style={ordem(2)} tabIndex={0} className={`v2-cartao flex flex-col p-5 outline-none ${e.condicao === "cartao" ? "v2-ativo" : ""}`}>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" style={ouro} aria-hidden="true" />
                <span className="text-[12px] font-bold uppercase tracking-[0.12em]" style={{ color: NAVY }}>
                  Cartão de crédito
                </span>
              </div>
              <div className="mt-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--v2-mudo)]">
                {c.parcelas === 1 ? "À vista no cartão" : `Em ${c.parcelas} parcelas`}
              </div>
              <div className="whitespace-nowrap text-[34px] font-extrabold tabular-nums leading-tight" style={{ color: NAVY }}>
                {c.parcelas === 1 ? fmtBRL(c.total, true) : `${c.parcelas}× ${fmtBRL(c.parcela, true)}`}
              </div>
              <div className="mt-0.5 text-[12.5px] tabular-nums text-[var(--v2-mudo)]">Total {fmtBRL(c.total, true)}</div>
            </div>
          </div>
          <p style={ordem(3)} className="mt-3 text-[11.5px] text-[var(--v2-mudo)]">
            Condições válidas por {VALIDADE_DIAS} dias.
          </p>
        </div>
        <div className="v2-cascata flex min-h-0 flex-col">
          <div style={ordem(1)} className="mb-1 flex items-center gap-2">
            <BadgeCheck className="h-4 w-4" style={ouro} aria-hidden="true" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em]" style={ouro}>
              O que vamos entregar
            </span>
          </div>
          <div style={ordem(2)}>
            <Metodologia />
          </div>
          <div style={ordem(3)} className="mt-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4" style={ouro} aria-hidden="true" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em]" style={ouro}>
              Dashplan · ferramenta de apoio inclusa
            </span>
          </div>
          <div style={ordem(4)} className="relative mt-2 min-h-0 flex-1">
            <img src={dashplan} alt="Dashplan: tela Meu Futuro" className="v2-dashplan absolute inset-0 m-auto max-h-full max-w-full" draggable={false} />
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
    { icone: HeartHandshake, titulo: "Decidir juntos", texto: "Escolher a condição de pagamento que faz sentido para você." },
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
