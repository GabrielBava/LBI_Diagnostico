// =====================================================================
//  DIAGNÓSTICO COMPLETO — cartões dos planos, perfil e bússola
//  ---------------------------------------------------------------------
//  6.1 · Perfil financeiro (rótulo do momento do cliente)
//  6.2 · Plano atual ........ Diagnóstico · Motivo · Risco da inação
//  6.3 · Plano potencial .... Oportunidade identificada · Como podemos
//                             atuar juntos · Objetivo desejado
//  6.4 · Plano otimização ... Descrição · Motivo da escolha · Como melhorar
//  6.7 · Bússola financeira . Organização, Patrimonial, Liberdade
//                             financeira e Gestão de ativos
//  Os cartões automáticos saem das regras abaixo; o consultor pode
//  personalizar, ocultar ou acrescentar cartões em cada plano.
// =====================================================================

import type { Cliente, Item } from "@/types";
import { fmtBRL, fmtPct, juntar, plural } from "./format";
import {
  bemQuitado,
  cartoes,
  idadePorNascimento,
  nOpt,
  rotuloDependente,
  temConjuge,
  despesas,
  dividas,
  fluxo,
  futuro,
  lista,
  modelo503020,
  mudancasVida,
  n,
  objetivos,
  parametros,
  patrimonio,
  protecao,
  renda,
  reservaEmergencia,
  s,
  sim,
} from "./calculos";
import { dividaCara, statusPorNota, type Status } from "./diagnostico";
import { componentesProtecao, nomeBem, oportunidades } from "./oportunidades";

export type Gravidade = "Alta" | "Média" | "Baixa";

/** Cartão gerado pelos dados. As chaves de `textos` são as dos campos do plano (ex.: diagnostico, motivo, risco). */
export interface CardPlano {
  id: string;
  area: string;
  titulo: string;
  textos: Record<string, string>;
  /** Plano atual: gravidade. Plano potencial: prioridade. */
  selo?: Gravidade;
  /** Plano potencial: produto e potencial (vindos da matriz de oportunidades). */
  produto?: string;
  potencial?: number;
  /** Plano potencial: texto da ação ao levar ao plano de ação. */
  acao?: string;
}

const ORDEM: Record<Gravidade, number> = { Alta: 0, Média: 1, Baixa: 2 };
const porGravidade = (a: CardPlano, b: CardPlano) => ORDEM[a.selo ?? "Baixa"] - ORDEM[b.selo ?? "Baixa"];
const fmtMeses = (m: number) => m.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
/** Meses com uma casa, arredondando para baixo (5,96 de 6 meses não vira "6 de 6"). */
const fmtMesesPiso = (m: number) => (Math.floor(m * 10) / 10).toLocaleString("pt-BR");
/** Uma casa decimal, arredondando para baixo: 19,96% não aparece como "20%, abaixo dos 20%". */
const pctPiso = (v: number) => `${(Math.floor(v * 1000) / 10).toLocaleString("pt-BR")}%`;
/** Percentual acima de um limite: só usa casa decimal quando o arredondamento cairia no limite (50,2% e não "50%"). */
const pctAcima = (v: number, limite: number) =>
  Math.round(v * 100) <= Math.round(limite * 100) ? `${(Math.ceil(v * 1000) / 10).toLocaleString("pt-BR")}%` : fmtPct(v);

/** Maiores categorias de despesa (opcionalmente só Essencial ou Estilo e Desejos), já com valores. */
function maioresGastos(c: Cliente, modelo?: "Necessidades" | "Desejos", quantos = 3) {
  const itens = despesas(c)
    .porCategoria.filter((x) => x.valor > 0 && (!modelo || x.modelo === modelo))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, quantos)
    // "Parcelas (Financiamento e Crédito)" vira "Parcelas de financiamento e crédito" (sem parênteses duplos).
    .map((x) => `${x.label.replace(/ \((.+)\)$/, (_, r: string) => ` de ${r.toLowerCase()}`)} (${fmtBRL(x.valor)})`);
  return juntar(itens);
}

// ---------------------------------------------------------------------
//  6.1 · Perfil financeiro
// ---------------------------------------------------------------------
export function perfilFinanceiro(c: Cliente): { nome: string; descricao: string } {
  const f = fluxo(c);
  const p = patrimonio(c);
  const { limite } = parametros(c.parametros);
  // Dívida cara pesa no perfil quando as parcelas passam de 5% da renda (ou não têm valor informado).
  const caras = c.emprestimos.filter((e) => dividaCara(s(e.categoria)));
  const parcelasCaras = caras.reduce((t, e) => t + n(e.parcela), 0);
  const carasRelevantes = caras.length > 0 && (parcelasCaras <= 0 || parcelasCaras / Math.max(1, f.renda) >= 0.05);
  if (f.renda <= 0) return { nome: "A definir", descricao: "Informe a renda e as despesas para traçar o perfil financeiro." };
  if (f.sobra < 0) return { nome: "Em déficit", descricao: "Gasta mais do que ganha: o primeiro passo é reorganizar o orçamento." };
  if (f.comprometimento > limite || carasRelevantes)
    return { nome: "Endividado", descricao: "Parcelas e dívidas tomam parte relevante da renda e limitam as escolhas." };
  // A reserva de emergência não conta como investimento.
  if (f.taxaPoupanca >= 0.2 && (sim(c.investimentos.temInvestimento) || p.investimentos + p.previdencia > 0))
    return { nome: "Construtor de patrimônio", descricao: "Poupa com consistência e já faz o dinheiro trabalhar." };
  if (f.taxaPoupanca >= 0.2) return { nome: "Poupador", descricao: "Gasta menos do que ganha; falta direcionar a sobra para investimentos." };
  if (f.taxaPoupanca >= 0.1) return { nome: "Equilibrado", descricao: "Vive bem e poupa um pouco todo mês; dá para acelerar os objetivos." };
  return { nome: "Consumidor", descricao: "Quase toda a renda vai para o dia a dia; sobra pouco para o futuro." };
}

