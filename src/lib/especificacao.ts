// =====================================================================
//  PRECIFICAÇÃO DO PLANEJAMENTO (etapa 7) — cálculos
//  ---------------------------------------------------------------------
//  Base anual  = renda bruta mensal (cliente + cônjuge) × 12, ou a renda
//                anual digitada pelo consultor (simulação).
//  Referência  = base × percentual (padrão 3%), ou o valor digitado pelo consultor.
//  Valor plano = referência − desconto do consultor (% ou R$), nunca abaixo do mínimo (R$ 2.790).
//  Pix/boleto  = valor × (1 − 5%), nunca abaixo do mínimo.
//  Cartão (n)  = valor + valor × taxa(n) + tarifa(n); parcela = total ÷ n.
//  Receita líquida = valor recebido − nota fiscal de 18,5% (Pix: o total; cartão: o valor
//                do plano, porque as taxas da maquininha ficam com a operadora).
//  Parâmetros em src/config/especificacao.ts. Valores arredondados em centavos.
// =====================================================================

import type { Cliente } from "@/types";
import {
  CARTAO_AVISTA,
  DESCONTO_PIX,
  IMPOSTO_NOTA_FISCAL,
  PARCELAS,
  PARCELAS_PADRAO,
  PERCENTUAL_PADRAO,
  TARIFA_POR_PARCELA,
  TAXAS_PARCELADO,
  VALIDADE_DIAS,
  VALOR_MINIMO,
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

/**
 * Valor do plano = referência (base × percentual, ou o valor digitado pelo consultor) − desconto
 * (em % ou em R$), nunca abaixo do mínimo. `noMinimo`: o valor subiu para o mínimo.
 */
export function valorPlano(
  base: number,
  percentual: number,
  desconto?: { tipo: TipoDesconto; valor: number },
  manual?: number,
  minimo = VALOR_MINIMO,
) {
  const bruto = centavos(manual !== undefined ? Math.max(0, manual) : (Math.max(0, base) * Math.max(0, percentual)) / 100);
  const pedido = !desconto
    ? 0
    : desconto.tipo === "%"
      ? (bruto * Math.min(100, Math.max(0, desconto.valor))) / 100
      : Math.max(0, desconto.valor);
  const aplicado = centavos(Math.min(bruto, pedido));
  const calculado = centavos(bruto - aplicado);
  return { bruto, desconto: aplicado, valor: Math.max(minimo, calculado), noMinimo: calculado < minimo };
}

/** Pix ou boleto: valor do plano com o desconto de 5%, nunca abaixo do mínimo. */
export function pixBoleto(valor: number, descontoPct = DESCONTO_PIX, minimo = VALOR_MINIMO) {
  const v = Math.max(0, valor);
  const total = v > 0 ? Math.max(Math.min(v, minimo), centavos(v * (1 - descontoPct / 100))) : 0;
  return { total, economia: centavos(v - total), descontoPct };
}

/** Nota fiscal (18,5%) sobre o valor recebido e o líquido que sobra. */
export function notaFiscal(recebido: number, impostoPct = IMPOSTO_NOTA_FISCAL) {
  const imposto = centavos((Math.max(0, recebido) * impostoPct) / 100);
  return { recebido: centavos(Math.max(0, recebido)), imposto, liquido: centavos(Math.max(0, recebido) - imposto), impostoPct };
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
 * Precificação do cliente, a partir do que o consultor guardou em cliente.especificacao:
 *  rendaAnual (R$, em branco = calculada) ·
 *  percentual (%, em branco = 3%) · valorManual (R$, em branco = calculado) ·
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
  const manual = nOpt(e.valorManual);
  const tipoDesconto: TipoDesconto = s(e.descontoTipo) === "R$" ? "R$" : "%";
  const descontoInformado = Math.max(0, tipoDesconto === "%" ? n(e.descontoPct) : n(e.descontoValor));
  const plano = valorPlano(base, percentual, { tipo: tipoDesconto, valor: descontoInformado }, manual);

  const parcelas = normalizarParcelas(nOpt(e.parcelas) ?? PARCELAS_PADRAO);
  const cond = s(e.condicao);
  const condicao: CondicaoPagamento | undefined = cond === "pix" || cond === "cartao" ? cond : undefined;

  const pix = pixBoleto(plano.valor);
  const cartaoEscolhido = cartao(plano.valor, parcelas);
  return {
    /** O consultor digitou o valor do plano (em vez de base × percentual). */
    valorManual: manual !== undefined,
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
    /** Sem percentual digitado: vale o padrão (3%). */
    percentualPadrao: percentualDigitado === undefined,
    tipoDesconto,
    descontoInformado,
    /** bruto = base × percentual (ou o valor digitado); desconto aplicado (R$); valor = bruto − desconto, no mínimo R$ 2.790. */
    ...plano,
    pix,
    cartao: cartaoEscolhido,
    /** Nota fiscal sobre o que fica com a empresa: no Pix, o total; no cartão, o valor do plano (sem as taxas da maquininha). */
    notaPix: notaFiscal(pix.total),
    notaCartao: notaFiscal(plano.valor),
    parcelas,
    condicao,
    observacoes: s(e.observacoes).trim(),
  };
}

export type Especificacao = ReturnType<typeof especificacao>;
