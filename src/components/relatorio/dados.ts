// =====================================================================
//  Dados do Diagnóstico em PDF (modelo LIFE)
//  ---------------------------------------------------------------------
//  Junta, por capítulo, os números dos cálculos do sistema (src/lib).
//  Nada é estimado aqui além de contas simples sobre esses resultados;
//  sem dado, o PDF mostra "Não informado".
// =====================================================================

import type { Cliente, Item } from "@/types";
import { HORIZONTES_PADRAO_VIDA, OPCOES, PRAZOS_PLANO, TIPOS_OBJETIVO } from "@/config/campos";
import { GRUPOS_DESPESA, MODELO_50_30_20, chaveDespesa } from "@/config/despesas";
import {
  TAXAS_REFERENCIA,
  TAXA_RETIRADA,
  despesas,
  dividas,
  educacional,
  fluxo,
  futuro,
  mensalidadeDependente,
  n,
  nOpt,
  objetivos,
  parametros,
  patrimonio,
  protecao,
  reservaEmergencia,
  rotuloDependente,
  s,
  sim,
  sucessao,
  taxaMensal,
  valorPresente,
} from "@/lib/calculos";
import { sugestoes } from "@/lib/diagnostico";
import { estrela } from "@/lib/estrela";
import { oportunidades } from "@/lib/oportunidades";
import { COLUNAS_PLANO, mesclarCards, planoAtual } from "@/lib/plano";
import { fmtBRL, fmtPct, plural } from "@/lib/format";

export const NAO_INFORMADO = "Não informado";

export type Prioridade = "Alta" | "Média" | "Baixa";

/** "26,9%" */
export const pct1 = (v: number) => fmtPct(v, 1);
const anosTxt = (a: number) => (a === 1 ? "1 ano" : `${a} anos`);
/** Prazo de objetivo: "1 ano", "18 meses", "Sem prazo". */
export const fmtPrazo = (meses: number) => (meses <= 0 ? "Sem prazo" : meses % 12 === 0 ? anosTxt(meses / 12) : `${meses} meses`);
/** "Parcelas (Financiamento e Crédito)" -> "Parcelas de financiamento e crédito". */
const semParenteses = (t: string) => t.replace(/ \((.+)\)$/, (_, r: string) => ` de ${r.toLowerCase()}`);

export interface LinhaVisao {
  dimensao: string;
  atual: string;
  necessario: string;
  diferenca: string;
  decisao: string;
  prioridade: Prioridade | "—";
  prazo: string;
}

