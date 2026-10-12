// Modelo de dados de um cliente (versão 2 do diagnóstico).
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
  financiamentos: Item[];
  consorcios: Item[];
  emprestimos: Item[];
  projetos: Item[];
  corporativo: Secao;

  // Etapa 3 · Proteção e futuro  /  Etapa 4 · Investimentos
  protecao: Secao;
  /** Aposentadoria: idade, renda desejada, outras rendas e estilo de vida. */
  futuro: Secao;
  investimentos: Secao;

  // Etapa 6 · Diagnóstico completo
  pontosFortes: Item[];
  pontosNegativos: Item[];
  plano: Item[];

  // Etapa 7 · Jornada
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
  | "financiamentos"
  | "consorcios"
  | "emprestimos"
  | "projetos"
  | "pontosFortes"
  | "pontosNegativos"
  | "plano"
  | "jornada";

export type SecaoId =
  | "cadastro"
  | "parametros"
  | "renda"
  | "corporativo"
  | "protecao"
  | "investimentos"
  | "futuro";
