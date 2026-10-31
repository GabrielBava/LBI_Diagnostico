// Modelo de dados de um cliente (versão 2 do diagnóstico).
import type { AnaliticoPlanejador } from "@/lib/analitico-tipos";
// Seções de formulário e listas usam objetos flexíveis (Secao / Item) para que
// novos campos possam ser incluídos apenas editando src/config/campos.ts.

/** Valor de um campo. Listas de opções marcadas (multiescolha) usam string[]. */
export type Valor = string | number | boolean | string[] | undefined | null;

/** Linha de uma lista (objetivo, imóvel, financiamento...). Cada campo configurado vira uma chave. */
export interface Item {
  id: string;
  [campo: string]: Valor;
}

export type Secao = Record<string, Valor>;

export interface Cliente {
  id: string;
  criadoEm: string;
  atualizadoEm: string;
  /** Versão da estrutura dos dados (conversões que só podem rodar uma vez usam este marcador). */
  versaoDados?: number;
  /** Data em que o consultor clicou em "Finalizar coleta" (libera o pré-diagnóstico e o diagnóstico). */
  coletaFinalizada?: string;

  // Etapa 1 · Conexão
  cadastro: Secao;
  parametros: Secao;
  objetivos: Item[];
  dependentes: Item[];

  // Etapa 2 · Raio-X financeiro
  /** Valor mensal por subcategoria de despesa (chave = "grupo.item", ex.: "casa.aluguel"). */
  despesas: Record<string, number | undefined>;
  /** Itens de despesa acrescentados dentro de um grupo (campo `grupo`). */
  despesasExtras: Item[];
  renda: Secao;
  outrasRendas: Item[];
  cartoes: Item[];
  imoveis: Item[];
  moveis: Item[];
  /** Respostas gerais de 7 · Patrimônio (ex.: "pretende fazer futuras aquisições?"). */
  patrimonioGeral: Secao;
  /** Futuras aquisições de imóveis e veículos. */
  aquisicoes: Item[];
  financiamentos: Item[];
  consorcios: Item[];
  emprestimos: Item[];
  /** FGTS (8 · Financiamento, consórcio e FGTS): tem saldo, valor e se contribui há mais de 2 anos. */
  fgts: Secao;
  projetos: Item[];
  corporativo: Secao;

  // Etapa 3 · Proteção e futuro  /  Etapa 4 · Investimentos
  protecao: Secao;
  /** Aposentadoria: idade, renda desejada, outras rendas, investimento mensal e estilo de vida. */
  futuro: Secao;
  /** Mudanças de vida programadas (impacto, daqui a quantos meses e valor). */
  mudancas: Item[];
  investimentos: Secao;

  // Etapa 5 · Pré-diagnóstico
  /** Data em que o consultor clicou em "Gerar recomendações" (a 5.2 · Recomendações aparece a partir daí). */
  recomendacoesAbertas?: string;
  /** Data em que o consultor clicou em "Finalizar recomendações" (5.2). */
  recomendacoesFinalizadas?: string;
  /** Indicações do cliente em 5.2 · Recomendações (nome e contato). */
  recomendacoes: Item[];

  // Etapa 6 · Diagnóstico completo
  /** Cartões do consultor no Plano atual (diagnóstico, motivo, risco da inação). */
  planoAtual: Item[];
  /** Cartões do consultor no Plano potencial (oportunidade, como atuar, objetivo). */
  planoPotencial: Item[];
  /** Cartões do consultor no Plano otimização (descrição, motivo da escolha, como melhorar). */
  planoOtimizacao: Item[];
  /** Cartões automáticos ocultos pelo consultor (id do cartão → true). */
  cardsOcultos: Record<string, boolean>;
  /** Simulação do 6.5 · Futuro (aporte, retorno real, idade e renda); em branco valem os dados da coleta. */
  simulacao: Secao;
  plano: Item[];

  // Etapa 7 · Especificação (proposta do planejamento: percentual, desconto, forma de pagamento)
  especificacao: Secao;

  // Etapa 8 · Analítico do Planejador (transcrições e análise da reunião)
  analitico: AnaliticoPlanejador;

  /** Encontros da antiga etapa Jornada (removida na v11); guardados só para não perder dados. */
  jornada: Item[];

  /** Anotações do consultor por seção. */
  notas: Record<string, string>;
  /** Seções marcadas como "não se aplica". */
  naoAplica: Record<string, boolean>;
  /** Perguntas do roteiro já feitas, por seção (índices). */
  roteiroFeito: Record<string, number[]>;
  /** Visibilidade de cada seção na versão apresentação (true = oculta). */
  ocultos: Record<string, boolean>;
}

export type ListaId =
  | "objetivos"
  | "dependentes"
  | "despesasExtras"
  | "outrasRendas"
  | "cartoes"
  | "imoveis"
  | "moveis"
  | "aquisicoes"
  | "mudancas"
  | "financiamentos"
  | "consorcios"
  | "emprestimos"
  | "projetos"
  | "recomendacoes"
  | "planoAtual"
  | "planoPotencial"
  | "planoOtimizacao"
  | "plano"
  | "jornada";

export type SecaoId =
  | "cadastro"
  | "parametros"
  | "renda"
  | "patrimonioGeral"
  | "corporativo"
  | "protecao"
  | "investimentos"
  | "futuro"
  | "simulacao"
  | "fgts"
  | "especificacao";
