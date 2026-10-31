// =====================================================================
//  DIAGNÓSTICO EM PDF — textos fixos (modelo LIFE do Alberto)
//  ---------------------------------------------------------------------
//  Edite aqui os textos institucionais do PDF (capa, capítulos, títulos,
//  princípios, referências, próximo passo, disclaimer e glossário).
//  Os números e as frases que dependem dos dados do cliente são montados
//  em src/components/relatorio/ (dados.ts e paginas.tsx).
//  Marcadores entre chaves são trocados pelo valor do cliente:
//    {meses} -> meses da meta de reserva de emergência (parâmetros)
//    {meta}  -> taxa de poupança mínima do modelo 50-30-20
// =====================================================================

export interface CapituloRelatorio {
  numero: string;
  /** Nome no sumário. */
  sumario: string;
  /** Título da página de abertura e do cabeçalho das páginas do capítulo. */
  titulo: string;
  /** Frase da metade azul da página de abertura. */
  frase: string;
}

export const RELATORIO = {
  /** Marca do sistema (capa e rodapé). */
  sistema: "LIFE FINANCIAL OPERATING SYSTEM™",
  /** Nome da plataforma no rodapé e na capa (seguido da versão e da data). */
  plataforma: "Plataforma LIFE",
  /** Aviso do rodapé de todas as páginas. */
  aviso:
    "Material educacional e consultivo. Este diagnóstico aponta caminhos e cenários com base nas informações prestadas pelo cliente; a decisão final de contratação, investimento ou estruturação é exclusiva do cliente, que assume integralmente seus riscos. A LIFE Brasil e o LIFE Financial Planner™ não se responsabilizam por escolhas, omissões ou resultados decorrentes da decisão do cliente — nosso papel é mostrar o caminho.",

  capa: {
    subtitulo: "Diagnóstico Patrimonial Estruturado",
    /** Cada item é uma linha do título. */
    titulo: ["Plano de Vida", "Financeira"],
    lema: "Atual · Necessário · Diferença · Decisão",
    rotuloCliente: "CLIENTE",
    /** E-mail do consultor na capa (em branco, a linha não aparece). */
    emailConsultor: "gabriel.bavaresco@grupolifebrasil.com.br",
  },

  sumario: {
    rotulo: "ÍNDICE",
    cabecalho: "SUMÁRIO",
    titulo: "Sumário",
    subtitulo: "Cada capítulo apresenta o que existe hoje, o que é necessário e as decisões que devem ser avaliadas com o cliente.",
  },

  capitulos: [
    {
      numero: "01",
      sumario: "Visão Executiva",
      titulo: "Visão Executiva",
      frase: "A situação atual, o necessário e as decisões organizadas por prioridade e prazo.",
    },
    {
      numero: "02",
      sumario: "Sonhos e Objetivos",
      titulo: "Sonhos e Objetivos de Vida",
      frase: "Cada objetivo declarado é apresentado pela situação atual e pelo necessário para orientar a decisão do cliente.",
    },
    {
      numero: "03",
      sumario: "Família e Educação",
      titulo: "Família e Educação",
      frase: "Educação dos filhos é meta inegociável — reforça o propósito do plano e é calculada com inflação real brasileira.",
    },
    {
      numero: "04",
      sumario: "Fluxo de Caixa Mensal",
      titulo: "Fluxo de Caixa Mensal",
      frase: "Receitas vs Despesas: desenhamos o motor do plano. Sem superávit, não há acumulação.",
    },
    {
      numero: "05",
      sumario: "Patrimônio e Reserva",
      titulo: "Patrimônio e Reserva",
      frase: "Ativos vs Dívidas: mostramos a foto real do balanço e blindamos o presente com {meses} meses de reserva.",
    },
    {
      numero: "06",
      sumario: "PROTEÇÃO PATRIMONIAL - Vida",
      titulo: "PROTEÇÃO PATRIMONIAL - Vida",
      frase: "Referências de necessidade de cobertura aplicadas ao planejamento da proteção familiar e patrimonial.",
    },
    {
      numero: "07",
      sumario: "Independência Financeira",
      titulo: "Independência Financeira",
      frase: "Regra dos 25x e Regra dos 4% — sua liberdade financeira medida em anos.",
    },
    {
      numero: "08",
      sumario: "Alavancagem Inteligente",
      titulo: "Alavancagem Patrimonial",
      frase: "Comparação entre formas de aquisição, custos, prazo, liquidez e riscos.",
    },
    {
      numero: "09",
      sumario: "Alertas e Plano de Ação",
      titulo: "Alertas e Plano de Ação",
      frase: "Onde focar primeiro — prioridades, prazos e responsáveis.",
    },
    {
      numero: "10",
      sumario: "Por que LIFE Brasil",
      titulo: "Por que LIFE Brasil",
      frase: "A diferença entre saber e colocar o plano em ação vale milhões.",
    },
  ] satisfies CapituloRelatorio[],

  /** Rótulos dos três cartões do bloco decisório. */
  bloco: { objetivo: "OBJETIVO", realidade: "REALIDADE", ajuste: "AJUSTE LIFE™" },

  // ------------------------------------------------------- 01 · Visão Executiva
  visao: {
    titulo: "Atual x Necessário x Decisão do cliente",
    subtitulo: "Leitura direta do diagnóstico: o cliente avalia e decide se e como seguirá cada orientação.",
    decisaoRotulo: "DECISÃO DO CLIENTE",
    decisaoTexto:
      "Prioridade e prazo organizam a conversa. A decisão final de contratar, investir ou estruturar pertence ao cliente, após avaliar alternativas, custos, riscos e condições.",
  },
  indicadores: {
    titulo: "Indicadores financeiros atuais",
    subtitulo: "Valores objetivos que sustentam a leitura do diagnóstico.",
    principioRotulo: "PRINCÍPIO LIFE™",
    principioTexto:
      "Riqueza não é apenas o que se ganha: é o que se preserva, protege e transfere com eficiência. Cada capítulo apresenta dados atuais, necessidades calculadas e decisões que pertencem ao cliente.",
  },

  // ------------------------------------------------- 02 · Sonhos e Objetivos
  objetivos: {
    // Substitui a "Probabilidade atual x Objetivo" do modelo (as probabilidades saíram do sistema).
    coberturaTitulo: "Cobertura atual x Objetivo",
    coberturaSubtitulo:
      "A diferença até 100% mostra a parte do aporte mensal de cada objetivo que a sobra livre ainda não cobre e orienta a decisão do cliente.",
    coberturaGrafico: "Cobertura pela sobra livre — Atual x Objetivo",
    coberturaNota: "Sobra livre distribuída na ordem Essencial → Desejo → Sonho e, dentro de cada um, por prioridade.",
    valorGrafico: "Valor futuro por sonho (R$)",
    valorGraficoSub: "Quanto cada objetivo custará no momento de sua realização",
    detalheTitulo: "Detalhamento dos Objetivos",
  },

  // ------------------------------------------------- 03 · Família e Educação
  educacao: {
    titulo: "Custo Educacional — Hoje x Futuro",
    grafico: "Educação por filho — custo total de escola e faculdade",
    detalheTitulo: "Detalhamento por Filho",
    blocoTitulo: "BLOCO DECISÓRIO — EDUCAÇÃO",
    objetivo: "Escola e faculdade integralmente provisionadas",
  },

  // ----------------------------------------------- 04 · Fluxo de Caixa Mensal
  fluxo: {
    titulo: "Fluxo de Caixa Mensal",
    subtitulo: "Quanto entra, quanto sai e quanto sobra — o motor do seu plano.",
    grafico: "Fluxo mensal (R$)",
    categorias: "Despesas por categoria",
    blocoTitulo: "BLOCO DECISÓRIO — FLUXO DE CAIXA",
    objetivo: "Taxa de poupança mínima de {meta}/mês",
    ajusteAlinhado: "Direcionar superávit para metas estruturadas",
  },

  // ------------------------------------------------- 05 · Patrimônio e Reserva
  patrimonio: {
    titulo: "Balanço Patrimonial",
    subtitulo: "Composição por classe e distribuição de liquidez — como seu patrimônio está alocado e quão acessível ele é.",
    grafico: "Composição patrimonial por classe",
    graficoSub: "Concentração ideal: nenhuma classe acima de 40%",
    liquidezTitulo: "Distribuição por Liquidez",
    liquidezGrafico: "Distribuição por liquidez",
    liquidezSub: "Alta = reserva de emergência (D+0/D+1) · Média = investimentos e previdência · Baixa = imóveis, veículos e empresa",
    reservaTitulo: "Reserva de Emergência — Blindagem de Curto Prazo",
    reservaSubtitulo: "Padrão LFP™ Brasil: {meses} meses de despesas em liquidez D+0/D+1 (Tesouro Selic, CDB 100% CDI liquidez diária).",
    reservaGrafico: "Atual x Necessário",
    reservaGraficoSub: "{meses} meses de despesas em liquidez imediata",
    defensivaTitulo: "Bloco Decisório — Liquidez Defensiva",
    defensivaBloco: "BLOCO DECISÓRIO — LIQUIDEZ DEFENSIVA",
    defensivaObjetivo: "{meses} meses de despesas em liquidez D+0",
  },

  // ------------------------------------------ 06 · PROTEÇÃO PATRIMONIAL - Vida
  protecao: {
    referenciasTitulo: "Necessidade de Seguro — Três Referências",
    referenciasSubtitulo:
      "Na dimensão PROTEÇÃO PATRIMONIAL - Vida, o capital necessário depende de quantos anos de padrão de vida ficam garantidos à família (1, 5 ou 15 anos). Objetivo - Atual revela a diferença a avaliar.",
    caixaRotulo: "ATUAL x NECESSÁRIO = DIFERENÇA",
    caixaDecisao: "Decisão: o cliente avalia como estruturar a cobertura.",
    metodosTitulo: "Referências de Cobertura",
    metodosGrafico: "Referências de cobertura — Atual x Necessidade estimada",
    metodosGraficoSub: "Estimativa de planejamento; contratação e cobertura dependem de análise e condições da seguradora.",
    composicaoTitulo: "Do que é feita a necessidade de seguro",
    composicaoSubtitulo:
      "Cada bloco é uma necessidade real da família. O capital necessário é a soma destes blocos, menos os recursos que a família já tem.",
    blocos: {
      padraoVida: {
        titulo: "Padrão de vida da família",
        texto: "O dinheiro que a família precisa por mês para manter a mesma vida de hoje: casa, alimentação, saúde e transporte.",
      },
      sucessao: {
        titulo: "Inventário e custos da sucessão",
        texto: "A conta que a família paga para transferir os bens: imposto de transmissão (ITCMD), honorários advocatícios e custas.",
      },
      educacao: {
        titulo: "Educação dos filhos",
        texto: "O custo de concluir os estudos dos filhos mesmo sem a renda do provedor, já corrigido pela inflação educacional.",
      },
      quitacao: {
        titulo: "Quitação de dívidas",
        texto: "O saldo devedor que continuaria com a família e consumiria a renda restante.",
      },
      recursos: {
        titulo: "Recursos que a família já tem",
        texto: "Reserva de emergência, investimentos e previdência ficam com a família e reduzem o capital a contratar.",
      },
    },
    sucessaoTitulo: "Sucessão e Inventário",
    sucessaoSubtitulo:
      "Inventário (ITCMD), honorários e custas x liquidez informada — valores efetivos dependem dos bens, do estado e da estrutura jurídica.",
    sucessaoCaixa: "COMO O SEGURO DE VIDA PODE APOIAR",
    sucessaoGrafico: "Proteção sucessória: Atual x Necessário",
    sucessaoGraficoSub: "A diferença orienta a decisão do cliente",
    principiosTitulo: "Princípios de Proteção — Leitura Responsável",
    principios: [
      "A renda sustenta o padrão de vida familiar; sua proteção deve ser analisada antes de assumir novos compromissos.",
      "O seguro de vida transfere riscos previstos na apólice e pode pagar capital aos beneficiários quando ocorre um evento coberto.",
      "O seguro pode fornecer liquidez aos beneficiários sem depender da venda de ativos; prazo e condições seguem a apólice e a regulação.",
      "PGBL e VGBL podem pagar valores diretamente a beneficiários e não sofrem ITCMD nesse repasse por morte, conforme o STF. Isso não significa que estejam sempre fora de inventário ou partilha: natureza, fase, aportes e circunstâncias devem ser avaliados juridicamente.",
      "Estratégias de aquisição, como consórcio ou financiamento, devem ser comparadas pelo custo, prazo, liquidez e risco antes da decisão.",
      "Revisões periódicas ajudam a manter capital segurado, coberturas e beneficiários coerentes com renda, dívidas e estrutura familiar.",
    ],
    conclusaoTitulo: "Conclusão MDRT",
    conclusaoRotulo: "CONCLUSÃO MDRT",
    conclusaoTexto: "Planejamento sem proteção é otimismo — não é estratégia.",
    blocoTitulo: "BLOCO DECISÓRIO — PROTEÇÃO FINANCEIRA",
    objetivo: "Objetivo: apoiar a preservação do padrão de vida e da renda",
    ajuste: "Cliente decide como estruturar a cobertura após avaliar alternativas",
  },

  // --------------------------------------------- 07 · Independência Financeira
  independencia: {
    curvaTitulo: "Curva Patrimonial até a Independência",
    curvaGrafico: "Patrimônio projetado ao longo do tempo",
    gapsTitulo: "Gaps a Fechar",
    gapsSubtitulo: "O que separa a realidade de hoje do plano LIFE™ de independência.",
    gapsGrafico: "Aposentadoria: Atual x Necessário",
    blocoTitulo: "BLOCO DECISÓRIO — INDEPENDÊNCIA",
    referenciasTitulo: "Referências de Cálculo — Brasil",
    referenciasSubtitulo: "Parâmetros educacionais para comparação; não são garantia de retorno, enquadramento tributário ou resultado.",
    referencias: [
      { titulo: "Regra dos 25x", texto: "Patrimônio alvo = despesa anual x 25. Corolário direto da Regra dos 4%." },
      {
        titulo: "Regra dos 4% (Trinity Study)",
        texto:
          "Referência histórica de retirada inicial, sujeita a horizonte, carteira, inflação, custos, impostos e sequência de retornos; não garante preservação do principal.",
      },
      { titulo: "Regra 72", texto: "Anos para dobrar o capital = 72 ÷ retorno real % a.a." },
      {
        titulo: "Referências Brasil",
        texto: "Selic, CDI e títulos indexados ao IPCA são comparadores; retorno líquido depende de prazo, custos, impostos, risco e produto.",
      },
      {
        titulo: "PGBL",
        texto:
          "Contribuições podem ser dedutíveis até 12% dos rendimentos tributáveis na declaração completa, observados os requisitos legais, inclusive previdência oficial quando aplicável; o IR incide sobre o valor recebido.",
      },
      { titulo: "VGBL", texto: "Não gera a dedução do PGBL; no resgate ou benefício, o IR incide sobre a parcela de rendimentos, conforme o regime escolhido." },
      {
        titulo: "ITCMD e previdência",
        texto: "O STF afastou o ITCMD no repasse por morte de PGBL/VGBL aos beneficiários. Inventário, partilha e outras consequências exigem análise do caso concreto.",
      },
    ],
  },

  // --------------------------------------------- 08 · Alavancagem Patrimonial
  alavancagem: {
    // O sistema não simula financiamento x consórcio: as páginas trazem as aquisições e os créditos informados.
    estrategiasTitulo: "Estratégias de Aquisição",
    estrategiasSubtitulo: "Aquisições planejadas e compromissos de crédito informados na coleta.",
    estrategiasGrafico: "Valor das aquisições planejadas por estratégia",
    consorcioTitulo: "Consórcio x Financiamento",
    consorcioSubtitulo: "Compromissos de crédito atuais: consórcios, financiamentos e empréstimos informados.",
    consorcioGrafico: "Parcelas mensais por tipo",
    blocoPagina: "Bloco Decisório — Aquisição do Bem",
    blocoTitulo: "BLOCO DECISÓRIO — AQUISIÇÃO DO BEM",
    ajustePadrao: "Comparar consórcio, financiamento e compra à vista pelo custo, prazo, liquidez e risco antes da decisão",
  },

  // --------------------------------------------- 09 · Alertas e Plano de Ação
  alertas: {
    titulo: "Alertas Críticos",
    subtitulo: "O que merece atenção imediata para evitar destruição de capital.",
    planoTitulo: "Plano de Ação Estruturado",
    planoSubtitulo: "Recomendações para apoiar a decisão do cliente, organizadas por prioridade e prazo.",
    planoSubtituloAutomatico:
      "Recomendações sugeridas pelo diagnóstico para apoiar a decisão do cliente, organizadas por prioridade e prazo.",
  },

  // ------------------------------------------------- 10 · Por que LIFE Brasil
  proximoPasso: {
    titulo: "Próximo Passo — Implementação LIFE™",
    paragrafos: [
      "Este diagnóstico evidencia diferenças entre a situação atual e os objetivos informados. Adiar decisões pode alterar custos, prazos e exposição a riscos; cada alternativa deve ser avaliada conforme as condições vigentes.",
      "A LIFE Brasil estrutura e acompanha decisões financeiras. A contratação de produtos é uma decisão exclusiva do cliente, após avaliar custos, riscos, condições e adequação.",
    ],
    itens: [
      "Planejador LFP™ dedicado e revisões trimestrais",
      "PROTEÇÃO PATRIMONIAL - Vida com comparação entre HLV, DIME e 10x renda",
      "Previdência PGBL/VGBL alinhada aos objetivos de longo prazo",
      "Comparação de consórcio, financiamento e compra à vista, com custos e liquidez",
      "Revisão integrada da carteira, incluindo a decisão sobre exposição internacional",
      "Acompanhamento do plano com prioridades, prazos e revisões periódicas",
    ],
    caixaRotulo: "PRÓXIMO PASSO — REUNIÃO DE IMPLEMENTAÇÃO LIFE™",
    caixaTexto:
      "Em 90 minutos transformamos este diagnóstico em prioridades, coberturas e alocações financeiras claras. Cada dia adiado reduz o tempo disponível para construir resultados. LIFE Brasil — grupolifebrasil.com.br · planejamento@grupolifebrasil.com.br",
  },
  disclaimer: {
    rotulo: "RESPONSABILIDADE E DECISÃO — DISCLAIMER LIFE™",
    texto:
      "Este diagnóstico é um instrumento educacional, consultivo e estratégico, elaborado a partir das informações prestadas pelo próprio cliente. Os cenários, projeções e recomendações apresentados têm caráter ORIENTATIVO e não constituem garantia de rentabilidade, oferta de produto financeiro ou parecer jurídico, tributário ou contábil vinculante. A decisão de contratar, investir, alocar, proteger ou estruturar patrimônio é EXCLUSIVA do cliente, que declara compreender os riscos envolvidos. A LIFE Brasil, seus sócios, parceiros e o LIFE Financial Planner™ responsável não respondem por escolhas, omissões, atrasos ou resultados decorrentes da decisão soberana do cliente. Nosso compromisso é mostrar o caminho com técnica, transparência e método — caminhar é decisão sua.",
  },

  // ----------------------------------------------------------- Apêndice
  glossario: {
    rotulo: "APÊNDICE",
    cabecalho: "GLOSSÁRIO",
    titulo: "Glossário Técnico",
    itens: [
      ["MDRT", "Million Dollar Round Table — associação internacional de profissionais de seguros e serviços financeiros."],
      ["LFP™", "Life Financial Planning — metodologia LIFE Brasil de planejamento integrado (fluxo, patrimônio, proteção e objetivos)."],
      ["HLV", "Human Life Value — valor presente da renda futura do segurado, descontado a taxa de mercado."],
      ["DIME", "Debt + Income + Mortgage + Education — dívidas + 10x renda + imóvel + educação."],
      ["Regra 4%", "Referência histórica de retirada inicial, sujeita a premissas e sem garantia de preservação do principal."],
      ["Regra 25x", "Patrimônio alvo = despesa anual x 25 (corolário da Regra dos 4%)."],
      ["Regra 72", "Anos para dobrar o capital = 72 ÷ retorno real % a.a."],
      ["ITCMD", "Imposto estadual sobre transmissão causa mortis e doação; alíquota e aplicação dependem da legislação pertinente."],
      ["PGBL", "Plano de previdência complementar aberta; a dedução de contribuições pode chegar a 12% dos rendimentos tributáveis, se cumpridos os requisitos legais."],
      ["VGBL", "Seguro de pessoas com cobertura por sobrevivência; no resgate ou benefício, o IR incide sobre os rendimentos, conforme as regras aplicáveis."],
      ["Consórcio LIFE™", "Aquisição preservando capital investido enquanto adquire o bem."],
    ] as [string, string][],
  },
};

/** Troca os marcadores {chave} pelos valores (ex.: "{meses} meses" -> "6 meses"). */
export const preencher = (texto: string, valores: Record<string, string | number>) =>
  texto.replace(/\{(\w+)\}/g, (m, chave: string) => (chave in valores ? String(valores[chave]) : m));