// ---------------------------------------------------------------------
//  6.2 · Plano atual — o que precisa mudar
// ---------------------------------------------------------------------
export function planoAtual(c: Cliente): CardPlano[] {
  const f = fluxo(c);
  const r = reservaEmergencia(c);
  const pr = protecao(c);
  const fu = futuro(c);
  const dv = dividas(c);
  const ob = objetivos(c);
  const ct = cartoes(c);
  const orc = modelo503020(c);
  const { limite } = parametros(c.parametros);
  const out: CardPlano[] = [];
  const add = (id: string, area: string, titulo: string, selo: Gravidade, diagnostico: string, motivo: string, risco: string) =>
    out.push({ id: `pa-${id}`, area, titulo, selo, textos: { diagnostico, motivo, risco } });

  // Fluxo de caixa
  if (f.renda > 0 && f.sobra < 0)
    add(
      "deficit",
      "Fluxo de caixa",
      "Déficit no mês",
      "Alta",
      `Gasta mais do que ganha: déficit de ${fmtBRL(-f.sobra)}/mês.`,
      `As despesas somam ${fmtBRL(f.despesas)} para uma renda de ${fmtBRL(f.renda)}. Maiores gastos: ${maioresGastos(c)}.`,
      "A diferença vira cheque especial ou rotativo do cartão, com juros altos, e consome a reserva e os investimentos.",
    );
  else if (f.renda > 0 && f.taxaPoupanca < 0.2)
    add(
      "poupanca",
      "Fluxo de caixa",
      "Poupança abaixo do ideal",
      f.taxaPoupanca < 0.1 ? "Alta" : "Média",
      `Poupa ${pctPiso(f.taxaPoupanca)} da renda (${fmtBRL(f.sobra)}/mês), abaixo dos 20% recomendados.`,
      `O modelo 50-30-20 pede ${fmtBRL(f.renda * 0.2)}/mês para o futuro. Maiores gastos: ${maioresGastos(c)}.`,
      "Objetivos adiados, aposentadoria dependente do INSS e pouca margem para imprevistos.",
    );
  if (f.renda > 0 && f.sobra >= 0 && f.sobraLivre < 0)
    add(
      "aportes-projetos",
      "Fluxo de caixa",
      "Aportes em projetos acima da sobra",
      "Média",
      `Os aportes declarados nos projetos (${fmtBRL(f.aportesProjetos)}/mês) passam a sobra de ${fmtBRL(f.sobra)}/mês em ${fmtBRL(-f.sobraLivre)}.`,
      "O que o cliente diz guardar para os projetos não cabe no orçamento informado: renda, despesas ou aportes precisam ser revistos.",
      "Para manter os aportes, o cliente usa a reserva ou crédito, ou os projetos atrasam.",
    );
  if (orc.renda > 0) {
    const nec = orc.partes.find((x) => x.id === "Necessidades")!;
    const des = orc.partes.find((x) => x.id === "Desejos")!;
    if (nec.foraDoModelo)
      add(
        "necessidades",
        "Fluxo de caixa",
        "Essencial acima de 50%",
        "Média",
        `O essencial consome ${pctAcima(nec.pct, 0.5)} da renda (${fmtBRL(nec.atual)}/mês); o modelo 50-30-20 indica até 50%.`,
        `Maiores gastos essenciais: ${maioresGastos(c, "Necessidades")}.`,
        "Orçamento engessado: uma queda de renda não tem onde ser absorvida e vira dívida.",
      );
    if (des.foraDoModelo)
      add(
        "desejos",
        "Fluxo de caixa",
        "Estilo e desejos acima de 30%",
        "Média",
        `Estilo e desejos consomem ${pctAcima(des.pct, 0.3)} da renda (${fmtBRL(des.atual)}/mês); o modelo 50-30-20 indica até 30%.`,
        `Maiores gastos de estilo e desejos: ${maioresGastos(c, "Desejos")}.`,
        "O padrão de vida cresce junto com a renda e o patrimônio não se forma.",
      );
  }
  if (ct.anuidadeAnual > 0)
    add(
      "anuidade",
      "Fluxo de caixa",
      "Anuidade de cartão",
      "Baixa",
      `Paga ${fmtBRL(ct.anuidadeAnual)}/ano de anuidade em ${plural(ct.comAnuidade.length, "cartão", "cartões")}.`,
      "A anuidade costuma ser negociável e há cartões sem tarifa com benefícios parecidos.",
      `${fmtBRL(ct.anuidadeAnual * 10)} em 10 anos sem retorno equivalente.`,
    );

  // Dívidas
  const caras = c.emprestimos.filter((e) => dividaCara(s(e.categoria)));
  if (caras.length) {
    const categorias = [...new Set(caras.map((e) => s(e.categoria) || "empréstimos"))];
    const parcelas = caras.reduce((t, e) => t + n(e.parcela), 0);
    add(
      "dividas-caras",
      "Dívidas",
      "Dívidas caras",
      "Alta",
      `${plural(caras.length, "dívida", "dívidas")} de crédito caro${categorias.length ? ` (${juntar(categorias).toLowerCase()})` : ""}.`,
      parcelas > 0 ? `As parcelas somam ${fmtBRL(parcelas)}/mês, com juros entre os mais altos do mercado.` : "Juros entre os mais altos do mercado.",
      "Com juros de 3% a 15% ao mês, a dívida pode dobrar em menos de um ano e travar os demais planos.",
    );
  }
  if (f.comprometimento > limite) {
    const partes = [
      dv.parcelasFin > 0 && `financiamentos ${fmtBRL(dv.parcelasFin)}`,
      dv.parcelasCons > 0 && `consórcios ${fmtBRL(dv.parcelasCons)}`,
      dv.parcelasEmp > 0 && `dívidas ${fmtBRL(dv.parcelasEmp)}`,
    ].filter(Boolean) as string[];
    add(
      "comprometimento",
      "Dívidas",
      "Renda comprometida com parcelas",
      "Alta",
      `${fmtPct(f.comprometimento)} da renda vai para parcelas (limite de ${fmtPct(limite)}).`,
      `As parcelas somam ${fmtBRL(f.parcelas)}/mês${partes.length ? `: ${juntar(partes)}` : ""}.`,
      "Pouco fôlego para investir e risco de atrasos se a renda cair.",
    );
  }

  // Proteção
  if (s(c.protecao.temSeguroVida) && pr.gap > 0)
    add(
      "seguro-vida",
      "Proteção",
      "Família descoberta",
      "Alta",
      `Faltam ${fmtBRL(pr.gap)} de capital segurado para proteger a família.`,
      `A família precisaria de ${fmtBRL(pr.necessario)} (${componentesProtecao(pr)}, já descontados os recursos financeiros) ${pr.atual > 0 ? `e o seguro atual é de ${fmtBRL(pr.atual)}` : "e hoje não há seguro de vida individual"}.`,
      `Na falta do cliente, a família perde o padrão de vida${pr.componentes.educacional > 0 ? ", os estudos dos filhos ficam em risco" : ""} e bens podem ser vendidos às pressas.`,
    );
  const regime = s(c.cadastro.regimeTrabalho);
  const semInss = ["Empresário", "Autônomo / Liberal"].includes(regime);
  if (s(c.protecao.temInvalidez) === "Não" && f.renda > 0 && regime !== "Aposentado")
    add(
      "invalidez",
      "Proteção",
      "Renda sem proteção",
      semInss ? "Alta" : "Média",
      "Não há seguro de invalidez, doenças graves ou afastamento (DIT).",
      semInss
        ? `Como ${regime.toLowerCase()}, a renda para se o cliente parar de trabalhar.`
        : "A previdência oficial (INSS ou regime próprio) cobre só parte da renda em caso de invalidez, com regras e carência.",
      "Um afastamento longo corta a renda justamente quando os gastos com saúde sobem.",
    );
  const moveisSemSeguro = c.moveis.filter((m) => m.temSeguro !== true);
  if (moveisSemSeguro.length)
    add(
      "seguro-auto",
      "Proteção",
      "Veículos sem seguro",
      "Média",
      `${plural(moveisSemSeguro.length, "bem", "bens")} sem seguro: ${juntar(moveisSemSeguro.map(nomeBem))}.`,
      `${fmtBRL(moveisSemSeguro.reduce((t, m) => t + n(m.valor), 0))} em bens expostos a roubo, colisão e danos a terceiros.`,
      "Um sinistro vira prejuízo direto no patrimônio, e um acidente com terceiros pode gerar dívida.",
    );
  const imoveisSemSeguro = c.imoveis.filter((m) => m.temSeguro !== true);
  if (imoveisSemSeguro.length)
    add(
      "seguro-imovel",
      "Proteção",
      "Imóveis sem seguro",
      "Baixa",
      `${plural(imoveisSemSeguro.length, "imóvel", "imóveis")} sem seguro (${fmtBRL(imoveisSemSeguro.reduce((t, m) => t + n(m.valor), 0))}).`,
      "Sem cobertura para incêndio, danos elétricos, vendaval e responsabilidade civil.",
      "O principal patrimônio da família fica exposto por falta de um seguro de custo baixo.",
    );

  // Investimentos
  if (r.meta > 0 && r.falta > 0)
    add(
      "reserva",
      "Investimentos",
      "Reserva de emergência incompleta",
      r.meses < 3 ? "Alta" : "Média",
      r.atual > 0
        ? `A reserva cobre ${fmtMesesPiso(r.meses)} de ${r.mesesMeta} meses de despesas; faltam ${fmtBRL(r.falta)}.`
        : `Não há reserva de emergência; faltam ${fmtBRL(r.falta)} para ${r.mesesMeta} meses de despesas.`,
      r.atual > 0
        ? `Reserva atual de ${fmtBRL(r.atual)} para despesas de ${fmtBRL(f.despesas)}/mês.`
        : `Não há reserva separada para despesas de ${fmtBRL(f.despesas)}/mês.`,
      "Um imprevisto (saúde, desemprego, conserto) vira dívida cara ou resgate de investimentos de longo prazo com perda.",
    );
  if (s(c.investimentos.temInvestimento) === "Não")
    add(
      "nao-investe",
      "Investimentos",
      "Sem investimentos",
      f.sobraLivre > 0 ? "Média" : "Baixa",
      "Ainda não tem investimentos.",
      f.sobraLivre > 0
        ? `Sobram ${fmtBRL(f.sobraLivre)}/mês livres${f.aportesProjetos > 0 ? ", depois dos aportes em projetos," : ""} que não estão sendo investidos.`
        : "Hoje não sobra dinheiro livre no mês para investir.",
      "O dinheiro parado perde para a inflação e os objetivos ficam sem fonte de recursos.",
    );

  // Fiscal / tributário
  const ir = s(c.renda.declaracaoIR);
  const tipoPrev = s(c.protecao.tipoPrevidencia);
  if (sim(c.protecao.temPrevidencia) && ir === "Simplificada" && tipoPrev.includes("PGBL"))
    add(
      "pgbl-simplificada",
      "Fiscal/Tributário",
      "PGBL sem benefício fiscal",
      "Média",
      "Tem PGBL, mas declara o IR no modelo simplificado.",
      "A dedução de até 12% da renda bruta só vale na declaração completa.",
      "No resgate, o IR incide sobre todo o valor acumulado sem ter havido economia na entrada.",
    );

  // Futuro
  if (fu.rendaDesejada > 0 && s(c.cadastro.nascimento)) {
    if (fu.idadeAtingida && fu.faltaHoje > 0)
      add(
        "futuro",
        "Futuro",
        "Independência financeira",
        "Alta",
        `A idade de aposentadoria (${fu.idadeAposentadoria} anos) já chegou e faltam ${fmtBRL(fu.faltaHoje)} para a meta.`,
        `O patrimônio de ${fmtBRL(fu.atual)} não sustenta a renda de ${fmtBRL(fu.rendaDesejada)}/mês pela regra dos 4%.`,
        fu.esgotaAos !== undefined
          ? `Retirando a renda desejada, o patrimônio acabaria aos ${fu.esgotaAos} anos.`
          : "Consumir o patrimônio antes do previsto ou reduzir o padrão de vida.",
      );
    else if (!fu.idadeAtingida && fu.independencia < 1)
      add(
        "futuro",
        "Futuro",
        "Independência financeira",
        fu.independencia < 0.5 ? "Alta" : "Média",
        `No ritmo atual, a projeção cobre ${fmtPct(fu.independencia)} da meta de independência aos ${fu.idadeAposentadoria} anos.`,
        `${fu.aporteAtual > 0 ? `Investindo ${fmtBRL(fu.aporteAtual)}/mês` : "Sem aportes mensais"}, o patrimônio chega a ${fmtBRL(fu.projetado)} para uma meta de ${fmtBRL(fu.alvo)}. Seriam necessários ${fmtBRL(fu.aporte)}/mês.`,
        `Aposentadoria com renda de cerca de ${fmtBRL(fu.rendaProjetada)}/mês em vez de ${fmtBRL(fu.rendaDesejada)}` +
          (fu.esgotaAos !== undefined ? `, ou o patrimônio acabando aos ${fu.esgotaAos} anos.` : "."),
      );
  }

  // Objetivos
  const comPrazo = c.objetivos.filter((o) => n(o.prazoMeses) > 0 && n(o.valorFuturo) > 0);
  if (c.objetivos.length && ob.aporteTotal > Math.max(0, f.sobraLivre))
    add(
      "objetivos-sobra",
      "Objetivos",
      "Objetivos maiores que a sobra",
      "Média",
      `Os objetivos pedem ${fmtBRL(ob.aporteTotal)}/mês${f.sobraLivre > 0 ? ` e sobram ${fmtBRL(f.sobraLivre)}/mês livres` : " e hoje não sobra dinheiro livre no mês"}${f.aportesProjetos > 0 ? ` (já descontados ${fmtBRL(f.aportesProjetos)} em aportes nos projetos)` : ""}.`,
      `${plural(comPrazo.length, "objetivo", "objetivos")} com prazo, somando ${fmtBRL(comPrazo.reduce((t, o) => t + n(o.valorFuturo), 0))}.`,
      "Sem priorizar, os objetivos competem entre si e nenhum é cumprido no prazo.",
    );
  const baixas = c.objetivos.filter((o) => s(o.probAtual) !== "" && n(o.probAtual) < 50);
  if (baixas.length)
    add(
      "objetivos-chance",
      "Objetivos",
      "Objetivos em risco",
      "Média",
      `${plural(baixas.length, "objetivo", "objetivos")} com menos de 50% de chance no cenário atual: ${juntar(baixas.map((o) => s(o.titulo) || s(o.categoria) || "objetivo"))}.`,
      "Chance avaliada com o cliente na seção Objetivos.",
      "Frustração e decisões por impulso (crédito, resgates) para tentar cumprir os prazos.",
    );
  mudancasVida(c).forEach((m) => {
    const quando = m.temData ? `em ${m.quando}` : "sem data definida";
    if (m.impacto === "Gasto único" && m.valor > 0)
      add(
        `mudanca-${m.item.id}`,
        "Objetivos",
        m.descricao,
        "Média",
        `${m.descricao} ${quando}: gasto único de ${fmtBRL(m.valor)}.`,
        m.temData && m.meses > 0 ? `Seria preciso guardar cerca de ${fmtBRL(m.valor / m.meses)}/mês até lá.` : "Ainda não há reserva para esse gasto.",
        "Sem planejar, a mudança é paga com crédito ou com a reserva de emergência.",
      );
    else if (m.efeitoMensal < 0)
      add(
        `mudanca-${m.item.id}`,
        "Fluxo de caixa",
        m.descricao,
        "Média",
        `${m.descricao} ${quando}: ${m.impacto.toLowerCase()} em ${fmtBRL(m.valor)}/mês.`,
        `A sobra passaria de ${fmtBRL(f.sobra)} para ${fmtBRL(f.sobra + m.efeitoMensal)}/mês.`,
        "Sem ajustar o orçamento antes, a mudança aperta o mês e adia os objetivos.",
      );
  });

  // Sucessão
  // Coberto quando o seguro de vida atual já cobre toda a necessidade (que inclui o inventário).
  const inventario = pr.itcmd + pr.honorarios;
  const inventarioCoberto = sim(c.protecao.temSeguroVida) && pr.gap <= 0;
  if (pr.quitados >= 300_000 && inventario > 0 && !inventarioCoberto)
    add(
      "inventario",
      "Sucessão",
      "Custo do inventário",
      inventario >= 100_000 ? "Média" : "Baixa",
      `O inventário custaria cerca de ${fmtBRL(inventario)} (ITCMD e honorários).`,
      `Calculado sobre ${fmtBRL(pr.quitados)} em bens quitados, investimentos e reserva.`,
      "Sem liquidez, os herdeiros podem precisar vender bens abaixo do valor ou esperar anos pela partilha.",
    );

  return out.sort(porGravidade);
}

