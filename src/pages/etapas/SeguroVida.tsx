import { CAMPOS_SEGURO } from "@/config/campos";
import { Formulario } from "@/components/campos";
import { BarraProgresso, Cartao, Kpi, LinhaValor } from "@/components/ui";
import { useCliente } from "@/lib/cliente-context";
import { n, seguroVida } from "@/lib/calculos";
import { fmtBRL, fmtPct } from "@/lib/format";

export default function SeguroVida() {
  const { cliente, setCampo } = useCliente();
  const sv = seguroVida(cliente);
  const anos = n(cliente.seguro.anosProtecao) || 5;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi tom="ouro" rotulo="Capital necessário" valor={fmtBRL(sv.necessario)} />
        <Kpi rotulo="Capital atual" valor={fmtBRL(sv.atual)} detalhe={`Cobertura de ${fmtPct(sv.cobertura)}`} />
        <Kpi
          rotulo="Gap de proteção"
          valor={fmtBRL(sv.gap)}
          tom={sv.gap > 0 ? "alerta" : "sucesso"}
          detalhe={sv.gap > 0 ? "Família descoberta neste valor" : "Família protegida"}
        />
      </div>

      <Cartao titulo="Situação atual da proteção">
        <Formulario campos={CAMPOS_SEGURO} dados={cliente.seguro} onChange={(k, v) => setCampo("seguro", k, v)} />
      </Cartao>

      <Cartao titulo="Como chegamos ao capital necessário" subtitulo="Se a renda do cliente faltasse hoje, quanto a família precisaria?">
        <div className="divide-y divide-border">
          <LinhaValor rotulo={`Manutenção do padrão de vida (${anos} anos, já descontada a renda passiva)`} valor={fmtBRL(sv.componentes.manutencao)} />
          <LinhaValor rotulo="Quitação das dívidas" valor={fmtBRL(sv.componentes.dividas)} />
          <LinhaValor rotulo="Educação dos filhos (valor presente)" valor={fmtBRL(sv.componentes.educacaoFilhos)} />
          <LinhaValor rotulo="Custos de inventário e sucessão" valor={fmtBRL(sv.componentes.inventario)} />
          <LinhaValor rotulo="Necessidade total" valor={fmtBRL(sv.necessidadeBruta)} forte />
          <LinhaValor rotulo="(−) Patrimônio financeiro já disponível" valor={`− ${fmtBRL(sv.recursos)}`} />
          <LinhaValor rotulo="Capital segurado necessário" valor={fmtBRL(sv.necessario)} forte />
        </div>
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>Cobertura atual</span>
            <span>{fmtPct(sv.cobertura)}</span>
          </div>
          <BarraProgresso valor={sv.cobertura * 100} />
        </div>
      </Cartao>
    </div>
  );
}
