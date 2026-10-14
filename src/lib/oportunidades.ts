// =====================================================================
//  6.6 · MATRIZ DE OPORTUNIDADES (ecossistema / cross-sell)
//  ---------------------------------------------------------------------
//  Seis áreas (as pontas do radar): Proteção, Futuro, Patrimonial,
//  Investimentos, Sucessão e Fiscal/Tributário.
//  Cada oportunidade diz o que oferecer, por quê e o objetivo para o
//  cliente, com um "potencial" de 0 a 100 que ordena a lista. Seguros e
//  consórcios têm peso maior (maior geração de receita) — ajuste em
//  PESO_PRODUTO.
// =====================================================================

import type { Cliente, Item } from "@/types";
import { fmtBRL, fmtPct, juntar, plural } from "./format";
import { bemFinanciado } from "@/config/campos";
import {
  cartoes,
  despesas,
  dividas,
  fluxo,
  futuro,
  lista,
  mudancasVida,
  n,
  patrimonio,
  protecao,
  renda,
  reservaEmergencia,
  s,
  sim,
  sucessao,
  temConjuge,
} from "./calculos";

export type AreaOportunidade = "Proteção" | "Futuro" | "Patrimonial" | "Investimentos" | "Sucessão" | "Fiscal/Tributário";
/** Ordem das pontas do radar (sentido horário a partir do topo). */
export const AREAS_RADAR: AreaOportunidade[] = ["Proteção", "Futuro", "Patrimonial", "Investimentos", "Sucessão", "Fiscal/Tributário"];

export type Produto = "Seguro" | "Consórcio" | "Previdência" | "Investimento" | "Planejamento" | "Crédito";

/** Peso de cada produto no potencial (seguros e consórcios geram mais receita para o ecossistema). */
export const PESO_PRODUTO: Record<Produto, number> = {
  Seguro: 82,
  Consórcio: 78,
  Previdência: 66,
  Investimento: 56,
  Planejamento: 50,
  Crédito: 46,
};

export interface Oportunidade {
  id: string;
  area: AreaOportunidade;
  produto: Produto;
  titulo: string;
  /** O que oferecer (como podemos atuar juntos). */
  oferta: string;
  /** Por quê: o que os dados mostram (oportunidade identificada). */
  porque: string;
  /** Objetivo desejado para o cliente. */
  objetivo: string;
  /** 0 a 100: ordena a lista e forma o radar. */
  potencial: number;
  prioridade: "Alta" | "Média" | "Baixa";
  prazo: "Curto" | "Médio" | "Longo";
  /** Resumo de uma linha (usado no plano de ação). */
  detalhe: string;
  /** Volume da oportunidade, quando há um valor claro (capital segurado ou carta de consórcio). */
  valor?: number;
}

const limitar = (v: number) => Math.max(0, Math.min(100, Math.round(v)));
/** Potencial = peso do produto + bônus (relevância para o cliente), até 100. */
const potencial = (produto: Produto, bonus = 0) => limitar(PESO_PRODUTO[produto] + bonus);

/** Nome de um veículo ou embarcação para os textos ("Moto 2019", "carro"...). */
export const nomeBem = (m: Item) => s(m.nome) || s(m.tipo).toLowerCase() || "veículo";

/** O que o capital do seguro de vida cobre (só os componentes com valor). */
export function componentesProtecao(pr: ReturnType<typeof protecao>) {
  return juntar(
    [
      pr.componentes.educacional > 0 && "educação dos filhos",
      `${pr.horizonte === 1 ? "1 ano" : `${pr.horizonte} anos`} de padrão de vida`,
      pr.componentes.sucessao > 0 && "custos do inventário",
      pr.componentes.quitacao > 0 && "quitação de dívidas",
    ].filter(Boolean) as string[],
  );
}

