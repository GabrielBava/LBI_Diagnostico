// =====================================================================
//  CAMPOS DO DIAGNÓSTICO
//  ---------------------------------------------------------------------
//  Arquivo para INCLUIR, REMOVER ou RENOMEAR campos. Cada campo declarado
//  aqui aparece automaticamente na tela e é salvo junto com o cliente.
//  Para usar um campo novo em algum cálculo, leia o valor em
//  src/lib/calculos.ts pela mesma `key`.
//
//  Tipos:
//    texto | textarea | email | telefone | data | numero | moeda |
//    percentual | select | chips | multichips | icones | simnao | switch |
//    slider | escala | contador
//
//  Propriedades úteis:
//    ajuda            -> dica exibida abaixo do campo
//    padrao           -> valor inicial
//    opcoes           -> opções (select / chips)
//    largura          -> 1, 2, 3 ou 4 colunas
//    min / max / passo-> limites (slider / contador / número)
//    mostrarSe        -> regra para exibir o campo (ex.: cônjuge só se casado)
//    somenteConsultor -> oculto na versão apresentação
//    novaLinha        -> começa uma linha nova (o campo que ele revela fica ao lado)
//    meioLinha        -> começa na 3ª coluna (desktop) — dois pares flag + campo na mesma linha
//    obrigatorio      -> chips sem opção de desmarcar (ex.: Quitado / Financiado)
// =====================================================================

import type { LucideIcon } from "lucide-react";
import { Briefcase, Car, Gem, GraduationCap, HeartPulse, House, Palette, Plane, Sparkles, Users } from "lucide-react";
import type { Cliente, Secao, Valor } from "@/types";

export type TipoCampo =
  | "texto"
  | "textarea"
  | "email"
  | "telefone"
  | "data"
  | "numero"
  | "moeda"
  | "percentual"
  | "select"
  | "chips"
  | "multichips"
  | "icones"
  | "simnao"
  | "switch"
  | "slider"
  | "escala"
  | "contador";

export interface CampoDef {
  key: string;
  label: string;
  tipo: TipoCampo;
  opcoes?: string[];
  placeholder?: string;
  ajuda?: string;
  sufixo?: string;
  padrao?: Valor;
  largura?: 1 | 2 | 3 | 4;
  min?: number;
  max?: number;
  passo?: number;
  mostrarSe?: (dados: Secao, cliente: Cliente) => boolean;
  somenteConsultor?: boolean;
  /** Textos das pontas da escala 0–10 (ex.: ["Muito insatisfeito", "Muito satisfeito"]). */
  rotulosEscala?: [string, string];
  /** Ícone de cada opção (tipo "icones"). */
  icones?: Record<string, LucideIcon>;
  /** Opções que dependem dos dados (ex.: "Cônjuge" só para casados). Substitui `opcoes`. */
  opcoesSe?: (dados: Secao, cliente: Cliente) => string[];
  /** Começa uma linha nova na grade (o campo condicional seguinte abre ao lado, sem mexer nos demais). */
  novaLinha?: boolean;
  /** Começa na 3ª coluna no desktop (e numa linha nova no tablet): segundo par "flag + campo" da linha. */
  meioLinha?: boolean;
  /** Chips: clicar na opção marcada não desmarca (sempre há uma escolha). */
  obrigatorio?: boolean;
}

const sim = (v: Valor) => v === "Sim" || v === true;

