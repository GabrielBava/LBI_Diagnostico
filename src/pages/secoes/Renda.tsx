import { CAMPOS_OUTRA_RENDA, CAMPOS_RENDA } from "@/config/campos";
import { Formulario } from "@/components/campos";
import { ListaItens } from "@/components/ListaEditor";
import { Kpi, SubBloco } from "@/components/ui";
import { useCliente } from "@/lib/cliente-context";
import { mensal, renda } from "@/lib/calculos";
import { fmtBRL } from "@/lib/format";

export default function Renda() {
  const { cliente, setCampo, setLista } = useCliente();
  const r = renda(cliente);
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi tom="ouro" rotulo="Renda familiar mensal" valor={fmtBRL(r.total)} detalhe="Anuais divididas por 12" />
        <Kpi rotulo="Renda anual" valor={fmtBRL(r.total * 12)} />
        <Kpi rotulo="Renda passiva" valor={fmtBRL(r.passiva)} sufixo="/mês" detalhe="Aluguéis, dividendos, pensões" />
      </div>
      <SubBloco titulo="Renda">
        <Formulario campos={CAMPOS_RENDA} dados={cliente.renda} cliente={cliente} colunas={2} onChange={(k, v) => setCampo("renda", k, v)} />
      </SubBloco>
      <SubBloco titulo="Outras fontes" total={r.outras > 0 ? `${fmtBRL(r.outras)}/mês` : undefined}>
        <ListaItens
          campos={CAMPOS_OUTRA_RENDA}
          itens={cliente.outrasRendas}
          onChange={(i) => setLista("outrasRendas", i)}
          textoAdicionar="Adicionar fonte de renda"
          tituloItem={(_, i) => `Fonte ${i + 1}`}
          rodapeItem={(i) => <>Equivalente mensal: <strong className="text-foreground">{fmtBRL(mensal(i))}</strong></>}
        />
      </SubBloco>
    </div>
  );
}
