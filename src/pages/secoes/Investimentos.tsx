import { CAMPOS_INVESTIMENTOS } from "@/config/campos";
import { Formulario } from "@/components/campos";
import { Kpi } from "@/components/ui";
import { useCliente } from "@/lib/cliente-context";
import { patrimonio, reservaEmergencia, sim } from "@/lib/calculos";
import { fmtBRL } from "@/lib/format";

export default function Investimentos() {
  const { cliente, setCampo } = useCliente();
  const p = patrimonio(cliente);
  const r = reservaEmergencia(cliente);
  return (
    <div className="space-y-4">
      <Formulario campos={CAMPOS_INVESTIMENTOS} dados={cliente.investimentos} cliente={cliente} onChange={(k, v) => setCampo("investimentos", k, v)} />
      {sim(cliente.investimentos.temInvestimento) && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Kpi tom="ouro" rotulo="Investimentos" valor={fmtBRL(p.investimentos)} />
          <Kpi
            rotulo="Reserva de emergência"
            valor={`${r.meses.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} meses`}
            tom={r.meta > 0 ? (r.falta > 0 ? "alerta" : "sucesso") : "neutro"}
            detalhe={r.meta > 0 ? `Meta: ${r.mesesMeta} meses (${fmtBRL(r.meta)})` : "Preencha as despesas"}
          />
          <Kpi rotulo="Previdência" valor={fmtBRL(p.previdencia)} detalhe="Informada em Proteção" />
        </div>
      )}
    </div>
  );
}