// ---------------------------------------------------------------------
//  Opções compartilhadas
// ---------------------------------------------------------------------
export const OPCOES = {
  estadoCivil: ["Solteiro(a)", "Casado(a)", "União estável", "Divorciado(a)", "Viúvo(a)"],
  comConjuge: ["Casado(a)", "União estável"],
  regimeTrabalho: ["CLT", "Servidor público", "Empresário", "Autônomo / Liberal", "Aposentado", "Outro"],
  prioridade: ["Alta", "Média", "Baixa"],
  tipoObjetivo: ["Essencial", "Desejo", "Sonho"],
  categoriaObjetivo: [
    "Viagem",
    "Veículo",
    "Casa",
    "Família",
    "Casamento",
    "Educação",
    "Hobby",
    "Profissional",
    "Saúde",
    "Outro",
  ],
  categoriaDependente: ["Filho(a)", "Enteado(a)", "Neto(a)", "Pai / Mãe", "Outro dependente"],
  nivelEscola: [
    "Não estuda",
    "Educação infantil",
    "Fundamental I",
    "Fundamental II",
    "Ensino médio",
    "Graduação",
    "Pós-graduação",
  ],
  escola: ["Particular", "Pública", "Bilíngue / Internacional"],
  frequencia: ["Mensal", "Anual"],
  tipoOutraRenda: [
    "Renda extra / freelance",
    "Aluguel",
    "Dividendos / Juros",
    "Pró-labore / Empresa",
    "Bônus / PLR",
    "Pensão / Aposentadoria",
    "Outros",
  ],
  pessoaRenda: ["Cliente", "Cônjuge", "Outra pessoa"],
  temasInvestimento: [
    "Reserva de emergência",
    "Tesouro Direto",
    "CDB, LCI e LCA",
    "Fundos de investimento",
    "Previdência privada",
    "Ações",
    "Fundos imobiliários (FIIs)",
    "Investimentos no exterior",
    "Criptoativos",
    "Derivativos e opções",
    "Planejamento sucessório",
    "Nenhum",
  ],
  declaracaoIR: ["Simplificada", "Completa", "Não declara"],
  situacaoBem: ["Quitado", "Financiado"],
  categoriaImovel: ["Moradia", "Veraneio", "Renda (aluguel)", "Investimento", "Comercial"],
  tipoImovel: ["Casa", "Apartamento", "Terreno", "Sala comercial", "Galpão", "Rural"],
  tipoMovel: ["Carro", "Moto", "Lancha", "Jetski"],
  segmentoAquisicao: ["Imóvel", "Veículo"],
  condicaoVeiculo: ["Novo", "Seminovo"],
  estrategiaAquisicao: ["À vista", "Financiamento", "Consórcio"],
  tipoFinanciamento: ["Imobiliário", "Veículo", "Outro"],
  categoriaDivida: [
    "Cartão de crédito",
    "Cheque especial",
    "Carnê / crediário",
    "Renegociação",
    "Empréstimo pessoal",
    "Consignado",
    "Financiamento estudantil",
    "Outra",
  ],
  tipoPrevidencia: ["PGBL", "VGBL", "PGBL e VGBL", "Não sabe"],
  impactoMudanca: ["Aumenta despesas", "Reduz despesas", "Aumenta renda", "Reduz renda", "Gasto único"],
  tipoConsorcio: ["Imóvel", "Veículo", "Serviços", "Outro"],
  tipoProjeto: ["Reforma", "Negócio / Empreendimento", "Investimento", "Pessoal", "Outro"],
  statusProjeto: ["Ideia", "Planejado", "Em andamento"],
  conhecimento: ["Iniciante", "Intermediário", "Avançado"],
  perfilInvestidor: ["Conservador", "Moderado", "Arrojado", "Não sabe"],
  regimeTributario: ["MEI", "Simples Nacional", "Lucro Presumido", "Lucro Real"],
  area: ["Fluxo de caixa", "Dívidas", "Proteção", "Futuro", "Patrimonial", "Investimentos", "Sucessão", "Fiscal/Tributário", "Objetivos"],
  prazoPlano: ["Curto", "Médio", "Longo"],
  responsavel: ["Cliente", "Consultor", "Ambos"],
  status: ["Pendente", "Em andamento", "Concluída"],
  statusReuniao: ["Pendente", "Agendada", "Realizada"],
};

// ---------------------------------------------------------------------
//  1 · Cadastro
// ---------------------------------------------------------------------
export const CAMPOS_CADASTRO: CampoDef[] = [
  { key: "nome", label: "Nome", tipo: "texto", largura: 2 },
  { key: "email", label: "E-mail", tipo: "email" },
  { key: "telefone", label: "Telefone", tipo: "telefone", placeholder: "(00) 00000-0000" },
  { key: "nascimento", label: "Data de nascimento", tipo: "data" },
  { key: "ocupacao", label: "Ocupação", tipo: "texto", placeholder: "Ex.: Engenheiro" },
  { key: "regimeTrabalho", label: "Regime de trabalho", tipo: "select", opcoes: OPCOES.regimeTrabalho },
  { key: "perfil", label: "Perfil", tipo: "texto", placeholder: "Ex.: Cliente Private" },
  { key: "estadoCivil", label: "Estado civil", tipo: "chips", opcoes: OPCOES.estadoCivil, largura: 4 },
  {
    key: "conjuge",
    label: "Nome do cônjuge",
    tipo: "texto",
    largura: 2,
    mostrarSe: (d) => OPCOES.comConjuge.includes(String(d.estadoCivil ?? "")),
  },
  { key: "temFilhos", label: "Tem filhos?", tipo: "simnao" },
  {
    key: "qtdFilhos",
    label: "Quantos filhos?",
    tipo: "contador",
    min: 1,
    max: 10,
    padrao: 1,
    ajuda: "Abre os filhos automaticamente em Sucessão.",
    mostrarSe: (d) => sim(d.temFilhos),
  },
];

/** Parâmetros financeiros (pop-up da engrenagem no topo do cliente, só na versão consultor). */
export const CAMPOS_PARAMETROS: CampoDef[] = [
  { key: "inflacaoGeral", label: "Inflação geral (% a.a.)", tipo: "percentual", padrao: 5, somenteConsultor: true },
  {
    key: "inflacaoEducacional",
    label: "Inflação educacional (% a.a.)",
    tipo: "percentual",
    padrao: 6,
    somenteConsultor: true,
    ajuda: "Reajuste de escola e faculdade (custo educacional da proteção).",
  },
  {
    key: "mesesReserva",
    label: "Meta de reserva (meses)",
    tipo: "numero",
    padrao: 6,
    somenteConsultor: true,
    ajuda: "6 meses (CLT) · 12 meses (empresário/autônomo)",
  },
  {
    key: "limiteComprometimento",
    label: "Limite de parcela (% da renda)",
    tipo: "percentual",
    padrao: 30,
    somenteConsultor: true,
  },
  { key: "retornoReal", label: "Retorno real (% a.a.)", tipo: "percentual", padrao: 4, somenteConsultor: true, ajuda: "Acima da inflação (objetivos e futuro)." },
];