// ---------------------------------------------------------------------
//  6.3 · Plano potencial — como podemos atuar juntos (vem da matriz)
// ---------------------------------------------------------------------
export function planoPotencial(c: Cliente): CardPlano[] {
  return oportunidades(c).map((o) => ({
    id: o.id,
    area: o.area,
    titulo: o.titulo,
    selo: o.prioridade,
    produto: o.produto,
    potencial: o.potencial,
    textos: { oportunidade: o.porque, comoAtuar: o.oferta, objetivo: o.objetivo },
    acao: o.detalhe,
  }));
}

// ---------------------------------------------------------------------
//  6.4 · Plano otimização — o que o cliente já faz bem
// ---------------------------------------------------------------------
export function planoOtimizacao(c: Cliente): CardPlano[] {
  const f = fluxo(c);
  const r = reservaEmergencia(c);
  const pr = protecao(c);
  const fu = futuro(c);
  const p = patrimonio(c);
  const dv = dividas(c);
  const ct = cartoes(c);
  const orc = modelo503020(c);
  const { limite } = parametros(c.parametros);
  const out: CardPlano[] = [];
  const add = (id: string, area: string, titulo: string, descricao: string, motivo: string, comoMelhorar: string) =>
    out.push({ id: `po-${id}`, area, titulo, textos: { descricao, motivo, comoMelhorar } });

  if (f.renda > 0 && f.taxaPoupanca >= 0.2)
    add(
      "poupanca",
      "Fluxo de caixa",
      "Boa taxa de poupança",
      `Poupa ${fmtPct(f.taxaPoupanca)} da renda (${fmtBRL(f.sobra)}/mês).`,
      "Gastar menos do que ganha é o que forma patrimônio e dá liberdade de escolha.",
      "Investir no dia do pagamento, e não o que sobrar no fim do mês, dividindo a sobra por objetivo: reserva, aposentadoria e projetos.",
    );
  if (orc.dentroDoModelo) {
    const pct = (id: string) => fmtPct(orc.partes.find((x) => x.id === id)!.pct);
    add(
      "503020",
      "Fluxo de caixa",
      "Orçamento equilibrado",
      `Essencial em ${pct("Necessidades")}, estilo e desejos em ${pct("Desejos")} e projeto e investimentos em ${pct("Poupança")} da renda: dentro do modelo 50-30-20.`,
      "Equilíbrio entre viver bem hoje e construir o futuro.",
      "Revisar o orçamento a cada 6 meses e levar parte de cada aumento de renda para os investimentos.",
    );
  }
  if (ct.comMilhas > 0)
    add(
      "milhas",
      "Fluxo de caixa",
      "Cartão com milhas",
      `Acumula milhas ou pontos em ${plural(ct.comMilhas, "cartão", "cartões")}.`,
      "Os gastos do dia a dia devolvem valor.",
      "Concentrar os gastos no cartão de melhor conversão e usar os pontos em passagens, não em produtos.",
    );

  const caras = c.emprestimos.some((e) => dividaCara(s(e.categoria)));
  if (f.renda > 0 && f.parcelas <= 0 && !c.emprestimos.length && dv.passivos <= 0)
    add(
      "sem-dividas",
      "Dívidas",
      "Sem dívidas",
      "Nenhuma parcela comprometendo a renda.",
      "Toda a renda fica livre para o padrão de vida e os investimentos.",
      "Nas compras grandes (imóvel, carro, reforma), usar consórcio planejado em vez de financiamento para continuar sem juros.",
    );
  else if (f.renda > 0 && f.parcelas > 0 && f.comprometimento <= limite && !caras)
    add(
      "parcelas",
      "Dívidas",
      "Parcelas sob controle",
      `${fmtPct(f.comprometimento)} da renda em parcelas, abaixo do limite de ${fmtPct(limite)}.`,
      "Crédito usado com moderação, sem dívidas caras.",
      dv.saldoFin > 0
        ? "Simular amortizações e a portabilidade do financiamento para pagar menos juros; nas próximas compras, preferir consórcio."
        : "Nas próximas compras grandes, preferir consórcio a financiamento.",
    );

  const imoveisQuitados = c.imoveis.filter(bemQuitado);
  const inventario = pr.itcmd + pr.honorarios;
  if (imoveisQuitados.length)
    add(
      "imoveis-quitados",
      "Patrimonial",
      "Imóveis quitados",
      `${plural(imoveisQuitados.length, "imóvel quitado", "imóveis quitados")}, somando ${fmtBRL(imoveisQuitados.reduce((t, i) => t + n(i.valor), 0))}.`,
      "Patrimônio sem juros e moradia garantida.",
      (imoveisQuitados.some((i) => i.temSeguro !== true) ? "Contratar seguro residencial e organizar " : "Organizar ") +
        `a sucessão${inventario > 0 ? ` (o inventário custaria cerca de ${fmtBRL(inventario)})` : ""}: seguro para o inventário, holding ou doação com usufruto.`,
    );
  if (p.ativos > 0 && p.liquido > 0 && p.passivos / p.ativos < 0.2 && !imoveisQuitados.length)
    add(
      "patrimonio",
      "Patrimonial",
      "Patrimônio sólido",
      `Patrimônio líquido de ${fmtBRL(p.liquido)}, com ${fmtPct(p.passivos / p.ativos)} de dívidas sobre os bens.`,
      "Bens construídos com pouco endividamento.",
      p.financeiro / p.ativos < 0.2
        ? `Aumentar a parte financeira do patrimônio (hoje ${fmtPct(p.financeiro / p.ativos)}), que gera renda e liquidez.`
        : "Proteger o que foi construído: seguros dos bens e planejamento sucessório.",
    );

  if (sim(c.protecao.temSeguroVida)) {
    if (pr.gap <= 0 && pr.atual > 0)
      add(
        "seguro-vida",
        "Proteção",
        "Família protegida",
        pr.necessario > 0
          ? `Seguro de vida de ${fmtBRL(pr.atual)} cobre a necessidade de ${fmtBRL(pr.necessario)}.`
          : `Seguro de vida de ${fmtBRL(pr.atual)}; reserva e investimentos já cobrem a necessidade da família.`,
        "A família mantém o padrão de vida e os planos mesmo sem a renda do cliente.",
        "Revisar capital e beneficiários a cada mudança de vida e comparar o custo do seguro atual com o mercado.",
      );
    else if (pr.atual > 0)
      add(
        "seguro-vida",
        "Proteção",
        "Já tem seguro de vida",
        `Capital segurado de ${fmtBRL(pr.atual)}.`,
        "Primeiro passo para proteger a família.",
        `Complementar com ${fmtBRL(pr.gap)} para cobrir toda a necessidade da família.`,
      );
  }
  if (sim(c.protecao.temInvalidez))
    add(
      "invalidez",
      "Proteção",
      "Renda protegida",
      "Tem cobertura de invalidez ou afastamento.",
      "A renda continua se o cliente precisar parar de trabalhar.",
      `Conferir se a diária ou o capital acompanham a renda atual de ${fmtBRL(renda(c).cliente.liquida || f.renda)}/mês.`,
    );
  if (c.moveis.length && c.moveis.every((m) => m.temSeguro === true))
    add(
      "seguro-auto",
      "Proteção",
      "Veículos segurados",
      `${c.moveis.length === 1 ? "O veículo tem" : `Os ${c.moveis.length} veículos têm`} seguro.`,
      "Roubo, colisão e danos a terceiros não viram prejuízo para o patrimônio.",
      "Cotar a renovação com antecedência e ajustar franquia e coberturas ao valor atual do bem.",
    );
  if (c.imoveis.length && c.imoveis.every((m) => m.temSeguro === true))
    add(
      "seguro-imovel",
      "Proteção",
      "Imóveis segurados",
      "Todos os imóveis têm seguro.",
      "O principal patrimônio está protegido contra incêndio e danos.",
      "Revisar o valor segurado quando o imóvel valorizar ou passar por reforma.",
    );

  if (r.meta > 0 && r.falta <= 0)
    add(
      "reserva",
      "Investimentos",
      "Reserva de emergência completa",
      `Reserva de ${fmtBRL(r.atual)}, que cobre ${fmtMeses(r.meses)} meses de despesas.`,
      "Segurança para imprevistos sem recorrer a crédito.",
      r.atual > r.meta * 1.5
        ? `O excedente de ${fmtBRL(r.atual - r.meta)} acima da meta pode ir para objetivos de longo prazo, com rentabilidade maior.`
        : "Manter em aplicação de liquidez diária que renda ao menos 100% do CDI, separada da conta do dia a dia.",
    );
  if (sim(c.investimentos.temInvestimento)) {
    const perfil = s(c.investimentos.perfil);
    const temas = lista(c.investimentos.temas).filter((t) => t !== "Nenhum").length;
    add(
      "investe",
      "Investimentos",
      "Já investe",
      `Tem ${fmtBRL(p.investimentos)} investidos${perfil && perfil !== "Não sabe" ? `, com perfil ${perfil.toLowerCase()}` : ""}${
        s(c.investimentos.temAssessor) === "Sim" ? " e acompanhamento de assessoria" : ""
      }.`,
      "O dinheiro trabalha para os objetivos.",
      s(c.investimentos.temAssessor) !== "Sim"
        ? "Ter acompanhamento profissional, separar a carteira por objetivo e revisar custos e impostos."
        : temas <= 3
          ? "Diversificar entre classes de ativos conforme o perfil e separar a carteira por objetivo."
          : "Separar a carteira por objetivo e revisar custos e impostos uma vez por ano.",
    );
  }
  if (sim(c.protecao.temPrevidencia)) {
    const ir = s(c.renda.declaracaoIR);
    const tipo = s(c.protecao.tipoPrevidencia);
    if (ir === "Completa" && tipo.includes("PGBL"))
      add(
        "previdencia",
        "Fiscal/Tributário",
        "PGBL com benefício fiscal",
        "Tem PGBL e declara o IR no modelo completo.",
        "Deduz até 12% da renda bruta tributável.",
        `Conferir se os aportes chegam a ${fmtBRL(renda(c).cliente.bruta * 12 * 0.12)}/ano (12% da renda bruta tributável do cliente) e se a tabela regressiva de IR foi escolhida.`,
      );
    else
      add(
        "previdencia",
        "Futuro",
        "Previdência privada",
        `Tem previdência${tipo && tipo !== "Não sabe" ? ` (${tipo})` : ""}${p.previdencia > 0 ? ` de ${fmtBRL(p.previdencia)}` : ""}.`,
        "Disciplina de longo prazo e recursos fora do inventário.",
        "Revisar taxa de administração, tabela de IR e beneficiários indicados.",
      );
  }

  if (fu.rendaDesejada > 0 && s(c.cadastro.nascimento) && !fu.idadeAtingida && fu.independencia >= 1)
    add(
      "futuro",
      "Futuro",
      "Independência no caminho",
      `No ritmo atual, atinge a independência aos ${fu.idadeAposentadoria} anos.`,
      fu.alvo <= 0
        ? `As outras rendas (${fmtBRL(fu.outras)}/mês) já cobrem a renda desejada de ${fmtBRL(fu.rendaDesejada)}/mês.`
        : `O patrimônio projetado de ${fmtBRL(fu.projetado)} cobre a meta de ${fmtBRL(fu.alvo)}.`,
      "Simular uma aposentadoria antecipada ou uma renda maior no simulador do Futuro.",
    );
  mudancasVida(c)
    .filter((m) => m.efeitoMensal > 0)
    .forEach((m) =>
      add(
        `mudanca-${m.item.id}`,
        "Fluxo de caixa",
        m.descricao,
        `${m.descricao} ${m.temData ? `em ${m.quando}` : "sem data definida"}: ${m.impacto.toLowerCase()} em ${fmtBRL(m.valor)}/mês.`,
        "Mais folga no orçamento.",
        `Direcionar os ${fmtBRL(m.valor)}/mês a mais para os objetivos assim que a mudança acontecer.`,
      ),
    );

  return out;
}

