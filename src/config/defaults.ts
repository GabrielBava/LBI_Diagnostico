// Valores padrão do sistema. Os parâmetros de cada cliente partem daqui
// (veja `padrao` em src/config/campos.ts) e podem ser alterados por cliente.

export const APP = {
  nome: "Diagnóstico LIFE",
  slogan: "Financial Operating System™",
  versao: "v11.0.0",
};

export interface ConfigConsultor {
  consultor: string;
  empresa: string;
  /** E-mail do consultor (capa do diagnóstico em PDF). */
  email: string;
  /** Chave da API do Claude (Anthropic) para o 8 · Analítico. Fica só neste navegador. */
  claudeChave: string;
  /** Modelo do Claude usado na análise da reunião. */
  claudeModelo: string;
}

/** Modelos do Claude oferecidos nas Configurações (o primeiro é o padrão). */
export const MODELOS_CLAUDE = [
  { id: "claude-opus-5-5", nome: "Claude Opus 5.5", detalhe: "recomendado" },
  { id: "claude-sonnet-5-5", nome: "Claude Sonnet 5.5", detalhe: "mais rápido e barato" },
  { id: "claude-haiku-5-5", nome: "Claude Haiku 5.5", detalhe: "mais econômico" },
];

export const CONFIG_PADRAO: ConfigConsultor = {
  consultor: "Gabriel Bavaresco",
  empresa: "Life Financial Planning",
  email: "gabriel.bavaresco@grupolifebrasil.com.br",
  claudeChave: "",
  claudeModelo: MODELOS_CLAUDE[0].id,
};