/** Ponto de partida registrado no V1 Institucional. */
export const CAMPOS_PONTO_PARTIDA: CampoDef[] = [
  {
    key: "motivacao",
    label: "O que motivou a busca pelo planejamento?",
    tipo: "textarea",
    largura: 4,
    placeholder: "Nas palavras do cliente…",
  },
  {
    key: "satisfacao",
    label: "De 0 a 10, como você se sente hoje em relação ao seu dinheiro?",
    tipo: "escala",
    min: 0,
    max: 10,
    largura: 4,
    rotulosEscala: ["Muito insatisfeito", "Muito satisfeito"],
    ajuda: "Repita a pergunta nas revisões para medir a evolução.",
  },
];

// ---------------------------------------------------------------------
//  3 · Objetivos
// ---------------------------------------------------------------------
/** Ícone de cada categoria de objetivo. */
export const ICONES_OBJETIVO: Record<string, LucideIcon> = {
  Viagem: Plane,
  Veículo: Car,
  Casa: House,
  Família: Users,
  Casamento: Gem,
  Educação: GraduationCap,
  Hobby: Palette,
  Profissional: Briefcase,
  Saúde: HeartPulse,
  Outro: Sparkles,
};

export const CAMPOS_OBJETIVO: CampoDef[] = [
  { key: "categoria", label: "Categoria", tipo: "icones", opcoes: OPCOES.categoriaObjetivo, icones: ICONES_OBJETIVO, largura: 4 },
  { key: "titulo", label: "Título do objetivo", tipo: "texto", largura: 2, placeholder: "Ex.: Casa na praia" },
  { key: "prioridade", label: "Prioridade", tipo: "chips", opcoes: OPCOES.prioridade, padrao: "Média", largura: 2 },
  { key: "valorFuturo", label: "Valor futuro", tipo: "moeda", largura: 2 },
  { key: "prazoMeses", label: "Prazo (meses)", tipo: "numero", padrao: 12, min: 1, largura: 2 },
  { key: "probAtual", label: "Probabilidade atual", tipo: "slider", min: 0, max: 100, passo: 5, sufixo: "%", largura: 2 },
  { key: "probPlano", label: "Probabilidade com plano", tipo: "slider", min: 0, max: 100, passo: 5, sufixo: "%", largura: 2 },
  { key: "impacto", label: "Impacto na vida (0 a 10)", tipo: "escala", min: 0, max: 10, largura: 4, rotulosEscala: ["Pouco impacto", "Transforma a vida"] },
  { key: "motivo", label: "Por que é importante?", tipo: "texto", largura: 4, placeholder: "Nas palavras do cliente" },
];

export const TIPOS_OBJETIVO: { id: string; titulo: string; descricao: string }[] = [
  { id: "Essencial", titulo: "Essencial", descricao: "O que não pode faltar" },
  { id: "Desejo", titulo: "Desejo", descricao: "O que melhora a vida" },
  { id: "Sonho", titulo: "Sonho", descricao: "O que transforma a vida" },
];

// ---------------------------------------------------------------------
//  4 · Sucessão (dependentes)
// ---------------------------------------------------------------------
/** Categorias de dependente que têm vida escolar (mostram escolaridade e mensalidade). */
export const DEPENDENTES_ESCOLARES = ["Filho(a)", "Enteado(a)", "Neto(a)"];
const escolar = (d: Secao) => DEPENDENTES_ESCOLARES.includes(String(d.categoria ?? ""));
const estuda = (d: Secao) => escolar(d) && !!d.nivelEscola && d.nivelEscola !== "Não estuda";

export const CAMPOS_DEPENDENTE: CampoDef[] = [
  { key: "categoria", label: "Categoria", tipo: "chips", opcoes: OPCOES.categoriaDependente, largura: 4 },
  { key: "nome", label: "Nome (opcional)", tipo: "texto" },
  { key: "idade", label: "Idade", tipo: "numero", sufixo: "anos", min: 0, mostrarSe: escolar },
  { key: "nivelEscola", label: "Escolaridade", tipo: "select", opcoes: OPCOES.nivelEscola, mostrarSe: escolar },
  { key: "escola", label: "Escola atual", tipo: "select", opcoes: OPCOES.escola, mostrarSe: estuda },
  { key: "mensalidade", label: "Mensalidade (R$)", tipo: "moeda", mostrarSe: estuda },
  { key: "auxilio", label: "Auxílio mensal (R$)", tipo: "moeda", ajuda: "Mesada, pensão, ajuda de custo" },
  {
    key: "outrosCustos",
    label: "Outros custos mensais (R$)",
    tipo: "moeda",
    ajuda: "Saúde, cuidador, moradia",
    mostrarSe: (d) => !!d.categoria && !escolar(d),
  },
];

