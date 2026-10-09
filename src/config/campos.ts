// =====================================================================
//  CAMPOS DO DIAGNÓSTICO
//  ---------------------------------------------------------------------
//  Este é o arquivo para INCLUIR, REMOVER ou RENOMEAR campos.
//  Cada campo declarado aqui aparece automaticamente na tela e é salvo
//  junto com o cliente. Para usar um campo novo em algum cálculo,
//  leia o valor dele em src/lib/calculos.ts pela mesma `key`.
//
//  Tipos disponíveis:
//    texto | textarea | email | telefone | data | numero | moeda |
//    percentual | select | simnao
//
//  Propriedades úteis:
//    ajuda   -> pergunta/dica exibida abaixo do campo (apoia a conversa)
//    padrao  -> valor inicial ao criar um cliente ou um novo item
//    opcoes  -> lista de opções (para select)
//    largura -> 1, 2 ou 3 colunas (formulários)
// =====================================================================

import type { Valor } from "@/types";

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
  | "simnao";

export interface CampoDef {
  key: string;
  label: string;
  tipo: TipoCampo;
  opcoes?: string[];
  placeholder?: string;
  ajuda?: string;
  sufixo?: string;
  padrao?: Valor;
  largura?: 1 | 2 | 3;
}

// ---------------------------------------------------------------------
//  Opções compartilhadas
// ---------------------------------------------------------------------
export const OPCOES = {
  estadoCivil: ["Solteiro(a)", "Casado(a)", "União estável", "Divorciado(a)", "Viúvo(a)"],
  regimeTrabalho: ["CLT", "Servidor público", "Empresário", "Autônomo / Profissional liberal", "Aposentado", "Outro"],
  prioridade: ["Alta", "Média", "Baixa"],
  categoriaSonho: ["Imóvel", "Veículo", "Viagem", "Educação", "Negócio próprio", "Família / Casamento", "Experiência", "Outro"],
  escola: ["Ainda não estuda", "Pública", "Particular"],
  faculdade: ["Particular", "Pública", "Exterior", "Não planejado"],
  frequencia: ["Mensal", "Anual"],
  tipoReceita: ["Ativa (trabalho)", "Passiva (aluguel, dividendos, juros)"],
  titular: ["Cliente", "Cônjuge", "Família"],
  tipoDespesa: ["Fixa", "Variável", "Família", "Educação", "Saúde", "Luxo"],
  tipoPatrimonio: [
    "Reserva / Caixa",
    "Renda fixa",
    "Renda variável",
    "Previdência",
    "Imóvel",
    "Veículo",
    "Empresa / Participação",
    "Outros",
  ],
  liquidez: ["Diária", "Até 30 dias", "Acima de 30 dias", "Sem liquidez"],
  tipoDivida: ["Financiamento", "Crédito", "Cartão", "Outros"],
  pilar: ["Fluxo de caixa", "Reserva", "Dívidas", "Proteção", "Aposentadoria", "Sonhos", "Alavancagem", "Outros"],
  responsavel: ["Cliente", "Consultor", "Ambos"],
  status: ["Pendente", "Em andamento", "Concluída"],
};

// ---------------------------------------------------------------------
//  Formulários (seções de campo único)
// ---------------------------------------------------------------------
/** Expectativas registradas na Apresentação (ficam junto ao cadastro). */
export const CAMPOS_APRESENTACAO: CampoDef[] = [
  {
    key: "motivacao",
    label: "O que motivou a busca pelo diagnóstico?",
    tipo: "textarea",
    largura: 2,
    placeholder: "Nas palavras do cliente…",
  },
  {
    key: "satisfacao",
    label: "Satisfação financeira hoje (0 a 10)",
    tipo: "numero",
    ajuda: "Repita a pergunta nas revisões para medir a evolução.",
  },
  {
    key: "sucesso12meses",
    label: "Como seria o sucesso em 12 meses?",
    tipo: "textarea",
    largura: 3,
    placeholder: "“Se daqui a 12 meses estivéssemos comemorando, o que teria acontecido?”",
  },
];

