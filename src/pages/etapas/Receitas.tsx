import { LISTAS } from "@/config/campos";
import { ListaEditor } from "@/components/ListaEditor";
import { Kpi } from "@/components/ui";
import { useCliente } from "@/lib/cliente-context";
import { fluxo, mensal } from "@/lib/calculos";
import { fmtBRL, fmtPct } from "@/lib/format";

export default function Receitas() {
  const { cliente, setLista } = useCliente();
  const f = fluxo(cliente);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi tom="ouro" rotulo="Renda mensal média" valor={fmtBRL(f.renda)} sufixo="/mês" detalhe="Rendas anuais divididas por 12" />
        <Kpi rotulo="Renda anual" valor={fmtBRL(f.renda * 12)} />
        <Kpi
          rotulo="Renda passiva"
          valor={fmtBRL(f.rendaPassiva)}
          sufixo="/mês"
          detalhe={f.renda > 0 ? `${fmtPct(f.rendaPassiva / f.renda)} da renda` : undefined}
        />
      </div>
      <ListaEditor
        def={LISTAS.receitas}
        itens={cliente.receitas}
        onChange={(i) => setLista("receitas", i)}
        subtitulo="Sempre valores líquidos. 13º, férias, PLR e bônus entram como frequência Anual."
        extras={[{ label: "Equivalente mensal", render: (i) => fmtBRL(mensal(i)) }]}
      />
    </div>
  );
}