// ---------------------------------------------------------------------
//  6.7 · Bússola financeira — saúde da vida financeira em 4 direções
// ---------------------------------------------------------------------
export type IdDimensao = "organizacao" | "patrimonial" | "liberdade" | "ativos";

export interface AcaoBussola {
  id: string;
  texto: string;
  /** Área do plano de ação. */
  area: string;
  prioridade: Gravidade;
  prazo: "Curto" | "Médio" | "Longo";
}

export interface DimensaoBussola {
  id: IdDimensao;
  nome: string;
  pergunta: string;
  nota: number;
  status: Status;
  resumo: string;
  indicadores: { nome: string; valor: string; ok?: boolean }[];
  acoes: AcaoBussola[];
}

/** Componente da nota: valor de 0 a 1 e peso (componentes sem dados ficam de fora). */
type Componente = { valor: number; peso: number };
const notaDe = (comps: Componente[]) => {
  const peso = comps.reduce((t, x) => t + x.peso, 0);
  return peso > 0 ? Math.round((comps.reduce((t, x) => t + Math.max(0, Math.min(1, x.valor)) * x.peso, 0) / peso) * 100) : 0;
};

export function bussola(c: Cliente) {
  const f = fluxo(c);
  const r = reservaEmergencia(c);
  const pr = protecao(c);
  const fu = futuro(c);
  const p = patrimonio(c);
  const ob = objetivos(c);
  const ct = cartoes(c);
  const orc = modelo503020(c);
  const { limite } = parametros(c.parametros);

  // ------------------------------------------------------------ Organização
  const organizacao = (): DimensaoBussola => {
    const comps: Componente[] = [];
    const ind: DimensaoBussola["indicadores"] = [];
    const acoes: AcaoBussola[] = [];
    const caras = c.emprestimos.filter((e) => dividaCara(s(e.categoria)));
    if (f.renda > 0) {
      comps.push({ valor: f.sobra < 0 ? 0 : f.taxaPoupanca / 0.2, peso: 35 });
      ind.push({ nome: "Taxa de poupança", valor: f.sobra < 0 ? `Déficit de ${fmtBRL(-f.sobra)}` : pctPiso(f.taxaPoupanca), ok: f.taxaPoupanca >= 0.2 });
      const nec = orc.partes.find((x) => x.id === "Necessidades")!;
      const des = orc.partes.find((x) => x.id === "Desejos")!;
      const excesso = Math.max(0, nec.pct - 0.5) + Math.max(0, des.pct - 0.3);
      comps.push({ valor: 1 - excesso / 0.3, peso: 20 });
      ind.push({ nome: "Essencial · estilo e desejos", valor: `${fmtPct(nec.pct)} · ${fmtPct(des.pct)}`, ok: !nec.foraDoModelo && !des.foraDoModelo });
      comps.push({ valor: f.parcelas <= 0 ? 1 : 1 - (f.comprometimento / limite) * 0.6, peso: 25 });
      ind.push({ nome: "Parcelas sobre a renda", valor: fmtPct(f.comprometimento), ok: f.comprometimento <= limite });
      comps.push({ valor: caras.length ? 0 : 1, peso: 20 });
      ind.push({ nome: "Dívidas caras", valor: caras.length ? String(caras.length) : "Nenhuma", ok: !caras.length });

      if (f.sobra < 0)
        acoes.push({ id: "sg-deficit", texto: `Eliminar o déficit de ${fmtBRL(-f.sobra)}/mês, começando pelos maiores gastos`, area: "Fluxo de caixa", prioridade: "Alta", prazo: "Curto" });
      else if (f.taxaPoupanca < 0.2)
        acoes.push({ id: "sg-poupanca", texto: `Chegar a 20% de poupança: ${fmtBRL(f.renda * 0.2)}/mês`, area: "Fluxo de caixa", prioridade: f.taxaPoupanca < 0.1 ? "Alta" : "Média", prazo: "Médio" });
      if (caras.length)
        acoes.push({ id: "sg-emprestimos", texto: "Quitar ou renegociar as dívidas caras", area: "Dívidas", prioridade: "Alta", prazo: "Curto" });
      if (f.comprometimento > limite)
        acoes.push({ id: "sg-comprometimento", texto: `Reduzir as parcelas para menos de ${fmtPct(limite)} da renda`, area: "Dívidas", prioridade: "Alta", prazo: "Médio" });
      if (nec.foraDoModelo)
        acoes.push({ id: "bu-necessidades", texto: `Trazer o essencial para até 50% da renda (hoje ${pctAcima(nec.pct, 0.5)})`, area: "Fluxo de caixa", prioridade: "Média", prazo: "Médio" });
      if (des.foraDoModelo)
        acoes.push({ id: "bu-desejos", texto: `Limitar estilo e desejos a 30% da renda: ${fmtBRL(des.atual - des.ideal)}/mês a menos`, area: "Fluxo de caixa", prioridade: "Média", prazo: "Curto" });
      if (ct.anuidadeAnual > 0)
        acoes.push({ id: "bu-anuidade", texto: `Negociar a isenção da anuidade (${fmtBRL(ct.anuidadeAnual)}/ano)`, area: "Fluxo de caixa", prioridade: "Baixa", prazo: "Curto" });
      if (!acoes.length)
        acoes.push({ id: "bu-org-manter", texto: "Manter o orçamento e revisá-lo a cada 6 meses", area: "Fluxo de caixa", prioridade: "Baixa", prazo: "Médio" });
    }
    const nota = notaDe(comps);
    return {
      id: "organizacao",
      nome: "Organização",
      pergunta: "O dinheiro do mês está sob controle?",
      nota,
      status: f.renda <= 0 ? "sem-dados" : f.sobra < 0 ? "critico" : statusPorNota(nota),
      resumo:
        f.renda <= 0
          ? "Informe a renda e as despesas."
          : f.sobra < 0
            ? `Déficit de ${fmtBRL(-f.sobra)}/mês.`
            : `Sobra de ${fmtBRL(f.sobra)}/mês (${pctPiso(f.taxaPoupanca)} da renda).`,
      indicadores: ind,
      acoes,
    };
  };

  // ------------------------------------------------------------ Patrimonial
  const patrimonial = (): DimensaoBussola => {
    const comps: Componente[] = [];
    const ind: DimensaoBussola["indicadores"] = [];
    const acoes: AcaoBussola[] = [];
    if (s(c.protecao.temSeguroVida) && pr.necessidade > 0) {
      comps.push({ valor: pr.cobertura, peso: 35 });
      ind.push({ nome: "Cobertura do seguro de vida", valor: fmtPct(pr.cobertura), ok: pr.gap <= 0 });
      if (pr.gap > 0)
        acoes.push({ id: "op-vida", texto: `Contratar ${fmtBRL(pr.gap)} de seguro de vida`, area: "Proteção", prioridade: "Alta", prazo: "Curto" });
    }
    const bens = [...c.imoveis, ...c.moveis];
    if (bens.length) {
      const segurados = bens.filter((b) => b.temSeguro === true).length;
      comps.push({ valor: segurados / bens.length, peso: 20 });
      ind.push({ nome: "Bens com seguro", valor: `${segurados} de ${bens.length}`, ok: segurados === bens.length });
      if (segurados < bens.length)
        acoes.push({ id: "bu-bens", texto: `Segurar ${bens.length - segurados === 1 ? "o bem" : `os ${bens.length - segurados} bens`} sem seguro`, area: "Proteção", prioridade: "Média", prazo: "Curto" });
    }
    if (s(c.protecao.temInvalidez) === "Não" && f.renda > 0 && s(c.cadastro.regimeTrabalho) !== "Aposentado")
      acoes.push({ id: "op-dit", texto: "Proteger a renda com seguro de invalidez e DIT", area: "Proteção", prioridade: "Média", prazo: "Curto" });
    if (p.ativos > 0) {
      const alavancagem = p.passivos / p.ativos;
      comps.push({ valor: 1 - alavancagem / 0.5, peso: 15 });
      ind.push({ nome: "Dívidas sobre os bens", valor: fmtPct(alavancagem), ok: alavancagem < 0.2 });
    }
    const inventario = pr.itcmd + pr.honorarios;
    if (pr.quitados >= 300_000 && inventario > 0) {
      const coberto = sim(c.protecao.temSeguroVida) && pr.gap <= 0;
      comps.push({ valor: coberto ? 1 : 0.3, peso: 15 });
      ind.push({ nome: "Custo do inventário", valor: fmtBRL(inventario), ok: coberto });
      if (!coberto)
        acoes.push({ id: "bu-sucessao", texto: "Planejar a sucessão: seguro para o inventário, holding ou doação com usufruto", area: "Sucessão", prioridade: "Média", prazo: "Longo" });
    }
    const financiar = sim(c.patrimonioGeral.pretendeAdquirir) && c.aquisicoes.some((a) => s(a.estrategia) === "Financiamento");
    if (financiar)
      acoes.push({ id: "bu-consorcio", texto: "Trocar o financiamento planejado por consórcio", area: "Patrimonial", prioridade: "Média", prazo: "Médio" });
    if (!acoes.length && comps.length)
      acoes.push({ id: "bu-pat-manter", texto: "Revisar seguros e beneficiários uma vez por ano", area: "Proteção", prioridade: "Baixa", prazo: "Longo" });
    const nota = notaDe(comps);
    return {
      id: "patrimonial",
      nome: "Patrimonial",
      pergunta: "O patrimônio e a família estão protegidos?",
      nota,
      status: comps.length ? statusPorNota(nota) : "sem-dados",
      resumo: !comps.length
        ? "Complete Patrimônio e Proteção."
        : pr.gap > 0 && s(c.protecao.temSeguroVida)
          ? `Patrimônio líquido de ${fmtBRL(p.liquido)}; faltam ${fmtBRL(pr.gap)} de seguro de vida.`
          : `Patrimônio líquido de ${fmtBRL(p.liquido)}.`,
      indicadores: ind,
      acoes,
    };
  };

  // ---------------------------------------------------- Liberdade financeira
  const liberdade = (): DimensaoBussola => {
    const comps: Componente[] = [];
    const ind: DimensaoBussola["indicadores"] = [];
    const acoes: AcaoBussola[] = [];
    const temFuturo = fu.rendaDesejada > 0 && !!s(c.cadastro.nascimento);
    if (temFuturo) {
      comps.push({ valor: fu.independencia, peso: 55 });
      ind.push({ nome: `Meta aos ${fu.idadeAposentadoria} anos`, valor: fmtPct(Math.min(fu.independencia, 9.99)), ok: fu.independencia >= 1 });
      if (!fu.idadeAtingida) {
        comps.push({ valor: fu.aporte > 0 ? fu.aporteAtual / fu.aporte : 1, peso: 25 });
        ind.push({ nome: "Aporte atual · necessário", valor: `${fmtBRL(fu.aporteAtual)} · ${fmtBRL(fu.aporte)}`, ok: fu.aporteAtual >= fu.aporte });
        if (fu.aporte > fu.aporteAtual)
          acoes.push({
            id: "op-independencia",
            texto: `Investir ${fmtBRL(fu.aporte)}/mês para a independência aos ${fu.idadeAposentadoria} anos`,
            area: "Futuro",
            prioridade: fu.independencia < 0.5 ? "Alta" : "Média",
            prazo: "Longo",
          });
      } else if (fu.faltaHoje > 0)
        acoes.push({ id: "bu-idade", texto: "Rever a idade de aposentadoria ou a renda desejada", area: "Futuro", prioridade: "Alta", prazo: "Curto" });
    }
    if (c.objetivos.length && ob.aporteTotal > 0) {
      comps.push({ valor: Math.max(0, f.sobraLivre) / ob.aporteTotal, peso: 20 });
      ind.push({ nome: "Objetivos cabem na sobra", valor: ob.cabeNaSobra ? "Sim" : "Não", ok: ob.cabeNaSobra });
      if (!ob.cabeNaSobra)
        acoes.push({ id: "sg-objetivos", texto: `Priorizar os objetivos: pedem ${fmtBRL(ob.aporteTotal)}/mês`, area: "Objetivos", prioridade: "Média", prazo: "Curto" });
    }
    if (s(c.protecao.temPrevidencia) === "Não")
      acoes.push({ id: "op-previdencia", texto: "Abrir uma previdência privada para a aposentadoria", area: "Futuro", prioridade: "Média", prazo: "Médio" });
    if (!acoes.length && comps.length)
      acoes.push({ id: "bu-lib-manter", texto: "Simular uma aposentadoria antecipada no simulador do Futuro", area: "Futuro", prioridade: "Baixa", prazo: "Longo" });
    const nota = notaDe(comps);
    return {
      id: "liberdade",
      nome: "Liberdade financeira",
      pergunta: "O futuro está garantido?",
      nota,
      status: comps.length ? statusPorNota(nota) : "sem-dados",
      resumo: !temFuturo
        ? comps.length
          ? "Informe nascimento e renda desejada para projetar a aposentadoria."
          : "Informe nascimento, renda desejada e objetivos."
        : fu.idadeAtingida
          ? `A idade de aposentadoria (${fu.idadeAposentadoria} anos) já chegou; o patrimônio cobre ${fmtPct(Math.min(fu.independencia, 9.99))} da meta.`
          : `Projeção cobre ${fmtPct(Math.min(fu.independencia, 9.99))} da meta aos ${fu.idadeAposentadoria} anos.`,
      indicadores: ind,
      acoes,
    };
  };

  // -------------------------------------------------------- Gestão de ativos
  const ativos = (): DimensaoBussola => {
    const comps: Componente[] = [];
    const ind: DimensaoBussola["indicadores"] = [];
    const acoes: AcaoBussola[] = [];
    if (r.meta > 0) {
      comps.push({ valor: r.meses / r.mesesMeta, peso: 35 });
      ind.push({ nome: "Reserva de emergência", valor: `${r.falta > 0 ? fmtMesesPiso(r.meses) : fmtMeses(r.meses)} de ${r.mesesMeta} meses`, ok: r.falta <= 0 });
      if (r.falta > 0)
        acoes.push({ id: "sg-reserva", texto: `Completar a reserva de emergência: faltam ${fmtBRL(r.falta)}`, area: "Investimentos", prioridade: r.meses < 3 ? "Alta" : "Média", prazo: "Curto" });
    }
    const investe = s(c.investimentos.temInvestimento);
    if (investe) {
      comps.push({ valor: sim(investe) ? 1 : 0, peso: 20 });
      ind.push({ nome: "Investimentos", valor: sim(investe) ? fmtBRL(p.investimentos) : "Não investe", ok: sim(investe) });
      if (!sim(investe))
        acoes.push({ id: "op-comecar", texto: "Começar a investir, com uma carteira por objetivo", area: "Investimentos", prioridade: "Média", prazo: "Curto" });
    }
    if (sim(investe)) {
      const assessor = s(c.investimentos.temAssessor) === "Sim";
      const perfil = s(c.investimentos.perfil);
      const perfilDefinido = !!perfil && perfil !== "Não sabe";
      comps.push({ valor: (assessor ? 0.6 : 0.2) + (perfilDefinido ? 0.4 : 0), peso: 15 });
      ind.push({ nome: "Assessoria · perfil", valor: `${assessor ? "Sim" : "Não"} · ${perfilDefinido ? perfil : "não definido"}`, ok: assessor && perfilDefinido });
      if (!assessor)
        acoes.push({ id: "op-assessoria", texto: "Ter acompanhamento profissional da carteira", area: "Investimentos", prioridade: "Média", prazo: "Curto" });
      if (!perfilDefinido)
        acoes.push({ id: "op-suitability", texto: "Definir o perfil de investidor (suitability)", area: "Investimentos", prioridade: "Baixa", prazo: "Curto" });
      const temas = lista(c.investimentos.temas).filter((t) => t !== "Nenhum").length;
      if (p.investimentos >= 50_000) {
        comps.push({ valor: temas / 4, peso: 15 });
        ind.push({ nome: "Temas que conhece", valor: String(temas), ok: temas >= 4 });
        if (temas < 4)
          acoes.push({ id: "op-diversificacao", texto: "Diversificar a carteira entre classes de ativos", area: "Investimentos", prioridade: "Baixa", prazo: "Médio" });
      }
    }
    const ir = s(c.renda.declaracaoIR);
    const tipo = s(c.protecao.tipoPrevidencia);
    const temPgbl = sim(c.protecao.temPrevidencia) && tipo.includes("PGBL");
    if (ir) {
      const eficiencia = ir === "Completa" ? (temPgbl ? 1 : 0.4) : temPgbl ? 0.3 : 0.8;
      comps.push({ valor: eficiencia, peso: 15 });
      ind.push({ nome: "Previdência × IR", valor: `${ir}${sim(c.protecao.temPrevidencia) && tipo ? ` · ${tipo}` : ""}`, ok: eficiencia >= 0.8 });
      // Sem previdência, a ação de abrir uma previdência (Liberdade financeira) já sugere o PGBL.
      if (ir === "Completa" && !temPgbl && s(c.protecao.temPrevidencia) !== "Não")
        acoes.push({ id: "op-pgbl", texto: "Usar o PGBL para deduzir até 12% da renda no IR", area: "Fiscal/Tributário", prioridade: "Média", prazo: "Curto" });
      if (ir === "Simplificada" && temPgbl)
        acoes.push({ id: "op-pgbl-vgbl", texto: "Rever o PGBL: declara no modelo simplificado", area: "Fiscal/Tributário", prioridade: "Média", prazo: "Curto" });
    }
    if (!acoes.length && comps.length)
      acoes.push({ id: "bu-ativos-manter", texto: "Revisar a carteira, os custos e os impostos uma vez por ano", area: "Investimentos", prioridade: "Baixa", prazo: "Longo" });
    const nota = notaDe(comps);
    return {
      id: "ativos",
      nome: "Gestão de ativos",
      pergunta: "Os investimentos estão bem cuidados?",
      nota,
      status: comps.length ? statusPorNota(nota) : "sem-dados",
      resumo: !comps.length
        ? "Complete Proteção e Investimentos."
        : `${fmtBRL(p.financeiro)} em reserva, investimentos e previdência.`,
      indicadores: ind,
      acoes,
    };
  };

  const dimensoes = [organizacao(), patrimonial(), liberdade(), ativos()];
  const comDados = dimensoes.filter((d) => d.status !== "sem-dados");
  // Norte = a direção que mais precisa de atenção agora (empate: a ordem acima).
  // Primeiro a gravidade do status (crítico antes de atenção), depois a nota.
  const grav: Record<Status, number> = { critico: 0, atencao: 1, ok: 2, "sem-dados": 3 };
  const norte = comDados.reduce<DimensaoBussola | undefined>(
    (m, d) => (!m || grav[d.status] < grav[m.status] || (grav[d.status] === grav[m.status] && d.nota < m.nota) ? d : m),
    undefined,
  );
  return {
    dimensoes,
    norte,
    nota: comDados.length ? Math.round(comDados.reduce((t, d) => t + d.nota, 0) / comDados.length) : 0,
    temDados: comDados.length > 0,
  };
}

