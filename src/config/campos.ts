// =====================================================================
//  CAMPOS DO DIAGNÓSTICO
//  ---------------------------------------------------------------------
//  Arquivo para INCLUIR, REMOVER ou RENOMEAR campos. Cada campo declarado
//  aqui aparece automaticamente na tela e é salvo junto com o cliente.
//  Para usar um campo novo em algum cálculo, leia o valor em
//  src/lib/calculos.ts pela mesma `key`.
//
//  Tipos:
//    texto | textarea | email | telefone | cep | data | numero | moeda |
//    percentual | select | chips | simnao | switch | slider | contador
//
//  Propriedades úteis:
//    ajuda            -> dica exibida abaixo do campo
//    padrao           -> valor inicial
//    opcoes           -> opções (select / chips)
//    largura          -> 1, 2, 3 ou 4 colunas
//    min / max / passo-> limites (slider / contador / número)
//    mostrarSe        -> regra para exibir o campo (ex.: cônjuge só se casado)
//    somenteConsultor -> oculto na versão apresentação
// =====================================================================

import type { Cliente, Secao, Valor } from "@/types";

export type TipoCampo =
  | "texto"
  | "textarea"
  | "email"
  | "telefone"
  | "cep"
  | "data"
  | "numero"
  | "moeda"
  | "percentual"
  | "select"
  | "chips"
  | "simnao"
  | "switch"
  | "slider"
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
  categoriaDependente: ["Filho(a)", "Enteado(a)", "Neto(a)", "Pai / Mãe", "Cônjuge", "Outro dependente"],
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
  tipoOutraRenda: ["Aluguel", "Dividendos / Juros", "Pró-labore / Empresa", "Bônus / PLR", "Pensão / Aposentadoria", "Outros"],
  categoriaImovel: ["Moradia", "Veraneio", "Renda (aluguel)", "Investimento", "Comercial"],
  tipoImovel: ["Casa", "Apartamento", "Terreno", "Sala comercial", "Galpão", "Rural"],
  tipoMovel: ["Carro", "Moto", "Lancha", "Jetski"],
  tipoFinanciamento: ["Imobiliário", "Veículo", "Outro"],
  tipoConsorcio: ["Imóvel", "Veículo", "Serviços", "Outro"],
  tipoProjeto: ["Reforma", "Negócio / Empreendimento", "Investimento", "Pessoal", "Outro"],
  statusProjeto: ["Ideia", "Planejado", "Em andamento"],
  conhecimento: ["Iniciante", "Intermediário", "Avançado"],
  perfilInvestidor: ["Conservador", "Moderado", "Arrojado", "Não sabe"],
  regimeTributario: ["MEI", "Simples Nacional", "Lucro Presumido", "Lucro Real"],
  area: ["Seguros", "Patrimonial", "Investimentos", "Futuro", "Fluxo de caixa", "Dívidas", "Objetivos"],
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
  { key: "cep", label: "CEP", tipo: "cep" },
  { key: "numero", label: "Número", tipo: "texto", placeholder: "Nº / complemento" },
];

/** Parâmetros financeiros (aparecem dentro do Cadastro, só na versão consultor). */
export const CAMPOS_PARAMETROS: CampoDef[] = [
  { key: "inflacaoGeral", label: "Inflação geral (% a.a.)", tipo: "percentual", padrao: 5, somenteConsultor: true },
  { key: "retornoReal", label: "Retorno real (% a.a.)", tipo: "percentual", padrao: 4, somenteConsultor: true },
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
    label: "Limite de parcelas (% renda)",
    tipo: "percentual",
    padrao: 30,
    somenteConsultor: true,
  },
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
    label: "Satisfação financeira hoje",
    tipo: "slider",
    min: 0,
    max: 10,
    largura: 2,
    ajuda: "Repita a pergunta nas revisões para medir a evolução.",
  },
];