export const CAMPOS_CADASTRO: CampoDef[] = [
  { key: "nome", label: "Nome", tipo: "texto" },
  { key: "email", label: "E-mail", tipo: "email" },
  { key: "telefone", label: "Telefone", tipo: "telefone", placeholder: "(00) 00000-0000" },
  { key: "nascimento", label: "Data nascimento", tipo: "data" },
  { key: "ocupacao", label: "Ocupação", tipo: "texto" },
  { key: "estadoCivil", label: "Estado civil", tipo: "select", opcoes: OPCOES.estadoCivil },
  { key: "perfil", label: "Perfil", tipo: "texto", placeholder: "Ex.: Cliente Private" },
  {
    key: "regimeTrabalho",
    label: "Regime de trabalho",
    tipo: "select",
    opcoes: OPCOES.regimeTrabalho,
    ajuda: "Renda instável (empresário/autônomo) pede reserva de emergência maior.",
  },
  { key: "conjuge", label: "Nome do cônjuge", tipo: "texto" },
  { key: "cidade", label: "Cidade / UF", tipo: "texto" },
  { key: "origem", label: "Como chegou até nós", tipo: "texto", placeholder: "Indicação de..., evento, redes" },
  { key: "dataPrimeiraReuniao", label: "Data da 1ª reunião", tipo: "data" },
];

export const CAMPOS_PARAMETROS: CampoDef[] = [
  { key: "inflacaoGeral", label: "Inflação geral (% a.a.)", tipo: "percentual", padrao: 5 },
  { key: "inflacaoEducacional", label: "Inflação educacional (% a.a.)", tipo: "percentual", padrao: 8 },
  {
    key: "retornoReal",
    label: "Retorno real esperado (% a.a.)",
    tipo: "percentual",
    padrao: 4,
    ajuda: "Rentabilidade acima da inflação usada em sonhos e educação.",
  },
  {
    key: "mesesReserva",
    label: "Meta de reserva (meses)",
    tipo: "numero",
    padrao: 6,
    ajuda: "Sugestão: 6 meses (CLT/servidor) e 12 meses (empresário/autônomo).",
  },
  {
    key: "limiteComprometimento",
    label: "Limite de parcelas (% da renda)",
    tipo: "percentual",
    padrao: 30,
    ajuda: "Acima disso as parcelas comprometem o orçamento.",
  },
];

export const CAMPOS_SEGURO: CampoDef[] = [
  { key: "capitalAtual", label: "Capital segurado atual", tipo: "moeda", ajuda: "Some todas as apólices individuais." },
  { key: "capitalEmpresa", label: "Seguro pela empresa", tipo: "moeda", ajuda: "Acaba quando o vínculo termina." },
  { key: "premioAtual", label: "Prêmio mensal atual", tipo: "moeda" },
  {
    key: "anosProtecao",
    label: "Anos de proteção da renda",
    tipo: "numero",
    padrao: 5,
    ajuda: "Por quanto tempo a família precisa manter o padrão de vida?",
  },
  {
    key: "custoInventario",
    label: "Custos de inventário (% patrimônio)",
    tipo: "percentual",
    padrao: 15,
    ajuda: "ITCMD + honorários + custas. Normalmente entre 10% e 20%.",
  },
  { key: "incluirEducacao", label: "Incluir educação dos filhos", tipo: "simnao", padrao: "Sim" },
  { key: "quitarDividas", label: "Quitar dívidas", tipo: "simnao", padrao: "Sim" },
  { key: "contarSeguroEmpresa", label: "Considerar seguro da empresa", tipo: "simnao", padrao: "Não" },
  { key: "temInvalidez", label: "Possui cobertura de invalidez / DIT", tipo: "simnao" },
  { key: "temSaude", label: "Possui plano de saúde", tipo: "simnao" },
  { key: "beneficiarios", label: "Beneficiários", tipo: "texto", largura: 2 },
];

