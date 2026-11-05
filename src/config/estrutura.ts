// =====================================================================
//  ESTRUTURA DO DIAGNÓSTICO — etapas e seções
//  ---------------------------------------------------------------------
//  A página do cliente é uma rolagem contínua: as seções aparecem na
//  ordem abaixo e o menu lateral acompanha a rolagem.
//  Para criar uma seção: adicione-a em SECOES, crie o componente em
//  src/pages/secoes e registre-o em src/pages/secoes/index.tsx.
// =====================================================================

import type { LucideIcon } from "lucide-react";
import {
  Baby,
  BadgeDollarSign,
  BrainCircuit,
  Briefcase,
  ChartPie,
  CircleCheckBig,
  Compass,
  CreditCard,
  FileText,
  Flame,
  Gauge,
  Handshake,
  Landmark,
  Lightbulb,
  ListChecks,
  MonitorPlay,
  NotebookPen,
  Presentation,
  Radar,
  ReceiptText,
  Shield,
  Sunrise,
  Sunset,
  Target,
  TrendingUp,
  TriangleAlert,
  User,
  UserPlus,
  Wallet,
} from "lucide-react";
import type { Cliente } from "@/types";
import { financiamentosDoPatrimonio, n, nOpt, renda, s } from "@/lib/calculos";
import { GRUPOS_DESPESA } from "./despesas";

export interface Etapa {
  id: string;
  numero: number;
  nome: string;
  subtitulo: string;
}

export const ETAPAS: Etapa[] = [
  { id: "conexao", numero: 1, nome: "Conexão", subtitulo: "Quem é o cliente e onde ele quer chegar" },
  { id: "raio-x", numero: 2, nome: "Raio-X financeiro", subtitulo: "Onde o cliente está hoje" },
  { id: "protecao", numero: 3, nome: "Proteção e futuro", subtitulo: "O que protege a família e o padrão de vida" },
  { id: "investimentos", numero: 4, nome: "Investimentos", subtitulo: "Como o cliente investe hoje" },
  { id: "pre", numero: 5, nome: "Pré-diagnóstico", subtitulo: "Visão breve, gerada com o que foi preenchido" },
  { id: "completo", numero: 6, nome: "Diagnóstico completo", subtitulo: "A leitura completa e o plano de ação" },
  { id: "especificacao", numero: 7, nome: "Precificação", subtitulo: "Precificação do planejamento financeiro" },
  { id: "analitico", numero: 8, nome: "Analítico do Planejador", subtitulo: "Transcrições, perfil do cliente e preparação da V2" },
  { id: "v2", numero: 9, nome: "V2 · Apresentação", subtitulo: "O diagnóstico em slides para apresentar ao cliente" },
];

export interface SecaoDef {
  id: string;
  etapa: string;
  numero: string;
  titulo: string;
  subtitulo?: string;
  icone: LucideIcon;
  /** Conta no progresso do preenchimento. */
  coleta?: boolean;
  /** Pode ser marcada como "não se aplica". */
  opcional?: boolean;
  /** Começa oculta na versão apresentação (o consultor pode mudar). */
  ocultaNaApresentacao?: boolean;
  concluida?: (c: Cliente) => boolean;
  /** Só aparece quando esta condição vale (além da regra das etapas liberadas após a coleta). */
  liberada?: (c: Cliente) => boolean;
  /** Na versão consultor, o roteiro da conversa já começa aberto. */
  roteiroAberto?: boolean;
}

const temValor = (itens: { [k: string]: unknown }[], campo: string) => itens.some((i) => n(i[campo] as never) > 0);

