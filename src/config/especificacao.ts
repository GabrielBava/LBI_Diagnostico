// =====================================================================
//  ESPECIFICAÇÃO DO PLANEJAMENTO (etapa 7) — parâmetros e textos
//  ---------------------------------------------------------------------
//  Valor do plano = renda bruta anual (cliente + cônjuge, × 12) × percentual
//  − desconto do consultor. Pix ou boleto têm desconto; no cartão entram as
//  taxas da maquininha (mesma tabela do slide 11 da proposta comercial).
//  As contas ficam em src/lib/especificacao.ts. Percentuais em % (3 = 3%).
// =====================================================================

/** Percentual padrão do planejamento sobre a renda bruta anual (%). */
export const PERCENTUAL_PADRAO = 3;

/** Desconto para pagamento no Pix ou boleto (%). */
export const DESCONTO_PIX = 5;

/** Cartão à vista (1x): taxa (%) + tarifa fixa (R$). */
export const CARTAO_AVISTA = { taxa: 4.53, tarifa: 0.29 };

/** Cartão parcelado: taxa (%) por número de parcelas. */
export const TAXAS_PARCELADO: Record<number, number> = {
  2: 5.15,
  3: 5.65,
  4: 6.35,
  5: 6.96,
  6: 7.57,
  7: 8.56,
  8: 9.18,
  9: 9.81,
  10: 10.44,
  11: 11.07,
  12: 11.71,
};

/** Tarifa fixa do cartão parcelado, por parcela (R$). */
export const TARIFA_POR_PARCELA = 0.29;

/** Parcelas aceitas no cartão (1x a 12x). */
export const PARCELAS = Array.from({ length: 12 }, (_, i) => i + 1);

/** Parcelas sugeridas quando o consultor ainda não escolheu. */
export const PARCELAS_PADRAO = 12;

/** Dias de validade da proposta, a partir da data de emissão. */
export const VALIDADE_DIAS = 7;

/** O que está incluso no planejamento (lista do PDF). */
export const INCLUSO_PLANEJAMENTO = [
  "Diagnóstico financeiro e plano de ação personalizado",
  "Organização do orçamento e do fluxo de caixa",
  "Plano para a reserva de emergência e os objetivos",
  "Análise da proteção da família e do patrimônio",
  "Orientação sobre investimentos e aposentadoria",
  "Reuniões de acompanhamento durante 12 meses",
  "Apoio do consultor nas decisões financeiras",
];

/** Textos da especificação em PDF. */
export const TEXTOS_PDF = {
  marca: "Grupo Life Brasil",
  submarca: "Life Financial Planning",
  titulo: "Especificação · Planejamento financeiro",
  subtitulo: "Acompanhamento anual do planejamento financeiro",
  introducao:
    "Esta especificação resume o valor do acompanhamento anual do seu planejamento financeiro e a condição de pagamento combinada.",
  base: "O valor do plano é calculado sobre a renda bruta anual da família (renda bruta mensal × 12).",
  estimada: "Renda bruta estimada a partir da renda líquida informada.",
  aceite: "De acordo com as condições desta especificação.",
};