// ---------------------------------------------------------------------
//  3 · Objetivos
// ---------------------------------------------------------------------
export const CAMPOS_OBJETIVO: CampoDef[] = [
  { key: "titulo", label: "Título do objetivo", tipo: "texto", largura: 2, placeholder: "Ex.: Casa na praia" },
  { key: "categoria", label: "Categoria", tipo: "select", opcoes: OPCOES.categoriaObjetivo },
  { key: "prioridade", label: "Prioridade", tipo: "chips", opcoes: OPCOES.prioridade, padrao: "Média" },
  { key: "valorFuturo", label: "Valor futuro", tipo: "moeda" },
  { key: "prazoMeses", label: "Prazo (meses)", tipo: "numero", padrao: 12, min: 1 },
  { key: "probAtual", label: "Probabilidade atual", tipo: "slider", min: 0, max: 100, passo: 5, sufixo: "%", largura: 2 },
  { key: "probPlano", label: "Probabilidade com plano", tipo: "slider", min: 0, max: 100, passo: 5, sufixo: "%", largura: 2 },
  { key: "impacto", label: "Impacto na vida", tipo: "slider", min: 0, max: 10, largura: 2 },
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
export const CAMPOS_DEPENDENTE: CampoDef[] = [
  { key: "categoria", label: "Categoria", tipo: "select", opcoes: OPCOES.categoriaDependente, padrao: "Filho(a)" },
  { key: "nome", label: "Nome (opcional)", tipo: "texto" },
  { key: "nivelEscola", label: "Nível escolar", tipo: "select", opcoes: OPCOES.nivelEscola },
  {
    key: "escola",
    label: "Escola atual",
    tipo: "select",
    opcoes: OPCOES.escola,
    mostrarSe: (d) => !!d.nivelEscola && d.nivelEscola !== "Não estuda",
  },
  {
    key: "mensalidade",
    label: "Mensalidade",
    tipo: "moeda",
    mostrarSe: (d) => !!d.nivelEscola && d.nivelEscola !== "Não estuda",
  },
  { key: "auxilio", label: "Auxílio mensal", tipo: "moeda", ajuda: "Mesada, pensão, ajuda de custo" },
];

// ---------------------------------------------------------------------
//  5 · Despesas — categorias pré-definidas (um valor mensal por categoria)
// ---------------------------------------------------------------------
export interface CategoriaDespesa {
  id: string;
  label: string;
  bloco: "Fixa" | "Variável";
  dica?: string;
}

export const CATEGORIAS_DESPESA: CategoriaDespesa[] = [
  { id: "casa", label: "Casa", bloco: "Fixa", dica: "Aluguel, condomínio, luz, água, internet" },
  { id: "alimentacao", label: "Alimentação", bloco: "Fixa" },
  { id: "transporte", label: "Transporte", bloco: "Fixa", dica: "Combustível, app, estacionamento" },
  { id: "saude", label: "Saúde", bloco: "Fixa", dica: "Plano de saúde, remédios, terapias" },
  { id: "cuidados", label: "Cuidados pessoais", bloco: "Fixa" },
  { id: "impostos", label: "Impostos", bloco: "Fixa", dica: "IPTU, IPVA (valor anual ÷ 12)" },
  { id: "servicosFinanceiros", label: "Serviços financeiros", bloco: "Fixa", dica: "Tarifas, anuidades" },
  { id: "profissionais", label: "Profissionais", bloco: "Fixa", dica: "Diarista, contador, personal" },
  { id: "mercado", label: "Mercado", bloco: "Fixa" },
  { id: "seguros", label: "Seguros", bloco: "Fixa" },
  { id: "financiamentos", label: "Financiamento / Dívidas", bloco: "Fixa", dica: "Preenchido por Financiamentos e Dívidas" },
  { id: "educacao", label: "Educação", bloco: "Fixa", dica: "Do próprio cliente (cursos, pós)" },
  { id: "restaurantes", label: "Restaurantes", bloco: "Variável" },
  { id: "lazer", label: "Lazer", bloco: "Variável" },
  { id: "roupas", label: "Roupas", bloco: "Variável" },
  { id: "assinaturas", label: "Assinaturas", bloco: "Variável", dica: "Streaming, apps, clubes" },
  { id: "compras", label: "Compras", bloco: "Variável" },
  { id: "esportes", label: "Esportes", bloco: "Variável" },
  { id: "viagens", label: "Viagens", bloco: "Variável", dica: "Gasto anual ÷ 12" },
  { id: "outros", label: "Outros", bloco: "Variável" },
];

export const CAMPOS_DESPESA_EXTRA: CampoDef[] = [
  { key: "descricao", label: "Descrição", tipo: "texto", largura: 2 },
  { key: "bloco", label: "Tipo", tipo: "chips", opcoes: ["Fixa", "Variável"], padrao: "Fixa" },
  { key: "valor", label: "Valor mensal", tipo: "moeda" },
];

// ---------------------------------------------------------------------
//  6 · Renda
// ---------------------------------------------------------------------
export const CAMPOS_RENDA: CampoDef[] = [
  { key: "renda", label: "Renda líquida mensal", tipo: "moeda", ajuda: "Já descontados impostos e INSS" },
  {
    key: "rendaConjuge",
    label: "Renda do cônjuge",
    tipo: "moeda",
    mostrarSe: (_d, c) => OPCOES.comConjuge.includes(String(c.cadastro.estadoCivil ?? "")),
  },
];

export const CAMPOS_OUTRA_RENDA: CampoDef[] = [
  { key: "descricao", label: "Fonte", tipo: "texto", largura: 2, placeholder: "Ex.: Aluguel sala comercial" },
  { key: "tipo", label: "Tipo", tipo: "select", opcoes: OPCOES.tipoOutraRenda, padrao: "Outros" },
  { key: "valor", label: "Valor", tipo: "moeda" },
  { key: "frequencia", label: "Frequência", tipo: "chips", opcoes: OPCOES.frequencia, padrao: "Mensal" },
];

// ---------------------------------------------------------------------
//  7 · Patrimônio
// ---------------------------------------------------------------------
export const CAMPOS_IMOVEL: CampoDef[] = [
  { key: "categoria", label: "Categoria", tipo: "select", opcoes: OPCOES.categoriaImovel, padrao: "Moradia" },
  { key: "tipo", label: "Tipo", tipo: "select", opcoes: OPCOES.tipoImovel, padrao: "Apartamento" },
  { key: "valor", label: "Valor de mercado", tipo: "moeda" },
  { key: "quitado", label: "Quitado", tipo: "switch", padrao: true },
];

export const CAMPOS_MOVEL: CampoDef[] = [
  { key: "tipo", label: "Tipo", tipo: "chips", opcoes: OPCOES.tipoMovel, padrao: "Carro", largura: 2 },
  { key: "nome", label: "Modelo", tipo: "texto", placeholder: "Ex.: Compass 2023" },
  { key: "valor", label: "Valor de mercado", tipo: "moeda" },
  { key: "quitado", label: "Quitado", tipo: "switch", padrao: true },
  { key: "temSeguro", label: "Tem seguro", tipo: "switch" },
  { key: "pensaAmpliacao", label: "Pensa em ampliação / troca", tipo: "switch", largura: 2 },
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
  { key: "parcela", label: "Parcela", tipo: "moeda" },
  { key: "credito", label: "Crédito (carta)", tipo: "moeda" },
  { key: "contemplado", label: "Contemplado", tipo: "switch" },
];

export const CAMPOS_EMPRESTIMO: CampoDef[] = [
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
  { key: "temSeguroVida", label: "Tem seguro de vida individual?", tipo: "simnao", largura: 2 },
  { key: "capitalAtual", label: "Capital segurado", tipo: "moeda", mostrarSe: (d) => sim(d.temSeguroVida) },
  { key: "premioAtual", label: "Prêmio mensal", tipo: "moeda", mostrarSe: (d) => sim(d.temSeguroVida) },
  { key: "seguroEmpresa", label: "Seguro de vida pela empresa", tipo: "moeda", ajuda: "Termina quando o vínculo acaba." },
  { key: "temInvalidez", label: "Cobertura de invalidez / DIT", tipo: "simnao" },
  { key: "temSaude", label: "Plano de saúde", tipo: "simnao" },
  { key: "temPrevidencia", label: "Previdência privada", tipo: "simnao" },
  {
    key: "valorPrevidencia",
    label: "Saldo da previdência",
    tipo: "moeda",
    mostrarSe: (d) => sim(d.temPrevidencia),
  },
  {
    key: "anosProtecao",
    label: "Anos de proteção da renda",
    tipo: "numero",
    padrao: 5,
    somenteConsultor: true,
    ajuda: "Por quanto tempo a família mantém o padrão sem a renda.",
  },
  {
    key: "custoInventario",
    label: "Custos de inventário (% patrimônio)",
    tipo: "percentual",
    padrao: 15,
    somenteConsultor: true,
  },
];

// ---------------------------------------------------------------------
//  Etapa 4 · Investimentos
// ---------------------------------------------------------------------
const investe = (d: Secao) => sim(d.temInvestimento);
export const CAMPOS_INVESTIMENTOS: CampoDef[] = [
  { key: "conhecimento", label: "Nível de conhecimento", tipo: "chips", opcoes: OPCOES.conhecimento, largura: 2 },
  { key: "perfil", label: "Perfil de investidor", tipo: "chips", opcoes: OPCOES.perfilInvestidor, largura: 2 },
  { key: "temInvestimento", label: "Tem investimentos?", tipo: "simnao", largura: 2 },
  { key: "valor", label: "Qual valor?", tipo: "moeda", mostrarSe: investe },
  {
    key: "liquidez",
    label: "Quanto com liquidez diária?",
    tipo: "moeda",
    mostrarSe: investe,
    ajuda: "Usado como reserva de emergência.",
  },
  { key: "temAssessor", label: "Tem assessor?", tipo: "simnao", mostrarSe: investe, largura: 2 },
  { key: "instituicao", label: "Onde investe?", tipo: "texto", mostrarSe: investe, placeholder: "Banco / corretora" },
];

// ---------------------------------------------------------------------
//  6.5 · Futuro (independência financeira)
// ---------------------------------------------------------------------
export const CAMPOS_FUTURO: CampoDef[] = [
  { key: "idadeAposentadoria", label: "Idade de aposentadoria", tipo: "numero", padrao: 60 },
  { key: "rendaDesejada", label: "Renda desejada /mês", tipo: "moeda", ajuda: "Em valores de hoje" },
  { key: "outrasRendas", label: "Outras rendas /mês", tipo: "moeda", ajuda: "INSS, aluguéis, previdência" },
];

// ---------------------------------------------------------------------
//  6.3 / 6.4 · Pontos fortes e negativos (itens manuais)
// ---------------------------------------------------------------------
export const CAMPOS_PONTO: CampoDef[] = [{ key: "texto", label: "Ponto", tipo: "texto", largura: 4 }];

// ---------------------------------------------------------------------
//  6.7 · Plano de ação
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
  { titulo: "Reunião 2 · Raio-X financeiro", descricao: "Despesas, renda, patrimônio, dívidas, proteção e investimentos" },
  { titulo: "Reunião 3 · Diagnóstico completo", descricao: "Panorama, pontos fortes e de atuação, futuro" },
  { titulo: "Reunião 4 · Fechamento do planejamento", descricao: "Plano de ação e cronograma de implementação" },
  { titulo: "Acompanhamento trimestral", descricao: "Revisão dos indicadores e ajustes no plano" },
];

/** Valores padrão de um conjunto de campos (usado ao criar cliente / item). */
export const padroes = (campos: CampoDef[]) =>
  Object.fromEntries(campos.filter((c) => c.padrao !== undefined).map((c) => [c.key, c.padrao]));