export const SECOES: SecaoDef[] = [
  // Etapa 1 · Conexão
  {
    id: "institucional",
    etapa: "conexao",
    numero: "1",
    titulo: "V1 · Institucional",
    subtitulo: "Apresentação do Grupo Life Brasil",
    icone: Presentation,
  },
  {
    id: "cadastro",
    etapa: "conexao",
    numero: "2",
    titulo: "Cadastro",
    icone: User,
    coleta: true,
    concluida: (c) => !!s(c.cadastro.nome) && !!s(c.cadastro.nascimento) && !!s(c.cadastro.estadoCivil) && !!s(c.cadastro.temFilhos),
  },
  {
    id: "objetivos",
    etapa: "conexao",
    numero: "3",
    titulo: "Objetivos",
    subtitulo: "Essencial, desejo e sonho",
    icone: Target,
    coleta: true,
    concluida: (c) => c.objetivos.length > 0,
  },
  {
    id: "sucessao",
    etapa: "conexao",
    numero: "4",
    titulo: "Sucessão",
    subtitulo: "Filhos e dependentes",
    icone: Baby,
    coleta: true,
    opcional: true,
    concluida: (c) =>
      c.dependentes.some(
        (d) => !!s(d.nome) || nOpt(d.idade) !== undefined || !!s(d.nivelEscola) || n(d.mensalidade) > 0 || n(d.auxilio) > 0,
      ) ||
      (s(c.cadastro.temFilhos) === "Não" && c.dependentes.length === 0),
  },

  // Etapa 2 · Raio-X financeiro
  {
    id: "despesas",
    etapa: "raio-x",
    numero: "5",
    titulo: "Despesas",
    subtitulo: "Fixas e variáveis",
    icone: CreditCard,
    coleta: true,
    concluida: (c) =>
      GRUPOS_DESPESA.some((g) => g.itens.some((it) => n(c.despesas[`${g.id}.${it.id}`]) > 0)) || temValor(c.despesasExtras, "valor"),
  },
  {
    id: "renda",
    etapa: "raio-x",
    numero: "6",
    titulo: "Renda",
    icone: TrendingUp,
    coleta: true,
    // Conta só renda que entra no total (renda do cônjuge exige cônjuge no cadastro).
    concluida: (c) => renda(c).total > 0,
  },
  {
    id: "patrimonio",
    etapa: "raio-x",
    numero: "7",
    titulo: "Patrimônio",
    subtitulo: "Imóveis e móveis",
    icone: Landmark,
    coleta: true,
    opcional: true,
    concluida: (c) => c.imoveis.length + c.moveis.length > 0,
  },
  {
    id: "dividas",
    etapa: "raio-x",
    numero: "8",
    titulo: "Financiamento, consórcio e FGTS",
    subtitulo: "Financiamentos, consórcios, dívidas e fundo de garantia",
    icone: ReceiptText,
    coleta: true,
    opcional: true,
    concluida: (c) =>
      c.financiamentos.length + c.consorcios.length + c.emprestimos.length + financiamentosDoPatrimonio(c).length > 0 || !!s(c.fgts.temFgts),
  },
  {
    id: "projetos",
    etapa: "raio-x",
    numero: "9",
    titulo: "Projetos",
    icone: Lightbulb,
    coleta: true,
    opcional: true,
    concluida: (c) => c.projetos.length > 0,
  },
  {
    id: "corporativo",
    etapa: "raio-x",
    numero: "10",
    titulo: "Corporativo",
    icone: Briefcase,
    coleta: true,
    concluida: (c) => !!s(c.corporativo.possuiEmpresa),
  },

  // Etapa 3 · Proteção e futuro
  {
    id: "protecao",
    etapa: "protecao",
    numero: "11",
    titulo: "Proteção",
    subtitulo: "Reserva, seguros e previdência",
    icone: Shield,
    coleta: true,
    concluida: (c) => !!s(c.protecao.temReserva) && !!s(c.protecao.temSeguroVida),
  },
  {
    id: "aposentadoria",
    etapa: "protecao",
    numero: "12",
    titulo: "Futuro",
    subtitulo: "Aposentadoria e estilo de vida",
    icone: Sunset,
    coleta: true,
    // A idade tem padrão (60 anos); basta definir o estilo de vida ou a renda desejada.
    concluida: (c) => !!s(c.futuro.estiloVida) || n(c.futuro.rendaDesejada) > 0,
  },

  // Etapa 4 · Investimentos
  {
    id: "investimentos",
    etapa: "investimentos",
    numero: "13",
    titulo: "Investimentos",
    icone: Wallet,
    coleta: true,
    concluida: (c) => !!s(c.investimentos.temInvestimento),
  },

  // Etapa 5 · Pré-diagnóstico
  { id: "plano-atual", etapa: "pre", numero: "5.1", titulo: "Plano atual", subtitulo: "Renda total, despesas atuais e modelo 50-30-20", icone: Gauge },
  // Aparece depois do botão "Gerar recomendações" (logo abaixo do 5.1).
  {
    id: "recomendacoes",
    etapa: "pre",
    numero: "5.2",
    titulo: "Recomendações",
    subtitulo: "Indicações do cliente: nome e contato",
    icone: UserPlus,
    liberada: (c) => !!c.recomendacoesAbertas,
    roteiroAberto: true,
  },

  // Etapa 6 · Diagnóstico completo
  { id: "panorama", etapa: "completo", numero: "6.1", titulo: "Panorama geral", subtitulo: "Perfil, perfil financeiro e Estrela LIFE", icone: ChartPie },
  {
    id: "plano-atual-completo",
    etapa: "completo",
    numero: "6.2",
    titulo: "Plano atual",
    subtitulo: "Diagnóstico, motivo e risco da inação",
    icone: TriangleAlert,
  },
  {
    id: "plano-potencial",
    etapa: "completo",
    numero: "6.3",
    titulo: "Plano potencial",
    subtitulo: "Como podemos atuar juntos",
    icone: Handshake,
  },
  {
    id: "plano-otimizacao",
    etapa: "completo",
    numero: "6.4",
    titulo: "Plano otimização",
    subtitulo: "O que o cliente já faz bem",
    icone: CircleCheckBig,
  },
  { id: "futuro", etapa: "completo", numero: "6.5", titulo: "Futuro", subtitulo: "Simulação e plano de independência", icone: Sunrise },
  {
    id: "oportunidades",
    etapa: "completo",
    numero: "6.6",
    titulo: "Matriz de oportunidades",
    subtitulo: "Radar das 6 áreas, por potencial",
    icone: Radar,
    ocultaNaApresentacao: true,
  },
  { id: "bussola", etapa: "completo", numero: "6.7", titulo: "Bússola financeira", subtitulo: "Saúde financeira e o norte das ações", icone: Compass },
  { id: "plano-acao", etapa: "completo", numero: "6.8", titulo: "Plano de ação", icone: ListChecks },

  // Etapa 7 · Precificação (só na versão consultor; o id interno continua "especificacao")
  {
    id: "especificacao",
    etapa: "especificacao",
    numero: "7.1",
    titulo: "Precificação do planejamento",
    subtitulo: "Base de cálculo, valor do plano e condições de pagamento",
    icone: BadgeDollarSign,
  },

  // Etapa 8 · Analítico do Planejador (só na versão consultor)
  { id: "transcricoes", etapa: "analitico", numero: "8.1", titulo: "Transcrições da reunião", subtitulo: "Parte 1, parte 2…", icone: FileText },
  { id: "dores-gatilhos", etapa: "analitico", numero: "8.2", titulo: "Dores, preocupações e gatilhos", icone: Flame },
  { id: "notas-planejador", etapa: "analitico", numero: "8.3", titulo: "Notas do Planejador", subtitulo: "Objeções, lacunas, perguntas para a V2, riscos e oportunidades", icone: NotebookPen },
  { id: "analitico-ia", etapa: "analitico", numero: "8.4", titulo: "Analítico IA", subtitulo: "Perfil comportamental e como falar a língua do cliente na V2", icone: BrainCircuit },

  // Etapa 9 · V2 Apresentação (só na versão consultor): abre os slides para o cliente
  {
    id: "apresentacao-v2",
    etapa: "v2",
    numero: "9.1",
    titulo: "Apresentação V2",
    subtitulo: "Resumo do diagnóstico em slides, sem download nem impressão",
    icone: MonitorPlay,
  },
];

