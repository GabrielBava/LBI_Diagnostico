// 6.1 · Panorama financeiro: nota LIFE, pilares e palavras do cliente.
import { CircleCheck, CircleMinus, CircleX, Quote, TriangleAlert } from "lucide-react";
import { Kpi, Selo, corStatus, textoStatus } from "@/components/ui";
import { useCliente } from "@/lib/cliente-context";
import { fluxo, n, patrimonio, s } from "@/lib/calculos";
import { notaGeral, pilares, type Status } from "@/lib/diagnostico";
import { fmtBRL, fmtPct } from "@/lib/format";

export const iconeStatus: Record<Status, typeof CircleCheck> = {
  ok: CircleCheck,
  atencao: TriangleAlert,
  critico: CircleX,
  "sem-dados": CircleMinus,
};

const secaoDoPilar: Record<string, string> = {
  fluxo: "despesas",
  reserva: "investimentos",
  dividas: "dividas",
  protecao: "protecao",
  futuro: "futuro",
  objetivos: "objetivos",
};

export default function Panorama() {
  const { cliente, irPara } = useCliente();
  const ps = pilares(cliente);
  const nota = notaGeral(ps);
  const f = fluxo(cliente);
  const p = patrimonio(cliente);
  const motivacao = s(cliente.cadastro.motivacao);
  const motivos = cliente.objetivos.filter((o) => s(o.motivo)).slice(0, 3);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="rounded-xl bg-gold p-5 text-primary-foreground">
          <div className="text-[10px] font-semibold uppercase tracking-widest opacity-80">Nota LIFE</div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-5xl font-bold tabular-nums">{nota}</span>
            <span className="text-sm opacity-80">/ 100</span>
          </div>
          <p className="mt-2 text-xs opacity-90">Média dos pilares com dados preenchidos.</p>
        </div>
        <div className="rounded-xl border border-border p-5 lg:col-span-2">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            <Quote className="h-3.5 w-3.5 text-primary" /> Nas palavras do cliente
          </div>
          {motivacao || motivos.length ? (
            <div className="mt-2 space-y-1.5">
              {motivacao && <p className="text-base italic">“{motivacao}”</p>}
              {motivos.map((o) => (
                <p key={o.id} className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{s(o.titulo)}:</span> “{s(o.motivo)}”
                </p>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">Registre a motivação no Institucional e o “porquê” de cada objetivo.</p>
          )}
          {s(cliente.cadastro.satisfacao) !== "" && (
            <p className="mt-2 text-xs text-muted-foreground">Satisfação financeira declarada: {n(cliente.cadastro.satisfacao)}/10</p>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi rotulo="Renda mensal" valor={fmtBRL(f.renda)} />
        <Kpi rotulo="Despesas mensais" valor={fmtBRL(f.despesas)} />
        <Kpi rotulo="Sobra" valor={fmtBRL(f.sobra)} tom={f.sobra < 0 ? "perigo" : "neutro"} detalhe={f.renda > 0 ? fmtPct(f.taxaPoupanca) : undefined} />
        <Kpi rotulo="Patrimônio líquido" valor={fmtBRL(p.liquido)} />
      </div>

      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {ps.map((x) => {
          const I = iconeStatus[x.status];
          return (
            <button
              key={x.id}
              type="button"
              onClick={() => irPara(secaoDoPilar[x.id])}
              className="rounded-lg border border-border bg-secondary/30 p-3 text-left transition hover:border-primary/50"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold">{x.nome}</span>
                <Selo className={`gap-1 ${corStatus[x.status]}`}>
                  <I className="h-3 w-3" /> {textoStatus[x.status]}
                </Selo>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-gold" style={{ width: `${x.status === "sem-dados" ? 0 : x.nota}%` }} />
                </div>
                <span className="w-8 text-right text-xs tabular-nums text-muted-foreground">{x.status === "sem-dados" ? "—" : x.nota}</span>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">{x.resumo}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
