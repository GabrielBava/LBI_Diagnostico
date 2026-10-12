// Gráficos reutilizáveis (Recharts). Cores vêm de --serie-1/--serie-2 em index.css.
import { Area, AreaChart, Bar, BarChart, CartesianGrid, LabelList, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
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
export function BarrasHorizontais({ dados, altura }: { dados: { nome: string; valor: number }[]; altura?: number }) {
  const ordenados = [...dados].filter((d) => d.valor > 0).sort((a, b) => b.valor - a.valor);
  if (!ordenados.length) return <p className="py-6 text-center text-xs text-muted-foreground">Sem valores para exibir.</p>;
  const h = altura ?? Math.max(120, ordenados.length * 40 + 20);
  return (
    <div style={{ height: h }}>
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
export function GraficoFuturo({ serie }: { serie: { ano: number; idade: number; atual: number; necessaria: number }[] }) {
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
          <Area type="monotone" dataKey="atual" name="Investindo a sobra atual" stroke="var(--serie-2)" strokeWidth={2} fill="url(#gAtual)" dot={false} isAnimationActive={false} />
          <Area type="monotone" dataKey="necessaria" name="Trajetória necessária" stroke="var(--serie-1)" strokeWidth={2} fill="url(#gNec)" dot={false} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
