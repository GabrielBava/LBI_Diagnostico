import { CAMPOS_CONSORCIO, CAMPOS_EMPRESTIMO, CAMPOS_FINANCIAMENTO } from "@/config/campos";
import { ListaItens } from "@/components/ListaEditor";
import { Kpi, SubBloco } from "@/components/ui";
import { useCliente } from "@/lib/cliente-context";
import { dividas, fluxo, parametros, s } from "@/lib/calculos";
import { fmtBRL, fmtPct } from "@/lib/format";

export default function Dividas() {
  const { cliente, setLista } = useCliente();
  const dv = dividas(cliente);
  const f = fluxo(cliente);
  const { limite } = parametros(cliente.parametros);
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi tom="ouro" rotulo="Parcelas mensais" valor={fmtBRL(dv.parcelas)} detalhe="Entram em Despesas · Financiamento/Dívidas" />
        <Kpi rotulo="Saldo devedor" valor={fmtBRL(dv.passivos)} detalhe="Financiamentos + empréstimos" />
        <Kpi
          rotulo="Comprometimento da renda"
          valor={f.renda > 0 ? fmtPct(f.comprometimento) : "—"}
          tom={f.renda > 0 && f.comprometimento > limite ? "perigo" : "neutro"}
          detalhe={`Limite saudável: ${fmtPct(limite)}`}
        />
      </div>
      <SubBloco titulo="Financiamentos" total={dv.parcelasFin ? `${fmtBRL(dv.parcelasFin)}/mês` : undefined}>
        <ListaItens
          campos={CAMPOS_FINANCIAMENTO}
          itens={cliente.financiamentos}
          onChange={(i) => setLista("financiamentos", i)}
          textoAdicionar="Adicionar financiamento"
          tituloItem={(x, i) => `Financiamento ${s(x.tipo).toLowerCase() || i + 1}`}
        />
      </SubBloco>
      <SubBloco titulo="Consórcios" total={dv.parcelasCons ? `${fmtBRL(dv.parcelasCons)}/mês` : undefined}>
        <ListaItens
          campos={CAMPOS_CONSORCIO}
          itens={cliente.consorcios}
          onChange={(i) => setLista("consorcios", i)}
          textoAdicionar="Adicionar consórcio"
          tituloItem={(x, i) => `Consórcio ${s(x.tipo).toLowerCase() || i + 1}`}
        />
      </SubBloco>
      <SubBloco titulo="Dívidas e empréstimos" total={dv.parcelasEmp ? `${fmtBRL(dv.parcelasEmp)}/mês` : undefined}>
        <ListaItens
          campos={CAMPOS_EMPRESTIMO}
          itens={cliente.emprestimos}
          onChange={(i) => setLista("emprestimos", i)}
          textoAdicionar="Adicionar dívida ou empréstimo"
          colunas={3}
          tituloItem={(x, i) => s(x.instituicao) || `Dívida ${i + 1}`}
        />
      </SubBloco>
    </div>
  );
}
