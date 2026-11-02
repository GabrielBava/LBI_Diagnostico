// 7.1 · Precificação do planejamento (só na versão consultor): modelo de consultoria (pontual,
// contrato ou concierge, com cronograma, regras de entrada e limite de reuniões), valor do plano
// (renda bruta anual × percentual − desconto, ou o valor digitado; mínimo R$ 2.790) e condições de
// pagamento (Pix/boleto com desconto ou cartão em até 12x), com o líquido após a nota fiscal.
// A condição marcada vai para o PDF. Tudo fica em cliente.especificacao (contas em src/lib/especificacao.ts).
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarRange, CreditCard, FileDown, ListChecks, QrCode, RotateCcw, ShieldCheck, TriangleAlert, type LucideIcon } from "lucide-react";
import { CampoMoeda, CampoNumero, Chips, Rotulo } from "@/components/campos";
import { BotaoOuro, Kpi, Selo, SubBloco } from "@/components/ui";
import { DESCONTO_PIX, IMPOSTO_NOTA_FISCAL, MODELOS_CONSULTORIA, PARCELAS, VALOR_MINIMO } from "@/config/especificacao";
import { useCliente } from "@/lib/cliente-context";
import { s } from "@/lib/calculos";
import { especificacao, fmtPercentual, type CondicaoPagamento, type notaFiscal } from "@/lib/especificacao";
import { fmtBRL } from "@/lib/format";
import type { Valor } from "@/types";

/** Botão discreto de voltar ao valor calculado / padrão. */
function BotaoRestaurar({ children, onClick, disabled }: { children: ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-7 shrink-0 items-center gap-1 rounded-md px-2 text-[11px] font-semibold text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary enabled:hover:bg-muted enabled:hover:text-foreground disabled:opacity-40"
    >
      <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> {children}
    </button>
  );
}

/** Cartão de uma condição de pagamento (como no slide 11), com o botão de rádio para escolher. */
function Opcao({
  grupo,
  valor,
  escolhida,
  onEscolher,
  titulo,
  icone: Icone,
  selo,
  children,
}: {
  grupo: string;
  valor: CondicaoPagamento;
  escolhida: boolean;
  onEscolher: () => void;
  titulo: string;
  icone: LucideIcon;
  selo?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      className={`flex min-w-0 flex-col gap-3 rounded-xl border p-4 transition ${
        escolhida ? "border-primary/70 bg-primary/5 ring-1 ring-primary/40" : "border-border bg-card"
      }`}
    >
      <label className="flex cursor-pointer flex-wrap items-center gap-x-2.5 gap-y-1.5">
        <input
          type="radio"
          name={grupo}
          value={valor}
          checked={escolhida}
          onChange={onEscolher}
          className="h-4 w-4 shrink-0 cursor-pointer accent-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        />
        <Icone className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <span className="text-xs font-semibold uppercase tracking-widest">{titulo}</span>
        {selo}
      </label>
      {children}
      <p className={`mt-auto text-[11px] font-medium ${escolhida ? "text-primary" : "text-muted-foreground"}`}>
        {escolhida ? "✓ Condição escolhida: vai para o PDF" : "Marque para usar esta condição no PDF"}
      </p>
    </div>
  );
}

/** Valor principal de uma condição: rótulo pequeno, valor grande e detalhe. */
function ValorCondicao({ rotulo, valor, detalhe }: { rotulo: string; valor: string; detalhe?: ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{rotulo}</div>
      <div className="mt-0.5 break-words text-2xl font-semibold tabular-nums">{valor}</div>
      {detalhe && <div className="mt-0.5 text-[11px] leading-snug text-muted-foreground tabular-nums">{detalhe}</div>}
    </div>
  );
}

const linha = "flex items-baseline justify-between gap-3 py-1.5";

