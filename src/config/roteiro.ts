// =====================================================================
//  ROTEIRO DA CONVERSA (storytelling da coleta de dados)
//  ---------------------------------------------------------------------
//  ABERTURA_ETAPA: frase que o consultor usa ao entrar em cada etapa
//  (aparece no divisor entre as etapas, na versão consultor).
//
//  ROTEIRO: para cada seção
//    objetivo  -> por que a seção existe
//    abertura  -> frase para abrir o assunto com o cliente
//    perguntas -> perguntas-chave (checklist marcável)
//    atencao   -> pontos de atenção para o consultor
//
//  Tudo aqui fica oculto na versão apresentação.
// =====================================================================

export interface Roteiro {
  objetivo: string;
  abertura: string;
  perguntas: string[];
  atencao: string[];
}

export const ABERTURA_ETAPA: Record<string, string> = {
  conexao:
    "Antes de falar de números, quero entender a sua história: quem é você, quem depende de você e onde você quer chegar.",
  "raio-x":
    "Agora que sabemos onde você quer chegar, vamos olhar com honestidade para onde você está hoje. Sem julgamento: é um raio-x.",
  protecao: "Tudo o que planejamos depende da sua capacidade de gerar renda. Vamos ver o que protege a sua família hoje.",
  investimentos: "Vamos entender como você investe hoje e como se sente em relação a risco.",
  pre: "Com o que você me contou, já consigo mostrar uma primeira leitura. É uma visão breve; o diagnóstico completo vem na próxima conversa.",
  completo: "Lembra do que você me disse no início? Agora vamos ver o que os números dizem e o que vamos fazer a respeito.",
  jornada: "Para o plano sair do papel, vamos combinar os próximos passos, com datas e responsáveis.",
};