export const CAMPOS_APOSENTADORIA: CampoDef[] = [
  { key: "idadeAtual", label: "Idade atual", tipo: "numero", ajuda: "Em branco = calculada pela data de nascimento." },
  { key: "idadeAlvo", label: "Idade alvo", tipo: "numero", padrao: 60 },
  { key: "despesasAnuais", label: "Despesas anuais", tipo: "moeda", ajuda: "Em branco = Despesas × 12." },
  { key: "aporteAtual", label: "Aporte atual mensal", tipo: "moeda" },
  { key: "rendaPassivaAtual", label: "Renda passiva atual /mês", tipo: "moeda", ajuda: "INSS, aluguéis, etc." },
  { key: "rendaPassivaAlvo", label: "Renda passiva alvo /mês", tipo: "moeda", ajuda: "Em branco = despesas anuais ÷ 12." },
  { key: "retornoReal", label: "Retorno real (% a.a.)", tipo: "percentual", padrao: 4 },
  {
    key: "taxaRetirada",
    label: "Taxa de retirada segura (% a.a.)",
    tipo: "percentual",
    padrao: 4,
    ajuda: "4% = patrimônio alvo de 25× a renda anual.",
  },
  {
    key: "patrimonioDestinado",
    label: "Patrimônio já destinado",
    tipo: "moeda",
    ajuda: "Em branco = renda fixa + renda variável + previdência.",
  },
];

export const CAMPOS_ALAVANCAGEM: CampoDef[] = [
  { key: "bemDesejado", label: "Bem desejado", tipo: "texto", placeholder: "Ex.: Apartamento" },
  { key: "valorBem", label: "Valor do bem", tipo: "moeda" },
  { key: "prazoAnos", label: "Prazo (anos)", tipo: "numero", padrao: 3 },
  { key: "taxaFinanciamento", label: "Taxa financ. (% a.a.)", tipo: "percentual", padrao: 14 },
  { key: "taxaConsorcio", label: "Taxa adm. consórcio (% total)", tipo: "percentual", padrao: 20 },
  { key: "fundoReserva", label: "Fundo de reserva (% total)", tipo: "percentual", padrao: 1 },
  { key: "retornoInvestido", label: "Retorno investido (% a.a.)", tipo: "percentual", padrao: 0 },
  { key: "valorizacaoBem", label: "Valorização bem (% a.a.)", tipo: "percentual", padrao: 5 },
];

// ---------------------------------------------------------------------
//  Listas (várias linhas por cliente)
// ---------------------------------------------------------------------
export interface ListaDef {
  titulo: string;
  textoAdicionar?: string;
  vazio: string;
  colunas: CampoDef[];
}

export const LISTAS: Record<
  "sonhos" | "filhos" | "receitas" | "despesas" | "patrimonio" | "dividas" | "plano",
  ListaDef
