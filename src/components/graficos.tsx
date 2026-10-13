// Gráficos reutilizáveis (Recharts). Cores vêm de --serie-1/--serie-2 em index.css.
import type { ReactNode } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, LabelList, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TrendingDown, TrendingUp } from "lucide-react";
import { fmtBRL, fmtCompacto, fmtPct } from "@/lib/format";

export const corEixo = "rgb(var(--muted-foreground))";
export const corGrade = "rgb(var(--border))";
export const estiloTooltip = {
  contentStyle: {
    background: "rgb(var(--popover))",
    border: "1px solid rgb(var(--border))",
    borderRadius: 8,
    fontSize: 12,
    color: "rgb(var(--foreground))",
  },
  labelStyle: { color: "rgb(var(--foreground))", fontWeight: 600 },
  itemStyle: { color: "rgb(var(--foreground))" },
  cursor: { fill: "rgb(var(--muted) / 0.4)" },
};

/** Barras horizontais ordenadas (uma série) com o valor rotulado na ponta. */
export function BarrasHorizontais({
  dados,
  altura,
  ultimo,
}: {
  dados: { nome: string; valor: number }[];
  altura?: number;
  /** Nome de um item que fica sempre no fim (ex.: "Demais categorias"). */
  ultimo?: string;
}) {
  const ordenados = [...dados]
    .filter((d) => d.valor > 0)
    .sort((a, b) => (a.nome === ultimo ? 1 : b.nome === ultimo ? -1 : b.valor - a.valor));
  if (!ordenados.length) return <p className="py-6 text-center text-xs text-muted-foreground">Sem valores para exibir.</p>;
  const h = altura ?? Math.max(120, ordenados.length * 40 + 20);
  return (
    // overflow-hidden: o tooltip (rótulos longos) não cria rolagem lateral no celular.
    <div className="overflow-hidden" style={{ height: h }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={ordenados} layout="vertical" margin={{ top: 0, right: 72, bottom: 0, left: 0 }} barCategoryGap={8}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="nome"
            width={130}
            tickLine={false}
            axisLine={false}
            tick={{ fill: corEixo, fontSize: 12 }}
          />
          <Tooltip {...estiloTooltip} formatter={(v: number) => [fmtBRL(v), "Valor"]} />
          <Bar dataKey="valor" fill="var(--serie-1)" radius={[0, 4, 4, 0]} maxBarSize={22} isAnimationActive={false}>
            <LabelList dataKey="valor" position="right" formatter={(v: number) => fmtBRL(v)} style={{ fill: "rgb(var(--foreground))", fontSize: 12 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Barras verticais de uma série, com rótulo de valor acima de cada barra. */
export function BarrasVerticais({ dados, altura = 288 }: { dados: { nome: string; valor: number }[]; altura?: number }) {
  return (
    <div style={{ height: altura }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dados} margin={{ top: 24, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke={corGrade} strokeDasharray="3 3" />
          <XAxis dataKey="nome" tickLine={false} axisLine={{ stroke: corGrade }} tick={{ fill: corEixo, fontSize: 12 }} />
          <YAxis tickFormatter={fmtCompacto} tickLine={false} axisLine={false} tick={{ fill: corEixo, fontSize: 11 }} width={48} />
          <Tooltip {...estiloTooltip} formatter={(v: number) => [fmtBRL(v), "Patrimônio"]} />
          <Bar dataKey="valor" fill="var(--serie-1)" radius={[4, 4, 0, 0]} maxBarSize={72} isAnimationActive={false}>
            <LabelList dataKey="valor" position="top" formatter={(v: number) => fmtBRL(v)} style={{ fill: "rgb(var(--foreground))", fontSize: 12 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Barra única 100% dividida em partes (ex.: renda → fixas, variáveis, sobra). Rótulos diretos abaixo. */
export function BarraComposicao({ partes }: { partes: { nome: string; valor: number; cor: string }[] }) {
  const total = partes.reduce((t, p) => t + Math.max(0, p.valor), 0);
  if (total <= 0) return <p className="text-xs text-muted-foreground">Sem valores para exibir.</p>;
  return (
    <div>
      <div className="flex h-4 w-full overflow-hidden rounded-full bg-muted">
        {partes.map((p, i) => (
          <div
            key={p.nome}
            title={`${p.nome}: ${fmtBRL(p.valor)}`}
            style={{ width: `${(Math.max(0, p.valor) / total) * 100}%`, background: p.cor }}
            className={i > 0 ? "border-l-2 border-card" : ""}
          />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
        {partes.map((p) => (
          <span key={p.nome} className="flex items-center gap-1.5 text-xs">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: p.cor }} />
            <span className="text-muted-foreground">{p.nome}</span>
            <span className="font-semibold tabular-nums">{fmtBRL(p.valor)}</span>
            <span className="text-muted-foreground">({fmtPct(Math.max(0, p.valor) / total)})</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** Cascata do fluxo de caixa: entrada, saídas e resultado, em linhas proporcionais. */
export function Cascata({ linhas }: { linhas: { nome: string; valor: number; tipo: "entrada" | "saida" | "resultado" }[] }) {
  const base = Math.max(1, ...linhas.map((l) => Math.abs(l.valor)));
  let acumulado = 0;
  return (
    <div className="space-y-2">
      {linhas.map((l) => {
        let inicio = 0;
        let largura = Math.abs(l.valor);
        if (l.tipo === "entrada") acumulado = l.valor;
        else if (l.tipo === "saida") {
          acumulado -= l.valor;
          inicio = Math.max(0, acumulado);
          largura = Math.min(l.valor, base - inicio);
        } else largura = Math.max(0, l.valor);
        return (
          <div key={l.nome} className="grid grid-cols-[110px_1fr_auto] items-center gap-3 text-sm sm:grid-cols-[150px_1fr_auto]">
            <span className="truncate text-muted-foreground">{l.nome}</span>
            <div className="relative h-5 rounded bg-muted/40">
              <div
                className={`absolute inset-y-0 rounded ${l.tipo === "saida" ? "bg-muted-foreground/45" : l.valor < 0 ? "bg-destructive" : "bg-gold"}`}
                style={{ left: `${(inicio / base) * 100}%`, width: `${(Math.abs(largura) / base) * 100}%` }}
              />
            </div>
            <span className={`text-right font-semibold tabular-nums ${l.tipo === "saida" ? "text-muted-foreground" : ""}`}>
              {l.tipo === "saida" ? "− " : ""}
              {fmtBRL(Math.abs(l.valor))}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** Duas barras por item (ex.: probabilidade atual × com plano). */
export function BarrasDuplas({
  itens,
  rotulos,
}: {
  itens: { nome: string; a: number; b: number }[];
  rotulos: [string, string];
}) {
  return (
    <div>
      <div className="mb-3 flex gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: "var(--serie-2)" }} /> {rotulos[0]}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: "var(--serie-1)" }} /> {rotulos[1]}
        </span>
      </div>
      <div className="space-y-3">
        {itens.map((i) => (
          <div key={i.nome} className="grid grid-cols-[minmax(0,160px)_1fr] items-center gap-3">
            <span className="truncate text-sm">{i.nome}</span>
            <div className="space-y-1">
              {[
                { v: i.a, cor: "var(--serie-2)" },
                { v: i.b, cor: "var(--serie-1)" },
              ].map((x, k) => (
                <div key={k} className="flex items-center gap-2">
                  <div className="h-2.5 flex-1 rounded-full bg-muted/50">
                    <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, x.v))}%`, background: x.cor }} />
                  </div>
                  <span className="w-10 text-right text-xs font-semibold tabular-nums">{x.v}%</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Projeção patrimonial: trajetória atual × trajetória necessária. */
export function GraficoFuturo({
  serie,
  rotuloAtual = "Investindo a sobra atual",
}: {
  serie: { ano: number; idade: number; atual: number; necessaria: number }[];
  /** Nome da série do ritmo atual (sobra ou investimento mensal informado). */
  rotuloAtual?: string;
}) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={serie} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="gAtual" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--serie-2)" stopOpacity={0.25} />
              <stop offset="100%" stopColor="var(--serie-2)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gNec" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--serie-1)" stopOpacity={0.25} />
              <stop offset="100%" stopColor="var(--serie-1)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={corGrade} strokeDasharray="3 3" />
          <XAxis dataKey="ano" tickLine={false} axisLine={{ stroke: corGrade }} tick={{ fill: corEixo, fontSize: 11 }} minTickGap={16} />
          <YAxis tickFormatter={fmtCompacto} tickLine={false} axisLine={false} tick={{ fill: corEixo, fontSize: 11 }} width={48} />
          <Tooltip
            {...estiloTooltip}
            cursor={{ stroke: corEixo, strokeDasharray: "3 3" }}
            labelFormatter={(ano, p) => `${ano} · ${p?.[0]?.payload?.idade ?? ""} anos`}
            formatter={(v: number, nome: string) => [fmtBRL(v), nome]}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: corEixo }} />
          <Area type="monotone" dataKey="atual" name={rotuloAtual} stroke="var(--serie-2)" strokeWidth={2} fill="url(#gAtual)" dot={false} isAnimationActive={false} />
          <Area type="monotone" dataKey="necessaria" name="Trajetória necessária" stroke="var(--serie-1)" strokeWidth={2} fill="url(#gNec)" dot={false} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------------------------------------------------------------------
//  Renda × despesas (HTML/CSS): duas colunas sobre a mesma base.
//  A faixa entre o topo das despesas e a altura da renda é a sobra;
//  se as despesas passam da renda, o excedente aparece como déficit.
// ---------------------------------------------------------------------
const ALTURA_RD = 220;

/** Afasta rótulos verticais (centros em px a partir da base) para não se sobreporem. */
function espalharRotulos<T extends { centro: number; altura: number }>(rotulos: T[], limite: number, folga = 4): T[] {
  const r = [...rotulos].sort((a, b) => a.centro - b.centro).map((x) => ({ ...x }));
  for (let i = 0; i < r.length; i++) {
    const min = i === 0 ? r[i].altura / 2 : r[i - 1].centro + r[i - 1].altura / 2 + folga + r[i].altura / 2;
    r[i].centro = Math.max(r[i].centro, min);
  }
  for (let i = r.length - 1; i >= 0; i--) {
    const max = i === r.length - 1 ? limite - r[i].altura / 2 : r[i + 1].centro - r[i + 1].altura / 2 - folga - r[i].altura / 2;
    r[i].centro = Math.min(r[i].centro, max);
  }
  return r;
}

// Listras finas: deixam ver os segmentos por baixo e não dependem só da cor (impressão/daltonismo).
const TEXTURA_DEFICIT =
  "repeating-linear-gradient(135deg, rgb(var(--destructive) / 0.7) 0 2px, rgb(var(--destructive) / 0.08) 2px 7px)";

export function RendaVsDespesas({ renda, fixas, variaveis }: { renda: number; fixas: number; variaveis: number }) {
  const r = Math.max(0, renda);
  const fx = Math.max(0, fixas);
  const vr = Math.max(0, variaveis);
  const desp = fx + vr;
  if (r <= 0 && desp <= 0) return <p className="py-6 text-center text-xs text-muted-foreground">Sem valores para exibir.</p>;

  const topo = Math.max(r, desp, 1);
  const px = (v: number) => (v / topo) * ALTURA_RD;
  const diferenca = r - desp;
  const sobra = diferenca > 0.5;
  const deficit = diferenca < -0.5;
  const pctRenda = r > 0 ? Math.abs(diferenca) / r : 0;

  const titulo = sobra
    ? `A renda supera as despesas em ${fmtBRL(diferenca)} (${fmtPct(pctRenda)})`
    : deficit
      ? `As despesas superam a renda em ${fmtBRL(-diferenca)}`
      : "A renda e as despesas estão empatadas";

  // Rótulos da coluna de despesas, ao lado de cada segmento.
  const rotulos = espalharRotulos(
    [
      ...(fx > 0 ? [{ id: "fixas", centro: px(fx) / 2, altura: 30 }] : []),
      ...(vr > 0 ? [{ id: "variaveis", centro: px(fx) + px(vr) / 2, altura: 30 }] : []),
      ...(sobra ? [{ id: "sobra", centro: (px(desp) + px(r)) / 2, altura: 44 }] : []),
      ...(deficit ? [{ id: "deficit", centro: (px(r) + px(desp)) / 2, altura: 30 }] : []),
    ],
    ALTURA_RD + 28,
    6,
  );
  const conteudo: Record<string, ReactNode> = {
    fixas: (
      <>
        <span className="block truncate text-[11px] text-muted-foreground">Fixas</span>
        <span className="block truncate text-xs font-semibold tabular-nums">{fmtBRL(fx)}</span>
      </>
    ),
    variaveis: (
      <>
        <span className="block truncate text-[11px] text-muted-foreground">Variáveis</span>
        <span className="block truncate text-xs font-semibold tabular-nums">{fmtBRL(vr)}</span>
      </>
    ),
    sobra: (
      <>
        <span className="block truncate text-[11px] font-semibold text-success">Sobra</span>
        <span className="block truncate text-xs font-semibold tabular-nums">{fmtBRL(diferenca)}</span>
        <span className="block truncate text-[11px] text-muted-foreground">{fmtPct(pctRenda)} da renda</span>
      </>
    ),
    deficit: (
      <>
        <span className="block truncate text-[11px] font-semibold text-destructive">Déficit</span>
        <span className="block truncate text-xs font-semibold tabular-nums">{fmtBRL(-diferenca)}</span>
      </>
    ),
  };

  const legenda = [
    { nome: "Renda", valor: r, amostra: <span className="h-2.5 w-2.5 shrink-0 rounded-sm bg-gold" /> },
    { nome: "Despesas fixas", valor: fx, amostra: <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: "var(--serie-2)" }} /> },
    {
      nome: "Despesas variáveis",
      valor: vr,
      amostra: <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: "var(--serie-2)", opacity: 0.55 }} />,
    },
    ...(sobra
      ? [{ nome: "Sobra", valor: diferenca, amostra: <span className="h-2.5 w-2.5 shrink-0 rounded-sm border border-dashed border-success bg-success/15" /> }]
      : []),
    ...(deficit
      ? [{ nome: "Déficit", valor: -diferenca, amostra: <span className="h-2.5 w-2.5 shrink-0 rounded-sm border border-destructive" style={{ background: TEXTURA_DEFICIT }} /> }]
      : []),
  ];

  const IconeTitulo = deficit ? TrendingDown : TrendingUp;

  return (
    <figure className="m-0">
      <figcaption className="mb-3 flex items-start gap-2 text-sm font-semibold">
        <IconeTitulo className={`mt-0.5 h-4 w-4 shrink-0 ${deficit ? "text-destructive" : "text-success"}`} aria-hidden="true" />
        <span className="min-w-0">{titulo}</span>
      </figcaption>

      <div
        role="img"
        aria-label={`Renda de ${fmtBRL(r)} e despesas de ${fmtBRL(desp)} (fixas ${fmtBRL(fx)}, variáveis ${fmtBRL(vr)}). ${titulo}.`}
        className="pt-8"
      >
        <div className="flex gap-3 border-b border-border" style={{ height: ALTURA_RD }}>
          {/* Coluna da renda */}
          <div className="relative h-full w-[28%] max-w-28 shrink-0">
            {r > 0 && (
              <div
                className="absolute inset-x-0 bottom-0 rounded-t bg-gold"
                style={{ height: Math.max(2, px(r)) }}
                title={`Renda: ${fmtBRL(r)}`}
              />
            )}
            <span
              className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-semibold tabular-nums"
              style={{ bottom: px(r) + 4 }}
            >
              {fmtBRL(r)}
            </span>
          </div>

          {/* Coluna das despesas: fixas embaixo, variáveis em cima, separadas por 2px */}
          <div className="relative h-full w-[28%] max-w-28 shrink-0">
            {fx > 0 && (
              <div
                className={`absolute inset-x-0 bottom-0 ${vr > 0 ? "" : "rounded-t"}`}
                style={{ height: Math.max(2, px(fx)), background: "var(--serie-2)" }}
                title={`Despesas fixas: ${fmtBRL(fx)}`}
              />
            )}
            {vr > 0 && (
              <div
                className="absolute inset-x-0 rounded-t"
                style={{
                  bottom: px(fx) + (fx > 0 ? 2 : 0),
                  height: Math.max(2, px(vr) - (fx > 0 ? 2 : 0)),
                  background: "var(--serie-2)",
                  opacity: 0.55,
                }}
                title={`Despesas variáveis: ${fmtBRL(vr)}`}
              />
            )}
            {sobra && (
              <div
                className="absolute inset-x-0 rounded-t border-2 border-dashed border-success/60 bg-success/10"
                style={{ bottom: px(desp) + 2, height: Math.max(2, px(r) - px(desp) - 2) }}
                title={`Sobra: ${fmtBRL(diferenca)} (${fmtPct(pctRenda)} da renda)`}
              />
            )}
            {deficit && (
              <div
                className="absolute -inset-x-1 rounded-t border-2 border-destructive"
                style={{ bottom: px(r), height: px(desp) - px(r), background: TEXTURA_DEFICIT }}
                title={`Déficit: ${fmtBRL(-diferenca)}`}
              />
            )}
          </div>

          {/* Rótulos diretos dos segmentos de despesa */}
          <div className="relative h-full min-w-0 flex-1">
            {rotulos.map((l) => (
              <div key={l.id} className="absolute inset-x-0 leading-tight" style={{ bottom: l.centro - l.altura / 2, height: l.altura }}>
                {conteudo[l.id]}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-1.5 flex gap-3 text-xs leading-tight">
          <span className="w-[28%] max-w-28 shrink-0 text-center">
            <span className="block font-semibold">Renda</span>
            <span className="block text-muted-foreground">líquida</span>
          </span>
          <span className="w-[28%] max-w-28 shrink-0 text-center">
            <span className="block font-semibold">Despesas</span>
            <span className="block truncate tabular-nums text-muted-foreground">{fmtBRL(desp)}</span>
          </span>
        </div>
      </div>

      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
        {legenda.map((l) => (
          <li key={l.nome} className="flex items-center gap-1.5 text-xs">
            {l.amostra}
            <span className="text-muted-foreground">{l.nome}</span>
            <span className="font-semibold tabular-nums">{fmtBRL(l.valor)}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}

// ---------------------------------------------------------------------
//  Renda × despesas atuais × modelo 50-30-20 (HTML/CSS): três colunas na
//  mesma escala. Necessidades (azul) e desejos (laranja) empilhados; a
//  poupança/sobra é tracejada. Paleta validada para daltonismo
//  (--serie-1/2/3 em index.css, claro e escuro).
// ---------------------------------------------------------------------
const ALTURA_503020 = 240;
/** Tinta escura para rótulos dentro das barras (contraste ≥ 4:1 nas três cores, claro e escuro). */
const TINTA_BARRA = "rgb(14 16 22)";

interface Segmento {
  id: string;
  nome: string;
  valor: number;
  estilo: React.CSSProperties;
  classe?: string;
  /** Rótulo dentro da barra (ex.: "62%"); some se o segmento for baixo. */
  rotulo?: string;
}

function Coluna({
  segmentos,
  topo,
  total,
  titulo,
  subtitulo,
  deficitAcimaDe,
  mostrarTotal = false,
}: {
  segmentos: Segmento[];
  topo: number;
  total: number;
  titulo: string;
  subtitulo: string;
  /** Renda: com déficit, uma linha tracejada marca a renda e o excedente é rotulado acima. */
  deficitAcimaDe?: number;
  /** Valor no topo da coluna (só na renda; as outras repetem a mesma altura). */
  mostrarTotal?: boolean;
}) {
  const px = (v: number) => (v / topo) * ALTURA_503020;
  let base = 0;
  return (
    <div className="flex min-w-0 flex-col items-center">
      <div className="relative w-full max-w-[140px]" style={{ height: ALTURA_503020 }}>
        {segmentos
          .filter((sg) => sg.valor > 0)
          .map((sg, i, lista) => {
            const altura = Math.max(2, px(sg.valor) - (i > 0 ? 2 : 0));
            const bottom = base + (i > 0 ? 2 : 0);
            base += px(sg.valor);
            const ultimo = i === lista.length - 1;
            return (
              <div
                key={sg.id}
                className={`absolute inset-x-0 flex items-center justify-center ${ultimo ? "rounded-t" : ""} ${sg.classe ?? ""}`}
                style={{ bottom, height: altura, ...sg.estilo }}
                title={`${sg.nome}: ${fmtBRL(sg.valor)}`}
              >
                {sg.rotulo && altura >= 22 && (
                  <span className="text-xs font-bold tabular-nums" style={{ color: sg.classe ? undefined : TINTA_BARRA }}>
                    {sg.rotulo}
                  </span>
                )}
              </div>
            );
          })}
        {deficitAcimaDe !== undefined && total > deficitAcimaDe && (
          <>
            {/* Linha da renda sobre a coluna: o que passa dela é o déficit (sem cobrir os segmentos). */}
            <div
              className="absolute -inset-x-2 border-t-2 border-dashed border-foreground"
              style={{ bottom: px(deficitAcimaDe) - 1 }}
              title={`Renda: ${fmtBRL(deficitAcimaDe)}`}
            />
            <span
              className="absolute left-1/2 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap text-xs font-semibold tabular-nums text-destructive"
              style={{ bottom: px(total) + 4 }}
            >
              <TrendingDown className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              Déficit {fmtBRL(total - deficitAcimaDe)}
            </span>
          </>
        )}
        {mostrarTotal && (
          <span
            className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-semibold tabular-nums"
            style={{ bottom: px(total) + 4 }}
          >
            {fmtBRL(total)}
          </span>
        )}
      </div>
      <div className="mt-1.5 w-full border-t border-border pt-1.5 text-center text-xs leading-tight">
        <span className="block font-semibold">{titulo}</span>
        <span className="block text-muted-foreground">{subtitulo}</span>
      </div>
    </div>
  );
}

export function Grafico503020({
  renda,
  necessidades,
  desejos,
}: {
  renda: number;
  necessidades: number;
  desejos: number;
}) {
  const r = Math.max(0, renda);
  const nec = Math.max(0, necessidades);
  const des = Math.max(0, desejos);
  const desp = nec + des;
  if (r <= 0 && desp <= 0) return <p className="py-6 text-center text-xs text-muted-foreground">Sem valores para exibir.</p>;

  const sobra = Math.max(0, r - desp);
  const deficit = Math.max(0, desp - r);
  const topo = Math.max(r, desp, 1);
  const pct = (v: number) => (r > 0 ? fmtPct(v / r) : undefined);
  const azul: React.CSSProperties = { background: "var(--serie-2)" };
  const laranja: React.CSSProperties = { background: "var(--serie-3)" };
  const tracejado = "border-2 border-dashed border-success/70 bg-success/10 text-foreground";

  const atual: Segmento[] = [
    { id: "nec", nome: "Necessidades (hoje)", valor: nec, estilo: azul, rotulo: pct(nec) },
    { id: "des", nome: "Desejos (hoje)", valor: des, estilo: laranja, rotulo: pct(des) },
    ...(sobra > 0 ? [{ id: "sobra", nome: "Poupança e investimentos (sobra)", valor: sobra, estilo: {}, classe: tracejado, rotulo: pct(sobra) }] : []),
  ];

  const modelo: Segmento[] = [
    { id: "nec", nome: "Necessidades (50%)", valor: r * 0.5, estilo: azul, rotulo: "50%" },
    { id: "des", nome: "Desejos (30%)", valor: r * 0.3, estilo: laranja, rotulo: "30%" },
    { id: "pou", nome: "Poupança e investimentos (20%)", valor: r * 0.2, estilo: {}, classe: tracejado, rotulo: "20%" },
  ];

  const legenda = [
    { nome: "Renda líquida", valor: r, amostra: <span className="h-2.5 w-2.5 shrink-0 rounded-sm bg-gold" /> },
    { nome: "Necessidades", valor: nec, amostra: <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={azul} /> },
    { nome: "Desejos", valor: des, amostra: <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={laranja} /> },
    ...(deficit > 0
      ? [{ nome: "Déficit (acima da linha da renda)", valor: deficit, amostra: <span className="h-0 w-3 shrink-0 border-t-2 border-dashed border-foreground" /> }]
      : [
          {
            nome: "Poupança e investimentos (sobra)",
            valor: sobra,
            amostra: <span className="h-2.5 w-2.5 shrink-0 rounded-sm border border-dashed border-success bg-success/15" />,
          },
        ]),
  ];

  return (
    <figure className="m-0">
      <div
        role="img"
        aria-label={`Renda líquida de ${fmtBRL(r)}. Hoje: necessidades ${fmtBRL(nec)}, desejos ${fmtBRL(des)}, ${
          deficit > 0 ? `déficit de ${fmtBRL(deficit)}` : `sobra de ${fmtBRL(sobra)}`
        }. Modelo 50-30-20: necessidades ${fmtBRL(r * 0.5)}, desejos ${fmtBRL(r * 0.3)}, poupança ${fmtBRL(r * 0.2)}.`}
        className="grid grid-cols-3 gap-3 pt-6 sm:gap-6"
      >
        <Coluna
          titulo="Renda"
          subtitulo="líquida"
          topo={topo}
          total={r}
          mostrarTotal
          segmentos={[{ id: "renda", nome: "Renda líquida", valor: r, estilo: { background: "var(--gradient-gold)" } }]}
        />
        <Coluna
          titulo="Despesas atuais"
          subtitulo={fmtBRL(desp)}
          topo={topo}
          total={Math.max(r, desp)}
          segmentos={atual}
          deficitAcimaDe={deficit > 0 ? r : undefined}
        />
        {/* Hífens inseparáveis: "50‑30‑20" não quebra no celular. */}
        <Coluna titulo="Modelo 50‑30‑20" subtitulo="ideal" topo={topo} total={r} segmentos={modelo} />
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
        {legenda.map((l) => (
          <li key={l.nome} className="flex items-center gap-1.5 text-xs">
            {l.amostra}
            <span className="text-muted-foreground">{l.nome}</span>
            <span className="font-semibold tabular-nums">{fmtBRL(l.valor)}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
