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
// =====================================================================

import type { LucideIcon } from "lucide-react";
import {
  Banknote,
  Car,
  Coffee,
  Dumbbell,
  Ellipsis,
  GraduationCap,
  HeartPulse,
  House,
  Landmark,
  Package,
  Plane,
  ReceiptText,
  ShieldCheck,
  Shirt,
  ShoppingBag,
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

export interface GrupoDespesa {
  id: string;
  label: string;
  bloco: "Fixa" | "Variável";
  icone: LucideIcon;
  itens: SubDespesa[];
  /**
   * "dividas": soma das parcelas de Financiamentos e dívidas e de bens não quitados.
   * "dependentes": mensalidades, auxílios e custos informados em Sucessão.
   */
  automatico?: "dividas" | "dependentes";
}

export const GRUPOS_DESPESA: GrupoDespesa[] = [
  // ------------------------------- Fixas -------------------------------
  {
    id: "casa",
    label: "Casa",
    bloco: "Fixa",
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
    icone: ShoppingCart,
    itens: [
      { id: "supermercado", label: "Supermercado" },
      { id: "hortifruti", label: "Hortifrúti, açougue e padaria" },
      { id: "limpeza", label: "Limpeza e higiene" },
    ],
  },
  {
    id: "transporte",
    label: "Transporte",
    bloco: "Fixa",
    icone: Car,
    itens: [
      { id: "combustivel", label: "Combustível" },
      { id: "estacionamento", label: "Estacionamento e pedágio" },
      { id: "app", label: "Aplicativos e transporte público" },
      { id: "manutencao", label: "Manutenção do veículo" },
      { id: "ipva", label: "IPVA e licenciamento", dica: "Valor anual ÷ 12" },
    ],
  },
  {
    id: "saude",
    label: "Saúde",
    bloco: "Fixa",
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
    icone: Sparkles,
    itens: [
      { id: "salao", label: "Salão / barbearia" },
      { id: "estetica", label: "Estética e cosméticos" },
    ],
  },
  {
    id: "impostos",
    label: "Impostos",
    bloco: "Fixa",
    icone: Landmark,
    itens: [
      { id: "ir", label: "Imposto de renda (parcelas)" },
      { id: "outros", label: "Outros impostos e taxas" },
    ],
  },
  {
    id: "servicosFinanceiros",
    label: "Serviços financeiros",
    bloco: "Fixa",
    icone: Banknote,
    itens: [
      { id: "tarifas", label: "Tarifas bancárias" },
      { id: "anuidade", label: "Anuidade de cartão" },
    ],
  },
  {
    id: "profissionais",
    label: "Profissionais",
    bloco: "Fixa",
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
    label: "Financiamento / Dívidas",
    bloco: "Fixa",
    icone: ReceiptText,
    automatico: "dividas",
    // Usado só quando nada foi lançado em Financiamentos e dívidas / Patrimônio.
    itens: [{ id: "parcelas", label: "Parcelas de financiamentos e dívidas" }],
  },
  {
    id: "educacao",
    label: "Educação",
    bloco: "Fixa",
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
    icone: Users,
    automatico: "dependentes",
    itens: [],
  },
  { id: "outrasFixas", label: "Outras despesas fixas", bloco: "Fixa", icone: Package, itens: [] },

  // ----------------------------- Variáveis -----------------------------
  {
    id: "restaurantes",
    label: "Restaurantes",
    bloco: "Variável",
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
    icone: Tv,
    itens: [
      { id: "streaming", label: "Streaming" },
      { id: "apps", label: "Apps e softwares" },
      { id: "clubes", label: "Clubes e associações" },
    ],
  },
  {
    id: "compras",
    label: "Compras",
    bloco: "Variável",
    icone: ShoppingBag,
    itens: [
      { id: "casa", label: "Casa e decoração" },
      { id: "eletronicos", label: "Eletrônicos" },
      { id: "presentes", label: "Presentes" },
    ],
  },
  {
    id: "esportes",
    label: "Esportes",
    bloco: "Variável",
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
    icone: Ellipsis,
    itens: [
      { id: "pets", label: "Pets" },
      { id: "doacoes", label: "Doações e dízimo" },
      { id: "outros", label: "Outros" },
    ],
  },
];

export const grupoDespesa = (id: string) => GRUPOS_DESPESA.find((g) => g.id === id);
export const chaveDespesa = (grupo: string, item: string) => `${grupo}.${item}`;
