// =====================================================================
//  PRECIFICAÇÃO DO PLANEJAMENTO (etapa 7) — parâmetros e textos
//  ---------------------------------------------------------------------
//  Valor do plano = renda bruta anual (cliente + cônjuge, × 12) × percentual do
//  modelo de consultoria − desconto do consultor (ou o valor digitado por ele),
//  nunca abaixo do VALOR_MINIMO. Pix ou boleto têm desconto; no cartão entram as
//  taxas da maquininha (mesma tabela do slide 11 da proposta comercial).
//  A nota fiscal (18,5%) sai do valor recebido (só na tela do consultor).
//  As contas ficam em src/lib/especificacao.ts. Percentuais em % (3 = 3%).
//  Os modelos de consultoria abaixo são uma proposta inicial: ajuste à vontade.
// =====================================================================

/** Percentual padrão do planejamento sobre a renda bruta anual (%), o do modelo Contrato. */
export const PERCENTUAL_PADRAO = 3;

/** Valor mínimo do plano (R$): nenhuma condição de pagamento fica abaixo dele. */
export const VALOR_MINIMO = 2790;

/** Imposto da emissão da nota fiscal (%), descontado do valor recebido. */
export const IMPOSTO_NOTA_FISCAL = 18.5;

/** Modelo de consultoria: duração, limite de reuniões, cronograma, regras de entrada e o que inclui. */
export interface ModeloConsultoria {
  id: "pontual" | "contrato" | "concierge";
  nome: string;
  resumo: string;
  /** Percentual padrão sobre a renda bruta anual (%). */
  percentual: number;
  duracao: string;
  /** Limite de reuniões no período. */
  reunioes: number;
  cronograma: { quando: string; oque: string }[];
  regras: string[];
  inclui: string[];
}

export const MODELOS_CONSULTORIA: ModeloConsultoria[] = [
  {
    id: "pontual",
    nome: "Consultoria pontual",
    resumo: "Diagnóstico completo e plano de ação para uma decisão ou momento específico, sem acompanhamento contínuo.",
    percentual: 1.5,
    duracao: "60 dias",
    reunioes: 3,
    cronograma: [
      { quando: "Semana 1", oque: "Reunião de diagnóstico completo (V2) com o plano de ação" },
      { quando: "Semanas 2 a 4", oque: "Reunião de implementação das prioridades" },
      { quando: "Até 60 dias", oque: "Reunião de fechamento e dúvidas" },
    ],
    regras: [
      "Pagamento integral (Pix/boleto ou cartão) antes da primeira reunião",
      "Coleta de dados concluída (etapas 1 a 4)",
      "Reuniões não usadas em 60 dias expiram",
      "Reunião extra: cobrada à parte",
    ],
    inclui: ["Diagnóstico financeiro completo", "Plano de ação priorizado", "Até 3 reuniões em 60 dias", "Suporte por mensagem até o fechamento"],
  },
  {
    id: "contrato",
    nome: "Contrato · planejamento anual",
    resumo: "Acompanhamento de 12 meses: diagnóstico, implementação das prioridades e revisões ao longo do ano.",
    percentual: PERCENTUAL_PADRAO,
    duracao: "12 meses",
    reunioes: 8,
    cronograma: [
      { quando: "Mês 1", oque: "Diagnóstico completo e plano de ação (2 reuniões)" },
      { quando: "Meses 2 e 3", oque: "Implementação das prioridades (2 reuniões)" },
      { quando: "Meses 4 a 11", oque: "Acompanhamento trimestral (3 reuniões)" },
      { quando: "Mês 12", oque: "Revisão anual e renovação (1 reunião)" },
    ],
    regras: [
      "Assinatura da precificação/contrato e primeiro pagamento",
      "Início em até 7 dias após o pagamento",
      "Até 8 reuniões no ano; as não usadas não passam para o ano seguinte",
      "Suporte por mensagem em horário comercial",
    ],
    inclui: [
      "Diagnóstico e plano de ação personalizado",
      "Organização do orçamento e do fluxo de caixa",
      "Plano para a reserva de emergência e os objetivos",
      "Análise da proteção da família e do patrimônio",
      "Orientação sobre investimentos e aposentadoria",
      "Até 8 reuniões em 12 meses",
    ],
  },
  {
    id: "concierge",
    nome: "Concierge",
    resumo: "Acompanhamento próximo de 12 meses, com reunião mensal, atendimento prioritário e apoio na implementação.",
    percentual: 4.5,
    duracao: "12 meses",
    reunioes: 12,
    cronograma: [
      { quando: "Mês 1", oque: "Diagnóstico completo e plano de ação (2 reuniões)" },
      { quando: "Meses 2 a 11", oque: "Reunião mensal de acompanhamento (9 reuniões)" },
      { quando: "Durante o ano", oque: "Atendimento prioritário e apoio na implementação (bancos, seguros, investimentos e documentos)" },
      { quando: "Mês 12", oque: "Revisão anual e renovação (1 reunião)" },
    ],
    regras: [
      "Assinatura da precificação/contrato e primeiro pagamento",
      "Indicado para famílias com decisões mais complexas (empresa, imóveis, sucessão)",
      "Até 12 reuniões no ano; resposta em até 1 dia útil",
      "Início em até 7 dias após o pagamento",
    ],
    inclui: [
      "Tudo do planejamento anual",
      "Reunião mensal de acompanhamento",
      "Atendimento prioritário",
      "Apoio na implementação junto a bancos, seguradoras e corretoras",
      "Até 12 reuniões em 12 meses",
    ],
  },
];

/** Modelo usado quando o consultor ainda não escolheu. */
export const MODELO_PADRAO: ModeloConsultoria["id"] = "contrato";

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

/** Textos da precificação em PDF. */
export const TEXTOS_PDF = {
  marca: "Grupo Life Brasil",
  submarca: "Life Financial Planning",
  titulo: "Precificação · Planejamento financeiro",
  subtitulo: "Modelo de consultoria, valor do plano e condição de pagamento",
  introducao:
    "Esta precificação resume o modelo de consultoria escolhido, o valor do seu planejamento financeiro e a condição de pagamento combinada.",
  base: "O valor do plano é calculado sobre a renda bruta anual da família (renda bruta mensal × 12).",
  estimada: "Renda bruta estimada a partir da renda líquida informada.",
  aceite: "De acordo com as condições desta precificação.",
};
