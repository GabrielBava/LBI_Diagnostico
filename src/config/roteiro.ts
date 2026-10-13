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
      "De 0 a 10, como você se sente hoje em relação ao seu dinheiro? (clique na nota)",
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
      "Você ajuda pais, enteados ou outras pessoas todo mês? Com quanto?",
    ],
    atencao: [
      "Escolha a categoria antes de preencher: pais e outros dependentes não têm escolaridade.",
      "Mensalidades, auxílios e custos daqui entram sozinhos nas despesas fixas (bloco Dependentes).",
      "A escolaridade define o custo educacional no cálculo de proteção (6.2).",
    ],
  },
  despesas: {
    objetivo: "Revelar o custo de vida real, bloco por bloco, separando o que é fixo do que é variável.",
    abertura: "Não existe julgamento aqui. Vamos abrir bloco por bloco, começando pela casa, para entender para onde vai o dinheiro.",
    perguntas: [
      "Casa: aluguel, condomínio, luz, água, internet, gás?",
      "Mercado e alimentação do dia a dia?",
      "Transporte (combustível, garagem, Uber/99, transporte público), saúde e profissionais (diarista, babá)?",
      "Quais gastos anuais costumam ser esquecidos? (IPTU, seguros, viagens)",
      "Qual gasto você cortaria primeiro? E qual nunca cortaria?",
    ],
    atencao: [
      "Gastos anuais: divida por 12.",
      "Dependentes vêm de Sucessão; manutenção e IPVA dos veículos, do Patrimônio; anuidade dos cartões, da Renda.",
      "Parcelas de financiamentos e dívidas não entram aqui: são lançadas em 8 · Financiamento e crédito e somadas no total.",
      "Algo fora da lista? Use “+ Adicionar item” dentro do bloco.",
      "Confira com as faturas do cartão: os gastos variáveis costumam ser subestimados.",
    ],
  },
  renda: {
    objetivo: "Conhecer todas as fontes de renda da família e o uso do cartão de crédito.",
    abertura: "Agora o lado de quem entra: sua renda, a do cônjuge, rendas extras e como você usa o cartão.",
    perguntas: [
      "Qual a sua renda mensal? Sabe a bruta, a líquida ou as duas?",
      "E a do cônjuge?",
      "Tem renda extra, aluguéis, PLR ou ajuda de outra pessoa?",
      "Quais cartões usa, qual o limite e quanto gasta por mês? Acumula milhas? Paga anuidade?",
      "Declara o imposto de renda no modelo simplificado ou completo?",
    ],
    atencao: [
      "Se o cliente souber só a bruta (ou só a líquida), a outra é estimada pelas tabelas de INSS e IR.",
      "Declaração completa abre espaço para PGBL (dedução de até 12% da renda bruta).",
      "Bônus e PLR: use frequência Anual.",
      "O gasto no cartão já está dentro das despesas: serve para avaliar limite e milhas.",
    ],
  },
  patrimonio: {
    objetivo: "Mapear imóveis e bens móveis, se estão quitados ou financiados, se estão protegidos e o que o cliente quer comprar.",
    abertura: "Vamos listar o que você já construiu: imóveis, carros e outros bens. E o que pretende conquistar.",
    perguntas: [
      "Quais imóveis você tem? São para morar, renda ou investimento?",
      "Estão quitados ou financiados? Se financiados, com qual instituição, qual a parcela e quanto falta?",
      "Os imóveis e veículos têm seguro? Quanto gasta por ano com manutenção e IPVA?",
      "Pensa em trocar ou ampliar algum bem? Qual o modelo de desejo?",
      "Pretende comprar outro imóvel ou veículo? À vista, financiado ou por consórcio?",
    ],
    atencao: [
      "Bem financiado vira financiamento automaticamente (não lance de novo na seção 8).",
      "Manutenção e IPVA entram em Despesas · Transporte.",
      "Aquisições por financiamento ou consórcio viram oportunidade de consórcio na matriz.",
      "Investimentos financeiros entram na etapa 4; a reserva, em Proteção.",
      "Bens sem seguro viram oportunidade na matriz.",
    ],
  },
  dividas: {
    objetivo: "Entender os compromissos mensais: financiamentos, consórcios e dívidas.",
    abertura: "Dívida não é necessariamente ruim. O que importa é o custo e se ela cabe no seu mês.",
    perguntas: [
      "Além dos bens já listados, tem outro financiamento?",
      "Participa de consórcio? Quanto falta e já foi contemplado?",
      "Tem dívidas de cartão, cheque especial, carnê, renegociação ou empréstimos?",
    ],
    atencao: [
      "Financiamentos de imóveis e veículos financiados já aparecem aqui, vindos do Patrimônio.",
      "As parcelas daqui entram no total de despesas (não são digitadas em Despesas).",
      "Cartão e cheque especial são as dívidas mais caras: prioridade no plano.",
    ],
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
    objetivo: "Avaliar a reserva de emergência e o que protege a família se a renda faltar.",
    abertura: "Se a renda parasse amanhã, por quanto tempo você se manteria? E se você faltasse, o plano continuaria?",
    perguntas: [
      "Tem reserva de emergência? Quanto e para quantos meses daria?",
      "Tem seguro de vida individual? Qual o capital?",
      "Tem seguro pela empresa? (termina com o vínculo)",
      "Se ficasse impossibilitado de trabalhar, como pagaria as contas?",
      "Tem plano de saúde e previdência privada? PGBL ou VGBL?",
    ],
    atencao: [
      "Compare os meses que o cliente imagina com os meses calculados pelas despesas.",
      "PGBL só faz sentido com declaração completa do IR (6 · Renda).",
      "O cálculo do que contratar (educacional, padrão de vida e sucessão) fica em 6.2.",
    ],
  },
  aposentadoria: {
    objetivo: "Definir como o cliente quer viver no futuro: idade, estilo de vida e renda desejada.",
    abertura: "Vamos imaginar a sua aposentadoria. Com que idade e com qual estilo de vida você gostaria de viver?",
    perguntas: [
      "Com que idade gostaria de ter a opção de parar de trabalhar?",
      "Imagina uma vida mais simples, igual à de hoje ou mais confortável?",
      "Quanto precisaria por mês, em valores de hoje?",
      "Vai contar com INSS, aluguéis ou previdência?",
    ],
    atencao: [
      "Com a renda desejada em branco, o cálculo usa o custo de vida atual ajustado pelo estilo de vida.",
      "A projeção aparece no diagnóstico (6.5).",
    ],
  },
  investimentos: {
    objetivo: "Entender a experiência, o perfil e a estrutura de investimentos do cliente.",
    abertura: "Como você investe hoje? E como se sente quando o investimento oscila?",
    perguntas: [
      "Como avalia seu conhecimento sobre investimentos?",
      "Sobre quais temas você já estudou ou leu?",
      "Se o investimento caísse 10% em um mês, o que faria?",
      "Quanto tem investido, sem contar a reserva? Tem assessor?",
    ],
    atencao: ["A reserva de emergência é informada em Proteção (11).", "Os temas estudados ajudam a calibrar a linguagem da recomendação."],
  },
  "plano-atual": {
    objetivo: "Mostrar uma primeira leitura, ainda na reunião de coleta: o fluxo atual comparado ao modelo 50-30-20.",
    abertura: "Com o que você me contou, olha o retrato de hoje. Uma referência simples: 50% da renda para necessidades, 30% para desejos e 20% para o futuro.",
    perguntas: ["Isso faz sentido com o que você sente no dia a dia?", "O que mais te surpreendeu?", "Onde você acha que dá para ajustar?"],
    atencao: [
      "Aparece só depois de “Finalizar coleta”.",
      "É uma visão breve: não entre em recomendações ainda.",
      "Agende a reunião do diagnóstico completo.",
    ],
  },
  panorama: {
    objetivo: "Abrir a apresentação com a nota LIFE e os pilares.",
    abertura: "Vamos começar pelo panorama geral: onde você está bem e onde precisa de atenção.",
    perguntas: ["Concorda com essa leitura?"],
    atencao: ["Comece pelos pontos fortes."],
  },
  "plano-atual-completo": {
    objetivo: "Mostrar renda × despesas, categorias, balanço patrimonial e o que contratar de proteção.",
    abertura: "Aqui está o detalhe: quanto entra, para onde vai, o que você tem e o que protege a sua família.",
    perguntas: [
      "Alguma categoria te surpreendeu?",
      "Por quanto tempo você gostaria de garantir o padrão de vida da família: 1, 5 ou 15 anos?",
    ],
    atencao: [
      "Clique no horizonte (1, 5 ou 15 anos) escolhido com o cliente.",
      "Premissas (ITCMD, honorários, faculdade) ficam na versão consultor.",
    ],
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
    objetivo: "Mostrar a independência financeira projetada com as premissas da seção 12.",
    abertura: "Independência financeira é quando trabalhar passa a ser uma escolha. Vamos ver quando isso acontece para você.",
    perguntas: ["Essa projeção te tranquiliza ou preocupa?", "Quanto a mais conseguiria investir por mês?"],
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
