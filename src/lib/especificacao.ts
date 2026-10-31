// =====================================================================
//  ESPECIFICAÇÃO DO PLANEJAMENTO (etapa 7) — cálculos
//  ---------------------------------------------------------------------
//  Base anual  = renda bruta mensal (cliente + cônjuge) × 12, ou a renda
//                anual digitada pelo consultor (simulação).
//  Valor plano = base × percentual − desconto do consultor (% ou R$), nunca negativo.
//  Pix/boleto  = valor × (1 − 5%).
//  Cartão (n)  = valor + valor × taxa(n) + tarifa(n); parcela = total ÷ n.
//  Parâmetros em src/config/especificacao.ts. Valores arredondados em centavos.
// =====================================================================

import type { Cliente } from "@/types";
import {
  CARTAO_AVISTA,
  DESCONTO_PIX,
  PARCELAS,
  PARCELAS_PADRAO,
  PERCENTUAL_PADRAO,
  TARIFA_POR_PARCELA,
  TAXAS_PARCELADO,
  VALIDADE_DIAS,
} from "@/config/especificacao";
import { n, nOpt, renda, s, temConjuge } from "./calculos";

export type CondicaoPagamento = "pix" | "cartao";
export type TipoDesconto = "%" | "R$";

/** Arredonda em centavos (o toFixed evita erros como 1,005 → 1,00). */
export const centavos = (v: number) => (Number.isFinite(v) ? Math.round(Number((v * 100).toFixed(6))) / 100 : 0);

