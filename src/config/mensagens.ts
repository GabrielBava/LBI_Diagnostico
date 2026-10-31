// =====================================================================
//  MODELOS DE MENSAGEM — 5.2 · Recomendações
//  ---------------------------------------------------------------------
//  Textos prontos para copiar ou enviar pelo WhatsApp. Edite à vontade.
//  {cliente} vira o primeiro nome do cliente; {nome}, o nome da pessoa
//  indicada (sem nome escolhido, fica "[Nome]" para preencher na hora).
// =====================================================================

export const MENSAGEM_CLIENTE = {
  titulo: "Para o cliente",
  subtitulo: "Agradecimento pela reunião e pedido de indicação",
  texto: `{cliente}, obrigado pelo nosso bate-papo de hoje!

Como conversamos, nosso objetivo é ajudar mais pessoas a organizarem suas finanças e planejarem seus objetivos com estratégia.

Segue abaixo uma mensagem que você pode compartilhar com amigos e familiares que acredita que poderiam se beneficiar desse acompanhamento.`,
};

export const MENSAGEM_AMIGOS = {
  titulo: "Para amigos e familiares",
  subtitulo: "O cliente encaminha para quem indicou",
  texto: `Olá, {nome}! Tudo bem?

Estou buscando otimizar melhor minha vida financeira e planejar alguns objetivos pessoais e patrimoniais.

Recentemente, tive uma conversa com o time de especialistas em Planejamento Financeiro do Grupo Life Brasil, que me apresentou como funciona o processo de consultoria e de que forma podemos organizar melhor nossas finanças e tomar decisões mais estratégicas.

Lembrei de você e achei interessante compartilhar essa oportunidade!

Se fizer sentido para você, posso compartilhar seu contato com o time para que eles expliquem melhor como funciona o planejamento financeiro e quais benefícios ele pode trazer para sua rotina.

Para conhecer um pouco mais sobre a empresa:

🌐 Site: https://www.grupolifebrasil.com.br

💼 LinkedIn: https://www.linkedin.com/company/grupo-life-brasil`,
};

/** Troca {cliente} e {nome} no modelo. */
export const preencherMensagem = (texto: string, valores: { cliente?: string; nome?: string }) =>
  texto.replace(/\{cliente\}/g, valores.cliente || "Olá").replace(/\{nome\}/g, valores.nome || "[Nome]");
