// 6.5 · Futuro: simulador de independência financeira (sliders de aporte, rentabilidade,
// idade e renda), gráfico da vida inteira e plano de independência em 1, 5 e 10 anos.
// As premissas da coleta ficam em 12 · Futuro; a simulação é salva à parte (cliente.simulacao).
import { useEffect, useRef, useState } from "react";
import { Flag, RotateCcw, SlidersHorizontal } from "lucide-react";
import { GraficoSimulacao } from "@/components/graficos";
import { BarraProgresso, Botao, Kpi } from "@/components/ui";
import { useCliente } from "@/lib/cliente-context";
import { futuro, mudancasVida, n, nOpt, s, TAXA_RETIRADA, type SimulacaoFuturo } from "@/lib/calculos";
import { fmtBRL, fmtPct } from "@/lib/format";
import { usePreferencias } from "@/lib/preferencias";
import type { Secao } from "@/types";

type ChaveSim = "aporte" | "retornoReal" | "idadeAposentadoria" | "rendaDesejada";
const CHAVES: ChaveSim[] = ["aporte", "retornoReal", "idadeAposentadoria", "rendaDesejada"];

/** Simulação salva → parâmetros do cálculo (retorno salvo em % ao ano). */
const paraSimulacao = (x: Secao): SimulacaoFuturo => ({
  aporte: nOpt(x.aporte),
  retornoReal: nOpt(x.retornoReal) !== undefined ? n(x.retornoReal) / 100 : undefined,
  idadeAposentadoria: nOpt(x.idadeAposentadoria),
  rendaDesejada: nOpt(x.rendaDesejada),
});

const teto = (v: number, passo: number) => Math.ceil(v / passo) * passo;
const fmtRetorno = (v: number) => `${v.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 })}% a.a.`;

function Slider({
  rotulo,
  valor,
  base,
  min,
  max,
  passo,
  formatar,
  onChange,
}: {
  rotulo: string;
  valor: number;
  /** Valor da coleta (marcado na régua). */
  base: number;
  min: number;
  max: number;
  passo: number;
  formatar: (v: number) => string;
  onChange: (v: number) => void;
}) {
  const v = Math.min(max, Math.max(min, valor));
  const pct = ((v - min) / (max - min || 1)) * 100;
  const pctBase = ((Math.min(max, Math.max(min, base)) - min) / (max - min || 1)) * 100;
  const alterado = Math.abs(valor - base) > passo / 2;
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="min-w-0 text-xs font-medium text-muted-foreground">{rotulo}</span>
        <span className={`shrink-0 whitespace-nowrap text-sm font-semibold tabular-nums ${alterado ? "text-primary" : ""}`}>{formatar(valor)}</span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={passo}
          value={v}
          aria-label={rotulo}
          aria-valuetext={formatar(valor)}
          onChange={(e) => onChange(Number(e.target.value))}
          className="regua w-full"
          style={{ ["--pct" as string]: `${pct}%` }}
        />
        {/* Marca do valor da coleta */}
        {alterado && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-[calc(50%+7px)] h-2 w-0.5 -translate-x-1/2 rounded bg-[var(--serie-2)]"
            style={{ left: `${pctBase}%` }}
          />
        )}
      </div>
      <div className="mt-1 flex justify-between text-[10px] tabular-nums text-muted-foreground/80">
        <span>{formatar(min)}</span>
        {alterado && <span className="text-[var(--serie-2)]">coleta: {formatar(base)}</span>}
        <span>{formatar(max)}</span>
      </div>
    </div>
  );
}

