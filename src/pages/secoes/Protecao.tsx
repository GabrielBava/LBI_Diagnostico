// 11 · Proteção: reserva de emergência, seguros (com o campo fumante) e previdência (PGBL/VGBL).
// O cálculo do que contratar (educacional, padrão de vida e sucessão) fica em 6.3 · Plano potencial.
import { CircleCheck, TriangleAlert } from "lucide-react";
import { CAMPOS_PROTECAO } from "@/config/campos";
import { Formulario } from "@/components/campos";
import { Kpi, SubBloco } from "@/components/ui";
import { useCliente } from "@/lib/cliente-context";
import { despesas, nOpt, reservaEmergencia, sim } from "@/lib/calculos";
import { fmtBRL } from "@/lib/format";

const fmtMeses = (v: number) => v.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
const meses = (v: number) => `${fmtMeses(v)} ${Math.abs(v - 1) < 0.05 ? "mês" : "meses"}`;

/** Quadro da reserva: quantos meses de despesas ela cobre e a comparação com a meta. */
function QuadroReserva() {
  const { cliente } = useCliente();
  const r = reservaEmergencia(cliente);
  const custo = despesas(cliente).total;
  const estimativa = nOpt(cliente.protecao.mesesReserva);
  const atingiu = r.meses >= r.mesesMeta;
  const diferente = estimativa !== undefined && Math.abs(estimativa - r.meses) >= 0.5;
  const Icone = atingiu ? CircleCheck : TriangleAlert;

  if (r.atual <= 0)
    return (
      <SubBloco titulo="Reserva de emergência">
        <p className="text-sm text-muted-foreground">Informe o valor da reserva para calcular quantos meses de despesas ela cobre.</p>
      </SubBloco>
    );

  return (
    <SubBloco titulo="Reserva de emergência">
      <p className="text-sm">
        Pelas despesas informadas (<strong className="tabular-nums">{fmtBRL(custo)}/mês</strong>), a reserva cobre{" "}
        <strong className="tabular-nums">{meses(r.meses)}</strong>.
        {estimativa !== undefined && diferente && <span className="text-muted-foreground"> O cliente estima {meses(estimativa)}.</span>}
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Kpi rotulo="Reserva informada" valor={fmtBRL(r.atual)} />
        <Kpi
          rotulo="Cobertura"
          valor={fmtMeses(r.meses)}
          sufixo={Math.abs(r.meses - 1) < 0.05 ? "mês" : "meses"}
          tom={atingiu ? "sucesso" : "alerta"}
          detalhe={
            <span className="inline-flex items-center gap-1">
              <Icone className={`h-3.5 w-3.5 shrink-0 ${atingiu ? "text-success" : "text-warning"}`} aria-hidden="true" />
              {atingiu ? "Dentro da meta" : "Abaixo da meta"} de {meses(r.mesesMeta)}
            </span>
          }
        />
        <Kpi
          rotulo={atingiu ? "Meta da reserva" : "Falta para a meta"}
          valor={fmtBRL(atingiu ? r.meta : r.falta)}
          detalhe={atingiu ? `${meses(r.mesesMeta)} de despesas` : `Meta: ${fmtBRL(r.meta)} (${meses(r.mesesMeta)})`}
        />
      </div>
    </SubBloco>
  );
}

export default function Protecao() {
  const { cliente, setCampo } = useCliente();
  const mostrarReserva = sim(cliente.protecao.temReserva) && despesas(cliente).total > 0;

  return (
    <div className="space-y-4">
      <Formulario campos={CAMPOS_PROTECAO} dados={cliente.protecao} cliente={cliente} onChange={(k, v) => setCampo("protecao", k, v)} />
      {mostrarReserva && <QuadroReserva />}
    </div>
  );
}
