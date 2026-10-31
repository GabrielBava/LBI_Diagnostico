// 7.1 · Especificação do planejamento (só na versão consultor): simulador do valor do
// planejamento (renda bruta anual × percentual − desconto) e condições de pagamento
// (Pix/boleto com desconto ou cartão em até 12x). A condição marcada vai para o PDF.
// Tudo fica em cliente.especificacao; as contas estão em src/lib/especificacao.ts.
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, FileDown, QrCode, RotateCcw, TriangleAlert, type LucideIcon } from "lucide-react";
import { CampoMoeda, CampoNumero, Chips, Rotulo } from "@/components/campos";
import { BotaoOuro, Kpi, Selo, SubBloco } from "@/components/ui";
import { DESCONTO_PIX, PARCELAS, PERCENTUAL_PADRAO } from "@/config/especificacao";
import { useCliente } from "@/lib/cliente-context";
import { s } from "@/lib/calculos";
import { especificacao, fmtPercentual, type CondicaoPagamento } from "@/lib/especificacao";
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

export default function Especificacao() {
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
        <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-primary">Etapa 7 · Especificação</div>
        <h3 className="mt-0.5 text-lg font-semibold sm:text-xl">Especificação · Planejamento financeiro</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Acompanhamento anual calculado sobre a renda bruta da família. Ajuste o percentual, dê um desconto se quiser e marque a condição
          de pagamento: ela vai para o PDF.
        </p>
      </div>

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
                placeholder={`${PERCENTUAL_PADRAO} (padrão)`}
                ariaLabel="Percentual sobre a renda anual"
              />
              <div className="mt-1 flex flex-wrap items-center justify-between gap-x-3">
                <span className="text-[11px] text-muted-foreground/80">Sobre a renda bruta anual. Padrão: {fmtPercentual(PERCENTUAL_PADRAO)}</span>
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
          </div>

          <div className="mt-4">
            <Kpi
              tom="ouro"
              rotulo="Valor do plano · acompanhamento anual"
              valor={temValor || e.base > 0 ? fmtBRL(e.valor, true) : "—"}
              detalhe={
                e.base > 0 ? (
                  <span className="tabular-nums">
                    {fmtBRL(e.base)} × {fmtPercentual(e.percentual)} = {fmtBRL(e.bruto, true)}
                    {e.desconto > 0 &&
                      ` − desconto ${fmtBRL(e.desconto, true)}${e.tipoDesconto === "%" ? ` (${fmtPercentual(Math.min(100, e.descontoInformado))})` : ""}`}
                  </span>
                ) : (
                  "Informe a renda bruta para calcular."
                )
              }
            />
          </div>
        </SubBloco>
      </div>

      {/* (c) Condições de pagamento */}
      <SubBloco titulo="Condições de pagamento">
        <fieldset className="min-w-0">
          <legend className="mb-3 text-xs text-muted-foreground">Marque a condição escolhida pelo cliente. Só ela entra no PDF.</legend>
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
                  temValor && (
                    <>
                      {fmtPercentual(DESCONTO_PIX)} de desconto sobre {fmtBRL(e.valor, true)}: economia de {fmtBRL(e.pix.economia, true)}
                    </>
                  )
                }
              />
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
                detalhe={
                  temValor && (
                    <>
                      Total {fmtBRL(e.cartao.total, true)} · taxa da maquininha {fmtPercentual(e.cartao.taxa)} + {fmtBRL(e.cartao.tarifa, true)}
                      {e.parcelas > 1 && " (R$ 0,29 por parcela)"}
                    </>
                  )
                }
              />
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
          <FileDown className="h-3.5 w-3.5" aria-hidden="true" /> Exportar especificação em PDF
        </BotaoOuro>
      </div>
    </div>
  );
}
