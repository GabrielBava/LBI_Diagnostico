// 6.6 · Matriz de oportunidades — ecossistema (cross-sell). Uso interno do consultor.
import { Check, Plus } from "lucide-react";
import { Selo } from "@/components/ui";
import { useCliente } from "@/lib/cliente-context";
import { s } from "@/lib/calculos";
import { QUADRANTES, oportunidades, type Oportunidade } from "@/lib/diagnostico";
import { uid } from "@/lib/format";

export const corPrioridade: Record<string, string> = {
  Alta: "text-destructive border-destructive/30 bg-destructive/10",
  Média: "text-warning border-warning/30 bg-warning/10",
  Baixa: "text-muted-foreground border-border bg-muted/40",
};

export default function Oportunidades() {
  const { cliente, setLista } = useCliente();
  const ops = oportunidades(cliente);
  const noPlano = new Set(cliente.plano.map((a) => s(a.origem)));
  const adicionar = (o: Oportunidade) =>
    setLista("plano", [
      ...cliente.plano,
      { id: uid(), origem: o.id, acao: `${o.titulo}: ${o.detalhe}`, area: o.quadrante, prioridade: o.prioridade, prazo: o.prazo, status: "Pendente" },
    ]);

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {QUADRANTES.map((q) => {
        const lista = ops.filter((o) => o.quadrante === q);
        return (
          <div key={q} className="rounded-xl border border-border bg-secondary/20 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">{q}</h3>
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-gold px-2 text-[11px] font-bold text-primary-foreground">
                {lista.length}
              </span>
            </div>
            {lista.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma oportunidade identificada.</p>}
            <ul className="space-y-2">
              {lista.map((o) => {
                const ja = noPlano.has(o.id);
                return (
                  <li key={o.id} className="rounded-lg border border-border bg-card p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold">{o.titulo}</div>
                        <p className="text-xs text-muted-foreground">{o.detalhe}</p>
                      </div>
                      <Selo className={corPrioridade[o.prioridade]}>{o.prioridade}</Selo>
                    </div>
                    <button
                      type="button"
                      disabled={ja}
                      onClick={() => adicionar(o)}
                      className="no-print mt-2 inline-flex h-8 items-center gap-1 rounded-md border border-primary/50 px-2.5 text-[11px] font-semibold text-primary hover:bg-primary/10 disabled:border-success/40 disabled:text-success"
                    >
                      {ja ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />} {ja ? "No plano" : "Levar ao plano"}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
