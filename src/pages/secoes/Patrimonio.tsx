import { CAMPOS_IMOVEL, CAMPOS_MOVEL } from "@/config/campos";
import { ListaItens } from "@/components/ListaEditor";
import { Kpi, SubBloco } from "@/components/ui";
import { useCliente } from "@/lib/cliente-context";
import { patrimonio, s } from "@/lib/calculos";
import { fmtBRL } from "@/lib/format";

export default function Patrimonio() {
  const { cliente, setLista } = useCliente();
  const p = patrimonio(cliente);
  const naoQuitados = [...cliente.imoveis, ...cliente.moveis].filter((x) => x.quitado !== true).length;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi tom="ouro" rotulo="Imóveis + móveis" valor={fmtBRL(p.imoveis + p.moveis)} />
        <Kpi rotulo="Bens não quitados" valor={naoQuitados} />
        <Kpi rotulo="Móveis sem seguro" valor={cliente.moveis.filter((m) => m.temSeguro !== true).length} />
      </div>
      <SubBloco titulo="Imóveis" total={fmtBRL(p.imoveis)}>
        <ListaItens
          campos={CAMPOS_IMOVEL}
          itens={cliente.imoveis}
          onChange={(i) => setLista("imoveis", i)}
          textoAdicionar="Adicionar imóvel"
          tituloItem={(x, i) => `${s(x.tipo) || "Imóvel"} ${i + 1}${s(x.categoria) ? ` · ${s(x.categoria)}` : ""}`}
        />
      </SubBloco>
      <SubBloco titulo="Móveis · veículos e embarcações" total={fmtBRL(p.moveis)}>
        <ListaItens
          campos={CAMPOS_MOVEL}
          itens={cliente.moveis}
          onChange={(i) => setLista("moveis", i)}
          textoAdicionar="Adicionar bem móvel"
          tituloItem={(x, i) => s(x.nome) || `${s(x.tipo) || "Bem"} ${i + 1}`}
        />
      </SubBloco>
    </div>
  );
}
