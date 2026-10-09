import { CAMPOS_ALAVANCAGEM } from "@/config/campos";
import { Formulario } from "@/components/campos";
import { BarrasVerticais } from "@/components/graficos";
import { Cartao, Kpi } from "@/components/ui";
import { useCliente } from "@/lib/cliente-context";
import { alavancagem } from "@/lib/calculos";
import { fmtBRL } from "@/lib/format";

export default function Alavancagem() {
  const { cliente, setCampo } = useCliente();
  const al = alavancagem(cliente);

  return (
    <div className="space-y-5">
      <Cartao titulo="Cenário de aquisição">
        <Formulario campos={CAMPOS_ALAVANCAGEM} dados={cliente.alavancagem} onChange={(k, v) => setCampo("alavancagem", k, v)} />
      </Cartao>

      <Cartao
        titulo={`Comparativo — patrimônio em ${al.anos} anos`}
        subtitulo={`Mesmo orçamento mensal nas três estratégias (${fmtBRL(Math.max(al.parcelaFin, al.parcelaCons))}/mês); a diferença de parcela fica investida.`}
      >
        {al.valor > 0 && al.meses > 0 ? (
          <>
            <BarrasVerticais dados={al.comparativo} />
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                    <th className="py-2 font-medium">Estratégia</th>
                    <th className="py-2 font-medium">Quando usa o bem</th>
                    <th className="py-2 text-right font-medium">Parcela</th>
                    <th className="py-2 text-right font-medium">Total pago</th>
                    <th className="py-2 text-right font-medium">Patrimônio final</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="py-2">Poupar e comprar à vista</td>
                    <td className="py-2 text-muted-foreground">{al.comparativo[0].uso}</td>
                    <td className="py-2 text-right tabular-nums">{fmtBRL(Math.max(al.parcelaFin, al.parcelaCons))}</td>
                    <td className="py-2 text-right tabular-nums">{fmtBRL(Math.max(al.parcelaFin, al.parcelaCons) * al.meses)}</td>
                    <td className="py-2 text-right tabular-nums">{fmtBRL(al.comparativo[0].valor)}</td>
                  </tr>
                  <tr>
                    <td className="py-2">Financiamento bancário</td>
                    <td className="py-2 text-muted-foreground">{al.comparativo[1].uso}</td>
                    <td className="py-2 text-right tabular-nums">{fmtBRL(al.parcelaFin)}</td>
                    <td className="py-2 text-right tabular-nums">{fmtBRL(al.totalFin)}</td>
                    <td className="py-2 text-right tabular-nums">{fmtBRL(al.comparativo[1].valor)}</td>
                  </tr>
                  <tr>
                    <td className="py-2">Consórcio + investido</td>
                    <td className="py-2 text-muted-foreground">{al.comparativo[2].uso}</td>
                    <td className="py-2 text-right tabular-nums">{fmtBRL(al.parcelaCons)}</td>
                    <td className="py-2 text-right tabular-nums">{fmtBRL(al.totalCons)}</td>
                    <td className="py-2 text-right tabular-nums">{fmtBRL(al.comparativo[2].valor)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="py-6 text-center text-xs text-muted-foreground">Informe o valor do bem e o prazo para ver o comparativo.</p>
        )}
      </Cartao>

      <Cartao titulo="Consórcio estratégico">
        <div className="grid gap-3 md:grid-cols-3">
          <Kpi tom="ouro" rotulo="Carta ideal" valor={fmtBRL(al.valor)} />
          <Kpi
            tom={al.parcelaSaudavel === false ? "perigo" : "neutro"}
            rotulo="Parcela do consórcio"
            valor={fmtBRL(al.parcelaCons)}
            sufixo="/mês"
            detalhe={
              al.parcelaSaudavel === undefined
                ? "Informe as receitas para avaliar a capacidade"
                : al.parcelaSaudavel
                  ? `Saudável: cabe na capacidade de ${fmtBRL(al.capacidade)}/mês`
                  : `Acima da capacidade saudável de ${fmtBRL(al.capacidade)}/mês`
            }
          />
          <Kpi
            tom={al.economia > 0 ? "sucesso" : "neutro"}
            rotulo="Economia vs financiamento"
            valor={fmtBRL(al.economia)}
            detalhe={`Financiamento: ${fmtBRL(al.totalFin)} · Consórcio: ${fmtBRL(al.totalCons)}`}
          />
        </div>
      </Cartao>
    </div>
  );
}