/** Nota fiscal e líquido da condição (interno: não vai para o PDF). */
function LinhaNota({ nota }: { nota: ReturnType<typeof notaFiscal> }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/30 px-3 py-2 text-[11px] text-muted-foreground tabular-nums">
      Nota fiscal ({fmtPercentual(nota.impostoPct)}): <span className="text-foreground">− {fmtBRL(nota.imposto, true)}</span> · Líquido:{" "}
      <strong className="text-foreground">{fmtBRL(nota.liquido, true)}</strong>
    </div>
  );
}

export default function Precificacao() {
  const { cliente, setCampo, irPara } = useCliente();
  const navigate = useNavigate();
  const dados = cliente.especificacao ?? {};
  const e = especificacao(cliente);
  const set = (k: string, v: Valor) => setCampo("especificacao", k, v);
  const semRenda = e.rendaMensal <= 0;
  const temValor = e.valor > 0;
  const grupo = `condicao-${cliente.id}`;
  // Desconto pedido acima do valor do plano: fica limitado a ele.
  const descontoLimitado = e.bruto > 0 && (e.tipoDesconto === "%" ? e.descontoInformado > 100 : e.descontoInformado > e.bruto);

  const modeloAtual = e.modelo;
  const noPdf = !temValor
    ? "Informe a renda para calcular o valor do plano e exportar."
    : e.condicao === "pix"
      ? `No PDF: Pix ou boleto, ${fmtBRL(e.pix.total, true)} à vista.`
      : e.condicao === "cartao"
        ? `No PDF: cartão de crédito, ${e.cartao.parcelas}× de ${fmtBRL(e.cartao.parcela, true)} (total ${fmtBRL(e.cartao.total, true)}).`
        : "Nenhuma condição marcada: o PDF mostra as duas opções. Marque a escolhida pelo cliente acima.";

  return (
    <div className="space-y-4">
      {/* Título de destaque */}
      <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
        <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-primary">Etapa 7 · Precificação</div>
        <h3 className="mt-0.5 text-lg font-semibold sm:text-xl">Precificação · Planejamento financeiro</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Escolha o modelo de consultoria, ajuste o percentual ou digite o valor do plano (mínimo de {fmtBRL(VALOR_MINIMO)}) e marque a
          condição de pagamento: ela vai para o PDF.
        </p>
      </div>

      {/* Modelo de consultoria: pontual, contrato ou concierge */}
      <SubBloco titulo="Modelo de consultoria">
        <div role="radiogroup" aria-label="Modelo de consultoria" className="grid gap-3 md:grid-cols-3">
          {MODELOS_CONSULTORIA.map((m) => {
            const ativo = modeloAtual.id === m.id;
            return (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={ativo}
                onClick={() => {
                  set("modelo", m.id);
                  // O percentual digitado era do modelo anterior: volta ao padrão do novo modelo.
                  if (dados.percentual !== undefined) set("percentual", undefined);
                }}
                className={`flex min-w-0 flex-col gap-1.5 rounded-xl border p-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
                  ativo ? "border-primary/70 bg-primary/5 ring-1 ring-primary/40" : "border-border bg-card hover:border-primary/50"
                }`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{m.nome}</span>
                  {ativo && <span className="shrink-0 text-[10px] font-semibold uppercase tracking-widest text-primary">Escolhido</span>}
                </span>
                <span className="text-xs leading-snug text-muted-foreground">{m.resumo}</span>
                <span className="mt-auto flex flex-wrap gap-1.5 pt-1">
                  <Selo className="border-border bg-muted/40 text-muted-foreground">{m.duracao}</Selo>
                  <Selo className="border-border bg-muted/40 text-muted-foreground">até {m.reunioes} reuniões</Selo>
                  <Selo className="border-primary/30 bg-primary/10 text-primary">{fmtPercentual(m.percentual)} da renda anual</Selo>
                </span>
              </button>
            );
          })}
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              <CalendarRange className="h-3.5 w-3.5 text-primary" aria-hidden="true" /> Cronograma
            </div>
            <ol className="space-y-2 border-l border-border pl-3">
              {modeloAtual.cronograma.map((c) => (
                <li key={c.quando} className="text-xs">
                  <span className="font-semibold text-foreground">{c.quando}</span>
                  <span className="block text-muted-foreground">{c.oque}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" aria-hidden="true" /> Regras de entrada · até {modeloAtual.reunioes} reuniões
            </div>
            <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">
              {modeloAtual.regras.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              <ListChecks className="h-3.5 w-3.5 text-primary" aria-hidden="true" /> O que inclui
            </div>
            <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">
              {modeloAtual.inclui.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        </div>
      </SubBloco>

      <div className="grid gap-4 xl:grid-cols-2">
        {/* (a) Base de cálculo */}
        <SubBloco titulo="Base de cálculo" total={fmtBRL(e.base)}>
          {semRenda ? (
            <div role="status" className="flex gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs text-warning">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <p className="font-semibold">Sem renda bruta na coleta.</p>
                <p className="mt-0.5">Preencha a renda em 6 · Renda ou digite a renda bruta anual abaixo para simular.</p>
                <button
                  type="button"
                  onClick={() => irPara("renda")}
                  className="mt-1 font-semibold underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                >
                  Ir para 6 · Renda
                </button>
              </div>
            </div>
          ) : (
            <dl className="divide-y divide-border/60 text-sm">
              {e.pessoas.map((p) => (
                <div key={p.papel} className={linha}>
                  <dt className="min-w-0">
                    <span className="break-words text-muted-foreground">
                      {p.papel}
                      {p.nome && ` · ${p.nome}`}
                    </span>
                    <span className={`block text-[11px] ${p.estimada && p.bruta > 0 ? "text-warning" : "text-muted-foreground/80"}`}>
                      {p.bruta <= 0 ? "Não informada" : p.estimada ? "Estimada pela renda líquida" : "Bruta informada em 6 · Renda"}
                    </span>
                  </dt>
                  <dd className="shrink-0 text-right tabular-nums">
                    {fmtBRL(p.bruta)}
                    <span className="text-xs text-muted-foreground">/mês</span>
                  </dd>
                </div>
              ))}
              <div className={`${linha} font-semibold`}>
                <dt className="min-w-0">Renda bruta mensal{e.comConjuge ? " (cliente + cônjuge)" : ""}</dt>
                <dd className="shrink-0 tabular-nums">{fmtBRL(e.rendaMensal)}</dd>
              </div>
              <div className={linha}>
                <dt className="min-w-0 text-muted-foreground">Renda bruta anual (× 12 meses)</dt>
                <dd className="shrink-0 tabular-nums">{fmtBRL(e.baseCalculada)}</dd>
              </div>
            </dl>
          )}
          {e.conjugeIgnorado && (
            <p className="mt-2 text-[11px] text-muted-foreground">A renda do cônjuge preenchida em 6 · Renda não entra: o cadastro está sem cônjuge.</p>
          )}

          <div className="mt-4">
            <Rotulo>Renda bruta anual usada no cálculo</Rotulo>
            <CampoMoeda
              valor={dados.rendaAnual}
              onChange={(v) => set("rendaAnual", v)}
              automatico={semRenda ? undefined : e.baseCalculada}
              ariaLabel="Renda bruta anual usada no cálculo"
            />
            <div className="mt-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
              <span className={`text-[11px] leading-snug ${e.simulada ? "text-primary" : "text-muted-foreground/80"}`}>
                {e.simulada
                  ? "Simulação: renda anual digitada pelo consultor."
                  : semRenda
                    ? "Digite a renda bruta anual da família."
                    : "Em branco, usa a renda da coleta. Digite outro valor para simular."}
              </span>
              <BotaoRestaurar onClick={() => set("rendaAnual", undefined)} disabled={!e.simulada}>
                Voltar ao calculado
              </BotaoRestaurar>
            </div>
          </div>
        </SubBloco>

        {/* (b) Percentual, desconto e valor do plano */}
        <SubBloco titulo="Valor do plano">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="min-w-0">
              <Rotulo>Percentual do plano</Rotulo>
              <CampoNumero
                valor={dados.percentual}
                onChange={(v) => set("percentual", v)}
                sufixo="%"
                min={0}
                max={100}
                placeholder={`${modeloAtual.percentual.toLocaleString("pt-BR")} (padrão do modelo)`}
                ariaLabel="Percentual sobre a renda anual"
              />
              <div className="mt-1 flex flex-wrap items-center justify-between gap-x-3">
                <span className="text-[11px] text-muted-foreground/80">
                  Sobre a renda bruta anual. Padrão do modelo: {fmtPercentual(modeloAtual.percentual)}
                </span>
                <BotaoRestaurar onClick={() => set("percentual", undefined)} disabled={e.percentualPadrao}>
                  Voltar ao padrão
                </BotaoRestaurar>
              </div>
            </div>
            <div className="min-w-0">
              <Rotulo>Desconto do consultor</Rotulo>
              <div className="flex items-center gap-2">
                <div className="shrink-0">
                  <Chips opcoes={["%", "R$"]} valor={e.tipoDesconto} onChange={(v) => set("descontoTipo", v ?? "%")} obrigatorio ariaLabel="Desconto em" />
                </div>
                <div className="min-w-0 flex-1">
                  {e.tipoDesconto === "%" ? (
                    <CampoNumero
                      valor={dados.descontoPct}
                      onChange={(v) => set("descontoPct", v)}
                      sufixo="%"
                      min={0}
                      max={100}
                      placeholder="0"
                      ariaLabel="Desconto em percentual"
                    />
                  ) : (
                    <CampoMoeda valor={dados.descontoValor} onChange={(v) => set("descontoValor", v)} ariaLabel="Desconto em reais" />
                  )}
                </div>
              </div>
              <span className={`mt-1 block text-[11px] leading-snug ${descontoLimitado ? "text-warning" : "text-muted-foreground/80"}`}>
                {descontoLimitado ? "Desconto limitado ao valor do plano." : "Opcional. Em branco, sem desconto."}
              </span>
            </div>
            <div className="min-w-0 sm:col-span-2">
              <Rotulo>Valor do plano definido pelo planejador (opcional)</Rotulo>
              <CampoMoeda valor={dados.valorManual} onChange={(v) => set("valorManual", v)} ariaLabel="Valor do plano definido pelo planejador" />
              <div className="mt-1 flex flex-wrap items-center justify-between gap-x-3">
                <span className={`text-[11px] leading-snug ${e.valorManual ? "text-primary" : "text-muted-foreground/80"}`}>
                  {e.valorManual ? "Valor digitado: substitui renda anual × percentual." : "Em branco, usa renda anual × percentual."} Mínimo de{" "}
                  {fmtBRL(VALOR_MINIMO)}.
                </span>
                <BotaoRestaurar onClick={() => set("valorManual", undefined)} disabled={!e.valorManual}>
                  Voltar ao calculado
                </BotaoRestaurar>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <Kpi
              tom="ouro"
              rotulo={`Valor do plano · ${modeloAtual.nome}`}
              valor={fmtBRL(e.valor, true)}
              detalhe={
                <span className="tabular-nums">
                  {e.valorManual
                    ? `Valor definido pelo planejador: ${fmtBRL(e.bruto, true)}`
                    : e.base > 0
                      ? `${fmtBRL(e.base)} × ${fmtPercentual(e.percentual)} = ${fmtBRL(e.bruto, true)}`
                      : "Sem renda: vale o valor mínimo."}
                  {e.desconto > 0 &&
                    ` − desconto ${fmtBRL(e.desconto, true)}${e.tipoDesconto === "%" ? ` (${fmtPercentual(Math.min(100, e.descontoInformado))})` : ""}`}
                  {e.noMinimo && ` → valor mínimo do plano (${fmtBRL(VALOR_MINIMO)})`}
                </span>
              }
            />
          </div>
        </SubBloco>
      </div>

      {/* (c) Condições de pagamento */}
      <SubBloco titulo="Condições de pagamento">
        <fieldset className="min-w-0">
          <legend className="mb-3 text-xs text-muted-foreground">
            Marque a condição escolhida pelo cliente. Só ela entra no PDF. A nota fiscal ({fmtPercentual(IMPOSTO_NOTA_FISCAL)}) e o líquido aparecem
            só aqui.
          </legend>
          <div className="grid gap-3 md:grid-cols-2">
            <Opcao
              grupo={grupo}
              valor="pix"
              escolhida={e.condicao === "pix"}
              onEscolher={() => set("condicao", "pix")}
              titulo="Pix ou boleto"
              icone={QrCode}
              selo={<Selo className="border-success/30 bg-success/10 text-success">{fmtPercentual(DESCONTO_PIX)} de desconto</Selo>}
            >
              <ValorCondicao
                rotulo="À vista"
                valor={temValor ? fmtBRL(e.pix.total, true) : "—"}
                detalhe={
                  temValor &&
                  (e.pix.economia > 0 ? (
                    <>
                      {fmtPercentual(DESCONTO_PIX)} de desconto sobre {fmtBRL(e.valor, true)}: economia de {fmtBRL(e.pix.economia, true)}
                    </>
                  ) : (
                    <>No valor mínimo do plano, o Pix não tem desconto.</>
                  ))
                }
              />
              {temValor && <LinhaNota nota={e.notaPix} />}
            </Opcao>

            <Opcao
              grupo={grupo}
              valor="cartao"
              escolhida={e.condicao === "cartao"}
              onEscolher={() => set("condicao", "cartao")}
              titulo="Cartão de crédito"
              icone={CreditCard}
            >
              <label className="block">
                <Rotulo>Parcelas</Rotulo>
                <select
                  className="inp tabular-nums focus-visible:ring-2 focus-visible:ring-primary/50"
                  value={e.parcelas}
                  onChange={(ev) => set("parcelas", Number(ev.target.value))}
                >
                  {PARCELAS.map((p) => (
                    <option key={p} value={p}>
                      {p === 1 ? "1x (à vista no cartão)" : `Em até ${p}x`}
                    </option>
                  ))}
                </select>
              </label>
              <ValorCondicao
                rotulo={e.parcelas === 1 ? "À vista no cartão" : `Em ${e.parcelas} parcelas`}
                valor={temValor ? (e.parcelas === 1 ? fmtBRL(e.cartao.total, true) : `${e.parcelas}× de ${fmtBRL(e.cartao.parcela, true)}`) : "—"}
                detalhe={temValor && e.parcelas > 1 && <>Total {fmtBRL(e.cartao.total, true)}</>}
              />
              {temValor && <LinhaNota nota={e.notaCartao} />}
            </Opcao>
          </div>
        </fieldset>
      </SubBloco>

      {/* (d) Observações */}
      <label className="block">
        <Rotulo>Observações para o cliente (entram no PDF)</Rotulo>
        <textarea
          rows={3}
          className="inp focus-visible:ring-2 focus-visible:ring-primary/50"
          placeholder="Ex.: início do acompanhamento, datas das reuniões, condição especial combinada…"
          value={s(dados.observacoes)}
          onChange={(ev) => set("observacoes", ev.target.value)}
        />
      </label>

      {/* (e) Exportar em PDF */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-secondary/20 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="min-w-0 text-xs text-muted-foreground" aria-live="polite">
          {noPdf}
        </p>
        <BotaoOuro
          onClick={() => navigate(`/clientes/${cliente.id}/especificacao`)}
          disabled={!temValor}
          className="shrink-0 justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <FileDown className="h-3.5 w-3.5" aria-hidden="true" /> Exportar precificação em PDF
        </BotaoOuro>
      </div>
    </div>
  );
}
