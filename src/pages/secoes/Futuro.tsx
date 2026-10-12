// 6.5 · Futuro: independência financeira (resultado).
// As premissas (idade, estilo, rendas) são preenchidas em 12 · Futuro.
import { GraficoFuturo } from "@/components/graficos";
import { BarraProgresso, Botao, Kpi } from "@/components/ui";
import { useCliente } from "@/lib/cliente-context";
import { usePreferencias } from "@/lib/preferencias";
import { futuro, nOpt, s, TAXA_RETIRADA } from "@/lib/calculos";
import { fmtBRL, fmtPct } from "@/lib/format";

export default function Futuro() {
  const { cliente, irPara } = useCliente();
  const { apresentacao } = usePreferencias();
  const fu = futuro(cliente);
  const semIdade = !s(cliente.cadastro.nascimento);
  const rendaAuto = nOpt(cliente.futuro.rendaDesejada) === undefined;
  const outrasAuto = nOpt(cliente.futuro.outrasRendas) === undefined;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 rounded-xl border border-border bg-secondary/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="min-w-0 text-sm text-muted-foreground">
          <span>
            Aposentadoria aos <strong className="text-foreground">{fu.idadeAposentadoria} anos</strong>
          </span>
          <span aria-hidden="true"> · </span>
          <span>
            estilo <strong className="text-foreground">{fu.estilo ? fu.estilo.toLowerCase() : "não definido"}</strong>
          </span>
          <span aria-hidden="true"> · </span>
          <span>
            renda desejada <strong className="tabular-nums text-foreground">{fmtBRL(fu.rendaDesejada)}/mês</strong>
            {rendaAuto && " (sugerida)"}
          </span>
          <span aria-hidden="true"> · </span>
          <span>
            outras rendas <strong className="tabular-nums text-foreground">{fmtBRL(fu.outras)}/mês</strong>
            {outrasAuto && fu.outras > 0 && " (renda passiva atual)"}
          </span>
        </p>
        {!apresentacao && (
          <Botao pequeno variante="fantasma" className="no-print -ml-3 shrink-0 self-start sm:ml-0 sm:self-auto" onClick={() => irPara("aposentadoria")}>
            Editar premissas
          </Botao>
        )}
      </div>

      {semIdade ? (
        <p className="text-sm text-warning">Informe a data de nascimento no Cadastro para projetar o futuro.</p>
      ) : fu.rendaDesejada <= 0 ? (
        <p className="text-sm text-warning">Preencha as despesas ou a renda desejada (12 · Futuro) para projetar a independência financeira.</p>
      ) : fu.idadeAtingida ? (
        <div className="rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm">
          <p>
            A idade de aposentadoria ({fu.idadeAposentadoria} anos) já foi atingida: o cliente tem {fu.idadeAtual} anos. Ajuste a idade em 12 ·
            Futuro para projetar os aportes.
          </p>
          <p className="mt-2">
            Hoje o patrimônio financeiro é de <strong>{fmtBRL(fu.atual)}</strong> para uma meta de <strong>{fmtBRL(fu.alvo)}</strong>
            {fu.faltaHoje > 0 ? (
              <>
                {" "}
                — faltam <strong>{fmtBRL(fu.faltaHoje)}</strong>.
              </>
            ) : (
              " — meta já atingida."
            )}
          </p>
        </div>
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