// ---------------------------------------------------------------------
//  5 · Despesas — blocos e subcategorias ficam em src/config/despesas.ts
// ---------------------------------------------------------------------
/** Item acrescentado dentro de um bloco de despesas. */
export const CAMPOS_DESPESA_EXTRA: CampoDef[] = [
  { key: "descricao", label: "Descrição", tipo: "texto", largura: 2 },
  { key: "valor", label: "Valor mensal", tipo: "moeda", largura: 2 },
];

// ---------------------------------------------------------------------
//  6 · Renda
// ---------------------------------------------------------------------
const casado = (c: Cliente) => OPCOES.comConjuge.includes(String(c.cadastro.estadoCivil ?? ""));
export const temConjugeCadastro = casado;

/** Renda do cliente: preencha a bruta, a líquida ou as duas. */
export const CAMPOS_RENDA_CLIENTE: CampoDef[] = [
  { key: "brutaCliente", label: "Renda bruta mensal", tipo: "moeda", largura: 2 },
  { key: "liquidaCliente", label: "Renda líquida mensal", tipo: "moeda", largura: 2 },
];

/** Renda extra do cliente (campo único, abaixo da estimativa bruta ↔ líquida). */
export const CAMPOS_RENDA_EXTRA: CampoDef[] = [
  {
    key: "rendaExtra",
    label: "Renda extra mensal",
    tipo: "moeda",
    largura: 2,
    ajuda: "Comissões, freelas, bicos (líquido). Bônus, PLR, aluguéis e renda de outra pessoa vão em Outras rendas.",
  },
];

/** Renda do cônjuge (só para casado(a) ou união estável). */
export const CAMPOS_RENDA_CONJUGE: CampoDef[] = [
  { key: "brutaConjuge", label: "Renda bruta mensal", tipo: "moeda", largura: 2, mostrarSe: (_d, c) => casado(c) },
  { key: "liquidaConjuge", label: "Renda líquida mensal", tipo: "moeda", largura: 2, mostrarSe: (_d, c) => casado(c) },
];

export const CAMPOS_OUTRA_RENDA: CampoDef[] = [
  {
    key: "pessoa",
    label: "De quem",
    tipo: "chips",
    opcoes: OPCOES.pessoaRenda,
    // "Cônjuge" só para casados — mas continua visível se já estiver marcada, para poder corrigir.
    opcoesSe: (d, c) =>
      casado(c) || d.pessoa === "Cônjuge" ? OPCOES.pessoaRenda : OPCOES.pessoaRenda.filter((p) => p !== "Cônjuge"),
    padrao: "Cliente",
    largura: 2,
  },
  { key: "descricao", label: "Fonte", tipo: "texto", largura: 2, placeholder: "Ex.: Aluguel sala comercial" },
  { key: "tipo", label: "Tipo", tipo: "select", opcoes: OPCOES.tipoOutraRenda, padrao: "Outros" },
  { key: "valor", label: "Valor líquido", tipo: "moeda" },
  { key: "frequencia", label: "Frequência", tipo: "chips", opcoes: OPCOES.frequencia, padrao: "Mensal", largura: 2 },
];

/** Modelo da declaração de imposto de renda (um campo só). */
export const CAMPOS_RENDA_IR: CampoDef[] = [
  { key: "declaracaoIR", label: "Como declara o imposto de renda?", tipo: "chips", opcoes: OPCOES.declaracaoIR, largura: 4 },
];

/** Pergunta que abre a lista de cartões (fica na seção Renda). */
export const CAMPOS_RENDA_CARTAO: CampoDef[] = [{ key: "temCartao", label: "Tem cartão de crédito?", tipo: "simnao", largura: 2 }];

export const CAMPOS_CARTAO: CampoDef[] = [
  { key: "cartao", label: "Qual cartão", tipo: "texto", largura: 2, placeholder: "Banco / bandeira / categoria" },
  { key: "limite", label: "Limite", tipo: "moeda" },
  { key: "gastoMensal", label: "Quanto gasta por mês", tipo: "moeda" },
  // Flags compactas: cada uma com o campo que ela abre ao lado (milhas nas colunas 1-2, anuidade nas 3-4).
  { key: "milhas", label: "Acumula milhas", tipo: "switch", novaLinha: true },
  { key: "programa", label: "Programa", tipo: "texto", placeholder: "Ex.: Smiles, Livelo", mostrarSe: (d) => d.milhas === true },
  { key: "pagaAnuidade", label: "Paga anuidade", tipo: "switch", meioLinha: true },
  { key: "valorAnuidade", label: "Anuidade (por ano)", tipo: "moeda", mostrarSe: (d) => d.pagaAnuidade === true },
];

// ---------------------------------------------------------------------
//  7 · Patrimônio
// ---------------------------------------------------------------------