export const secaoPorId = (id: string) => SECOES.find((x) => x.id === id);

/** Etapas liberadas só depois do botão "Finalizar coleta". */
export const ETAPAS_APOS_COLETA = ["pre", "completo", "especificacao", "analitico", "v2"];
/** Etapas que só aparecem na versão consultor (a apresentação vai até o pré-diagnóstico). */
export const ETAPAS_SO_CONSULTOR = ["completo", "especificacao", "analitico", "v2"];
/** Etapas de coleta (o botão "Finalizar coleta" fica depois da última delas). */
export const ETAPAS_COLETA = ["conexao", "raio-x", "protecao", "investimentos"];
export const coletaFinalizada = (c: Cliente) => !!c.coletaFinalizada;
/**
 * A seção aparece agora? Pré-diagnóstico e etapas 6–8 esperam a coleta ser finalizada; 5.2 espera
 * "Gerar recomendações"; as etapas 6–8 só aparecem na versão consultor.
 */
export const secaoLiberada = (c: Cliente, x: SecaoDef, apresentacao = false) =>
  (coletaFinalizada(c) || !ETAPAS_APOS_COLETA.includes(x.etapa)) &&
  !(apresentacao && ETAPAS_SO_CONSULTOR.includes(x.etapa)) &&
  (x.liberada?.(c) ?? true);
/** O botão "Gerar recomendações" aparece depois do 5.1 até ser clicado. */
export const podeGerarRecomendacoes = (c: Cliente) => coletaFinalizada(c) && !c.recomendacoesAbertas;
/** Quantidade de recomendações com nome ou contato preenchido. */
export const recomendacoesPreenchidas = (c: Cliente) => c.recomendacoes.filter((r) => !!s(r.nome) || !!s(r.contato)).length;
export const etapaPorId = (id: string) => ETAPAS.find((e) => e.id === id)!;

export const secaoConcluida = (c: Cliente, x: SecaoDef) => !!c.naoAplica[x.id] || !!x.concluida?.(c);
export const secaoOculta = (c: Cliente, x: SecaoDef) => c.ocultos[x.id] ?? !!x.ocultaNaApresentacao;

export function progresso(c: Cliente) {
  const coleta = SECOES.filter((x) => x.coleta);
  const feitas = coleta.filter((x) => secaoConcluida(c, x)).length;
  const pct = Math.round((feitas / coleta.length) * 100);
  const pendentes = coleta.filter((x) => !secaoConcluida(c, x));
  const proxima = pendentes[0];
  let mensagem = "Comece pelo cadastro do cliente.";
  if (coletaFinalizada(c)) mensagem = "Coleta finalizada. Pré-diagnóstico liberado.";
  else if (pct >= 100) mensagem = "Coleta completa. Clique em Finalizar coleta.";
  else if (pct >= 60) mensagem = "Quase lá. Feche o raio-x e finalize a coleta.";
  else if (pct > 0) mensagem = "Conexão iniciada. Siga rolando para o raio-x.";
  return { pct, feitas, total: coleta.length, proxima, pendentes, mensagem };
}
