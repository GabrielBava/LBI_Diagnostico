import { LISTAS } from "@/config/campos";
import { ListaEditor } from "@/components/ListaEditor";
import { BarrasHorizontais } from "@/components/graficos";
import { Cartao, Kpi } from "@/components/ui";
import { useCliente } from "@/lib/cliente-context";
import { fluxo } from "@/lib/calculos";
import { fmtBRL, fmtPct } from "@/lib/format";

export default function Despesas() {
  const { cliente, setLista } = useCliente();
  const f = fluxo(cliente);
  const sobraAntesDividas = f.renda - f.despesas;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi tom="ouro" rotulo="Custo de vida" valor={fmtBRL(f.despesas)} sufixo="/mês" />
        <Kpi
          rotulo="Despesas / renda"
          valor={f.renda > 0 ? fmtPct(f.despesas / f.renda) : "—"}
          tom={f.renda > 0 && f.despesas / f.renda > 0.8 ? "alerta" : "neutro"}
        />
        <Kpi
          rotulo="Sobra antes das dívidas"
          valor={fmtBRL(sobraAntesDividas)}
          sufixo="/mês"
          tom={f.renda > 0 && sobraAntesDividas < 0 ? "perigo" : "neutro"}
        />
      </div>
      <ListaEditor
        def={LISTAS.despesas}
        itens={cliente.despesas}
        onChange={(i) => setLista("despesas", i)}
        subtitulo="Parcelas de empréstimos e financiamentos vão na etapa Dívidas (evita contar duas vezes)."
      />
      {cliente.despesas.length > 0 && (
        <Cartao titulo="Para onde vai o dinheiro" subtitulo="Despesas mensais por tipo">
          <BarrasHorizontais dados={Object.entries(f.despesasPorTipo).map(([nome, valor]) => ({ nome, valor }))} />
        </Cartao>
      )}
    </div>
  );
}