/** Bem financiado? Sem situação marcada, vale o campo antigo `quitado` (sim/não) ou, sem ele, Quitado. */
export const bemFinanciado = (d: Secao) => (d.situacao ? d.situacao === "Financiado" : d.quitado === false);
const SITUACAO_BEM: CampoDef = {
  key: "situacao",
  label: "Situação",
  tipo: "chips",
  opcoes: OPCOES.situacaoBem,
  padrao: "Quitado",
  obrigatorio: true,
  novaLinha: true,
  largura: 2,
};

/** Campos que aparecem quando o bem está financiado. */
const CAMPOS_FINANCIAMENTO_DO_BEM: CampoDef[] = [
  { key: "instituicao", label: "Instituição", tipo: "texto", placeholder: "Banco / financeira", mostrarSe: bemFinanciado, novaLinha: true },
  { key: "parcela", label: "Parcela", tipo: "moeda", mostrarSe: bemFinanciado },
  { key: "prazo", label: "Prazo restante (meses)", tipo: "numero", mostrarSe: bemFinanciado },
  { key: "saldo", label: "Saldo devedor (se souber)", tipo: "moeda", mostrarSe: bemFinanciado },
];

export const CAMPOS_IMOVEL: CampoDef[] = [
  { key: "categoria", label: "Categoria", tipo: "select", opcoes: OPCOES.categoriaImovel, padrao: "Moradia" },
  { key: "tipo", label: "Tipo", tipo: "select", opcoes: OPCOES.tipoImovel, padrao: "Apartamento" },
  { key: "valor", label: "Valor de mercado", tipo: "moeda", largura: 2 },
  SITUACAO_BEM,
  { key: "temSeguro", label: "Tem seguro", tipo: "switch", largura: 2 },
  ...CAMPOS_FINANCIAMENTO_DO_BEM,
];

export const CAMPOS_MOVEL: CampoDef[] = [
  { key: "tipo", label: "Tipo", tipo: "chips", opcoes: OPCOES.tipoMovel, padrao: "Carro", largura: 2 },
  { key: "nome", label: "Modelo", tipo: "texto", placeholder: "Ex.: Compass 2023" },
  { key: "valor", label: "Valor de mercado", tipo: "moeda" },
  SITUACAO_BEM,
  { key: "temSeguro", label: "Tem seguro", tipo: "switch", largura: 2 },
  // Financiado abre os campos logo abaixo da situação.
  ...CAMPOS_FINANCIAMENTO_DO_BEM,
  { key: "manutencaoAnual", label: "Manutenção (por ano)", tipo: "moeda", novaLinha: true },
  { key: "ipvaAnual", label: "IPVA e licenciamento (por ano)", tipo: "moeda" },
  { key: "pensaAmpliacao", label: "Pensa em ampliação / troca", tipo: "switch", largura: 2, novaLinha: true },
  {
    key: "modeloDesejado",
    label: "Modelo de desejo",
    tipo: "texto",
    placeholder: "Ex.: SUV híbrido",
    largura: 2,
    mostrarSe: (d) => d.pensaAmpliacao === true,
  },
];

/** Pergunta que abre as futuras aquisições (fica em 7 · Patrimônio). */
export const CAMPOS_PATRIMONIO_GERAL: CampoDef[] = [
  { key: "pretendeAdquirir", label: "Pretende fazer futuras aquisições?", tipo: "simnao", largura: 2 },
];

const ehImovel = (d: Secao) => d.segmento !== "Veículo";
export const CAMPOS_AQUISICAO: CampoDef[] = [
  { key: "segmento", label: "Segmento", tipo: "chips", opcoes: OPCOES.segmentoAquisicao, padrao: "Imóvel", obrigatorio: true, largura: 2 },
  {
    key: "categoria",
    label: "Categoria",
    tipo: "select",
    opcoes: OPCOES.categoriaImovel,
    opcoesSe: (d) => (ehImovel(d) ? OPCOES.categoriaImovel : OPCOES.tipoMovel),
  },
  {
    key: "tipo",
    label: "Tipo",
    tipo: "select",
    opcoes: OPCOES.tipoImovel,
    opcoesSe: (d) => (ehImovel(d) ? OPCOES.tipoImovel : OPCOES.condicaoVeiculo),
  },
  { key: "valorDesejado", label: "Valor desejado", tipo: "moeda", largura: 2 },
  { key: "estrategia", label: "Estratégia", tipo: "chips", opcoes: OPCOES.estrategiaAquisicao, largura: 2 },
];

// ---------------------------------------------------------------------
//  8 · Financiamentos e dívidas
// ---------------------------------------------------------------------
export const CAMPOS_FINANCIAMENTO: CampoDef[] = [
  { key: "tipo", label: "Tipo", tipo: "select", opcoes: OPCOES.tipoFinanciamento, padrao: "Imobiliário" },
  { key: "parcela", label: "Parcela", tipo: "moeda" },
  { key: "prazo", label: "Prazo restante (meses)", tipo: "numero" },
  { key: "saldo", label: "Saldo devedor", tipo: "moeda" },
];

