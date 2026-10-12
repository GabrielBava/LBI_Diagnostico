// Modelo de dados de um cliente (versão 2 do diagnóstico).
// Seções de formulário e listas usam objetos flexíveis (Secao / Item) para que
// novos campos possam ser incluídos apenas editando src/config/campos.ts.

export type Valor = string | number | boolean | undefined | null;

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

  // Etapa 1 · Conexão
  cadastro: Secao;
  parametros: Secao;
  objetivos: Item[];
  dependentes: Item[];

  // Etapa 2 · Raio-X financeiro
  /** Valor mensal por categoria de despesa (chave = id da categoria). */
  despesas: Record<string, number | undefined>;
  despesasExtras: Item[];
  renda: Secao;
  outrasRendas: Item[];
  imoveis: Item[];
  moveis: Item[];
  financiamentos: Item[];
  consorcios: Item[];
  emprestimos: Item[];
  projetos: Item[];
  corporativo: Secao;

  // Etapa 3 · Proteção  /  Etapa 4 · Investimentos
  protecao: Secao;
  investimentos: Secao;

  // Etapa 6 · Diagnóstico completo
  futuro: Secao;
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
