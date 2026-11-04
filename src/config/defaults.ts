// Valores padrão do sistema. Os parâmetros de cada cliente partem daqui
// (veja `padrao` em src/config/campos.ts) e podem ser alterados por cliente.

export const APP = {
  nome: "Diagnóstico LIFE",
  slogan: "Financial Operating System™",
  versao: "v13.0.0",
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
  /** IA escolhida pelo planejador no 8 · Analítico (id de PLATAFORMAS_IA). */
  iaPlataforma: string;
}

/**
 * IAs que o planejador pode usar no 8 · Analítico: copia o prompt, abre a plataforma e cola o
 * resultado de volta. "api" analisa direto pelo Claude com a chave da API (Configurações).
 */
export const PLATAFORMAS_IA = [
  { id: "claude", nome: "Claude", url: "https://claude.ai/new" },
  { id: "chatgpt", nome: "ChatGPT", url: "https://chatgpt.com/" },
  { id: "gemini", nome: "Gemini", url: "https://gemini.google.com/app" },
  { id: "copilot", nome: "Copilot", url: "https://copilot.microsoft.com/" },
  { id: "outra", nome: "Outra IA", url: "" },
  { id: "api", nome: "Claude automático (chave da API)", url: "" },
];

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
  iaPlataforma: "claude",
};