export const CAMPOS_CONSORCIO: CampoDef[] = [
  { key: "tipo", label: "Tipo", tipo: "select", opcoes: OPCOES.tipoConsorcio, padrao: "Imóvel" },
  { key: "administradora", label: "Administradora", tipo: "texto", placeholder: "Ex.: Porto, Embracon" },
  { key: "parcela", label: "Parcela", tipo: "moeda" },
  { key: "prazo", label: "Prazo restante (meses)", tipo: "numero" },
  { key: "credito", label: "Crédito (carta)", tipo: "moeda" },
  { key: "contemplado", label: "Contemplado", tipo: "switch" },
];

export const CAMPOS_EMPRESTIMO: CampoDef[] = [
  { key: "categoria", label: "Categoria da dívida", tipo: "select", opcoes: OPCOES.categoriaDivida },
  { key: "instituicao", label: "Instituição", tipo: "texto", placeholder: "Banco / financeira" },
  { key: "parcela", label: "Parcela", tipo: "moeda" },
  { key: "prazo", label: "Prazo restante (meses)", tipo: "numero" },
];

// ---------------------------------------------------------------------
//  9 · Projetos   /   10 · Corporativo
// ---------------------------------------------------------------------
export const CAMPOS_PROJETO: CampoDef[] = [
  { key: "titulo", label: "Projeto", tipo: "texto", largura: 2 },
  { key: "tipo", label: "Tipo", tipo: "select", opcoes: OPCOES.tipoProjeto, padrao: "Outro" },
  { key: "valor", label: "Investimento estimado", tipo: "moeda" },
  { key: "prazoMeses", label: "Prazo (meses)", tipo: "numero" },
  { key: "status", label: "Status", tipo: "chips", opcoes: OPCOES.statusProjeto, padrao: "Ideia", largura: 2 },
];

const temEmpresa = (d: Secao) => sim(d.possuiEmpresa);
export const CAMPOS_CORPORATIVO: CampoDef[] = [
  { key: "possuiEmpresa", label: "Possui empresa ou participação societária?", tipo: "simnao", largura: 2 },
  { key: "ramo", label: "Ramo de atividade", tipo: "texto", mostrarSe: temEmpresa },
  { key: "regime", label: "Regime tributário", tipo: "select", opcoes: OPCOES.regimeTributario, mostrarSe: temEmpresa },
  { key: "faturamento", label: "Faturamento mensal", tipo: "moeda", mostrarSe: temEmpresa },
  { key: "participacao", label: "Participação (%)", tipo: "percentual", mostrarSe: temEmpresa },
  { key: "valorParticipacao", label: "Valor estimado da participação", tipo: "moeda", mostrarSe: temEmpresa },
  { key: "socios", label: "Nº de sócios", tipo: "numero", mostrarSe: temEmpresa },
  { key: "funcionarios", label: "Nº de funcionários", tipo: "numero", mostrarSe: temEmpresa },
  { key: "seguroEmpresarial", label: "Seguro empresarial", tipo: "switch", mostrarSe: temEmpresa },
  { key: "saudeEmpresarial", label: "Plano de saúde empresarial", tipo: "switch", mostrarSe: temEmpresa },
  { key: "acordoSocios", label: "Acordo de sócios / seguro de sócio", tipo: "switch", mostrarSe: temEmpresa, largura: 2 },
];

// ---------------------------------------------------------------------
//  Etapa 3 · Proteção
// ---------------------------------------------------------------------
export const CAMPOS_PROTECAO: CampoDef[] = [
  { key: "temReserva", label: "Tem reserva de emergência?", tipo: "simnao", largura: 2 },
  { key: "valorReserva", label: "Valor da reserva", tipo: "moeda", mostrarSe: (d) => sim(d.temReserva) },
  {
    key: "mesesReserva",
    label: "Para quantos meses?",
    tipo: "numero",
    sufixo: "meses",
    ajuda: "Na visão do cliente",
    mostrarSe: (d) => sim(d.temReserva),
  },
  { key: "temSeguroVida", label: "Tem seguro de vida individual?", tipo: "simnao", largura: 2 },
  { key: "capitalAtual", label: "Capital segurado", tipo: "moeda", mostrarSe: (d) => sim(d.temSeguroVida) },
  { key: "premioAtual", label: "Prêmio mensal", tipo: "moeda", mostrarSe: (d) => sim(d.temSeguroVida) },
  { key: "seguroEmpresa", label: "Seguro de vida pela empresa", tipo: "moeda", largura: 2, ajuda: "Termina quando o vínculo acaba." },
  { key: "temInvalidez", label: "Cobertura de invalidez / DIT", tipo: "simnao" },
  { key: "temSaude", label: "Plano de saúde", tipo: "simnao" },
  // Previdência em linha própria: o tipo e o saldo abrem ao lado.
  { key: "temPrevidencia", label: "Previdência privada", tipo: "simnao", novaLinha: true },
  { key: "tipoPrevidencia", label: "Tipo de plano", tipo: "chips", opcoes: OPCOES.tipoPrevidencia, largura: 2, mostrarSe: (d) => sim(d.temPrevidencia) },
  { key: "valorPrevidencia", label: "Saldo da previdência", tipo: "moeda", mostrarSe: (d) => sim(d.temPrevidencia) },
];

