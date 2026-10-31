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
}

/** Perfil comportamental (DISC) sugerido a partir da transcrição. */
export interface PerfilComportamental {
  /** Fator predominante: D (Dominância), I (Influência), S (Estabilidade), C (Conformidade). */
  predominante?: "D" | "I" | "S" | "C";
  /** Fator secundário, quando houver. */
  secundario?: "D" | "I" | "S" | "C";
  /** Intensidade estimada de cada fator (0 a 100). */
  intensidade?: Partial<Record<"D" | "I" | "S" | "C", number>>;
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
}

/** Resultado da análise da reunião. Todos os campos são editáveis. */
export interface AnaliseReuniao {
  dores: string[];
  preocupacoes: string[];
  gatilhos: string[];
  notas: {
    objecoes: string[];
    gaps: string[];
    perguntasV2: string[];
    riscos: string[];
    oportunidades: string[];
    livre?: string;
  };
  perfil: PerfilComportamental;
  /** Origem: "ia" (Claude), "manual" ou "colada" (resposta copiada do claude.ai). */
  origem?: "ia" | "manual" | "colada";
  /** Data da última análise (ISO). */
  geradaEm?: string;
  /** Modelo usado na análise por IA. */
  modelo?: string;
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
