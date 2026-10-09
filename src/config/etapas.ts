// =====================================================================
//  JORNADA DO CLIENTE — fases e etapas
//  ---------------------------------------------------------------------
//  A ordem aqui é a ordem do menu e do botão "Próxima etapa".
//  Para criar uma etapa nova: adicione-a em ETAPAS, crie o componente
//  em src/pages/etapas e registre-o em src/pages/etapas/index.tsx.
// =====================================================================

import type { LucideIcon } from "lucide-react";
import {
  Baby,
  ChartColumn,
  CreditCard,
  History,
  Landmark,
  PiggyBank,
  Presentation,
  ReceiptText,
  Rocket,
  Shield,
  Star,
  Target,
  TrendingUp,
  User,
} from "lucide-react";
import type { Cliente } from "@/types";
import { n, s } from "@/lib/calculos";

export type EtapaId =
  | "apresentacao"
  | "cadastro"
  | "sonhos"
  | "filhos"
  | "receitas"
  | "despesas"
  | "patrimonio"
  | "dividas"
  | "seguro"
  | "aposentadoria"
  | "alavancagem"
  | "visao-geral"
  | "plano"
  | "historico";

export interface Fase {
  id: string;
  numero: number;
  nome: string;
  subtitulo: string;
  encontro: string;
  /** Documentos para pedir ao cliente ANTES desta fase. */
  documentos?: string[];
}

export const FASES: Fase[] = [
  {
    id: "conexao",
    numero: 1,
    nome: "Conexão",
    subtitulo: "Quem é o cliente e onde ele quer chegar",
    encontro: "Reunião 1 · Descoberta (60–90 min)",
  },
  {
    id: "raio-x",
    numero: 2,
    nome: "Raio-X financeiro",
    subtitulo: "Onde o cliente está hoje",
    encontro: "Reunião 2 · Coleta de dados (60–90 min)",
    documentos: [
      "Contracheques ou pró-labore dos últimos 3 meses",
      "Extratos bancários dos últimos 3 meses",
      "Faturas de cartão de crédito dos últimos 3 meses",
      "Última declaração de Imposto de Renda",
      "Extratos de investimentos e previdência",
      "Contratos de financiamentos e empréstimos (saldo, taxa, prazo)",
    ],
  },
  {
    id: "futuro",
    numero: 3,
    nome: "Proteção e futuro",
    subtitulo: "Proteger o que foi construído e projetar o futuro",
    encontro: "Reunião 2 ou 3 · Análise",
    documentos: ["Apólices de seguro de vida (individual e empresa)", "Extrato do INSS (CNIS) ou previsão de benefício"],
  },
  {
    id: "entrega",
    numero: 4,
    nome: "Diagnóstico e plano",
    subtitulo: "Mostrar o retrato e combinar as ações",
    encontro: "Reunião 3 · Apresentação do diagnóstico (60 min)",
  },
  {
    id: "acompanhamento",
    numero: 5,
    nome: "Acompanhamento",
    subtitulo: "Medir a evolução e ajustar a rota",
    encontro: "Revisões mensais ou trimestrais",
  },
];

export interface Etapa {
  id: EtapaId;
  label: string;
  icone: LucideIcon;
  fase: string;
  /** Etapas guiadas contam no progresso; as demais (apresentação, resultados) não. */
  guiada: boolean;
  /** Pode ser marcada como "Não se aplica". */
  opcional?: boolean;
  /** Regra de conclusão usada no progresso e no check verde do menu. */
  concluida?: (c: Cliente) => boolean;
}

export const ETAPAS: Etapa[] = [
  { id: "apresentacao", label: "Apresentação", icone: Presentation, fase: "conexao", guiada: false },
  {
    id: "cadastro",
    label: "Cadastro",
    icone: User,
    fase: "conexao",
    guiada: true,
    concluida: (c) => !!s(c.cadastro.nome) && !!s(c.cadastro.nascimento),
  },
  { id: "sonhos", label: "Sonhos", icone: Star, fase: "conexao", guiada: true, concluida: (c) => c.sonhos.length > 0 },
  {
    id: "filhos",
    label: "Filhos",
    icone: Baby,
    fase: "conexao",
    guiada: true,
    opcional: true,
    concluida: (c) => c.filhos.length > 0,
  },
  {
    id: "receitas",
    label: "Receitas",
    icone: TrendingUp,
    fase: "raio-x",
    guiada: true,
    concluida: (c) => c.receitas.some((r) => n(r.valor) > 0),
  },
  {
    id: "despesas",
    label: "Despesas",
    icone: CreditCard,
    fase: "raio-x",
    guiada: true,
    concluida: (c) => c.despesas.some((d) => n(d.valor) > 0),
  },
  {
    id: "patrimonio",
    label: "Patrimônio",
    icone: Landmark,
    fase: "raio-x",
    guiada: true,
    opcional: true,
    concluida: (c) => c.patrimonio.some((p) => n(p.valor) > 0),
  },
  {
    id: "dividas",
    label: "Dívidas",
    icone: ReceiptText,
    fase: "raio-x",
    guiada: true,
    opcional: true,
    concluida: (c) => c.dividas.some((d) => n(d.saldo) > 0),
  },
  {
    id: "seguro",
    label: "Seguro de Vida",
    icone: Shield,
    fase: "futuro",
    guiada: true,
    opcional: true,
    concluida: (c) => s(c.seguro.capitalAtual) !== "" || s(c.seguro.temInvalidez) !== "",
  },
  {
    id: "aposentadoria",
    label: "Aposentadoria",
    icone: PiggyBank,
    fase: "futuro",
    guiada: true,
    concluida: (c) => n(c.aposentadoria.idadeAlvo) > 0 && s(c.aposentadoria.aporteAtual) !== "",
  },
  {
    id: "alavancagem",
    label: "Alavancagem",
    icone: Rocket,
    fase: "futuro",
    guiada: true,
    opcional: true,
    concluida: (c) => n(c.alavancagem.valorBem) > 0,
  },
  { id: "visao-geral", label: "Visão geral Diagnóstico", icone: ChartColumn, fase: "entrega", guiada: false },
  { id: "plano", label: "Plano de ação", icone: Target, fase: "entrega", guiada: false, concluida: (c) => c.plano.length > 0 },
  { id: "historico", label: "Histórico", icone: History, fase: "acompanhamento", guiada: false, concluida: (c) => c.historico.length > 0 },
];

export const etapaPorId = (id: string) => ETAPAS.find((e) => e.id === id);
export const fasePorId = (id: string) => FASES.find((f) => f.id === id)!;

export const etapaConcluida = (c: Cliente, e: Etapa) => !!c.naoAplica[e.id] || !!e.concluida?.(c);

export function progresso(c: Cliente) {
  const guiadas = ETAPAS.filter((e) => e.guiada);
  const feitas = guiadas.filter((e) => etapaConcluida(c, e)).length;
  const pct = Math.round((feitas / guiadas.length) * 100);
  const proxima = guiadas.find((e) => !etapaConcluida(c, e));
  let mensagem = "Comece pela apresentação e o cadastro.";
  if (pct >= 100) mensagem = "Diagnóstico completo. Hora de apresentar.";
  else if (pct >= 70) mensagem = "Quase lá! Faltam poucas etapas para o diagnóstico.";
  else if (pct >= 35) mensagem = "Bom ritmo. Continue o raio-x financeiro.";
  else if (pct > 0) mensagem = "Conexão iniciada. Siga para os sonhos e a família.";
  return { pct, feitas, total: guiadas.length, proxima, mensagem };
}