/**
 * Premissas do cálculo de proteção (6.3 · Plano potencial). Versão consultor.
 * O horizonte do padrão de vida (1, 5 ou 15 anos) é escolhido na proteção do 6.3.
 */
export const CAMPOS_PREMISSAS_PROTECAO: CampoDef[] = [
  { key: "itcmd", label: "ITCMD (%)", tipo: "percentual", padrao: 4, somenteConsultor: true, ajuda: "Varia por estado (até 8%)." },
  { key: "honorarios", label: "Honorários e custas (%)", tipo: "percentual", padrao: 6, somenteConsultor: true },
  {
    key: "mensalidadeFaculdade",
    label: "Mensalidade de faculdade",
    tipo: "moeda",
    padrao: 3000,
    somenteConsultor: true,
    ajuda: "Referência para quem ainda não está na faculdade.",
  },
  { key: "duracaoFaculdade", label: "Duração da faculdade (anos)", tipo: "numero", padrao: 5, somenteConsultor: true },
  { key: "incluirQuitacao", label: "Incluir quitação de dívidas", tipo: "switch", padrao: false, somenteConsultor: true, largura: 2 },
];

export const HORIZONTES_PADRAO_VIDA = [1, 5, 15];

// ---------------------------------------------------------------------
//  Etapa 4 · Investimentos
// ---------------------------------------------------------------------
const investe = (d: Secao) => sim(d.temInvestimento);
export const CAMPOS_INVESTIMENTOS: CampoDef[] = [
  { key: "conhecimento", label: "Nível de conhecimento", tipo: "chips", opcoes: OPCOES.conhecimento, largura: 2 },
  { key: "perfil", label: "Perfil de investidor", tipo: "chips", opcoes: OPCOES.perfilInvestidor, largura: 2 },
  {
    key: "temas",
    label: "Temas que já estudou",
    tipo: "multichips",
    opcoes: OPCOES.temasInvestimento,
    largura: 4,
    ajuda: "Marque todos que se aplicam.",
  },
  { key: "temInvestimento", label: "Tem investimentos?", tipo: "simnao", largura: 2 },
  { key: "valor", label: "Valor investido", tipo: "moeda", mostrarSe: investe, ajuda: "Sem contar a reserva de emergência." },
  { key: "temAssessor", label: "Tem assessor?", tipo: "simnao", mostrarSe: investe },
  { key: "instituicao", label: "Onde investe?", tipo: "texto", mostrarSe: investe, placeholder: "Banco / corretora", largura: 2 },
];

// ---------------------------------------------------------------------
//  12 · Futuro (Etapa 3) — aposentadoria
// ---------------------------------------------------------------------
/** Estilo de vida na aposentadoria: o fator multiplica o custo de vida atual para sugerir a renda desejada. */
export const ESTILOS_VIDA: { id: string; fator: number; descricao: string }[] = [
  { id: "Mais simples", fator: 0.7, descricao: "Menos gastos que hoje" },
  { id: "Igual a hoje", fator: 1, descricao: "Mesmo padrão atual" },
  { id: "Mais confortável", fator: 1.3, descricao: "Mais viagens e lazer" },
  { id: "Sofisticado", fator: 1.6, descricao: "Padrão bem acima do atual" },
];

/** O estilo de vida é escolhido nos cartões da seção 12 (campo "estiloVida"). */
export const CAMPOS_FUTURO: CampoDef[] = [
  { key: "idadeAposentadoria", label: "Idade de aposentadoria", tipo: "numero", padrao: 60, sufixo: "anos", largura: 2 },
  {
    key: "investimentoMensal",
    label: "Investimento mensal",
    tipo: "moeda",
    largura: 2,
    ajuda: "Quanto investe por mês hoje. Em branco, o diagnóstico usa a sobra do mês.",
  },
  { key: "rendaDesejada", label: "Renda desejada /mês", tipo: "moeda", largura: 2, ajuda: "Em valores de hoje. Em branco, o diagnóstico usa o estilo de vida." },
  { key: "outrasRendas", label: "Outras fontes de renda /mês", tipo: "moeda", largura: 2, ajuda: "INSS, aluguéis, previdência. Em branco = aluguéis e aposentadorias atuais (juros e dividendos já vêm dos investimentos)." },
];

/** Pergunta que abre as mudanças de vida programadas (seção 12). */
export const CAMPOS_FUTURO_MUDANCA: CampoDef[] = [
  { key: "temMudanca", label: "Tem alguma mudança de vida programada?", tipo: "simnao", largura: 4 },
];

