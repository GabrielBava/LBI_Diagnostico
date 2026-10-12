// 13 · Investimentos: conhecimento, perfil, temas já estudados e onde investe.
import { BookOpen } from "lucide-react";
import { CAMPOS_INVESTIMENTOS } from "@/config/campos";
import { Formulario } from "@/components/campos";
import { Kpi } from "@/components/ui";
import { useCliente } from "@/lib/cliente-context";
import { lista, patrimonio, sim } from "@/lib/calculos";
import { fmtBRL } from "@/lib/format";

export default function Investimentos() {
  const { cliente, setCampo } = useCliente();
  const p = patrimonio(cliente);
  const marcados = lista(cliente.investimentos.temas);
  const temas = marcados.filter((t) => t !== "Nenhum");
  const nenhum = marcados.includes("Nenhum");

  return (
    <div className="space-y-4">
      <Formulario campos={CAMPOS_INVESTIMENTOS} dados={cliente.investimentos} cliente={cliente} onChange={(k, v) => setCampo("investimentos", k, v)} />
      {(temas.length > 0 || nenhum) && (
        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
          <span className="min-w-0">
            {nenhum ? (
              "Ainda não estudou nenhum tema: boa oportunidade de educação financeira."
            ) : (
              <>
                Já estudou <strong className="text-foreground">{temas.length === 1 ? "1 tema" : `${temas.length} temas`}</strong>: {temas.join(", ")}.
              </>
            )}
          </span>
        </p>
      )}
      {sim(cliente.investimentos.temInvestimento) && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Kpi tom="ouro" rotulo="Investimentos" valor={fmtBRL(p.investimentos)} />
          <Kpi rotulo="Reserva de emergência" valor={fmtBRL(p.reserva)} detalhe="Informada em 11 · Proteção" />
          <Kpi rotulo="Previdência" valor={fmtBRL(p.previdencia)} detalhe="Informada em 11 · Proteção" />
        </div>
      )}
    </div>
  );
}