export const ROTEIRO: Record<string, Roteiro> = {
  cadastro: {
    objetivo: "Registrar os dados que alimentam as projeções: idade, família e regime de trabalho.",
    abertura: "Vou fazer algumas perguntas rápidas. Elas são importantes para os cálculos de futuro e de proteção.",
    perguntas: [
      "Qual a sua data de nascimento?",
      "Estado civil? O cônjuge participa das decisões financeiras?",
      "Qual a sua ocupação e o regime de trabalho?",
      "Tem filhos? Quantos?",
    ],
    atencao: [
      "Empresário ou autônomo: ajuste a meta de reserva para 12 meses nos parâmetros.",
      "Ao informar a quantidade de filhos, os cartões já aparecem em Sucessão.",
    ],
  },
  institucional: {
    objetivo: "Apresentar o Grupo Life Brasil e alinhar como o planejamento vai funcionar.",
    abertura:
      "Antes de seguirmos, quero te mostrar quem somos e como trabalhamos. O planejamento é um processo: hoje entendemos você, depois entregamos o diagnóstico e o plano.",
    perguntas: [
      "O que te motivou a buscar um planejamento agora?",
      "De 0 a 10, como você se sente hoje em relação ao seu dinheiro?",
      "Se daqui a 12 meses estivéssemos comemorando, o que teria acontecido?",
    ],
    atencao: ["Anote as palavras exatas do cliente: elas voltam no diagnóstico completo.", "Combine as próximas reuniões."],
  },
  objetivos: {
    objetivo: "Dar propósito ao plano, separando o que é essencial, o que é desejo e o que é sonho.",
    abertura: "Imagine a sua vida daqui a 1, 5 e 10 anos. O que não pode faltar? O que você gostaria de ter? E o que seria um sonho?",
    perguntas: [
      "O que é essencial para você e sua família nos próximos anos?",
      "Quanto custa cada objetivo e em quanto tempo quer realizá-lo?",
      "De 0 a 10, quanto esse objetivo muda a sua vida?",
      "Hoje, qual a chance de isso acontecer? E com um plano?",
      "Por que isso é importante para você?",
    ],
    atencao: [
      "Valor futuro: o valor na data do objetivo (o sistema calcula o aporte com o retorno nominal).",
      "A probabilidade sugerida considera a sobra mensal distribuída do essencial para o sonho.",
    ],
  },
  sucessao: {
    objetivo: "Mapear quem depende financeiramente do cliente e o custo mensal com cada um.",
    abertura: "Vamos falar de quem depende de você hoje: filhos e outras pessoas que você ajuda.",
    perguntas: [
      "Em que fase escolar cada filho está?",
      "Escola pública ou particular? Qual a mensalidade?",
      "Você ajuda pais, enteados ou outras pessoas todo mês?",
    ],
    atencao: [
      "Mensalidades e auxílios daqui entram automaticamente nas despesas fixas (não lance de novo).",
      "Esse custo também pesa no cálculo de proteção (seguro de vida).",
    ],
  },
  despesas: {
    objetivo: "Revelar o custo de vida real, separando o que é fixo do que é variável.",
    abertura: "Não existe julgamento aqui. Vamos passar categoria por categoria para entender para onde vai o dinheiro.",
    perguntas: [
      "Quanto gasta com casa (aluguel, condomínio, contas)?",
      "Quanto gasta com mercado e alimentação fora?",
      "Quais gastos anuais costumam ser esquecidos? (IPVA, IPTU, seguros, viagens)",
      "Qual gasto você cortaria primeiro? E qual nunca cortaria?",
    ],
    atencao: [
      "Gastos anuais: divida por 12.",
      "Financiamento/Dívidas é preenchido sozinho com as parcelas da seção 8.",
      "Confira com as faturas do cartão: os gastos variáveis costumam ser subestimados.",
    ],
  },
  renda: {
    objetivo: "Conhecer todas as fontes de renda da família.",
    abertura: "Agora o lado de quem entra: sua renda, a do cônjuge e outras fontes.",
    perguntas: [
      "Qual a sua renda líquida mensal?",
      "E a do cônjuge?",
      "Recebe PLR, bônus, aluguéis ou dividendos?",
    ],
    atencao: ["Sempre renda líquida.", "Bônus e PLR: use frequência Anual."],
  },
  patrimonio: {
    objetivo: "Mapear imóveis e bens móveis, se estão quitados e se estão protegidos.",
    abertura: "Vamos listar o que você já construiu: imóveis, carros e outros bens.",
    perguntas: [
      "Quais imóveis você tem? São para morar, renda ou investimento?",
      "Estão quitados?",
      "Seus veículos têm seguro? Pensa em trocar ou ampliar?",
    ],
    atencao: ["Investimentos financeiros entram na etapa 4.", "Bens sem seguro viram oportunidade na matriz."],
  },
  dividas: {
    objetivo: "Entender os compromissos mensais: financiamentos, consórcios e empréstimos.",
    abertura: "Dívida não é necessariamente ruim. O que importa é o custo e se ela cabe no seu mês.",
    perguntas: [
      "Tem financiamento? Qual a parcela, o prazo e o saldo?",
      "Participa de consórcio? Já foi contemplado?",
      "Tem empréstimos, cheque especial ou cartão parcelado?",
    ],
    atencao: ["As parcelas daqui alimentam a categoria Financiamento/Dívidas das despesas.", "Empréstimos pessoais são prioridade no plano."],
  },
  projetos: {
    objetivo: "Registrar projetos em andamento ou planejados que vão exigir recursos.",
    abertura: "Tem algum projeto em mente? Uma reforma, um negócio, um investimento?",
    perguntas: ["Qual o projeto e quanto deve custar?", "Para quando?", "Já começou ou ainda é uma ideia?"],
    atencao: ["Projetos com data viram objetivos ou ações no plano."],
  },
  corporativo: {
    objetivo: "Entender a relação do cliente com empresas: participação, proteção e benefícios.",
    abertura: "Você tem empresa ou participação em alguma sociedade?",
    perguntas: [
      "Qual o ramo e o faturamento médio?",
      "Quantos sócios e funcionários?",
      "A empresa tem seguro, plano de saúde e acordo de sócios?",
    ],
    atencao: ["Empresa sem seguro de sócio ou acordo societário é oportunidade de proteção."],
  },
  protecao: {
    objetivo: "Avaliar se a família e o padrão de vida estão protegidos se a renda faltar.",
    abertura: "Se você faltasse amanhã, o plano continuaria? Vamos ver o que protege a sua família hoje.",
    perguntas: [
      "Tem seguro de vida individual? Qual o capital?",
      "Tem seguro pela empresa? (termina com o vínculo)",
      "Se ficasse impossibilitado de trabalhar, como pagaria as contas?",
      "Tem plano de saúde e previdência privada?",
    ],
    atencao: ["O seguro da empresa não entra no capital atual.", "O capital necessário já desconta os investimentos e a previdência."],
  },
  investimentos: {
    objetivo: "Entender a experiência, o perfil e a estrutura de investimentos do cliente.",
    abertura: "Como você investe hoje? E como se sente quando o investimento oscila?",
    perguntas: [
      "Como avalia seu conhecimento sobre investimentos?",
      "Se o investimento caísse 10% em um mês, o que faria?",
      "Quanto tem investido? Quanto pode resgatar no mesmo dia?",
      "Tem assessor?",
    ],
    atencao: ["O valor com liquidez diária é a reserva de emergência do diagnóstico."],
  },
  "plano-atual": {
    objetivo: "Mostrar uma primeira leitura, ainda na reunião de coleta.",
    abertura: "Com o que você me contou, olha o retrato de hoje.",
    perguntas: ["Isso faz sentido com o que você sente no dia a dia?", "O que mais te surpreendeu?"],
    atencao: ["É uma visão breve: não entre em recomendações ainda.", "Agende a reunião do diagnóstico completo."],
  },
  panorama: {
    objetivo: "Abrir a apresentação com a nota LIFE e os pilares.",
    abertura: "Vamos começar pelo panorama geral: onde você está bem e onde precisa de atenção.",
    perguntas: ["Concorda com essa leitura?"],
    atencao: ["Comece pelos pontos fortes."],
  },
  "plano-atual-completo": {
    objetivo: "Detalhar categorias, fluxo de caixa e balanço patrimonial.",
    abertura: "Aqui está o detalhe: para onde vai cada real e o que você tem e deve.",
    perguntas: ["Alguma categoria te surpreendeu?"],
    atencao: ["Use o fluxo para mostrar a sobra real."],
  },
  "pontos-fortes": {
    objetivo: "Reconhecer o que o cliente já faz bem e deve manter.",
    abertura: "Antes dos ajustes, quero destacar o que você já faz muito bem.",
    perguntas: ["O que mais te orgulha na sua vida financeira?"],
    atencao: ["Acrescente pontos que os números não mostram."],
  },
  "pontos-negativos": {
    objetivo: "Mostrar os pontos de atuação e a probabilidade de cada objetivo acontecer.",
    abertura: "Agora os pontos onde vamos atuar. Repare na diferença entre o cenário atual e o cenário com plano.",
    perguntas: ["Qual destes pontos mais te incomoda?"],
    atencao: ["No máximo 3 a 5 pontos em destaque.", "Conecte cada ponto a um objetivo do cliente."],
  },
  futuro: {
    objetivo: "Calcular a independência financeira com os dados do cliente.",
    abertura: "Independência financeira é quando trabalhar passa a ser uma escolha. Vamos ver quando isso acontece para você.",
    perguntas: ["Com que idade gostaria de ter essa opção?", "Quanto precisaria por mês, em valores de hoje?", "Conta com INSS ou aluguéis?"],
    atencao: ["Valores reais (já descontada a inflação).", "A projeção considera investir toda a sobra mensal atual."],
  },
  oportunidades: {
    objetivo: "Mapear as oportunidades do ecossistema (uso interno do consultor).",
    abertura: "",
    perguntas: [],
    atencao: ["Seção oculta na versão apresentação por padrão.", "Leve as oportunidades para o plano de ação com um clique."],
  },
  "plano-acao": {
    objetivo: "Fechar ações priorizadas, por área e prazo.",
    abertura: "Um plano só funciona se for executável. Vamos escolher juntos as primeiras ações.",
    perguntas: ["Qual destas ações você consegue começar esta semana?", "O que pode te impedir de cumprir o plano?"],
    atencao: ["Comece com 3 a 5 ações de curto prazo."],
  },
  "jornada-cliente": {
    objetivo: "Mostrar ao cliente a jornada completa e onde ele está.",
    abertura: "Esta é a nossa jornada juntos. Vamos marcar as próximas datas.",
    perguntas: ["Qual a melhor data para a próxima reunião?"],
    atencao: ["Saia da reunião com a próxima data marcada."],
  },
  cronograma: {
    objetivo: "Distribuir as ações do plano no tempo.",
    abertura: "Assim fica a implementação ao longo dos próximos meses.",
    perguntas: ["Esse ritmo é viável para você?"],
    atencao: ["Curto: até 3 meses · Médio: 3 a 12 meses · Longo: acima de 12 meses."],
  },
};
