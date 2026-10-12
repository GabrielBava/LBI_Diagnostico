// 6.5 · Futuro: independência financeira (entradas e resultado).
import { CAMPOS_FUTURO } from "@/config/campos";
import { Formulario } from "@/components/campos";
import { GraficoFuturo } from "@/components/graficos";
import { BarraProgresso, Kpi } from "@/components/ui";
import { useCliente } from "@/lib/cliente-context";
import { futuro, s, TAXA_RETIRADA } from "@/lib/calculos";
import { fmtBRL, fmtPct } from "@/lib/format";

export default function Futuro() {
  const { cliente, setCampo } = useCliente();
  const fu = futuro(cliente);
  const semIdade = !s(cliente.cadastro.nascimento);

  return (
    <div className="space-y-4">
      <Formulario
        campos={CAMPOS_FUTURO}
        dados={cliente.futuro}
        cliente={cliente}
        colunas={3}
        onChange={(k, v) => setCampo("futuro", k, v)}
        automaticos={{ rendaDesejada: fu.rendaDesejadaAuto || undefined, outrasRendas: fu.outrasAuto || undefined }}
      />

      {semIdade ? (
        <p className="text-sm text-warning">Informe a data de nascimento no Cadastro para projetar o futuro.</p>
      ) : (
        <>
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-primary">Independência financeira</div>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-3">
              <span className="text-4xl font-bold tabular-nums">{fmtPct(Math.min(fu.independencia, 9.99))}</span>
              <span className="text-sm text-muted-foreground">
                da meta atingida aos {fu.idadeAposentadoria} anos ({fu.anos} anos a partir de hoje)
              </span>
            </div>
            <BarraProgresso valor={fu.independencia * 100} className="mt-3 h-2" />
            <p className="mt-3 text-sm">
              Investindo a sobra atual de <strong>{fmtBRL(fu.aporteAtual)}/mês</strong>, o patrimônio chega a{" "}
              <strong>{fmtBRL(fu.projetado)}</strong> e gera cerca de <strong>{fmtBRL(fu.rendaProjetada)}/mês</strong>, para uma
              renda desejada de {fmtBRL(fu.rendaDesejada)}/mês.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi tom="ouro" rotulo={`Patrimônio necessário (${Math.round(1 / TAXA_RETIRADA)}x)`} valor={fmtBRL(fu.alvo)} />
            <Kpi rotulo="Patrimônio financeiro hoje" valor={fmtBRL(fu.atual)} />
            <Kpi rotulo="Aporte necessário" valor={fmtBRL(fu.aporte)} sufixo="/mês" tom={fu.aporte > fu.aporteAtual ? "alerta" : "sucesso"} />
            <Kpi rotulo="Renda projetada" valor={fmtBRL(fu.rendaProjetada)} sufixo="/mês" />
          </div>
          {fu.anos > 0 && <GraficoFuturo serie={fu.serie} />}
          <p className="text-[11px] text-muted-foreground">Valores reais (R$ de hoje), retorno real definido nos parâmetros e retirada de 4% ao ano.</p>
        </>
      )}
    </div>
  );
}
