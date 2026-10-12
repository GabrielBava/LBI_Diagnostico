import { CAMPOS_DEPENDENTE } from "@/config/campos";
import { ListaItens } from "@/components/ListaEditor";
import { Kpi } from "@/components/ui";
import { useCliente } from "@/lib/cliente-context";
import { custoDependente, s, sucessao } from "@/lib/calculos";
import { fmtBRL } from "@/lib/format";

export default function Sucessao() {
  const { cliente, setLista } = useCliente();
  const su = sucessao(cliente);
  const semFilhos = s(cliente.cadastro.temFilhos) === "Não";

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi tom="ouro" rotulo="Filhos" valor={su.filhos} detalhe={semFilhos ? "Informado no cadastro: não tem filhos" : "Vem do cadastro"} />
        <Kpi rotulo="Dependentes no total" valor={su.dependentes} />
        <Kpi rotulo="Custo mensal" valor={fmtBRL(su.custoMensal)} sufixo="/mês" detalhe="Entra nas despesas fixas automaticamente" />
      </div>
      <ListaItens
        campos={CAMPOS_DEPENDENTE}
        itens={cliente.dependentes}
        onChange={(i) => setLista("dependentes", i)}
        textoAdicionar="Adicionar dependente"
        vazio={semFilhos ? "Sem filhos. Adicione outros dependentes, se houver (pais, enteados…)." : undefined}
        colunas={3}
        tituloItem={(d, i) => (
          <span className="text-sm font-semibold text-foreground">
            {s(d.nome) || `${s(d.categoria) || "Dependente"} ${i + 1}`}
            {s(d.nome) && <span className="ml-2 text-xs font-normal text-muted-foreground">{s(d.categoria)}</span>}
          </span>
        )}
        rodapeItem={(d) => <>Custo mensal: <strong className="text-foreground">{fmtBRL(custoDependente(d))}</strong></>}
      />
    </div>
  );
}
