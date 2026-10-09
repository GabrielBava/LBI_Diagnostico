import { LISTAS } from "@/config/campos";
import { ListaEditor } from "@/components/ListaEditor";
import { Kpi } from "@/components/ui";
import { useCliente } from "@/lib/cliente-context";
import { educacao, educacaoTotal, n } from "@/lib/calculos";
import { fmtBRL } from "@/lib/format";

export default function Filhos() {
  const { cliente, setLista } = useCliente();
  const ed = educacaoTotal(cliente);
  const escolaMensal = cliente.filhos.reduce((t, f) => t + n(f.mensalidadeEscola), 0);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi tom="ouro" rotulo="Custo futuro da faculdade" valor={fmtBRL(ed.custoFuturoTotal)} detalhe="Corrigido pela inflação educacional" />
        <Kpi rotulo="Aporte mensal p/ educação" valor={fmtBRL(ed.aporteTotal)} sufixo="/mês" />
        <Kpi rotulo="Mensalidades escolares hoje" valor={fmtBRL(escolaMensal)} sufixo="/mês" detalhe="Lance também em Despesas (tipo Educação)" />
      </div>
      <ListaEditor
        def={LISTAS.filhos}
        itens={cliente.filhos}
        onChange={(i) => setLista("filhos", i)}
        extras={[
          { label: "Anos até ingresso", render: (f) => educacao(cliente, f).anosAte },
          { label: "Aporte mensal", render: (f) => fmtBRL(educacao(cliente, f).aporte) },
        ]}
      />
    </div>
  );
}
