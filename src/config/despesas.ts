// =====================================================================
//  DESPESAS — blocos (grupos) e subcategorias
//  ---------------------------------------------------------------------
//  Cada grupo vira um bloco na tela (ex.: "Casa") e cada item vira uma
//  linha com valor mensal (ex.: "Aluguel"). O valor fica salvo na chave
//  "grupo.item" (ex.: "casa.aluguel").
//
//  Para incluir uma subcategoria, acrescente-a em `itens` do grupo.
//  Para incluir um bloco, acrescente um grupo novo.
//  Grupos com `automatico` são preenchidos por outras seções.
//  `modelo` diz em que parte do modelo 50-30-20 o bloco entra
//  (Necessidades = 50% da renda, Desejos = 30%; os 20% são a sobra).
//  Ao remover uma subcategoria, inclua-a em DESPESAS_REMOVIDAS (migracao.ts)
//  para o valor já salvo virar um item extra e não sumir do total.
// =====================================================================

import type { LucideIcon } from "lucide-react";
import {
  Car,
  Coffee,
  Dumbbell,
  Ellipsis,
  GraduationCap,
  HeartPulse,
  House,
  Package,
  Plane,
  ReceiptText,
  ShieldCheck,
  Shirt,
  ShoppingCart,
  Sparkles,
  Ticket,
  Tv,
  Users,
  UserRound,
  UtensilsCrossed,
} from "lucide-react";

export interface SubDespesa {
  id: string;
  label: string;
  dica?: string;
}

export type ParteModelo = "Necessidades" | "Desejos";

export interface GrupoDespesa {
  id: string;
  label: string;
  bloco: "Fixa" | "Variável";
  icone: LucideIcon;
  itens: SubDespesa[];
  /** Parte do modelo 50-30-20 (Necessidades 50% · Desejos 30%). */
  modelo: ParteModelo;
  /**
   * "dividas": parcelas de 8 · Financiamento e crédito (inclui bens financiados do Patrimônio).
   * "dependentes": mensalidades, auxílios e custos informados em Sucessão.
   */
  automatico?: "dividas" | "dependentes";
  /** Entra nos totais, mas não aparece como bloco na tela de Despesas (é lançado em outra seção). */
  foraDaTela?: boolean;
}

