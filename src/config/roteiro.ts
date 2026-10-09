// =====================================================================
//  ROTEIRO DA CONVERSA (storytelling da coleta de dados)
//  ---------------------------------------------------------------------
//  Para cada etapa:
//    objetivo   -> por que esta etapa existe (o que o consultor busca)
//    abertura   -> frase para abrir o assunto com o cliente
//    perguntas  -> perguntas-chave (viram checklist marcável na tela)
//    atencao    -> pontos de atenção / boas práticas para o consultor
//    transicao  -> frase-ponte que conecta com a próxima etapa
//
//  Edite livremente: o texto aparece no painel "Roteiro da conversa",
//  que fica oculto no Modo apresentação (tela compartilhada com o cliente).
// =====================================================================

import type { EtapaId } from "./etapas";

export interface Roteiro {
  objetivo: string;
  abertura: string;
  perguntas: string[];
  atencao: string[];
  transicao?: string;
}

export const ROTEIRO: Record<EtapaId, Roteiro> = {
  apresentacao: {
    objetivo:
      "Gerar confiança e alinhar expectativas: o cliente precisa entender como o processo funciona, quanto tempo leva e o que vai receber.",
    abertura:
      "Antes de falarmos de números, quero entender a sua história. O Diagnóstico LIFE funciona como um check-up: primeiro entendemos onde você quer chegar, depois olhamos onde você está hoje e, no final, entregamos um plano claro de como chegar lá.",
    perguntas: [
      "O que te motivou a buscar este diagnóstico agora?",
      "Se daqui a 12 meses estivéssemos comemorando, o que teria acontecido na sua vida financeira?",
      "De 0 a 10, como você se sente hoje em relação ao seu dinheiro? Por quê?",
      "Quem mais participa das decisões financeiras da família?",
    ],
    atencao: [
      "Ouça mais do que fala (80/20). Ainda não é hora de recomendar nada.",
      "Anote as palavras exatas do cliente: elas voltam na apresentação do diagnóstico.",
      "Combine o processo: 3 encontros + acompanhamento.",
    ],
    transicao: "Perfeito. Vou registrar alguns dados básicos para personalizar as suas projeções.",
  },
  cadastro: {
    objetivo: "Registrar os dados de base que alimentam todas as projeções (idade, família, regime de trabalho).",
    abertura: "Vou fazer algumas perguntas rápidas. Elas são importantes para os cálculos de aposentadoria e de proteção.",
    perguntas: [
      "Qual a sua data de nascimento?",
      "Estado civil e regime de bens? O cônjuge participa das decisões?",
      "Qual a sua profissão e o regime de trabalho (CLT, empresário, autônomo)?",
      "Quem depende financeiramente de você hoje?",
    ],
    atencao: [
      "Renda instável (empresário/autônomo) pede meta de reserva maior: ajuste em Parâmetros.",
      "Confirme os parâmetros macro (inflação e retorno real) antes de seguir.",
    ],
    transicao:
      "Agora vem a parte mais importante: quero entender os seus sonhos. Tudo o que fizermos daqui para frente será para viabilizá-los.",
  },
  sonhos: {
    objetivo: "Dar propósito ao plano. Sonho com valor e prazo vira meta, e meta gera disciplina.",
    abertura: "Imagine a sua vida daqui a 5, 10 e 20 anos. O que você quer ter realizado?",
    perguntas: [
      "Qual sonho você já adiou por causa de dinheiro?",
      "Quanto custa esse sonho hoje? Em quanto tempo quer realizá-lo?",
      "Por que isso é importante para você? (registre no campo “Por que é importante?”)",
      "Se só pudesse realizar um deles, qual seria?",
      "Já tem algum valor guardado para algum desses sonhos?",
    ],
    atencao: [
      "Transforme desejos vagos em metas com valor e prazo. Se o cliente não souber o valor, estimem juntos na hora.",
      "Os valores estão em R$ de hoje: o sistema considera o retorno real dos investimentos.",
      "A motivação do cliente (o “porquê”) aparece no diagnóstico e no plano.",
    ],
    transicao: "Muitos desses sonhos envolvem a família. Vamos falar dos filhos e do planejamento da educação deles.",
  },
  filhos: {
    objetivo: "Dimensionar a educação dos filhos e entender quem depende do cliente (impacta seguro de vida).",
    abertura: "Educação é um dos maiores investimentos de uma família, e o custo sobe acima da inflação.",
    perguntas: [
      "Quantos filhos e quais as idades?",
      "Estudam em escola pública ou particular? Qual a mensalidade?",
      "Vocês imaginam faculdade particular, pública ou no exterior?",
      "Pretendem ter mais filhos?",
    ],
    atencao: [
      "A inflação educacional (Parâmetros) corrige o custo da faculdade até o ingresso.",
      "Sem filhos? Marque “Não se aplica” e registre planos futuros nas anotações.",
    ],
    transicao:
      "Agora que sabemos onde vocês querem chegar, vamos olhar para o presente, começando pelo que entra todo mês.",
  },
  receitas: {
    objetivo: "Conhecer todas as fontes de renda, sua estabilidade e o que é renda ativa x passiva.",
    abertura: "Vamos mapear tudo que entra: salário, pró-labore, aluguéis, dividendos, bônus.",
    perguntas: [
      "Qual a sua renda líquida mensal (já descontados os impostos)?",
      "Recebe 13º, férias, PLR ou bônus? Em que meses?",
      "A renda é estável ou varia? Qual foi a média dos últimos 12 meses?",
      "Existe renda do cônjuge ou de aluguéis/investimentos?",
    ],
    atencao: [
      "Use sempre renda LÍQUIDA.",
      "Rendas anuais (13º, PLR, bônus) entram com frequência “Anual”: o sistema divide por 12.",
      "Renda variável: use uma média conservadora.",
    ],
    transicao: "Agora o outro lado da balança: para onde vai esse dinheiro.",
  },
  despesas: {
    objetivo: "Revelar o custo de vida real e encontrar espaço para os sonhos.",
    abertura:
      "Não existe julgamento aqui. O objetivo é enxergar o padrão de gastos para encontrar espaço para os seus sonhos.",
    perguntas: [
      "Moradia: aluguel/condomínio, contas da casa, funcionários?",
      "Transporte, alimentação, saúde, educação, lazer e assinaturas?",
      "Quais gastos anuais costumam ser esquecidos? (IPVA, IPTU, seguros, material escolar)",
      "Qual gasto você cortaria primeiro? E qual nunca cortaria?",
    ],
    atencao: [
      "Parcelas de empréstimos e financiamentos vão na etapa Dívidas, para não contar duas vezes.",
      "Confira com as faturas do cartão: as pessoas costumam subestimar os gastos variáveis em 20–30%.",
      "Classifique o tipo (Fixa, Variável, Luxo...): é isso que mostra onde dá para ajustar.",
    ],
    transicao: "Visto o fluxo do mês, vamos olhar o que você já construiu até aqui.",
  },
  patrimonio: {
    objetivo: "Mapear os bens e investimentos, a liquidez e onde o dinheiro está aplicado.",
    abertura: "Vamos listar tudo o que você já construiu: investimentos, previdência, imóveis, veículos, empresa.",
    perguntas: [
      "Onde estão seus investimentos e em quanto tempo consegue resgatar?",
      "Tem previdência privada? PGBL ou VGBL? Quem são os beneficiários?",
      "Imóveis: são para morar ou geram renda?",
      "Existe uma reserva de emergência separada?",
    ],
    atencao: [
      "Liquidez importa tanto quanto valor: só conta como reserva o que tem liquidez diária ou até 30 dias.",
      "Renda fixa, renda variável e previdência formam o patrimônio para aposentadoria.",
    ],
    transicao: "Para fechar o raio-x, precisamos ver o que está comprometido: as dívidas.",
  },
  dividas: {
    objetivo: "Entender o custo das dívidas e quanto da renda está comprometida com parcelas.",
    abertura: "Dívida não é necessariamente ruim. O que importa é o custo e se ela cabe no seu mês.",
    perguntas: [
      "Quais dívidas existem hoje? Saldo devedor, taxa e prazo restante?",
      "Usa cheque especial ou o rotativo do cartão?",
      "Qual parcela mais pesa no mês?",
      "Alguma dívida foi feita para adquirir patrimônio (imóvel, empresa)?",
    ],
    atencao: [
      "Cartão rotativo e cheque especial são prioridade máxima no plano.",
      "A parcela é estimada pela Tabela Price a partir do saldo, taxa e prazo.",
      "Sem dívidas? Marque “Não se aplica”.",
    ],
    transicao:
      "Com o retrato do presente completo, vamos proteger o que foi construído e planejar o futuro, começando pela proteção da família.",
  },
  seguro: {
    objetivo: "Garantir que a família e os sonhos estejam protegidos se a renda do cliente faltar.",
    abertura:
      "Tudo o que planejamos depende da sua capacidade de gerar renda. A pergunta é: se você faltasse amanhã, o plano continuaria?",
    perguntas: [
      "Por quantos anos sua família precisaria manter o padrão de vida sem a sua renda?",
      "Você tem seguro de vida hoje? Qual o capital e quem são os beneficiários?",
      "Tem seguro pela empresa? (geralmente cobre 12–24 salários e acaba com o vínculo)",
      "Se ficasse impossibilitado de trabalhar, como pagaria as contas?",
      "Já pensou nos custos de inventário (ITCMD, advogados, custas)?",
    ],
    atencao: [
      "Seguro de empresa não é proteção definitiva: por padrão ele não entra na conta.",
      "Inventário pode travar o patrimônio por meses: o seguro dá liquidez imediata à família.",
      "O capital necessário já desconta o patrimônio financeiro existente.",
    ],
    transicao: "Protegida a família, vamos olhar para você no futuro: a sua independência financeira.",
  },
  aposentadoria: {
    objetivo: "Definir a meta de independência financeira e o esforço mensal necessário para chegar lá.",
    abertura:
      "Independência financeira é quando trabalhar passa a ser uma escolha. Vamos calcular quanto você precisa acumular e quanto falta.",
    perguntas: [
      "Com que idade você gostaria de ter a opção de parar de trabalhar?",
      "Quanto precisaria por mês, em valores de hoje, para viver bem?",
      "Conta com INSS, aluguéis ou outra renda passiva no futuro?",
      "Quanto consegue investir por mês hoje para esse objetivo?",
    ],
    atencao: [
      "Os valores são reais (já descontada a inflação): use retorno real conservador, 3–5% a.a.",
      "Patrimônio alvo = renda anual desejada ÷ taxa de retirada (4% = 25×).",
      "Mostre a diferença entre a trajetória atual e a necessária no gráfico.",
    ],
    transicao: "E se pudermos antecipar algum sonho sem comprometer o futuro? Vamos ver estratégias de alavancagem.",
  },
  alavancagem: {
    objetivo: "Comparar as formas de adquirir um bem (poupar, financiar, consórcio) e escolher a mais eficiente.",
    abertura:
      "Quando você compra um bem, existe o custo do bem e o custo do tempo. Vamos comparar as alternativas lado a lado.",
    perguntas: [
      "Qual bem você quer adquirir e quando precisa dele?",
      "Precisa usar imediatamente ou pode planejar?",
      "Qual parcela cabe confortavelmente no seu mês?",
    ],
    atencao: [
      "A parcela não deve ultrapassar o limite de comprometimento da renda (Parâmetros).",
      "Consórcio depende de contemplação (sorteio ou lance): alinhe a expectativa de prazo.",
      "Sem bem em vista? Marque “Não se aplica”.",
    ],
    transicao: "Temos todas as peças. Agora vou consolidar tudo em um diagnóstico e mostrar as prioridades.",
  },
  "visao-geral": {
    objetivo: "Mostrar o retrato completo de forma visual e conectar os números aos sonhos do cliente.",
    abertura: "Lembra o que você me disse no início? Vamos ver o que os números dizem sobre isso.",
    perguntas: [
      "O que mais te surpreendeu neste retrato?",
      "Isso faz sentido com o que você sente no dia a dia?",
      "Qual destes pontos você gostaria de resolver primeiro?",
    ],
    atencao: [
      "Comece pelos pontos fortes, depois os alertas.",
      "Use as palavras do cliente (motivação dos sonhos).",
      "Mostre no máximo 3 prioridades: foco gera ação.",
    ],
    transicao: "Agora vamos transformar o diagnóstico em ações concretas, com prazo e responsável.",
  },
  plano: {
    objetivo: "Fechar compromissos: ações claras, priorizadas, com prazo e responsável.",
    abertura: "Um plano só funciona se for executável. Vamos escolher juntos as primeiras ações.",
    perguntas: [
      "Qual destas ações você consegue começar ainda esta semana?",
      "O que pode te impedir de cumprir este plano?",
      "Quando fazemos a nossa próxima revisão?",
    ],
    atencao: [
      "Ordem recomendada: fluxo → dívidas caras → reserva → proteção → futuro → sonhos.",
      "Comece com 3 a 5 ações. Plano grande demais não sai do papel.",
      "Agende o acompanhamento antes de encerrar a reunião.",
    ],
    transicao: "Combinado! Vou registrar esta fotografia do seu diagnóstico para acompanharmos a evolução.",
  },
  historico: {
    objetivo: "Acompanhar a evolução, celebrar conquistas e ajustar a rota.",
    abertura: "Vamos comparar onde você estava e onde está agora.",
    perguntas: [
      "O que funcionou desde a nossa última conversa?",
      "O que mudou na sua vida (trabalho, família, objetivos)?",
      "Surgiu algum novo sonho?",
      "Quais ações do plano ficaram travadas? Por quê?",
    ],
    atencao: [
      "Registre uma fotografia do diagnóstico em cada reunião.",
      "Celebre as conquistas: isso reforça o comportamento.",
      "Atualize as etapas que mudaram e gere um novo PDF.",
    ],
  },
};
