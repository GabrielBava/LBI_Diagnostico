// Faixa fixa com os números principais, atualizada a cada campo preenchido.
import type { Cliente } from "@/types";
import { fluxo, objetivos, patrimonio } from "@/lib/calculos";
import { fmtBRL, fmtPct } from "@/lib/format";

export function ResumoVivo({ cliente }: { cliente: Cliente }) {
  const f = fluxo(cliente);
  const p = patrimonio(cliente);
  const ob = objetivos(cliente);
  const itens = [
    { rotulo: "Renda", valor: fmtBRL(f.renda) },
    { rotulo: "Despesas", valor: fmtBRL(f.despesas) },
    {
      rotulo: "Sobra",
      valor: fmtBRL(f.sobra),
      detalhe: f.renda > 0 ? fmtPct(f.taxaPoupanca) : undefined,
      tom: f.renda > 0 ? (f.sobra < 0 ? "text-destructive" : f.taxaPoupanca >= 0.2 ? "text-success" : "text-warning") : "",
    },
    { rotulo: "Patrimônio líquido", valor: fmtBRL(p.liquido) },
    { rotulo: "Objetivos", valor: `${fmtBRL(ob.aporteTotal)}/mês`, detalhe: `${cliente.objetivos.length}` },
  ];
  return (
    <div className="no-print sticky top-14 z-20 -mx-4 -mt-6 border-b border-border bg-background/90 px-4 py-2 backdrop-blur md:-mx-8 md:-mt-8 md:px-8">
      <div className="mx-auto flex max-w-7xl items-center gap-5 overflow-x-auto">
        <span className="hidden shrink-0 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary lg:inline">Pré-diagnóstico ao vivo</span>
        {itens.map((i) => (
          <div key={i.rotulo} className="shrink-0 leading-tight">
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground">{i.rotulo}</div>
            <div className={`text-sm font-semibold tabular-nums ${i.tom ?? ""}`}>
              {i.valor}
              {i.detalhe && <span className="ml-1 text-[10px] font-medium text-muted-foreground">({i.detalhe})</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