export const GRUPOS_DESPESA: GrupoDespesa[] = [
  // ------------------------------- Fixas -------------------------------
  {
    id: "casa",
    label: "Casa",
    bloco: "Fixa",
    modelo: "Necessidades",
    icone: House,
    itens: [
      { id: "aluguel", label: "Aluguel" },
      { id: "condominio", label: "Condomínio" },
      { id: "luz", label: "Energia elétrica (luz)" },
      { id: "agua", label: "Água" },
      { id: "internet", label: "Internet e telefone" },
      { id: "gas", label: "Gás" },
      { id: "iptu", label: "IPTU", dica: "Valor anual ÷ 12" },
      { id: "manutencao", label: "Manutenção e reparos" },
    ],
  },
  {
    id: "alimentacao",
    label: "Alimentação",
    bloco: "Fixa",
    modelo: "Necessidades",
    icone: Coffee,
    itens: [
      { id: "refeicoes", label: "Refeições do dia a dia" },
      { id: "lanches", label: "Lanches e cafés" },
    ],
  },
  {
    id: "mercado",
    label: "Mercado",
    bloco: "Fixa",
    modelo: "Necessidades",
    icone: ShoppingCart,
    itens: [
      { id: "supermercado", label: "Supermercado" },
      { id: "hortifruti", label: "Hortifrúti, açougue e padaria" },
    ],
  },
  {
    id: "transporte",
    label: "Transporte",
    bloco: "Fixa",
    modelo: "Necessidades",
    icone: Car,
    // Manutenção e IPVA vêm de cada veículo em 7 · Patrimônio (linha automática).
    itens: [
      { id: "combustivel", label: "Combustível" },
      { id: "estacionamento", label: "Estacionamento / garagem" },
      { id: "app", label: "Aplicativos (Uber e 99)" },
      { id: "publico", label: "Transporte público" },
    ],
  },
  {
    id: "saude",
    label: "Saúde",
    bloco: "Fixa",
    modelo: "Necessidades",
    icone: HeartPulse,
    itens: [
      { id: "plano", label: "Plano de saúde" },
      { id: "odonto", label: "Plano odontológico" },
      { id: "remedios", label: "Medicamentos" },
      { id: "consultas", label: "Consultas, exames e terapias" },
    ],
  },
  {
    id: "cuidados",
    label: "Cuidados pessoais",
    bloco: "Fixa",
    modelo: "Desejos",
    icone: Sparkles,
    itens: [
      { id: "salao", label: "Salão / barbearia" },
      { id: "estetica", label: "Estética e cosméticos" },
    ],
  },
  {
    id: "profissionais",
    label: "Profissionais",
    bloco: "Fixa",
    // Serviços de conforto (diarista, personal) contam como desejo no 50-30-20.
    modelo: "Desejos",
    icone: UserRound,
    itens: [
      { id: "diarista", label: "Diarista / empregada" },
      { id: "baba", label: "Babá / cuidador(a)" },
      { id: "professores", label: "Personal / professores particulares" },
      { id: "contador", label: "Contador / advogado" },
    ],
  },
  {
    id: "seguros",
    label: "Seguros",
    bloco: "Fixa",
    modelo: "Necessidades",
    icone: ShieldCheck,
    itens: [
      { id: "vida", label: "Seguro de vida" },
      { id: "auto", label: "Seguro auto" },
      { id: "residencial", label: "Seguro residencial" },
      { id: "outros", label: "Outros seguros" },
    ],
  },
  {
    id: "financiamentos",
    label: "Parcelas (financiamento e crédito)",
    bloco: "Fixa",
    modelo: "Necessidades",
    icone: ReceiptText,
    automatico: "dividas",
    // Lançadas em 8 · Financiamento e crédito (e bens financiados do Patrimônio).
    foraDaTela: true,
    itens: [],
  },
  {
    id: "educacao",
    label: "Educação",
    bloco: "Fixa",
    modelo: "Necessidades",
    icone: GraduationCap,
    itens: [
      { id: "cursos", label: "Cursos, pós e idiomas (do cliente)" },
      { id: "material", label: "Livros e material" },
    ],
  },
  {
    id: "dependentes",
    label: "Dependentes",
    bloco: "Fixa",
    modelo: "Necessidades",
    icone: Users,
    automatico: "dependentes",
    itens: [],
  },
  // Anuidades dos cartões (informadas em 6 · Renda) entram aqui como linha automática.
  { id: "outrasFixas", label: "Outras despesas fixas", bloco: "Fixa", modelo: "Necessidades", icone: Package, itens: [] },

  // ----------------------------- Variáveis -----------------------------
  {
    id: "restaurantes",
    label: "Restaurantes",
    bloco: "Variável",
    modelo: "Desejos",
    icone: UtensilsCrossed,
    itens: [
      { id: "restaurantes", label: "Restaurantes" },
      { id: "delivery", label: "Delivery" },
      { id: "bares", label: "Bares e cafés" },
    ],
  },
  {
    id: "lazer",
    label: "Lazer",
    bloco: "Variável",
    modelo: "Desejos",
    icone: Ticket,
    itens: [
      { id: "passeios", label: "Passeios, cinema e shows" },
      { id: "hobbies", label: "Hobbies" },
      { id: "festas", label: "Festas e eventos" },
    ],
  },
  {
    id: "roupas",
    label: "Roupas",
    bloco: "Variável",
    modelo: "Desejos",
    icone: Shirt,
    itens: [
      { id: "roupas", label: "Roupas" },
      { id: "calcados", label: "Calçados e acessórios" },
    ],
  },
  {
    id: "assinaturas",
    label: "Assinaturas",
    bloco: "Variável",
    modelo: "Desejos",
    icone: Tv,
    itens: [
      { id: "streaming", label: "Streaming" },
      { id: "apps", label: "Apps e softwares" },
      { id: "clubes", label: "Clubes e associações" },
    ],
  },
  {
    id: "esportes",
    label: "Esportes",
    bloco: "Variável",
    modelo: "Desejos",
    icone: Dumbbell,
    itens: [
      { id: "academia", label: "Academia" },
      { id: "atividades", label: "Esportes e atividades" },
      { id: "equipamentos", label: "Equipamentos" },
    ],
  },
  {
    id: "viagens",
    label: "Viagens",
    bloco: "Variável",
    modelo: "Desejos",
    icone: Plane,
    itens: [
      { id: "nacionais", label: "Viagens nacionais", dica: "Gasto anual ÷ 12" },
      { id: "internacionais", label: "Viagens internacionais", dica: "Gasto anual ÷ 12" },
    ],
  },
  {
    id: "outros",
    label: "Outros",
    bloco: "Variável",
    modelo: "Desejos",
    icone: Ellipsis,
    itens: [
      { id: "pets", label: "Pets" },
      { id: "doacoes", label: "Doações e dízimo" },
      { id: "outros", label: "Outros" },
    ],
  },
];

export const grupoDespesa = (id: string) => GRUPOS_DESPESA.find((g) => g.id === id);

/** Modelo 50-30-20: metas de cada parte em % da renda líquida. */
export const MODELO_50_30_20: { id: ParteModelo | "Poupança"; label: string; meta: number; descricao: string }[] = [
  { id: "Necessidades", label: "Necessidades", meta: 0.5, descricao: "Moradia, mercado, transporte, saúde, educação, dependentes, seguros e parcelas" },
  { id: "Desejos", label: "Desejos", meta: 0.3, descricao: "Restaurantes, lazer, viagens, roupas, assinaturas, cuidados e serviços" },
  { id: "Poupança", label: "Poupança e investimentos", meta: 0.2, descricao: "O que sobra para reserva, objetivos e aposentadoria" },
];
export const chaveDespesa = (grupo: string, item: string) => `${grupo}.${item}`;