// ---------------------------------------------------------------------
//  Cartões na tela: automáticos (ou a versão personalizada pelo consultor)
//  seguidos dos acrescentados. Usado nas seções 6.2–6.4 e no relatório.
// ---------------------------------------------------------------------
export type ListaCards = "planoAtual" | "planoPotencial" | "planoOtimizacao";

export interface CardMesclado extends CardPlano {
  /** Item salvo (cartão personalizado ou acrescentado). */
  item?: Item;
  /** Cartão automático que deu origem ao personalizado. */
  automatico?: CardPlano;
  oculto: boolean;
}

/** Item salvo → cartão (as chaves das colunas vêm da configuração). */
const doItem = (item: Item, chaves: string[], temSelo: boolean): CardPlano => ({
  id: item.id,
  area: s(item.area),
  titulo: s(item.titulo),
  selo: temSelo ? ((s(item.selo) || undefined) as Gravidade | undefined) : undefined,
  textos: Object.fromEntries(chaves.map((k) => [k, s(item[k])])),
});

export function mesclarCards(c: Cliente, lista: ListaCards, automaticos: CardPlano[], chaves: string[], temSelo: boolean): CardMesclado[] {
  const itens = c[lista];
  const idsAuto = new Set(automaticos.map((a) => a.id));
  return [
    ...automaticos.map((a) => {
      const item = itens.find((i) => s(i.origem) === a.id);
      // A versão personalizada mantém o id do automático (ocultar vale para as duas).
      return item
        ? { ...doItem(item, chaves, temSelo), id: a.id, produto: a.produto, potencial: a.potencial, item, automatico: a, oculto: !!c.cardsOcultos[a.id] }
        : { ...a, oculto: !!c.cardsOcultos[a.id] };
    }),
    // Personalizado cujo automático deixou de existir mantém a chave da origem (e o "oculto").
    ...itens
      .filter((i) => !idsAuto.has(s(i.origem)))
      .map((i) => {
        const chave = s(i.origem) || i.id;
        return { ...doItem(i, chaves, temSelo), id: chave, item: i, oculto: !!c.cardsOcultos[chave] };
      }),
  ];
}