export function oportunidades(c: Cliente): Oportunidade[] {
  const pr = protecao(c);
  const p = patrimonio(c);
  const r = reservaEmergencia(c);
  const f = fluxo(c);
  const fu = futuro(c);
  const dv = dividas(c);
  const su = sucessao(c);
  const rd = renda(c);
  const ct = cartoes(c);
  const d = despesas(c);
  const out: Oportunidade[] = [];
  const add = (o: Omit<Oportunidade, "detalhe"> & { detalhe?: string }) => out.push({ ...o, detalhe: o.detalhe ?? o.oferta });
  const rendaAnual = Math.max(1, f.renda * 12);
  const regime = s(c.cadastro.regimeTrabalho);
  const semInss = ["Empresário", "Autônomo / Liberal"].includes(regime);
  // Fumante: muda a cotação dos seguros de vida e de invalidez (prêmio maior).
  const fumante = sim(c.protecao.fumante);

  // ------------------------------------------------------------- Proteção
  if (pr.gap > 0)
    add({
      id: "op-vida",
      area: "Proteção",
      produto: "Seguro",
      titulo: "Seguro de vida",
      oferta: `Seguro de vida com capital de ${fmtBRL(pr.gap)}: ${componentesProtecao(pr)}.${fumante ? " Cotação para fumante." : ""}`,
      porque: `A família precisa de ${fmtBRL(pr.necessario)} ${pr.atual > 0 ? `e hoje tem ${fmtBRL(pr.atual)} em seguro individual` : "e hoje não tem seguro de vida individual"}.`,
      objetivo: "A família mantém o padrão de vida e os planos mesmo sem a renda do cliente.",
      // Quanto maior o gap em anos de renda, maior o potencial.
      potencial: potencial("Seguro", Math.min(15, (pr.gap / rendaAnual) * 2)),
      prioridade: "Alta",
      prazo: "Curto",
      valor: pr.gap,
    });
  if (s(c.protecao.temInvalidez) !== "Sim" && f.renda > 0 && regime !== "Aposentado")
    add({
      id: "op-dit",
      area: "Proteção",
      produto: "Seguro",
      titulo: "Invalidez, doenças graves e DIT",
      oferta: `Cobertura de invalidez, doenças graves e diária por incapacidade temporária para repor a renda de ${fmtBRL(rd.cliente.liquida || f.renda)}/mês.${fumante ? " Cotação para fumante." : ""}`,
      porque: semInss
        ? `Como ${regime.toLowerCase()}, o cliente não tem salário garantido se ficar afastado.`
        : s(c.protecao.temInvalidez) === "Não"
          ? "A renda depende do trabalho do cliente e não há cobertura para afastamento."
          : "Não há cobertura de invalidez ou afastamento informada; a renda depende do trabalho do cliente.",
      objetivo: "Contas em dia e tratamento garantido durante um afastamento.",
      potencial: potencial("Seguro", semInss ? 10 : 4),
      prioridade: semInss ? "Alta" : "Média",
      prazo: "Curto",
    });
  if (temConjuge(c) && rd.conjuge > 0)
    add({
      id: "op-vida-conjuge",
      area: "Proteção",
      produto: "Seguro",
      titulo: "Seguro de vida do cônjuge",
      oferta: `Seguro de vida para o cônjuge, cobrindo a renda de ${fmtBRL(rd.conjuge)}/mês.`,
      porque: `A renda do cônjuge é ${fmtPct(rd.conjuge / Math.max(1, f.renda))} da renda familiar.`,
      objetivo: "O orçamento da família não depende de uma pessoa só.",
      potencial: potencial("Seguro", -2),
      prioridade: "Média",
      prazo: "Curto",
    });
  const semSeguroMovel = c.moveis.filter((m) => m.temSeguro !== true);
  if (semSeguroMovel.length)
    add({
      id: "op-auto",
      area: "Proteção",
      produto: "Seguro",
      titulo: "Seguro auto / náutico",
      oferta: `Seguro para ${juntar(semSeguroMovel.map(nomeBem))} (${fmtBRL(semSeguroMovel.reduce((t, m) => t + n(m.valor), 0))} em bens).`,
      porque: `${plural(semSeguroMovel.length, "veículo ou embarcação", "veículos ou embarcações")} sem seguro.`,
      objetivo: "Um roubo ou acidente não vira prejuízo para o patrimônio.",
      potencial: potencial("Seguro", -10),
      prioridade: "Média",
      prazo: "Curto",
    });
  const semSeguroImovel = c.imoveis.filter((m) => m.temSeguro !== true);
  if (semSeguroImovel.length)
    add({
      id: "op-residencial",
      area: "Proteção",
      produto: "Seguro",
      titulo: "Seguro residencial / patrimonial",
      oferta: `Seguro para ${plural(semSeguroImovel.length, "imóvel", "imóveis")}, somando ${fmtBRL(semSeguroImovel.reduce((t, m) => t + n(m.valor), 0))}.`,
      porque: "Imóveis sem seguro contra incêndio, danos elétricos e responsabilidade civil.",
      objetivo: "O principal patrimônio protegido por um custo baixo.",
      potencial: potencial("Seguro", -14),
      prioridade: "Média",
      prazo: "Curto",
    });
  if (sim(c.corporativo.possuiEmpresa) && c.corporativo.seguroEmpresarial !== true)
    add({
      id: "op-empresarial",
      area: "Proteção",
      produto: "Seguro",
      titulo: "Seguro empresarial",
      oferta: "Seguro do patrimônio e da operação da empresa (incêndio, roubo, responsabilidade civil, lucros cessantes).",
      porque: "A empresa não tem seguro empresarial.",
      objetivo: "A empresa continua de pé depois de um sinistro.",
      potencial: potencial("Seguro", -6),
      prioridade: "Média",
      prazo: "Médio",
    });
  if (sim(c.corporativo.possuiEmpresa) && n(c.corporativo.socios) > 1 && c.corporativo.acordoSocios !== true)
    add({
      id: "op-socio",
      area: "Proteção",
      produto: "Seguro",
      titulo: "Seguro de sócio (key person)",
      oferta: "Seguro de vida entre os sócios, atrelado a um acordo de sócios.",
      porque: `A empresa tem ${n(c.corporativo.socios)} sócios e não tem acordo nem seguro de sócio.`,
      objetivo: "Se um sócio faltar, a família recebe e a empresa segue com os demais.",
      potencial: potencial("Seguro", -2),
      prioridade: "Média",
      prazo: "Médio",
    });
  const funcionarios = n(c.corporativo.funcionarios);
  if (sim(c.corporativo.possuiEmpresa) && funcionarios > 0)
    add({
      id: "op-vida-grupo",
      area: "Proteção",
      produto: "Seguro",
      titulo: "Seguro de vida em grupo",
      oferta: `Seguro de vida em grupo para ${funcionarios === 1 ? "o funcionário" : `os ${funcionarios} funcionários`} da empresa.`,
      porque: "Benefício valorizado pela equipe, com custo dedutível para a empresa e exigido em muitas convenções coletivas.",
      objetivo: "Equipe protegida e empresa em dia com a convenção coletiva.",
      potencial: potencial("Seguro", -8),
      prioridade: "Média",
      prazo: "Médio",
    });
  if (sim(c.corporativo.possuiEmpresa) && c.corporativo.saudeEmpresarial !== true)
    add({
      id: "op-saude-pme",
      area: "Proteção",
      produto: "Seguro",
      titulo: "Plano de saúde empresarial (PME)",
      oferta: `Plano de saúde pelo CNPJ para ${funcionarios > 0 ? "os sócios, os funcionários e as famílias" : "o cliente e a família"}.`,
      porque: "A empresa não tem plano empresarial: o plano PME costuma custar menos que o individual e pode incluir a família.",
      objetivo: "Saúde garantida pagando menos.",
      potencial: potencial("Seguro", -6),
      prioridade: "Média",
      prazo: "Curto",
    });
  if (regime === "Autônomo / Liberal")
    add({
      id: "op-rc-profissional",
      area: "Proteção",
      produto: "Seguro",
      titulo: "Seguro de responsabilidade civil profissional",
      oferta: `Seguro de RC profissional${s(c.cadastro.ocupacao) ? ` para a atuação como ${s(c.cadastro.ocupacao).toLowerCase()}` : ""}.`,
      porque: "Como profissional liberal, um erro ou processo de cliente é pago com o patrimônio pessoal.",
      objetivo: "Trabalhar sem colocar o patrimônio da família em risco.",
      potencial: potencial("Seguro", -18),
      prioridade: "Baixa",
      prazo: "Médio",
    });
  const viagensInternacionais = n(c.despesas["viagens.internacionais"]);
  if (viagensInternacionais > 0 || c.objetivos.some((o) => s(o.categoria) === "Viagem"))
    add({
      id: "op-viagem",
      area: "Proteção",
      produto: "Seguro",
      titulo: "Seguro viagem anual",
      oferta: "Seguro viagem anual (multiviagem) para a família.",
      porque: viagensInternacionais > 0 ? `Gasta ${fmtBRL(viagensInternacionais)}/mês com viagens internacionais.` : "Há objetivos de viagem no plano.",
      objetivo: "Viajar sem o risco de despesas médicas no exterior.",
      potencial: potencial("Seguro", -28),
      prioridade: "Baixa",
      prazo: "Médio",
    });

  // ------------------------------------------------------------ Patrimonial
  // Futuras aquisições (7 · Patrimônio): consórcio no lugar do financiamento.
  const aquisicoes = sim(c.patrimonioGeral.pretendeAdquirir) ? c.aquisicoes.filter((a) => n(a.valorDesejado) > 0) : [];
  const nomeAquisicao = (a: Item) => {
    const partes = s(a.segmento) === "Veículo" ? [s(a.categoria), s(a.tipo)] : [s(a.tipo), s(a.categoria)];
    return partes.filter(Boolean).join(" · ") || s(a.segmento) || "aquisição";
  };
  aquisicoes.forEach((a) => {
    const valor = fmtBRL(n(a.valorDesejado));
    const estrategia = s(a.estrategia);
    if (estrategia === "Financiamento" || estrategia === "Consórcio")
      add({
        id: `op-aq-${a.id}`,
        area: "Patrimonial",
        produto: "Consórcio",
        titulo: `Consórcio para ${nomeAquisicao(a)}`,
        oferta: `Carta de consórcio de ${valor}${estrategia === "Financiamento" ? " no lugar do financiamento" : ""}, com lance planejado.`,
        porque:
          estrategia === "Financiamento"
            ? `O cliente pretende financiar ${valor}: no financiamento, os juros podem dobrar o custo do bem.`
            : `O cliente já pensa em consórcio para ${valor}.`,
        objetivo: "Comprar o bem pagando taxa de administração em vez de juros.",
        potencial: potencial("Consórcio", estrategia === "Financiamento" ? 12 : 8),
        prioridade: estrategia === "Financiamento" ? "Alta" : "Média",
        prazo: "Médio",
        valor: n(a.valorDesejado),
        detalhe: `Consórcio de ${valor} para ${nomeAquisicao(a).toLowerCase()}${estrategia === "Financiamento" ? " no lugar do financiamento" : ""}`,
      });
  });
  const segmentoComConsorcio = (segmento: string) =>
    aquisicoes.some((a) => s(a.segmento) === segmento && ["Financiamento", "Consórcio"].includes(s(a.estrategia)));
  c.objetivos
    .filter((o) => ["Casa", "Veículo"].includes(s(o.categoria)) && n(o.valorFuturo) > 0)
    .filter((o) => !segmentoComConsorcio(s(o.categoria) === "Casa" ? "Imóvel" : "Veículo"))
    .forEach((o) =>
      add({
        id: `op-cons-${o.id}`,
        area: "Patrimonial",
        produto: "Consórcio",
        titulo: `Consórcio para “${s(o.titulo) || s(o.categoria)}”`,
        oferta: `Carta de ${fmtBRL(n(o.valorFuturo))}${n(o.prazoMeses) > 0 ? ` com prazo compatível com os ${n(o.prazoMeses)} meses do objetivo` : ""}.`,
        porque: `Objetivo de ${s(o.categoria).toLowerCase()} de ${fmtBRL(n(o.valorFuturo))} sem estratégia de compra definida.`,
        objetivo: "Conquistar o objetivo sem juros de financiamento.",
        potencial: potencial("Consórcio", 6),
        prioridade: "Média",
        prazo: "Médio",
        valor: n(o.valorFuturo),
        detalhe: `Consórcio de ${fmtBRL(n(o.valorFuturo))} para “${s(o.titulo) || s(o.categoria)}”`,
      }),
    );
  const troca = c.moveis.filter((m) => m.pensaAmpliacao === true);
  if (troca.length)
    add({
      id: "op-troca",
      area: "Patrimonial",
      produto: "Consórcio",
      titulo: "Consórcio para a troca de bens",
      oferta: `Carta de consórcio para trocar ${juntar(troca.map((m) => `${nomeBem(m)}${s(m.modeloDesejado) ? ` pelo ${s(m.modeloDesejado)}` : ""}`))}, usando o bem atual como lance.`,
      porque: "O cliente pensa em trocar ou ampliar bens.",
      objetivo: "Trocar de bem sem descapitalizar nem pagar juros.",
      potencial: potencial("Consórcio", 2),
      prioridade: "Média",
      prazo: "Médio",
    });
  // Veículos financiados (sem troca planejada): a próxima troca pode ser por consórcio.
  const veiculosFinanciados = c.moveis.filter((m) => bemFinanciado(m) && m.pensaAmpliacao !== true);
  if (veiculosFinanciados.length && !segmentoComConsorcio("Veículo"))
    add({
      id: "op-cons-proxima-troca",
      area: "Patrimonial",
      produto: "Consórcio",
      titulo: "Consórcio para a próxima troca de veículo",
      oferta: `Carta de consórcio para a próxima troca de ${juntar(veiculosFinanciados.map(nomeBem))}, começando antes de o financiamento acabar.`,
      porque: `${veiculosFinanciados.length === 1 ? "O veículo atual foi financiado" : "Os veículos atuais foram financiados"}: sem planejamento, a próxima troca volta a pagar juros.`,
      objetivo: "Trocar de veículo sem juros e com a parcela já prevista no orçamento.",
      potencial: potencial("Consórcio", -6),
      prioridade: "Baixa",
      prazo: "Médio",
    });
  if (sim(c.corporativo.possuiEmpresa))
    add({
      id: "op-cons-empresa",
      area: "Patrimonial",
      produto: "Consórcio",
      titulo: "Consórcio para bens da empresa",
      oferta: "Cartas de consórcio para veículos, máquinas ou imóvel comercial da empresa.",
      porque: "Empresário: o consórcio renova os bens da empresa sem juros e sem usar o capital de giro.",
      objetivo: "Empresa crescendo sem endividamento caro.",
      potencial: potencial("Consórcio", -12),
      prioridade: "Baixa",
      prazo: "Médio",
    });
  // Reformas e grandes gastos programados: consórcio de serviços.
  const reformas = [
    ...c.projetos.filter((x) => s(x.tipo) === "Reforma" && n(x.valor) >= 15000).map((x) => ({ id: x.id, nome: s(x.titulo) || "Reforma", valor: n(x.valor) })),
    ...mudancasVida(c)
      .filter((m) => m.impacto === "Gasto único" && m.valor >= 15000)
      .map((m) => ({ id: m.item.id, nome: m.descricao, valor: m.valor })),
  ];
  reformas.forEach((x) =>
    add({
      id: `op-servicos-${x.id}`,
      area: "Patrimonial",
      produto: "Consórcio",
      titulo: `Consórcio de serviços: ${x.nome}`,
      oferta: `Carta de consórcio de serviços de ${fmtBRL(x.valor)} para ${x.nome.toLowerCase()}.`,
      porque: `Gasto planejado de ${fmtBRL(x.valor)}.`,
      objetivo: "Fazer o projeto sem tirar dos investimentos nem usar crédito caro.",
      potencial: potencial("Consórcio", -4),
      prioridade: "Média",
      prazo: "Médio",
      valor: x.valor,
    }),
  );
  // Sobra folgada e sem consórcio: carta para construir patrimônio (imóvel para renda).
  // Carta estimada: parcela × 200 meses ÷ 1,2 (taxa de administração de cerca de 20%).
  const parcelaPatrimonio = Math.round(f.sobra * 0.3);
  const cartaPatrimonio = Math.round((parcelaPatrimonio * 200) / 1.2 / 10_000) * 10_000;
  if (f.sobra >= 3000 && c.consorcios.length === 0 && f.comprometimento < 0.2)
    add({
      id: "op-cons-patrimonio",
      area: "Patrimonial",
      produto: "Consórcio",
      titulo: "Consórcio imobiliário para construir patrimônio",
      oferta: `Carta de imóvel de cerca de ${fmtBRL(cartaPatrimonio)}, com parcela de até ${fmtBRL(parcelaPatrimonio)}/mês (30% da sobra), para um imóvel de renda.`,
      porque: `Sobram ${fmtBRL(f.sobra)}/mês ${f.parcelas > 0 ? `e as parcelas comprometem só ${fmtPct(f.comprometimento)} da renda` : "e não há parcelas comprometendo a renda"}.`,
      objetivo: "Aumentar o patrimônio e criar renda de aluguel no longo prazo.",
      potencial: potencial("Consórcio", -8),
      prioridade: "Baixa",
      prazo: "Longo",
      valor: cartaPatrimonio,
      detalhe: `Consórcio imobiliário de cerca de ${fmtBRL(cartaPatrimonio)} (parcela de até ${fmtBRL(parcelaPatrimonio)}/mês) para um imóvel de renda`,
    });
  if (dv.saldoFin > 0)
    add({
      id: "op-portabilidade",
      area: "Patrimonial",
      produto: "Crédito",
      titulo: "Portabilidade / amortização de financiamento",
      oferta: `Revisar taxa e portabilidade do saldo de ${fmtBRL(dv.saldoFin)} e simular amortizações.`,
      porque: `Saldo devedor de ${fmtBRL(dv.saldoFin)} em financiamentos.`,
      objetivo: "Pagar menos juros e quitar antes.",
      potencial: potencial("Crédito"),
      prioridade: "Média",
      prazo: "Curto",
    });

  // --------------------------------------------------------------- Sucessão
  // Com gap > 0, o capital do seguro de vida (op-vida) já inclui o inventário. Este cartão
  // fica para quem tem a necessidade coberta por recursos que ficariam presos no inventário.
  const custoInventario = pr.itcmd + pr.honorarios;
  if (custoInventario > 0 && pr.quitados >= 300_000 && pr.gap <= 0 && !sim(c.protecao.temSeguroVida))
    add({
      id: "op-vida-sucessao",
      area: "Sucessão",
      produto: "Seguro",
      titulo: "Seguro de vida para o inventário",
      oferta: `Seguro de vida de ${fmtBRL(custoInventario)} para pagar ITCMD e honorários, com liquidez imediata para os herdeiros.`,
      porque: `O inventário de ${fmtBRL(pr.quitados)} em bens quitados, investimentos e reserva custaria cerca de ${fmtBRL(custoInventario)}, e esses recursos ficam bloqueados até a partilha.`,
      objetivo: "Os herdeiros não precisam vender bens para pagar o inventário.",
      potencial: potencial("Seguro", -4),
      prioridade: "Média",
      prazo: "Médio",
      valor: custoInventario,
    });
  if (c.imoveis.length >= 2 || p.ativos >= 2_000_000)
    add({
      id: "op-holding",
      area: "Sucessão",
      produto: "Planejamento",
      titulo: "Planejamento sucessório / holding",
      oferta: "Estudo de holding patrimonial, doação com usufruto e testamento.",
      porque: `Patrimônio de ${fmtBRL(p.ativos)}${c.imoveis.length >= 2 ? ` com ${c.imoveis.length} imóveis` : ""}.`,
      objetivo: "Sucessão mais rápida e barata, sem conflito entre herdeiros.",
      potencial: potencial("Planejamento", 8),
      prioridade: "Média",
      prazo: "Longo",
    });
  // Previdência já fica fora do inventário: contam só reserva e investimentos.
  const noInventario = p.reserva + p.investimentos;
  const tipoPrev = sim(c.protecao.temPrevidencia) ? s(c.protecao.tipoPrevidencia) : "";
  if (noInventario >= 200_000 && !tipoPrev.includes("VGBL"))
    add({
      id: "op-vgbl-sucessao",
      area: "Sucessão",
      produto: "Previdência",
      titulo: "VGBL como instrumento sucessório",
      oferta: "Parte dos investimentos em VGBL, com beneficiários indicados.",
      porque: `${fmtBRL(noInventario)} em reserva e investimentos entrariam no inventário.`,
      objetivo: "Recursos chegam aos beneficiários em dias, fora do inventário.",
      potencial: potencial("Previdência", -4),
      prioridade: "Baixa",
      prazo: "Médio",
    });

  // ------------------------------------------------------- Fiscal/Tributário
  const ir = s(c.renda.declaracaoIR);
  // A dedução de 12% vale sobre a renda bruta tributável de quem declara (o cônjuge tem limite próprio).
  const brutaAnual = rd.cliente.bruta * 12;
  // Sem previdência, op-previdencia (Futuro) já oferece o PGBL.
  if (ir === "Completa" && s(c.protecao.temPrevidencia) !== "Não" && !tipoPrev.includes("PGBL"))
    add({
      id: "op-pgbl",
      area: "Fiscal/Tributário",
      produto: "Previdência",
      titulo: "PGBL para deduzir no IR",
      oferta: `Aportes em PGBL de até ${fmtBRL(brutaAnual * 0.12)}/ano (12% da renda bruta tributável do cliente; o cônjuge tem limite próprio se também declarar no modelo completo).`,
      porque: "Declara no modelo completo e não aproveita a dedução de previdência.",
      objetivo: "Pagar menos IR e investir a diferença na aposentadoria.",
      potencial: potencial("Previdência", 6),
      prioridade: "Média",
      prazo: "Curto",
    });
  if (ir === "Simplificada" && tipoPrev.includes("PGBL"))
    add({
      id: "op-pgbl-vgbl",
      area: "Fiscal/Tributário",
      produto: "Previdência",
      titulo: "Rever o PGBL (declaração simplificada)",
      oferta: "Direcionar novos aportes para VGBL ou mudar para a declaração completa.",
      porque: "Tem PGBL, mas declara no simplificado: o benefício fiscal não é usado e o resgate é tributado sobre o total.",
      objetivo: "Previdência com a tributação certa para o perfil.",
      potencial: potencial("Previdência", -6),
      prioridade: "Média",
      prazo: "Curto",
    });
  if (ir === "Simplificada" && su.dependentes >= 2 && (su.mensalidades > 0 || d.porCategoria.find((x) => x.id === "saude")!.valor > 0))
    add({
      id: "op-ir-modelo",
      area: "Fiscal/Tributário",
      produto: "Planejamento",
      titulo: "Comparar declaração simplificada × completa",
      oferta: "Simular a declaração completa com dependentes, educação e saúde.",
      porque: `${su.dependentes} dependentes e despesas dedutíveis podem render mais restituição no modelo completo.`,
      objetivo: "Pagar só o imposto necessário.",
      potencial: potencial("Planejamento", -6),
      prioridade: "Baixa",
      prazo: "Curto",
    });
  if (sim(c.corporativo.possuiEmpresa))
    add({
      id: "op-regime",
      area: "Fiscal/Tributário",
      produto: "Planejamento",
      titulo: "Revisão tributária da empresa",
      oferta: `Revisar o regime${s(c.corporativo.regime) ? ` (${s(c.corporativo.regime)})` : ""} e o equilíbrio entre pró-labore e dividendos.`,
      porque: "Empresário: o desenho tributário muda a renda líquida da família.",
      objetivo: "Mais renda líquida com segurança fiscal.",
      potencial: potencial("Planejamento", 2),
      prioridade: "Média",
      prazo: "Médio",
    });
  if (p.investimentos >= 50_000 && ["Conservador", "Moderado"].includes(s(c.investimentos.perfil)))
    add({
      id: "op-isentos",
      area: "Fiscal/Tributário",
      produto: "Investimento",
      titulo: "Investimentos isentos de IR",
      oferta: "Parte da renda fixa em LCI e LCA (com garantia do FGC) e, conforme o perfil, CRI e CRA (sem FGC), todos isentos de IR para pessoa física.",
      porque: `${fmtBRL(p.investimentos)} investidos com perfil ${s(c.investimentos.perfil).toLowerCase()}.`,
      objetivo: "Mais rentabilidade líquida, respeitando prazo, liquidez e garantia de cada título.",
      potencial: potencial("Investimento", -8),
      prioridade: "Baixa",
      prazo: "Curto",
    });

  // ----------------------------------------------------------- Investimentos
  if (s(c.investimentos.temInvestimento) === "Não")
    add({
      id: "op-comecar",
      area: "Investimentos",
      produto: "Investimento",
      titulo: "Início dos investimentos",
      oferta: "Abrir a conta de investimentos e montar a carteira inicial por objetivo.",
      porque: "O cliente ainda não investe.",
      objetivo: "Dinheiro trabalhando para os objetivos.",
      potencial: potencial("Investimento", 10),
      prioridade: "Alta",
      prazo: "Curto",
    });
  if (r.falta > 0)
    add({
      id: "op-reserva",
      area: "Investimentos",
      produto: "Investimento",
      titulo: "Reserva de emergência",
      oferta: `Completar ${fmtBRL(r.falta)} em aplicação de liquidez diária.`,
      porque:
        r.atual > 0
          ? `A reserva cobre ${(Math.floor(r.meses * 10) / 10).toLocaleString("pt-BR")} de ${r.mesesMeta} meses de despesas.`
          : `Não há reserva de emergência para ${r.mesesMeta} meses de despesas.`,
      objetivo: "Imprevistos pagos sem crédito caro nem resgate de investimentos de longo prazo.",
      potencial: potencial("Investimento", 6),
      prioridade: r.meses < 3 ? "Alta" : "Média",
      prazo: "Curto",
      detalhe: `Completar a reserva de emergência: ${fmtBRL(r.falta)} em aplicação de liquidez diária`,
    });
  if (sim(c.investimentos.temInvestimento) && s(c.investimentos.temAssessor) === "Não")
    add({
      id: "op-assessoria",
      area: "Investimentos",
      produto: "Investimento",
      titulo: "Assessoria de investimentos",
      oferta: "Assessoria de investimentos, com acompanhamento e revisão periódica da carteira.",
      porque: `Investe ${fmtBRL(p.investimentos)} sem acompanhamento.`,
      objetivo: "Carteira alinhada aos objetivos e ao perfil.",
      potencial: potencial("Investimento", 4),
      prioridade: "Média",
      prazo: "Curto",
    });
  if (p.investimentos >= 50_000 && lista(c.investimentos.temas).filter((t) => t !== "Nenhum").length <= 3)
    add({
      id: "op-diversificacao",
      area: "Investimentos",
      produto: "Investimento",
      titulo: "Diversificação da carteira",
      oferta: "Distribuir entre renda fixa, fundos imobiliários, ações e exterior, conforme o perfil.",
      porque: "Carteira relevante com poucos temas conhecidos pelo cliente.",
      objetivo: "Menos risco concentrado e melhor retorno no longo prazo.",
      potencial: potencial("Investimento", -2),
      prioridade: "Baixa",
      prazo: "Médio",
    });
  aquisicoes
    .filter((a) => s(a.estrategia) === "À vista")
    .forEach((a) =>
      add({
        id: `op-aq-${a.id}`,
        area: "Investimentos",
        produto: "Investimento",
        titulo: `Investimento para comprar à vista (${nomeAquisicao(a)})`,
        oferta: `Juntar ${fmtBRL(n(a.valorDesejado))} para comprar à vista, em aplicação compatível com o prazo da compra.`,
        porque: "O cliente quer comprar à vista.",
        objetivo: "Comprar com desconto e sem juros.",
        potencial: potencial("Investimento", -4),
        prioridade: "Baixa",
        prazo: "Médio",
      }),
    );
  if (!s(c.investimentos.perfil) || s(c.investimentos.perfil) === "Não sabe")
    add({
      id: "op-suitability",
      area: "Investimentos",
      produto: "Planejamento",
      titulo: "Definir o perfil de investidor",
      oferta: "Aplicar o suitability e alinhar a carteira.",
      porque: "O perfil de investidor não está definido.",
      objetivo: "Investimentos compatíveis com o risco que o cliente aceita.",
      potencial: potencial("Planejamento", -16),
      prioridade: "Baixa",
      prazo: "Curto",
    });
  if (p.ativos > 300_000 && p.financeiro / p.ativos < 0.2)
    add({
      id: "op-liquidez",
      area: "Investimentos",
      produto: "Investimento",
      titulo: "Aumentar o patrimônio financeiro",
      oferta: "Plano de aportes para equilibrar patrimônio imobilizado e financeiro.",
      porque: `Só ${fmtPct(p.financeiro / p.ativos)} do patrimônio gera rendimento com liquidez.`,
      objetivo: "Mais liquidez e renda passiva.",
      potencial: potencial("Investimento", -10),
      prioridade: "Baixa",
      prazo: "Longo",
    });
  const gastoSemMilhas = ct.semMilhas.reduce((t, k) => t + n(k.gastoMensal), 0);
  if (gastoSemMilhas >= 3000 || ct.anuidadeAnual > 0)
    add({
      id: "op-cartao",
      area: "Investimentos",
      produto: "Planejamento",
      titulo: "Cartão com benefícios",
      oferta:
        gastoSemMilhas >= 3000
          ? `Cartão com milhas ou cashback para os ${fmtBRL(gastoSemMilhas)}/mês gastos sem pontos.`
          : `Negociar isenção da anuidade (${fmtBRL(ct.anuidadeAnual)}/ano) ou trocar de cartão.`,
      porque: gastoSemMilhas >= 3000 ? "Gastos altos no cartão sem acumular benefícios." : "Paga anuidade de cartão.",
      objetivo: "Os gastos do dia a dia devolvem valor.",
      potencial: potencial("Planejamento", -22),
      prioridade: "Baixa",
      prazo: "Curto",
    });

  // ------------------------------------------------------------------ Futuro
  if (s(c.protecao.temPrevidencia) === "Não")
    add({
      id: "op-previdencia",
      area: "Futuro",
      produto: "Previdência",
      titulo: ir === "Completa" ? "Previdência privada (PGBL)" : ir === "Simplificada" ? "Previdência privada (VGBL)" : "Previdência privada (PGBL/VGBL)",
      oferta: "Plano de previdência com aporte mensal e beneficiários indicados.",
      porque:
        ir === "Completa"
          ? "Declara no modelo completo: o PGBL deduz até 12% da renda bruta."
          : ir === "Simplificada"
            ? "Declara no simplificado: VGBL, com eficiência sucessória."
            : "Não tem previdência privada.",
      objetivo: "Aposentadoria complementar com eficiência fiscal e sucessória.",
      potencial: potencial("Previdência", 6),
      prioridade: "Média",
      prazo: "Médio",
      detalhe: `${ir === "Completa" ? "Previdência privada (PGBL)" : ir === "Simplificada" ? "Previdência privada (VGBL)" : "Previdência privada"} com aporte mensal e beneficiários indicados`,
    });
  if (fu.alvo > 0 && fu.aporte > fu.aporteAtual && !fu.idadeAtingida && !!s(c.cadastro.nascimento))
    add({
      id: "op-independencia",
      area: "Futuro",
      produto: "Investimento",
      titulo: "Plano de independência financeira",
      oferta: `Investir ${fmtBRL(fu.aporte)}/mês para chegar a ${fmtBRL(fu.alvo)} aos ${fu.idadeAposentadoria} anos.`,
      porque: `${fu.aporteAtual > 0 ? `No ritmo atual (${fmtBRL(fu.aporteAtual)}/mês)` : "Sem aportes mensais"}, a projeção cobre ${fmtPct(Math.min(fu.independencia, 9.99))} da meta.`,
      objetivo: `Renda de ${fmtBRL(fu.rendaDesejada)}/mês na aposentadoria.`,
      potencial: potencial("Investimento", 8),
      prioridade: "Média",
      prazo: "Longo",
    });
  // Só quem ainda tem a faculdade pela frente.
  const comFaculdade = pr.educacional.lista.filter((x) => x.faculdade > 0).length;
  if (comFaculdade > 0)
    add({
      id: "op-educacao",
      area: "Futuro",
      produto: "Previdência",
      titulo: "Fundo de educação dos filhos",
      oferta: "Previdência ou investimento dedicado à faculdade de cada filho, com o filho como beneficiário.",
      porque: `${plural(comFaculdade, "dependente com a faculdade pela frente", "dependentes com a faculdade pela frente")}${su.mensalidades > 0 ? `; mensalidades atuais de ${fmtBRL(su.mensalidades)}/mês` : ""}.`,
      objetivo: "Faculdade paga sem apertar o orçamento.",
      potencial: potencial("Previdência", -2),
      prioridade: "Média",
      prazo: "Longo",
    });

  return out.sort((a, b) => b.potencial - a.potencial);
}

/** Radar: uma nota de 0 a 100 por área (80% da maior oportunidade + 4 pontos por oportunidade extra). */
export function radarOportunidades(ops: Oportunidade[]) {
  return AREAS_RADAR.map((area) => {
    const daArea = ops.filter((o) => o.area === area);
    const maior = daArea.reduce((m, o) => Math.max(m, o.potencial), 0);
    return {
      area,
      quantidade: daArea.length,
      potencial: daArea.length ? limitar(maior * 0.8 + 4 * (daArea.length - 1)) : 0,
    };
  });
}

/** Foco em receita: seguros e consórcios (quantidade e volume: capital segurado e cartas). */
export function focoReceita(ops: Oportunidade[]) {
  const resumo = (produto: Produto) => {
    const lista = ops.filter((o) => o.produto === produto);
    return { quantidade: lista.length, volume: lista.reduce((t, o) => t + (o.valor ?? 0), 0) };
  };
  return { seguros: resumo("Seguro"), consorcios: resumo("Consórcio") };
}