export function dadosRelatorio(c: Cliente) {
  const f = fluxo(c);
  const d = despesas(c);
  const p = patrimonio(c);
  const r = reservaEmergencia(c);
  const pr = protecao(c);
  const ob = objetivos(c);
  const dv = dividas(c);
  const par = parametros(c.parametros);
  // Futuro: com a simulação do 6.5, quando houver (como no relatório anterior).
  const sm = c.simulacao;
  const simulacao = {
    aporte: nOpt(sm.aporte),
    retornoReal: nOpt(sm.retornoReal) !== undefined ? n(sm.retornoReal) / 100 : undefined,
    idadeAposentadoria: nOpt(sm.idadeAposentadoria),
    rendaDesejada: nOpt(sm.rendaDesejada),
  };
  const simulado = Object.values(simulacao).some((v) => v !== undefined);
  const fu = futuro(c, simulacao);
  const temFuturo = fu.rendaDesejada > 0 && !!s(c.cadastro.nascimento);
  const temProtecao = !!s(c.protecao.temSeguroVida);
  const rendaHoje = (fu.atual * TAXA_RETIRADA) / 12;
  const progresso = fu.alvo > 0 ? fu.atual / fu.alvo : 1;
  const metaPoupanca = MODELO_50_30_20.find((m) => m.id === "Poupança")?.meta ?? 0.2;

  // ------------------------------------------------------------ Objetivos
  const listaObjetivos = [
    ...TIPOS_OBJETIVO.flatMap((t) => ob.porTipo[t.id] ?? []),
    ...c.objetivos.filter((o) => !OPCOES.tipoObjetivo.includes(s(o.tipo))),
  ].map((o) => {
    const aporte = ob.aportes[o.id] ?? 0;
    return {
      id: o.id,
      titulo: s(o.titulo) || s(o.categoria) || "Objetivo",
      tipo: s(o.tipo) || "—",
      prazo: fmtPrazo(n(o.prazoMeses)),
      valor: n(o.valorFuturo) > 0 ? n(o.valorFuturo) : null,
      aporte,
      prioridade: s(o.prioridade) || "—",
      /** Parte do aporte necessário que a sobra livre cobre (null: sem valor ou sem prazo). */
      cobertura: aporte > 0 ? (ob.sugestao[o.id] ?? 0) : null,
      impacto: nOpt(o.impacto) !== undefined ? `${n(o.impacto)}/10` : "-",
    };
  });
  const sobraLivre = Math.max(0, f.sobraLivre);
  const coberturaObjetivos = ob.aporteTotal > 0 ? Math.min(1, sobraLivre / ob.aporteTotal) : null;
  // Necessidade mensal das metas: objetivos + aporte para a independência.
  const aporteIndependencia = temFuturo && !fu.idadeAtingida ? fu.aporte : 0;
  const necessidadeMensal = ob.aporteTotal + aporteIndependencia;

  // ------------------------------------------------- 01 · Visão executiva
  const linhaProtecao = (): LinhaVisao => {
    const dimensao = "PROTEÇÃO PATRIMONIAL - Vida";
    if (pr.necessidade <= 0)
      return { dimensao, atual: NAO_INFORMADO, necessario: NAO_INFORMADO, diferenca: "—", decisao: "Completar os dados de despesas, dependentes e proteção", prioridade: "—", prazo: "—" };
    return {
      dimensao,
      atual: temProtecao ? fmtBRL(pr.atual) : NAO_INFORMADO,
      necessario: fmtBRL(pr.necessario),
      diferenca: fmtBRL(pr.gap),
      decisao: pr.gap > 0 ? `Decidir como cobrir a diferença de ${fmtBRL(pr.gap)}` : "Manter a cobertura e revisar capital e beneficiários",
      prioridade: pr.gap > 0 ? "Alta" : "Baixa",
      prazo: pr.gap > 0 ? "Imediato" : "Revisão anual",
    };
  };
  const linhaReserva = (): LinhaVisao => {
    if (r.meta <= 0) return { dimensao: "Reserva", atual: NAO_INFORMADO, necessario: NAO_INFORMADO, diferenca: "—", decisao: "Informar as despesas mensais", prioridade: "—", prazo: "—" };
    return {
      dimensao: "Reserva",
      atual: fmtBRL(r.atual),
      necessario: fmtBRL(r.meta),
      diferenca: fmtBRL(r.falta),
      decisao:
        r.falta <= 0
          ? "Manter a reserva em aplicação de liquidez diária"
          : r.atual > 0
            ? `Completar a reserva de emergência: faltam ${fmtBRL(r.falta)}`
            : `Constituir a reserva de emergência: meta de ${fmtBRL(r.meta)}`,
      prioridade: r.falta <= 0 ? "Baixa" : r.meses < 3 ? "Alta" : "Média",
      prazo: r.falta <= 0 ? "Revisão anual" : "30 dias",
    };
  };
  const linhaAposentadoria = (): LinhaVisao => {
    if (!temFuturo)
      return { dimensao: "Aposentadoria", atual: NAO_INFORMADO, necessario: NAO_INFORMADO, diferenca: "—", decisao: "Informar nascimento e renda desejada na aposentadoria", prioridade: "—", prazo: "—" };
    const base = { dimensao: "Aposentadoria", atual: fmtBRL(fu.atual), necessario: fmtBRL(fu.alvo), diferenca: fmtBRL(fu.faltaHoje) };
    if (fu.alvo <= 0) return { ...base, decisao: "As outras rendas já cobrem a renda desejada", prioridade: "Baixa", prazo: "Revisão anual" };
    if (fu.idadeAtingida) return { ...base, decisao: "Rever a idade de aposentadoria ou a renda desejada", prioridade: "Alta", prazo: "30 dias" };
    if (fu.aporte > fu.aporteAtual)
      return { ...base, decisao: `Decidir o aporte de ${fmtBRL(fu.aporte)}/mês para a independência`, prioridade: fu.independencia < 0.5 ? "Alta" : "Média", prazo: "60 dias" };
    return { ...base, decisao: `Manter o aporte de ${fmtBRL(fu.aporteAtual)}/mês`, prioridade: "Baixa", prazo: "Revisão anual" };
  };
  const linhaFluxo = (): LinhaVisao => {
    if (f.renda <= 0) return { dimensao: "Fluxo financeiro (mês)", atual: NAO_INFORMADO, necessario: NAO_INFORMADO, diferenca: "—", decisao: "Informar a renda e as despesas", prioridade: "—", prazo: "—" };
    const falta = Math.max(0, necessidadeMensal - Math.max(0, f.sobra));
    return {
      dimensao: "Fluxo financeiro (mês)",
      atual: fmtBRL(f.sobra),
      necessario: fmtBRL(necessidadeMensal),
      diferenca: fmtBRL(falta),
      decisao:
        f.sobra < 0
          ? `Eliminar o déficit de ${fmtBRL(-f.sobra)}/mês`
          : falta > 0
            ? "Priorizar metas: necessidade mensal supera o superávit"
            : "Direcionar o superávit para as metas",
      prioridade: f.sobra < 0 || falta > 0 ? "Alta" : "Média",
      prazo: f.sobra < 0 ? "Imediato" : "30 dias",
    };
  };
  const linhaObjetivos = (): LinhaVisao => {
    if (coberturaObjetivos === null)
      return {
        dimensao: "Objetivos",
        atual: NAO_INFORMADO,
        necessario: "100%",
        diferenca: "—",
        decisao: c.objetivos.length ? "Informar valor e prazo dos objetivos" : "Registrar os objetivos do cliente",
        prioridade: "—",
        prazo: "—",
      };
    const pctCob = Math.round(coberturaObjetivos * 100);
    return {
      dimensao: "Objetivos",
      atual: `${pctCob}%`,
      necessario: "100%",
      diferenca: `${100 - pctCob} p.p.`,
      decisao: pctCob >= 100 ? "Manter os aportes mensais nos objetivos" : `Decidir a destinação mensal para objetivos, cuja necessidade calculada é ${fmtBRL(ob.aporteTotal)}/mês`,
      prioridade: pctCob >= 100 ? "Baixa" : "Média",
      prazo: "30 dias",
    };
  };

  // ------------------------------------------------- 03 · Família e educação
  const ed = educacional(c);
  // Mesmo cálculo sem o reajuste acima da inflação: o custo "a preços de hoje".
  const edHoje = educacional({ ...c, parametros: { ...c.parametros, inflacaoEducacional: c.parametros.inflacaoGeral ?? "" } });
  const filhos = ed.lista.map((x, i) => {
    const item = x.item;
    const nivel = s(item.nivelEscola);
    const escola = s(item.escola);
    return {
      nome: rotuloDependente(c.dependentes, item),
      idade: nOpt(item.idade) !== undefined ? String(n(item.idade)) : "—",
      escolaridade: nivel ? `${nivel}${escola && nivel !== "Não estuda" ? ` (${escola.toLowerCase()})` : ""}` : NAO_INFORMADO,
      mensalidade: mensalidadeDependente(item),
      anosEscola: x.anosEscola,
      escola: x.escola,
      faculdade: x.faculdade,
      total: x.total,
      hoje: edHoje.lista[i]?.total ?? 0,
    };
  });

  // ------------------------------------------------- 04 · Fluxo de caixa
  const detalhes = (grupo: string) => {
    const g = GRUPOS_DESPESA.find((x) => x.id === grupo);
    if (!g) return [];
    return [
      ...g.itens.filter((it) => n(c.despesas[chaveDespesa(g.id, it.id)]) > 0).map((it) => it.label.replace(/ \(.+\)$/, "")),
      ...c.despesasExtras.filter((e) => s(e.grupo) === g.id && n(e.valor) > 0).map((e) => s(e.descricao)).filter(Boolean),
      ...(d.linhasAutomaticas[g.id] ?? []).filter((x) => x.valor > 0).map((x) => x.label),
    ];
  };
  const categorias = d.porCategoria
    .filter((x) => x.valor > 0)
    .sort((a, b) => b.valor - a.valor)
    .map((x) => {
      const det = detalhes(x.id);
      const lista = det.slice(0, 4).join(", ") + (det.length > 4 ? "…" : "");
      return { nome: `${semParenteses(x.label)}${lista ? ` (${lista})` : ""}`, valor: x.valor };
    });
  // Até 11 categorias na legenda; as menores viram "Demais categorias".
  const categoriasRosca =
    categorias.length > 11 ? [...categorias.slice(0, 10), { nome: "Demais categorias", valor: categorias.slice(10).reduce((t, x) => t + x.valor, 0) }] : categorias;
  const blocoFluxo = {
    objetivoMeta: fmtPct(metaPoupanca),
    realidade:
      f.renda <= 0
        ? "Renda não informada"
        : f.sobra < 0
          ? `Déficit de ${fmtBRL(-f.sobra)}/mês`
          : `Hoje em ${pct1(f.taxaPoupanca)} — ${f.taxaPoupanca >= metaPoupanca ? "alinhado" : "abaixo do mínimo"}`,
    ajuste:
      f.renda <= 0
        ? "Informar renda e despesas para medir a poupança"
        : f.sobra < 0
          ? `Eliminar o déficit de ${fmtBRL(-f.sobra)}/mês, começando pelos maiores gastos`
          : f.taxaPoupanca >= metaPoupanca
            ? null
            : `Elevar a poupança para ${fmtBRL(f.renda * metaPoupanca)}/mês (${fmtPct(metaPoupanca)} da renda)`,
  };

  // ------------------------------------------------- 05 · Patrimônio e reserva
  const classes = p.linhasAtivo.filter((l) => l.valor > 0);
  // FGTS só sai em situações previstas em lei: liquidez baixa.
  const liquidez = { alta: p.reserva, media: p.investimentos + p.previdencia, baixa: p.imoveis + p.moveis + p.empresa + p.fgts };
  const mesesParaReserva = r.falta > 0 && sobraLivre > 0 ? Math.ceil(r.falta / sobraLivre) : null;
  const blocoReserva = {
    realidade:
      r.meta <= 0
        ? "Despesas não informadas"
        : r.atual <= 0
          ? "Sem reserva de emergência constituída"
          : r.falta > 0
            ? `Reserva cobre ${(Math.floor(r.meses * 10) / 10).toLocaleString("pt-BR")} de ${r.mesesMeta} meses; faltam ${fmtBRL(r.falta)}`
            : `Reserva completa: ${fmtBRL(r.atual)}`,
    ajuste:
      r.meta <= 0
        ? "Informar as despesas para calcular a reserva"
        : r.falta <= 0
          ? "Manter a reserva em aplicação de liquidez diária, separada do dia a dia"
          : mesesParaReserva !== null
            ? `${r.atual > 0 ? "Completar" : "Constituir"} a reserva com a sobra livre mensal em cerca de ${plural(mesesParaReserva, "mês", "meses")}`
            : "Liberar espaço no orçamento para começar a reserva",
  };

  // ------------------------------------------------- 06 · Proteção (vida)
  const baseProtecao = pr.componentes.educacional + pr.componentes.sucessao + pr.componentes.quitacao;
  const referencias = HORIZONTES_PADRAO_VIDA.map((h) => ({ horizonte: h, necessario: Math.max(0, baseProtecao + (pr.padraoVida[h] ?? 0) - pr.recursos) }));
  const custoSucessao = pr.itcmd + pr.honorarios;
  const faltaSucessao = Math.max(0, custoSucessao - pr.recursos);

  // ------------------------------------------------- 08 · Alavancagem
  const ops = oportunidades(c);
  const aquisicoes = (sim(c.patrimonioGeral.pretendeAdquirir) ? c.aquisicoes.filter((a) => n(a.valorDesejado) > 0) : []).map((a) => {
    const partes = s(a.segmento) === "Veículo" ? [s(a.categoria), s(a.tipo)] : [s(a.tipo), s(a.categoria)];
    return {
      id: a.id,
      nome: partes.filter(Boolean).join(" · ") || s(a.segmento) || "Aquisição",
      segmento: s(a.segmento) || "—",
      valor: n(a.valorDesejado),
      estrategia: s(a.estrategia),
      oportunidade: ops.find((o) => o.id === `op-aq-${a.id}`),
    };
  });
  const prazoTxt = (i: Item) => (n(i.prazo) > 0 ? `${n(i.prazo)} meses` : "—");
  const estimado = (v: number) => `${fmtBRL(v)} (estimado)`;
  const compromissos = [
    ...c.consorcios.map((x) => ({
      tipo: "Consórcio",
      descricao: [s(x.tipo), s(x.administradora), x.contemplado === true ? "contemplado" : ""].filter(Boolean).join(" · ") || "Consórcio",
      parcela: n(x.parcela),
      prazo: prazoTxt(x),
      saldo: n(x.credito) > 0 ? `Carta de ${fmtBRL(n(x.credito))}` : NAO_INFORMADO,
    })),
    ...c.financiamentos.map((x) => {
      const taxa = s(x.tipo) === "Imobiliário" ? TAXAS_REFERENCIA.imovel : s(x.tipo) === "Veículo" ? TAXAS_REFERENCIA.veiculo : TAXAS_REFERENCIA.outro;
      return {
        tipo: "Financiamento",
        descricao: s(x.tipo) || "Financiamento",
        parcela: n(x.parcela),
        prazo: prazoTxt(x),
        saldo: nOpt(x.saldo) !== undefined ? fmtBRL(n(x.saldo)) : estimado(valorPresente(n(x.parcela), taxaMensal(taxa), n(x.prazo))),
      };
    }),
    ...dv.doPatrimonio.map((x) => ({
      tipo: "Financiamento",
      descricao: [x.descricao, x.instituicao].filter(Boolean).join(" · "),
      parcela: x.parcela,
      prazo: x.prazo > 0 ? `${x.prazo} meses` : "—",
      saldo: x.saldoInformado ? fmtBRL(x.saldo) : estimado(x.saldo),
    })),
    ...c.emprestimos.map((x) => ({
      tipo: "Empréstimo",
      descricao: [s(x.categoria), s(x.instituicao)].filter(Boolean).join(" · ") || "Empréstimo",
      parcela: n(x.parcela),
      prazo: prazoTxt(x),
      saldo: estimado(valorPresente(n(x.parcela), taxaMensal(TAXAS_REFERENCIA.emprestimo), n(x.prazo))),
    })),
  ];
  const consorciosAtivos = c.consorcios.filter((x) => n(x.credito) > 0);
  const blocosAquisicao = aquisicoes.map((a) => ({
    objetivo: `Adquirir ${a.nome} (${fmtBRL(a.valor)}) preservando caixa`,
    realidade:
      `Estratégia informada: ${a.estrategia ? a.estrategia.toLowerCase() : "não definida"}` +
      (consorciosAtivos.length
        ? ` · já possui ${consorciosAtivos.map((x) => `consórcio${s(x.administradora) ? ` ${s(x.administradora)}` : ""} de ${fmtBRL(n(x.credito))}`).join(" e ")}`
        : ""),
    ajuste: a.oportunidade ? a.oportunidade.oferta.replace(/\.$/, "") : null,
  }));

  // ------------------------------------------------- 09 · Alertas e plano
  const cfgAtual = COLUNAS_PLANO.planoAtual;
  const alertas = mesclarCards(c, "planoAtual", planoAtual(c), cfgAtual.chaves, cfgAtual.selo)
    .filter((x) => !x.oculto)
    .sort((a, b) => ordemPrioridade(a.selo) - ordemPrioridade(b.selo))
    .map((x) => ({ nivel: x.selo ?? "Média", titulo: x.titulo || "Alerta", descricao: x.textos.diagnostico || "" }));
  const planoConsultor = c.plano.filter((a) => s(a.acao));
  const plano = planoConsultor.length
    ? planoConsultor
        .map((a) => ({
          prioridade: (s(a.prioridade) || "Média") as Prioridade,
          acao: s(a.acao),
          prazo: PRAZOS_PLANO[s(a.prazo) || "Curto"]?.titulo ?? s(a.prazo),
          area: s(a.area) || "—",
        }))
        .sort((a, b) => ordemPrioridade(a.prioridade) - ordemPrioridade(b.prioridade))
    : sugestoes(c).map((x) => ({ prioridade: x.prioridade, acao: x.acao, prazo: PRAZOS_PLANO[x.prazo]?.titulo ?? x.prazo, area: x.area }));

  // Nota LIFE = total da Estrela LIFE (mesma regra de notaLife(), sem calcular duas vezes).
  const est = estrela(c);

  return {
    nome: s(c.cadastro.nome) || "Cliente",
    estrela: est,
    notaLife: est.temDados ? est.total : undefined,
    f,
    d,
    p,
    r,
    pr,
    ob,
    dv,
    par,
    fu,
    simulado,
    temFuturo,
    temProtecao,
    rendaHoje,
    progresso,
    metaPoupanca,
    visao: [linhaProtecao(), linhaReserva(), linhaAposentadoria(), linhaFluxo(), linhaObjetivos()],
    listaObjetivos,
    filhos,
    ed,
    escolares: sucessao(c),
    categorias: categoriasRosca,
    blocoFluxo,
    classes,
    liquidez,
    blocoReserva,
    referencias,
    custoSucessao,
    faltaSucessao,
    aquisicoes,
    compromissos,
    blocosAquisicao,
    alertas,
    plano,
    planoAutomatico: !planoConsultor.length,
  };
}

const ORDEM: Record<string, number> = { Alta: 0, Média: 1, Baixa: 2 };
const ordemPrioridade = (p?: string) => ORDEM[p ?? ""] ?? 1;

export type DadosRelatorio = ReturnType<typeof dadosRelatorio>;