> = {
  sonhos: {
    titulo: "Sonhos e objetivos",
    vazio: "Nenhum sonho registrado. Pergunte: “O que você quer ter realizado daqui a 5, 10 e 20 anos?”",
    colunas: [
      { key: "descricao", label: "Sonho", tipo: "texto", placeholder: "Ex.: Casa na praia" },
      { key: "categoria", label: "Categoria", tipo: "select", opcoes: OPCOES.categoriaSonho, padrao: "Imóvel" },
      { key: "valor", label: "Valor hoje", tipo: "moeda" },
      { key: "prazo", label: "Prazo (anos)", tipo: "numero", padrao: 5 },
      { key: "acumulado", label: "Já acumulado", tipo: "moeda" },
      { key: "prioridade", label: "Prioridade", tipo: "select", opcoes: OPCOES.prioridade, padrao: "Média" },
      { key: "motivo", label: "Por que é importante?", tipo: "texto", placeholder: "Nas palavras do cliente", largura: 2 },
    ],
  },
  filhos: {
    titulo: "Filhos e dependentes",
    vazio: "Nenhum filho cadastrado. Se o cliente não tem filhos, marque “Não se aplica”.",
    colunas: [
      { key: "nome", label: "Nome", tipo: "texto" },
      { key: "idade", label: "Idade", tipo: "numero" },
      { key: "escola", label: "Escola atual", tipo: "select", opcoes: OPCOES.escola, padrao: "Particular" },
      { key: "mensalidadeEscola", label: "Mensalidade escola", tipo: "moeda" },
      { key: "faculdade", label: "Faculdade", tipo: "select", opcoes: OPCOES.faculdade, padrao: "Particular" },
      { key: "mensalidadeFaculdade", label: "Mensalidade faculdade (hoje)", tipo: "moeda" },
      { key: "duracaoFaculdade", label: "Duração (anos)", tipo: "numero", padrao: 5 },
      { key: "idadeIngresso", label: "Idade de ingresso", tipo: "numero", padrao: 18 },
    ],
  },
  receitas: {
    titulo: "Receitas",
    vazio: "Nenhuma receita registrada. Comece pela renda líquida principal.",
    colunas: [
      { key: "fonte", label: "Fonte", tipo: "texto", placeholder: "Ex.: Salário líquido" },
      { key: "valor", label: "Valor", tipo: "moeda" },
      { key: "frequencia", label: "Frequência", tipo: "select", opcoes: OPCOES.frequencia, padrao: "Mensal" },
      { key: "tipo", label: "Tipo", tipo: "select", opcoes: OPCOES.tipoReceita, padrao: "Ativa (trabalho)" },
      { key: "titular", label: "Titular", tipo: "select", opcoes: OPCOES.titular, padrao: "Cliente" },
    ],
  },
  despesas: {
    titulo: "Despesas mensais",
    vazio: "Nenhuma despesa registrada. Siga a ordem: moradia, transporte, alimentação, saúde, educação, lazer.",
    colunas: [
      { key: "categoria", label: "Categoria", tipo: "texto" },
      { key: "valor", label: "Valor", tipo: "moeda" },
      { key: "tipo", label: "Tipo", tipo: "select", opcoes: OPCOES.tipoDespesa, padrao: "Fixa" },
      { key: "frequencia", label: "Frequência", tipo: "select", opcoes: OPCOES.frequencia, padrao: "Mensal" },
    ],
  },
  patrimonio: {
    titulo: "Patrimônio",
    vazio: "Nenhum bem ou investimento registrado.",
    colunas: [
      { key: "descricao", label: "Descrição", tipo: "texto" },
      { key: "valor", label: "Valor", tipo: "moeda" },
      { key: "tipo", label: "Tipo", tipo: "select", opcoes: OPCOES.tipoPatrimonio, padrao: "Renda fixa" },
      { key: "liquidez", label: "Liquidez", tipo: "select", opcoes: OPCOES.liquidez, padrao: "Diária" },
      { key: "instituicao", label: "Instituição", tipo: "texto" },
      { key: "rentabilidade", label: "Rentab. % a.a.", tipo: "percentual" },
    ],
  },
  dividas: {
    titulo: "Dívidas",
    vazio: "Nenhuma dívida registrada. Se o cliente não possui dívidas, marque “Não se aplica”.",
    colunas: [
      { key: "descricao", label: "Descrição", tipo: "texto" },
      { key: "saldo", label: "Saldo", tipo: "moeda" },
      { key: "taxa", label: "Taxa a.a. %", tipo: "percentual", padrao: 0 },
      { key: "prazo", label: "Prazo (meses)", tipo: "numero", padrao: 0 },
      { key: "tipo", label: "Tipo", tipo: "select", opcoes: OPCOES.tipoDivida, padrao: "Financiamento" },
    ],
  },
  plano: {
    titulo: "Plano de ação",
    vazio: "Nenhuma ação no plano. Use as sugestões do diagnóstico acima ou adicione manualmente.",
    colunas: [
      { key: "acao", label: "Ação", tipo: "texto", largura: 2 },
      { key: "pilar", label: "Pilar", tipo: "select", opcoes: OPCOES.pilar, padrao: "Outros" },
      { key: "prioridade", label: "Prioridade", tipo: "select", opcoes: OPCOES.prioridade, padrao: "Média" },
      { key: "prazo", label: "Prazo", tipo: "data" },
      { key: "responsavel", label: "Responsável", tipo: "select", opcoes: OPCOES.responsavel, padrao: "Cliente" },
      { key: "status", label: "Status", tipo: "select", opcoes: OPCOES.status, padrao: "Pendente" },
    ],
  },
};

/** Valores padrão de um conjunto de campos (usado ao criar cliente / item). */
export const padroes = (campos: CampoDef[]) =>
  Object.fromEntries(campos.filter((c) => c.padrao !== undefined).map((c) => [c.key, c.padrao]));
