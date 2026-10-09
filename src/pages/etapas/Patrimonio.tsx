import { LISTAS } from "@/config/campos";
import { ListaEditor } from "@/components/ListaEditor";
import { BarrasHorizontais } from "@/components/graficos";
import { Cartao, Kpi } from "@/components/ui";
import { useCliente } from "@/lib/cliente-context";
import { patrimonio, reservaEmergencia } from "@/lib/calculos";
import { fmtBRL } from "@/lib/format";

export default function Patrimonio() {
  const { cliente, setLista } = useCliente();
  const p = patrimonio(cliente);
  const r = reservaEmergencia(cliente);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi tom="ouro" rotulo="Patrimônio total" valor={fmtBRL(p.total)} />
        <Kpi rotulo="Patrimônio financeiro" valor={fmtBRL(p.financeiro)} />
        <Kpi
          rotulo="Reserva disponível"
          valor={fmtBRL(r.atual)}
          tom={r.meta > 0 && r.falta > 0 ? "alerta" : r.meta > 0 ? "sucesso" : "neutro"}
          detalhe={
            r.meta > 0
              ? `${r.meses.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} de ${r.mesesMeta} meses de custo de vida`
              : "Liquidez diária ou até 30 dias"
          }
        />
        <Kpi rotulo="Para aposentadoria" valor={fmtBRL(p.paraAposentadoria)} detalhe="Renda fixa + variável + previdência" />
      </div>
      <ListaEditor def={LISTAS.patrimonio} itens={cliente.patrimonio} onChange={(i) => setLista("patrimonio", i)} />
      {cliente.patrimonio.length > 0 && (
        <Cartao titulo="Composição do patrimônio">
          <BarrasHorizontais dados={Object.entries(p.porTipo).map(([nome, valor]) => ({ nome, valor }))} />
        </Cartao>
      )}
    </div>
  );
}
