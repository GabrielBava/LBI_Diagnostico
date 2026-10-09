import { LISTAS } from "@/config/campos";
import { ListaEditor } from "@/components/ListaEditor";
import { Kpi } from "@/components/ui";
import { useCliente } from "@/lib/cliente-context";
import { fluxo, sonho, sonhos } from "@/lib/calculos";
import { fmtBRL } from "@/lib/format";

export default function Sonhos() {
  const { cliente, setLista } = useCliente();
  const so = sonhos(cliente);
  const f = fluxo(cliente);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi tom="ouro" rotulo="Sonhos registrados" valor={cliente.sonhos.length} />
        <Kpi rotulo="Valor total (hoje)" valor={fmtBRL(so.valorTotal)} />
        <Kpi
          tom={f.renda > 0 && so.aporteTotal > f.sobra ? "alerta" : "neutro"}
          rotulo="Aporte mensal necessário"
          valor={fmtBRL(so.aporteTotal)}
          sufixo="/mês"
          detalhe={f.renda > 0 ? `Sobra mensal atual: ${fmtBRL(f.sobra)}` : "Complete Receitas e Despesas para comparar"}
        />
      </div>
      <ListaEditor
        def={LISTAS.sonhos}
        itens={cliente.sonhos}
        onChange={(i) => setLista("sonhos", i)}
        subtitulo="Valores em R$ de hoje. O aporte considera o retorno real definido nos parâmetros."
        extras={[{ label: "Aporte mensal", render: (item) => fmtBRL(sonho(cliente, item).aporte) }]}
      />
    </div>
  );
}