/** Chaves das colunas de cada plano (as mesmas de CAMPOS_CARD_*). */
export const COLUNAS_PLANO: Record<ListaCards, { chaves: string[]; rotulos: string[]; selo: boolean }> = {
  planoAtual: { chaves: ["diagnostico", "motivo", "risco"], rotulos: ["Diagnóstico", "Motivo", "Risco da inação"], selo: true },
  planoPotencial: {
    chaves: ["oportunidade", "comoAtuar", "objetivo"],
    rotulos: ["Oportunidade identificada", "Como podemos atuar juntos", "Objetivo desejado"],
    selo: true,
  },
  planoOtimizacao: { chaves: ["descricao", "motivo", "comoMelhorar"], rotulos: ["Descrição", "Motivo da escolha", "Como melhorar"], selo: false },
};

// ---------------------------------------------------------------------
//  6.1 · Perfil do cliente (tela e relatório)
// ---------------------------------------------------------------------
const PLURAL_TIPO: Record<string, string> = { Essencial: "essenciais", Desejo: "desejos", Sonho: "sonhos" };

export function dadosPerfil(c: Cliente) {
  const idade = idadePorNascimento(s(c.cadastro.nascimento));
  const estado = s(c.cadastro.estadoCivil);
  const conjuge = temConjuge(c) && s(c.cadastro.conjuge) ? ` com ${s(c.cadastro.conjuge)}` : "";
  const ocupacao = [s(c.cadastro.ocupacao), s(c.cadastro.regimeTrabalho)].filter(Boolean).join(" · ");
  const fu = futuro(c);
  const dependentes = c.dependentes.map((d) => {
    const i = nOpt(d.idade);
    return `${s(d.nome) || rotuloDependente(c.dependentes, d)}${i !== undefined ? ` (${i} ${i === 1 ? "ano" : "anos"})` : ""}`;
  });
  const tipos = ["Essencial", "Desejo", "Sonho"]
    .map((t) => [t, c.objetivos.filter((o) => s(o.tipo) === t).length] as const)
    .filter(([, q]) => q > 0)
    .map(([t, q]) => `${q} ${q > 1 ? PLURAL_TIPO[t] : t.toLowerCase()}`);
  return {
    nome: s(c.cadastro.nome) || "Cliente",
    rotulo: s(c.cadastro.perfil),
    /** "34 anos · Casado(a) com Ana · Engenheiro · CLT" */
    linha: [idade !== undefined ? `${idade} anos` : "", s(c.cadastro.sexo), estado ? `${estado}${conjuge}` : "", ocupacao].filter(Boolean),
    dados: [
      { rotulo: "Filhos e dependentes", valor: dependentes.length ? dependentes.join(", ") : "Sem dependentes" },
      {
        rotulo: "Objetivos",
        valor: c.objetivos.length ? `${plural(c.objetivos.length, "objetivo", "objetivos")}${tipos.length ? ` (${tipos.join(", ")})` : ""}` : "Não registrados",
      },
      { rotulo: "Declaração do IR", valor: s(c.renda.declaracaoIR) || "Não informada" },
      { rotulo: "Perfil de investidor", valor: s(c.investimentos.perfil) || "Não definido" },
      { rotulo: "Aposentadoria desejada", valor: `aos ${fu.idadeAposentadoria} anos${fu.estilo ? ` · estilo ${fu.estilo.toLowerCase()}` : ""}` },
      { rotulo: "Empresa", valor: s(c.corporativo.possuiEmpresa) === "Sim" ? s(c.corporativo.ramo) || "Possui empresa" : "Não possui" },
      { rotulo: "Fumante", valor: s(c.protecao.fumante) || "Não informado" },
    ],
  };
}
