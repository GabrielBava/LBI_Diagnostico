// Gráficos reutilizáveis (Recharts). Cores vêm de --serie-1/--serie-2 em index.css.
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fmtBRL, fmtCompacto } from "@/lib/format";

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
