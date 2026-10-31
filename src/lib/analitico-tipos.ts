// Tipos da etapa 8 · Analítico do Planejador (transcrições da reunião e análise).
// A análise pode vir da IA (Claude) ou ser escrita/ajustada à mão pelo planejador.

/** Uma transcrição anexada (Parte 1, Parte 2...). */
export interface Transcricao {
  id: string;
  /** "Parte 1", "Parte 2"… (editável). */
  titulo: string;
  /** Texto da transcrição (colado ou lido do arquivo). */
  texto: string;
  /** Nome do arquivo de origem, quando veio de um arquivo. */
  arquivo?: string;
  /** Data em que foi anexada (ISO). */
  anexadaEm: string;
  /** false = fica fora da próxima análise (para analisar as partes separadas). */
  incluir?: boolean;
}

export type FatorDisc = "D" | "I" | "S" | "C";
export const FATORES_DISC: FatorDisc[] = ["D", "I", "S", "C"];

/** Item de uma lista da análise: frase curta + trecho da fala do cliente (evidência). */
export interface ItemAnalise {
  id: string;
  texto: string;
  /** Trecho literal da fala do cliente que sustenta o item (sem aspas). */
  evidencia?: string;
  /** Evidência fraca ou indireta (a IA não tem certeza). */
  fraca?: boolean;
}

/** Perfil comportamental (DISC) sugerido a partir da transcrição. */
export interface PerfilComportamental {
  /** Fator predominante: D (Dominância), I (Influência), S (Estabilidade), C (Conformidade). */
  predominante?: FatorDisc;
  /** Fator que a IA sugeriu (para mostrar quando o consultor ajustou à mão). */
  predominanteIA?: FatorDisc;
  /** Fator secundário, quando houver. */
  secundario?: FatorDisc;
  /** Intensidade estimada de cada fator (0 a 100). */
  intensidade?: Partial<Record<FatorDisc, number>>;
  /** Quanto a transcrição sustenta o perfil. */
  confianca?: "alta" | "media" | "baixa";
  /** Classificação curta (ex.: "Analítico cauteloso"). */
  classificacao?: string;
  resumo?: string;
  comoFala?: string[];
  comoDecide?: string[];
  prefere?: string[];
  evita?: string[];
  /** Como conduzir a V2 com este cliente (linguagem, ritmo, provas). */
  comoAbordarNaV2?: string[];
  frasesQueConectam?: string[];
  /** Trechos da fala do cliente que sustentam o perfil. */
  evidencias?: string[];
}

export interface NotasPlanejador {
  objecoes: ItemAnalise[];
  gaps: ItemAnalise[];
  perguntasV2: ItemAnalise[];
  riscos: ItemAnalise[];
  oportunidades: ItemAnalise[];
  /** Anotações livres do planejador (a IA nunca substitui). */
  livre?: string;
}

/** Resultado da análise da reunião. Todos os campos são editáveis. */
export interface AnaliseReuniao {
  dores: ItemAnalise[];
  preocupacoes: ItemAnalise[];
  gatilhos: ItemAnalise[];
  notas: NotasPlanejador;
  perfil: PerfilComportamental;
  /** Limitações da análise apontadas pela IA (transcrição curta, falas sem nome…). */
  observacoes?: string;
  /** Origem: "ia" (Claude), "manual" ou "colada" (resposta copiada do claude.ai). */
  origem?: "ia" | "manual" | "colada";
  /** Data da última análise (ISO). */
  geradaEm?: string;
  /** Data da última edição à mão (ISO); usada para perguntar antes de reanalisar. */
  editadaEm?: string;
  /** Modelo usado na análise por IA. */
  modelo?: string;
  /** Tempo da análise, em segundos. */
  duracaoSeg?: number;
  /** Tokens de entrada e saída da última análise. */
  tokens?: { entrada: number; saida: number };
  /** Partes analisadas (títulos), na ordem. */
  partes?: string[];
}

/** Dados da etapa 8 guardados com o cliente. */
export interface AnaliticoPlanejador {
  transcricoes: Transcricao[];
  analise?: AnaliseReuniao;
}

export const analiseVazia = (): AnaliseReuniao => ({
  dores: [],
  preocupacoes: [],
  gatilhos: [],
  notas: { objecoes: [], gaps: [], perguntasV2: [], riscos: [], oportunidades: [], livre: "" },
  perfil: {},
});
