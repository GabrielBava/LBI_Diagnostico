import { CAMPOS_PROTECAO } from "@/config/campos";
import { Formulario } from "@/components/campos";
import { BarraProgresso, Kpi, LinhaValor, SubBloco } from "@/components/ui";
import { useCliente } from "@/lib/cliente-context";
import { protecao } from "@/lib/calculos";
import { fmtBRL, fmtPct } from "@/lib/format";

export default function Protecao() {
  const { cliente, setCampo } = useCliente();
  const pr = protecao(cliente);
  return (
    <div className="space-y-4">
      <Formulario campos={CAMPOS_PROTECAO} dados={cliente.protecao} cliente={cliente} onChange={(k, v) => setCampo("protecao", k, v)} />
      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi tom="ouro" rotulo="Capital necessário" valor={fmtBRL(pr.necessario)} />
        <Kpi rotulo="Capital atual" valor={fmtBRL(pr.atual)} detalhe={`Cobertura de ${fmtPct(pr.cobertura)}`} />
        <Kpi
          rotulo="Gap de proteção"
          valor={fmtBRL(pr.gap)}
          tom={pr.gap > 0 ? "alerta" : pr.necessario > 0 ? "sucesso" : "neutro"}
          detalhe={pr.empresa > 0 ? `Seguro da empresa (${fmtBRL(pr.empresa)}) não entra na conta` : undefined}
        />
      </div>
      <SubBloco titulo="Como chegamos ao capital necessário">
        <div className="divide-y divide-border">
          <LinhaValor rotulo={`Manutenção do padrão de vida por ${pr.anos} anos (descontadas renda do cônjuge e passiva)`} valor={fmtBRL(pr.componentes.manutencao)} />
          <LinhaValor rotulo="Quitação de financiamentos e dívidas" valor={fmtBRL(pr.componentes.quitacao)} />
          <LinhaValor rotulo="Custos de inventário e sucessão" valor={fmtBRL(pr.componentes.inventario)} />
          <LinhaValor rotulo="(−) Investimentos e previdência já disponíveis" valor={`− ${fmtBRL(pr.recursos)}`} />
          <LinhaValor rotulo="Capital segurado necessário" valor={fmtBRL(pr.necessario)} forte />
        </div>
        <BarraProgresso valor={pr.cobertura * 100} className="mt-3" />
      </SubBloco>
    </div>
  );
}
