// Valores padrão do sistema. Os parâmetros de cada cliente partem daqui
// (veja `padrao` em src/config/campos.ts) e podem ser alterados por cliente.

export const APP = {
  nome: "Diagnóstico LIFE",
  slogan: "Financial Operating System™",
  versao: "v3.0.0",
};

export interface ConfigConsultor {
  consultor: string;
  empresa: string;
}

export const CONFIG_PADRAO: ConfigConsultor = {
  consultor: "Gabriel Bavaresco",
  empresa: "Life Financial Planning",
};
