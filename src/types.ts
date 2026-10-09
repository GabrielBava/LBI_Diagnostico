// Modelo de dados de um cliente.
// Seções de formulário e listas usam objetos flexíveis (Record / Item) para que
// novos campos possam ser incluídos apenas editando src/config/campos.ts.

export type Valor = string | number | boolean | undefined | null;

/** Linha de uma lista (despesa, dívida, sonho...). Cada coluna configurada vira uma chave. */
export interface Item {
  id: string;
  [campo: string]: Valor;
}

export type Secao = Record<string, Valor>;

export interface Snapshot {
  id: string;
  data: string; // ISO
  titulo: string;
  resumo: string;
  indicadores: Record<string, number>;
}

export interface Cliente {
  id: string;
  criadoEm: string;
  atualizadoEm: string;

  cadastro: Secao;
  parametros: Secao;

  sonhos: Item[];
  filhos: Item[];
  receitas: Item[];
  despesas: Item[];
  patrimonio: Item[];
  dividas: Item[];

  seguro: Secao;
  aposentadoria: Secao;
  alavancagem: Secao;

  plano: Item[];
  historico: Snapshot[];

  /** Anotações livres do consultor em cada etapa (frases do cliente, emoções, objeções). */
  notas: Record<string, string>;
  /** Etapas marcadas como "não se aplica" (ex.: cliente sem filhos ou sem dívidas). */
  naoAplica: Record<string, boolean>;
  /** Perguntas do roteiro já feitas, por etapa (índices marcados). */
  roteiroFeito: Record<string, number[]>;
}

export type ListaId = "sonhos" | "filhos" | "receitas" | "despesas" | "patrimonio" | "dividas" | "plano";
export type SecaoId = "cadastro" | "parametros" | "seguro" | "aposentadoria" | "alavancagem";