/** Percentual para exibir: 3 → "3%", 2.5 → "2,5%", 11.71 → "11,71%". */
export const fmtPercentual = (p: number) => `${(Number.isFinite(p) ? p : 0).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;

/** Parcelas dentro da faixa aceita (1x a 12x); valor inválido vira o padrão. */
export const normalizarParcelas = (v: number) => {
  const p = Number.isFinite(v) ? Math.round(v) : PARCELAS_PADRAO;
  return Math.min(PARCELAS[PARCELAS.length - 1], Math.max(PARCELAS[0], p));
};

/** Base anual: a renda anual digitada pelo consultor ou a renda bruta mensal × 12. */
export const baseAnual = (rendaMensal: number, digitada?: number) =>
  centavos(digitada !== undefined ? Math.max(0, digitada) : Math.max(0, rendaMensal) * 12);

/** Valor do plano = base × percentual − desconto (em % do valor ou em R$). Nunca fica negativo. */
export function valorPlano(base: number, percentual: number, desconto?: { tipo: TipoDesconto; valor: number }) {
  const bruto = centavos((Math.max(0, base) * Math.max(0, percentual)) / 100);
  const pedido = !desconto
    ? 0
    : desconto.tipo === "%"
      ? (bruto * Math.min(100, Math.max(0, desconto.valor))) / 100
      : Math.max(0, desconto.valor);
  const aplicado = centavos(Math.min(bruto, pedido));
  return { bruto, desconto: aplicado, valor: centavos(bruto - aplicado) };
}

/** Pix ou boleto: valor do plano com o desconto de 5%. */
export function pixBoleto(valor: number, descontoPct = DESCONTO_PIX) {
  const v = Math.max(0, valor);
  const total = centavos(v * (1 - descontoPct / 100));
  return { total, economia: centavos(v - total), descontoPct };
}

/** Taxa (%) e tarifa (R$) do cartão: à vista (1x) ou parcelado (2x a 12x, tarifa por parcela). */
export function taxaCartao(parcelas: number) {
  const p = normalizarParcelas(parcelas);
  return p === 1
    ? { taxa: CARTAO_AVISTA.taxa, tarifa: CARTAO_AVISTA.tarifa }
    : { taxa: TAXAS_PARCELADO[p] ?? 0, tarifa: centavos(TARIFA_POR_PARCELA * p) };
}

/** Cartão de crédito: total = valor + valor × taxa + tarifa; parcela = total ÷ n. */
export function cartao(valor: number, parcelas: number) {
  const p = normalizarParcelas(parcelas);
  const { taxa, tarifa } = taxaCartao(p);
  const v = Math.max(0, valor);
  if (v <= 0) return { parcelas: p, taxa, tarifa, total: 0, parcela: 0 };
  const total = centavos(v + (v * taxa) / 100 + tarifa);
  return { parcelas: p, taxa, tarifa, total, parcela: centavos(total / p) };
}

/** Data de validade da proposta (emissão + dias). */
export const validadeAte = (emissao: Date, dias = VALIDADE_DIAS) => {
  const d = new Date(emissao);
  d.setDate(d.getDate() + dias);
  return d;
};

/**
 * Especificação do cliente, a partir do que o consultor guardou em cliente.especificacao:
 *  rendaAnual (R$, em branco = calculada) · percentual (%, em branco = padrão) ·
 *  descontoTipo ("%" ou "R$") · descontoPct (%) · descontoValor (R$) ·
 *  condicao ("pix" ou "cartao") · parcelas (1 a 12) · observacoes (texto).
 */
export function especificacao(c: Cliente) {
  const e = c.especificacao ?? {};
  const r = renda(c);
  const comConjuge = temConjuge(c);
  // De onde vem a renda bruta mensal: informada, ou estimada pela líquida (6 · Renda).
  const pessoas = [
    { papel: "Cliente", nome: s(c.cadastro.nome), bruta: r.cliente.bruta, estimada: r.cliente.estimada === "bruta" },
    ...(comConjuge
      ? [{ papel: "Cônjuge", nome: s(c.cadastro.conjuge), bruta: r.conjugeDetalhe.bruta, estimada: r.conjugeDetalhe.estimada === "bruta" }]
      : []),
  ];
  const rendaMensal = r.brutaTotal;
  const baseCalculada = baseAnual(rendaMensal);
  const digitada = nOpt(e.rendaAnual);
  const simulada = digitada !== undefined;
  const base = baseAnual(rendaMensal, digitada);

  const percentualDigitado = nOpt(e.percentual);
  const percentual = Math.max(0, percentualDigitado ?? PERCENTUAL_PADRAO);
  const tipoDesconto: TipoDesconto = s(e.descontoTipo) === "R$" ? "R$" : "%";
  const descontoInformado = Math.max(0, tipoDesconto === "%" ? n(e.descontoPct) : n(e.descontoValor));
  const plano = valorPlano(base, percentual, { tipo: tipoDesconto, valor: descontoInformado });

  const parcelas = normalizarParcelas(nOpt(e.parcelas) ?? PARCELAS_PADRAO);
  const cond = s(e.condicao);
  const condicao: CondicaoPagamento | undefined = cond === "pix" || cond === "cartao" ? cond : undefined;

  return {
    pessoas,
    comConjuge,
    /** Renda do cônjuge preenchida, mas o cadastro não tem cônjuge: não entra na base. */
    conjugeIgnorado: !comConjuge && (n(c.renda.brutaConjuge) > 0 || n(c.renda.liquidaConjuge) > 0),
    rendaMensal,
    baseCalculada,
    /** O consultor digitou outra renda anual para simular. */
    simulada,
    base,
    /** Alguma renda bruta usada na base foi estimada pela líquida. */
    estimada: !simulada && pessoas.some((p) => p.estimada && p.bruta > 0),
    percentual,
    percentualPadrao: percentualDigitado === undefined,
    tipoDesconto,
    descontoInformado,
    /** bruto = base × percentual; desconto aplicado (R$); valor = bruto − desconto. */
    ...plano,
    pix: pixBoleto(plano.valor),
    cartao: cartao(plano.valor, parcelas),
    parcelas,
    condicao,
    observacoes: s(e.observacoes).trim(),
  };
}

export type Especificacao = ReturnType<typeof especificacao>;