/** Mudança de vida programada: o que muda, o impacto, quando e quanto. */
export const CAMPOS_MUDANCA: CampoDef[] = [
  { key: "descricao", label: "Qual mudança?", tipo: "texto", largura: 2, placeholder: "Ex.: Filho na faculdade, casamento, mudança de cidade" },
  { key: "impacto", label: "Impacto", tipo: "chips", opcoes: OPCOES.impactoMudanca, largura: 2 },
  { key: "meses", label: "Daqui a quantos meses?", tipo: "numero", sufixo: "meses", min: 0, largura: 2 },
  {
    key: "valor",
    label: "Valor",
    tipo: "moeda",
    largura: 2,
    ajuda: "Por mês (aumento ou redução) ou o total, se for gasto único.",
  },
];

// ---------------------------------------------------------------------
//  6.2 / 6.3 / 6.4 · Cartões dos planos (acrescentados ou personalizados
//  pelo consultor). As três últimas chaves de cada lista são as colunas
//  do cartão.
// ---------------------------------------------------------------------
const cabecalhoCard = (selo: string): CampoDef[] => [
  { key: "titulo", label: "Título", tipo: "texto", largura: 2 },
  { key: "area", label: "Área", tipo: "select", opcoes: OPCOES.area },
  { key: "selo", label: selo, tipo: "chips", opcoes: OPCOES.prioridade, padrao: "Média" },
];
const textoCard = (key: string, label: string, placeholder?: string): CampoDef => ({ key, label, tipo: "textarea", largura: 4, placeholder });

export const CAMPOS_CARD_ATUAL: CampoDef[] = [
  ...cabecalhoCard("Gravidade"),
  textoCard("diagnostico", "Diagnóstico", "O que está acontecendo hoje"),
  textoCard("motivo", "Motivo", "Por que acontece (o que os números mostram)"),
  textoCard("risco", "Risco da inação", "O que pode acontecer se nada mudar"),
];
export const CAMPOS_CARD_POTENCIAL: CampoDef[] = [
  ...cabecalhoCard("Prioridade"),
  textoCard("oportunidade", "Oportunidade identificada"),
  textoCard("comoAtuar", "Como podemos atuar juntos"),
  textoCard("objetivo", "Objetivo desejado"),
];
export const CAMPOS_CARD_OTIMIZACAO: CampoDef[] = [
  { key: "titulo", label: "Título", tipo: "texto", largura: 2 },
  { key: "area", label: "Área", tipo: "select", opcoes: OPCOES.area },
  textoCard("descricao", "Descrição", "O que o cliente já faz bem"),
  textoCard("motivo", "Motivo da escolha", "Por que essa escolha é boa"),
  textoCard("comoMelhorar", "Como melhorar"),
];

// ---------------------------------------------------------------------
//  6.8 · Plano de ação
// ---------------------------------------------------------------------
export const CAMPOS_ACAO: CampoDef[] = [
  { key: "acao", label: "Ação", tipo: "texto", largura: 4 },
  { key: "area", label: "Área relacionada", tipo: "select", opcoes: OPCOES.area, padrao: "Objetivos" },
  { key: "prioridade", label: "Prioridade", tipo: "chips", opcoes: OPCOES.prioridade, padrao: "Média" },
  { key: "prazo", label: "Prazo", tipo: "chips", opcoes: OPCOES.prazoPlano, padrao: "Curto" },
  { key: "status", label: "Status", tipo: "select", opcoes: OPCOES.status, padrao: "Pendente" },
];

export const PRAZOS_PLANO: Record<string, { titulo: string; meses: [number, number | null] }> = {
  Curto: { titulo: "Curto prazo", meses: [0, 3] },
  Médio: { titulo: "Médio prazo", meses: [3, 12] },
  Longo: { titulo: "Longo prazo", meses: [12, null] },
};

// ---------------------------------------------------------------------
//  7.1 · Jornada do cliente (reuniões)
// ---------------------------------------------------------------------
export const CAMPOS_REUNIAO: CampoDef[] = [
  { key: "titulo", label: "Encontro", tipo: "texto", largura: 2 },
  { key: "data", label: "Data", tipo: "data" },
  { key: "status", label: "Status", tipo: "chips", opcoes: OPCOES.statusReuniao, padrao: "Pendente" },
];

export const JORNADA_PADRAO = [
  { titulo: "Reunião 1 · Conexão e cadastro", descricao: "Cadastro, institucional, objetivos e sucessão" },
  { titulo: "Reunião 2 · Raio-X financeiro", descricao: "Despesas, renda, patrimônio, financiamento e crédito, proteção e investimentos" },
  { titulo: "Reunião 3 · Diagnóstico completo", descricao: "Panorama, planos atual, potencial e de otimização, futuro e bússola financeira" },
  { titulo: "Reunião 4 · Fechamento do planejamento", descricao: "Plano de ação e cronograma de implementação" },
  { titulo: "Acompanhamento trimestral", descricao: "Revisão dos indicadores e ajustes no plano" },
];

/** Valores padrão de um conjunto de campos (usado ao criar cliente / item). */
export const padroes = (campos: CampoDef[]) =>
  Object.fromEntries(campos.filter((c) => c.padrao !== undefined).map((c) => [c.key, c.padrao]));