export default function Futuro() {
  const { cliente, irPara, atualizar } = useCliente();
  const { apresentacao } = usePreferencias();
  const base = futuro(cliente);

  // Valores em edição ficam locais e são salvos com um pequeno atraso (arrastar não grava a cada passo).
  const [local, setLocal] = useState<Secao>(cliente.simulacao);
  const salvo = useRef(JSON.stringify(cliente.simulacao));
  useEffect(() => {
    const atual = JSON.stringify(cliente.simulacao);
    if (atual !== salvo.current) {
      salvo.current = atual;
      setLocal(cliente.simulacao);
    }
  }, [cliente.simulacao]);
  useEffect(() => {
    const texto = JSON.stringify(local);
    if (texto === salvo.current) return;
    const t = setTimeout(() => {
      salvo.current = texto;
      atualizar((c) => ({ ...c, simulacao: local }));
    }, 250);
    return () => clearTimeout(t);
  }, [local, atualizar]);

  const sim = futuro(cliente, paraSimulacao(local));
  const simulando = CHAVES.some((k) => nOpt(local[k]) !== undefined);
  const set = (k: ChaveSim, v: number) => setLocal((x) => ({ ...x, [k]: v }));
  const restaurar = () => setLocal({});

  const semIdade = !s(cliente.cadastro.nascimento);
  const rendaAuto = nOpt(cliente.futuro.rendaDesejada) === undefined;
  const mudancas = mudancasVida(cliente);
  const retornoBase = base.retornoReal * 100;

  // Faixas dos sliders: cobrem o valor atual, o necessário e uma folga.
  const maxAporte = teto(Math.max(10_000, base.aporteAtual * 2, base.aporte * 1.5, sim.aporteAtual), 1000);
  const maxRenda = teto(Math.max(20_000, base.rendaDesejada * 2, sim.rendaDesejada), 5000);
  const minIdade = Math.max(30, (base.idadeAtual || 29) + 1);
  const maxIdade = Math.max(80, minIdade + 5);
  const dura = sim.esgotaAos !== undefined ? `até os ${sim.esgotaAos} anos` : `além dos ${sim.vida[sim.vida.length - 1]?.idade ?? 95} anos`;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 rounded-xl border border-border bg-secondary/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="min-w-0 text-sm text-muted-foreground">
          <span>
            Dados da coleta: aposentadoria aos <strong className="text-foreground">{base.idadeAposentadoria} anos</strong>
          </span>
          <span aria-hidden="true"> · </span>
          <span>
            renda desejada <strong className="tabular-nums text-foreground">{fmtBRL(base.rendaDesejada)}/mês</strong>
            {rendaAuto && " (sugerida)"}
          </span>
          <span aria-hidden="true"> · </span>
          <span>
            investindo <strong className="tabular-nums text-foreground">{fmtBRL(base.aporteAtual)}/mês</strong>
            {!base.aporteInformado && " (sobra atual)"}
          </span>
          {base.outras > 0 && (
            <>
              <span aria-hidden="true"> · </span>
              <span>
                outras rendas <strong className="tabular-nums text-foreground">{fmtBRL(base.outras)}/mês</strong>
              </span>
            </>
          )}
        </p>
        {!apresentacao && (
          <Botao pequeno variante="fantasma" className="no-print -ml-3 shrink-0 self-start sm:ml-0 sm:self-auto" onClick={() => irPara("aposentadoria")}>
            Editar premissas
          </Botao>
        )}
      </div>

      {semIdade ? (
        <p className="text-sm text-warning">Informe a data de nascimento no Cadastro para simular o futuro.</p>
      ) : base.rendaDesejada <= 0 && !simulando ? (
        <p className="text-sm text-warning">Preencha as despesas ou a renda desejada (12 · Futuro) para simular a independência financeira.</p>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,19rem)_minmax(0,1fr)]">
            {/* Simulador */}
            <div className="rounded-xl border border-border bg-secondary/20 p-4">
              <div className="mb-4 flex items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-primary" aria-hidden="true" /> Simulação
                </h3>
                {/* Sempre na tela (desabilitado sem simulação): o foco do teclado não se perde ao clicar. */}
                <button
                  type="button"
                  onClick={restaurar}
                  disabled={!simulando}
                  className="no-print inline-flex h-7 items-center gap-1 rounded-md px-2 text-[11px] font-semibold text-muted-foreground enabled:hover:bg-muted enabled:hover:text-foreground disabled:opacity-40"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Voltar aos dados da coleta
                </button>
              </div>
              <div className="space-y-5">
                <Slider
                  rotulo="Investimento mensal"
                  valor={sim.aporteAtual}
                  base={base.aporteAtual}
                  min={0}
                  max={maxAporte}
                  passo={maxAporte > 20_000 ? 500 : 100}
                  formatar={(v) => fmtBRL(v)}
                  onChange={(v) => set("aporte", v)}
                />
                <Slider
                  rotulo="Rentabilidade real"
                  valor={sim.retornoReal * 100}
                  base={retornoBase}
                  min={0}
                  max={10}
                  passo={0.25}
                  formatar={fmtRetorno}
                  onChange={(v) => set("retornoReal", v)}
                />
                <Slider
                  rotulo="Idade de aposentadoria"
                  valor={sim.idadeAposentadoria}
                  base={base.idadeAposentadoria}
                  min={minIdade}
                  max={maxIdade}
                  passo={1}
                  formatar={(v) => `${v} anos`}
                  onChange={(v) => set("idadeAposentadoria", v)}
                />
                <Slider
                  rotulo="Renda desejada na aposentadoria"
                  valor={sim.rendaDesejada}
                  base={base.rendaDesejada}
                  min={500}
                  max={maxRenda}
                  passo={500}
                  formatar={(v) => fmtBRL(v)}
                  onChange={(v) => set("rendaDesejada", v)}
                />
              </div>
              <p className="mt-4 text-[11px] leading-snug text-muted-foreground">
                Valores em R$ de hoje; rentabilidade real é a que fica acima da inflação. Meta pela regra dos {fmtPct(TAXA_RETIRADA)}: {Math.round(1 / TAXA_RETIRADA)}× a renda anual que falta
                {sim.outras > 0 ? ` (descontadas outras rendas de ${fmtBRL(sim.outras)}/mês)` : ""}.
              </p>
            </div>

            {/* Resultado */}
            <div className="min-w-0 space-y-4">
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-primary">
                  Independência financeira {simulando && "· simulação"}
                </div>
                {sim.idadeAtingida ? (
                  <p className="mt-2 text-sm">
                    A idade de aposentadoria ({sim.idadeAposentadoria} anos) já foi atingida. Hoje os investimentos e a previdência somam{" "}
                    <strong>{fmtBRL(sim.atual)}</strong> para uma meta de <strong>{fmtBRL(sim.alvo)}</strong>
                    {sim.faltaHoje > 0 ? (
                      <>
                        {" "}
                        — faltam <strong>{fmtBRL(sim.faltaHoje)}</strong>.
                      </>
                    ) : (
                      " — meta atingida."
                    )}
                  </p>
                ) : (
                  <>
                    <div className="mt-1 flex flex-wrap items-baseline gap-x-3">
                      <span className="text-4xl font-bold tabular-nums">{fmtPct(Math.min(sim.independencia, 9.99))}</span>
                      <span className="text-sm text-muted-foreground">
                        da meta aos {sim.idadeAposentadoria} anos ({sim.anos === 1 ? "1 ano" : `${sim.anos} anos`} a partir de hoje)
                      </span>
                    </div>
                    <BarraProgresso valor={sim.independencia * 100} className="mt-3 h-2" />
                    <p className="mt-3 text-sm">
                      Investindo <strong>{fmtBRL(sim.aporteAtual)}/mês</strong> a {fmtRetorno(sim.retornoReal * 100)}, o patrimônio chega a{" "}
                      <strong>{fmtBRL(sim.projetado)}</strong> e gera cerca de <strong>{fmtBRL(sim.rendaProjetada)}/mês</strong>, para uma renda
                      desejada de {fmtBRL(sim.rendaDesejada)}/mês.{" "}
                      {sim.retiradaMensal > 0 && (
                        <>
                          Retirando essa renda, o patrimônio dura <strong>{dura}</strong>.
                        </>
                      )}
                    </p>
                  </>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <Kpi tom="ouro" rotulo="Patrimônio necessário" valor={fmtBRL(sim.alvo)} />
                <Kpi rotulo="Investimentos e previdência hoje" valor={fmtBRL(sim.atual)} detalhe="Sem a reserva de emergência" />
                <Kpi
                  rotulo="Aporte necessário"
                  valor={fmtBRL(sim.aporte)}
                  sufixo="/mês"
                  tom={sim.idadeAtingida ? "neutro" : sim.aporte > sim.aporteAtual ? "alerta" : "sucesso"}
                />
                <Kpi rotulo="Renda projetada" valor={fmtBRL(sim.rendaProjetada)} sufixo="/mês" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border p-4">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Patrimônio ao longo da vida</div>
            <GraficoSimulacao
              serie={sim.vida}
              base={simulando ? base.vida : undefined}
              idadeAposentadoria={sim.idadeAposentadoria}
              meta={sim.alvo}
            />
          </div>

          {/* Plano de independência: 1, 5 e 10 anos */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              <Flag className="h-3.5 w-3.5 text-primary" aria-hidden="true" /> Plano de independência
            </h3>
            <ol className="relative grid gap-3 lg:grid-cols-3">
              {/* Linha do tempo ligando os marcos (desktop) */}
              <span aria-hidden="true" className="absolute left-[16%] right-[16%] top-[18px] hidden h-px bg-border lg:block" />
              {sim.marcos.map((m) => {
                // Rendimentos = patrimônio + o que já foi retirado na aposentadoria − o que foi aportado.
                const rendimento = Math.max(0, m.patrimonio + m.retirado - m.aportado);
                return (
                  <li key={m.anos} className="relative min-w-0">
                    <div className="mb-2 flex items-center gap-2 lg:justify-center">
                      <span className="relative z-[1] flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold text-sm font-bold text-primary-foreground">
                        {m.anos}
                      </span>
                      <span className="text-sm font-semibold">
                        {m.anos === 1 ? "1 ano" : `${m.anos} anos`}
                        {m.idade !== undefined && <span className="font-normal text-muted-foreground"> · {m.idade} anos de idade</span>}
                      </span>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-4">
                      <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Patrimônio</div>
                      <div className="text-2xl font-semibold tabular-nums">{fmtBRL(m.patrimonio)}</div>
                      <div className="mt-2 flex items-center gap-2">
                        <BarraProgresso valor={m.percentualMeta * 100} className="flex-1" />
                        <span className="w-12 text-right text-xs tabular-nums text-muted-foreground">{fmtPct(Math.min(m.percentualMeta, 9.99))}</span>
                      </div>
                      <div className="mt-1 text-[11px] text-muted-foreground">da meta de independência</div>
                      <dl className="mt-3 space-y-1 border-t border-border/60 pt-3 text-sm">
                        <div className="flex flex-wrap justify-between gap-x-3">
                          <dt className="text-muted-foreground">Renda passiva</dt>
                          <dd className="whitespace-nowrap tabular-nums font-semibold">{fmtBRL(m.rendaPassiva)}/mês</dd>
                        </div>
                        <div className="flex flex-wrap justify-between gap-x-3">
                          <dt className="text-muted-foreground">Total aportado</dt>
                          <dd className="whitespace-nowrap tabular-nums">{fmtBRL(m.aportado)}</dd>
                        </div>
                        <div className="flex flex-wrap justify-between gap-x-3">
                          <dt className="text-muted-foreground">Rendimentos</dt>
                          <dd className="whitespace-nowrap tabular-nums">{fmtBRL(rendimento)}</dd>
                        </div>
                        {m.retirado > 0 && (
                          <div className="flex flex-wrap justify-between gap-x-3">
                            <dt className="text-muted-foreground">Retirado na aposentadoria</dt>
                            <dd className="whitespace-nowrap tabular-nums">{fmtBRL(m.retirado)}</dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  </li>
                );
              })}
            </ol>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Renda passiva: {fmtPct(TAXA_RETIRADA)} ao ano do patrimônio{sim.outras > 0 ? " mais as outras rendas" : ""}. Total aportado inclui o
              patrimônio de hoje.
            </p>
          </div>
        </>
      )}

      {mudancas.length > 0 && (
        <div className="rounded-xl border border-border p-4">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Mudanças de vida programadas</div>
          <ul className="divide-y divide-border/60">
            {mudancas.map((m) => (
              <li key={m.item.id} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 py-1.5 text-sm">
                <span className="min-w-0">
                  {m.descricao}
                  {m.impacto && <span className="text-xs text-muted-foreground"> · {m.impacto.toLowerCase()}</span>}
                </span>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {m.temData ? `em ${m.quando}` : "sem data"}
                  {m.valor > 0 && (
                    <strong className="ml-2 text-foreground">
                      {m.impacto === "Gasto único" ? fmtBRL(m.valor) : `${m.efeitoMensal < 0 ? "−" : m.efeitoMensal > 0 ? "+" : ""}${fmtBRL(m.valor)}/mês`}
                    </strong>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
