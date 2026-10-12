// =====================================================================
//  METODOLOGIA DE CÁLCULO
//  ---------------------------------------------------------------------
//  Todas as fórmulas do diagnóstico ficam aqui, em funções puras.
//  A explicação de cada uma está em docs/METODOLOGIA.md.
//  Convenção: taxas nos campos estão em % (ex.: 5 = 5%); aqui viram 0,05.
// =====================================================================

import type { Cliente, Item, Secao, Valor } from "@/types";
import { DEPENDENTES_ESCOLARES, ESTILOS_VIDA, HORIZONTES_PADRAO_VIDA, OPCOES } from "@/config/campos";
import { GRUPOS_DESPESA, chaveDespesa } from "@/config/despesas";
import { brutaDeLiquida, liquidaDeBruta } from "@/config/tributos";

// ---------------------------------------------------------------------
//  Leitura segura de valores
// ---------------------------------------------------------------------
export const n = (v: Valor): number => {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string" && v.trim() !== "") {
    const x = Number(v);
    return Number.isFinite(x) ? x : 0;
  }
  return 0;
};
/** Número informado ou `undefined` quando o campo está em branco (para valores automáticos). */
export const nOpt = (v: Valor): number | undefined => (v === undefined || v === null || v === "" ? undefined : n(v));
export const s = (v: Valor): string => (v === undefined || v === null ? "" : Array.isArray(v) ? v.join(", ") : String(v));
/** Lista de opções marcadas (multiescolha). */
export const lista = (v: Valor): string[] => (Array.isArray(v) ? v : typeof v === "string" && v ? [v] : []);
export const sim = (v: Valor) => v === "Sim" || v === true;
const pct = (v: Valor) => n(v) / 100;
const soma = (itens: Item[], f: (i: Item) => number) => itens.reduce((t, i) => t + f(i), 0);

// ---------------------------------------------------------------------
//  Matemática financeira
// ---------------------------------------------------------------------
/** Taxa mensal equivalente a uma taxa anual composta. */
export const taxaMensal = (anual: number) => Math.pow(1 + anual, 1 / 12) - 1;

/** Parcela (Tabela Price) para quitar `pv` em `meses` à taxa mensal `i`. */
export const pmt = (pv: number, i: number, meses: number) => {
  if (meses <= 0) return 0;
  if (i === 0) return pv / meses;
  return (pv * i) / (1 - Math.pow(1 + i, -meses));
};

/** Valor futuro de aportes mensais `p` por `meses` à taxa mensal `i`, partindo de `pv`. */
export const valorFuturo = (pv: number, p: number, i: number, meses: number) => {
  if (meses <= 0) return pv;
  if (i === 0) return pv + p * meses;
  const f = Math.pow(1 + i, meses);
  return pv * f + (p * (f - 1)) / i;
};

/** Valor presente de `meses` parcelas `p` à taxa mensal `i` (estimativa de saldo devedor). */
export const valorPresente = (p: number, i: number, meses: number) => {
  if (meses <= 0 || p <= 0) return 0;
  if (i === 0) return p * meses;
  return (p * (1 - Math.pow(1 + i, -meses))) / i;
};

/** Aporte mensal necessário para sair de `pv` e chegar em `fv` em `meses` à taxa mensal `i`. */
export const aporteNecessario = (fv: number, pv: number, i: number, meses: number) => {
  if (meses <= 0) return Math.max(0, fv - pv);
  if (i === 0) return Math.max(0, (fv - pv) / meses);
  const f = Math.pow(1 + i, meses);
  return Math.max(0, ((fv - pv * f) * i) / (f - 1));
};

export const idadePorNascimento = (iso: string) => {
  if (!iso) return undefined;
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return undefined;
  const hoje = new Date();
  let idade = hoje.getFullYear() - d.getFullYear();
  const m = hoje.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < d.getDate())) idade--;
  return idade;
};

/** Valor mensal equivalente (frequência "Anual" é dividida por 12). */
export const mensal = (i: Item) => (s(i.frequencia) === "Anual" ? n(i.valor) / 12 : n(i.valor));

export const temConjuge = (c: Cliente) => OPCOES.comConjuge.includes(s(c.cadastro.estadoCivil));

// ---------------------------------------------------------------------
//  Parâmetros do cliente
// ---------------------------------------------------------------------
export const parametros = (p: Secao) => {
  const inflacao = pct(p.inflacaoGeral);
  const retornoReal = pct(p.retornoReal);
  return {
    inflacao,
    retornoReal,
    /** Retorno nominal = (1 + inflação) × (1 + retorno real) − 1 */
    nominal: (1 + inflacao) * (1 + retornoReal) - 1,
    mesesReserva: n(p.mesesReserva) || 6,
    limite: pct(p.limiteComprometimento) || 0.3,
  };
};

// ---------------------------------------------------------------------
//  Sucessão (dependentes)
// ---------------------------------------------------------------------
export const ehEscolar = (d: Item) => DEPENDENTES_ESCOLARES.includes(s(d.categoria));
const estuda = (d: Item) => ehEscolar(d) && !!s(d.nivelEscola) && s(d.nivelEscola) !== "Não estuda";
/** Mensalidade só conta para dependente que estuda (campo oculto não soma). */
export const mensalidadeDependente = (d: Item) => (estuda(d) ? n(d.mensalidade) : 0);
export const custoDependente = (d: Item) =>
  mensalidadeDependente(d) + n(d.auxilio) + (ehEscolar(d) ? 0 : n(d.outrosCustos));

export function sucessao(c: Cliente) {
  const filhos = c.dependentes.filter((d) => s(d.categoria) === "Filho(a)" || s(d.categoria) === "Enteado(a)");
  return {
    filhos: filhos.length,
    dependentes: c.dependentes.length,
    custoMensal: soma(c.dependentes, custoDependente),
    mensalidades: soma(c.dependentes, mensalidadeDependente),
    auxilios: soma(c.dependentes, (d) => n(d.auxilio)),
  };
}

// ---------------------------------------------------------------------
//  Financiamentos e dívidas
//  Saldo não informado é estimado pelo valor presente das parcelas
//  restantes, a uma taxa de referência por tipo (ajuste em TAXAS_REFERENCIA).
// ---------------------------------------------------------------------
export const TAXAS_REFERENCIA = { imovel: 0.1, veiculo: 0.18, outro: 0.2, emprestimo: 0.35 };

const saldoEstimado = (f: Item, taxaAnual: number) =>
  nOpt(f.saldo) ?? valorPresente(n(f.parcela), taxaMensal(taxaAnual), n(f.prazo));

/** Bens (imóveis e móveis) não quitados viram financiamentos automaticamente. */
export function financiamentosDoPatrimonio(c: Cliente) {
  const naoQuitado = (b: Item) => b.quitado !== true && (n(b.parcela) > 0 || n(b.saldo) > 0);
  return [
    ...c.imoveis.filter(naoQuitado).map((b) => ({
      id: b.id,
      origem: "imovel" as const,
      descricao: `${s(b.tipo) || "Imóvel"}${s(b.categoria) ? ` · ${s(b.categoria)}` : ""}`,
      instituicao: s(b.instituicao),
      parcela: n(b.parcela),
      prazo: n(b.prazo),
      saldo: saldoEstimado(b, TAXAS_REFERENCIA.imovel),
      saldoInformado: nOpt(b.saldo) !== undefined,
    })),
    ...c.moveis.filter(naoQuitado).map((b) => ({
      id: b.id,
      origem: "movel" as const,
      descricao: s(b.nome) || s(b.tipo) || "Veículo",
      instituicao: s(b.instituicao),
      parcela: n(b.parcela),
      prazo: n(b.prazo),
      saldo: saldoEstimado(b, TAXAS_REFERENCIA.veiculo),
      saldoInformado: nOpt(b.saldo) !== undefined,
    })),
  ];
}

export function dividas(c: Cliente) {
  const doPatrimonio = financiamentosDoPatrimonio(c);
  const taxaFin = (f: Item) =>
    s(f.tipo) === "Imobiliário" ? TAXAS_REFERENCIA.imovel : s(f.tipo) === "Veículo" ? TAXAS_REFERENCIA.veiculo : TAXAS_REFERENCIA.outro;
  const parcelasFin = soma(c.financiamentos, (f) => n(f.parcela)) + doPatrimonio.reduce((t, f) => t + f.parcela, 0);
  const parcelasCons = soma(c.consorcios, (f) => n(f.parcela));
  const parcelasEmp = soma(c.emprestimos, (f) => n(f.parcela));
  const saldoFin = soma(c.financiamentos, (f) => saldoEstimado(f, taxaFin(f))) + doPatrimonio.reduce((t, f) => t + f.saldo, 0);
  const saldoEmp = soma(c.emprestimos, (f) => saldoEstimado(f, TAXAS_REFERENCIA.emprestimo));
  const creditoConsorcio = soma(c.consorcios, (f) => n(f.credito));
  return {
    doPatrimonio,
    parcelasFin,
    parcelasCons,
    parcelasEmp,
    parcelas: parcelasFin + parcelasCons + parcelasEmp,
    /** Parcelas que geram dívida (consórcio é compromisso, mas não passivo). */
    parcelasDivida: parcelasFin + parcelasEmp,
    saldoFin,
    saldoEmp,
    passivos: saldoFin + saldoEmp,
    creditoConsorcio,
  };
}

// ---------------------------------------------------------------------
//  Renda, despesas e fluxo de caixa
// ---------------------------------------------------------------------
export const RENDA_PASSIVA = ["Aluguel", "Dividendos / Juros", "Pensão / Aposentadoria"];

/**
 * Bruta e líquida de uma pessoa. Se só uma for informada, a outra é estimada
 * pelas tabelas de INSS/IR (src/config/tributos.ts).
 */
export function brutaLiquida(bruta: Valor, liquida: Valor) {
  const b = nOpt(bruta);
  const l = nOpt(liquida);
  if (l !== undefined && l > 0)
    return { bruta: b && b > 0 ? b : brutaDeLiquida(l), liquida: l, estimada: b && b > 0 ? undefined : ("bruta" as const) };
  if (b !== undefined && b > 0) return { bruta: b, liquida: liquidaDeBruta(b), estimada: "liquida" as const };
  return { bruta: 0, liquida: 0, estimada: undefined };
}

export function renda(c: Cliente) {
  const cliente = brutaLiquida(c.renda.brutaCliente, c.renda.liquidaCliente);
  const conjuge = temConjuge(c) ? brutaLiquida(c.renda.brutaConjuge, c.renda.liquidaConjuge) : brutaLiquida(0, 0);
  const outras = soma(c.outrasRendas, mensal);
  const passiva = soma(
    c.outrasRendas.filter((r) => RENDA_PASSIVA.includes(s(r.tipo))),
    mensal,
  );
  return {
    cliente,
    conjugeDetalhe: conjuge,
    principal: cliente.liquida,
    conjuge: conjuge.liquida,
    outras,
    passiva,
    /** Renda familiar líquida mensal. */
    total: cliente.liquida + conjuge.liquida + outras,
    brutaTotal: cliente.bruta + conjuge.bruta,
  };
}

export function cartoes(c: Cliente) {
  const lista = s(c.renda.temCartao) === "Sim" ? c.cartoes : [];
  const limite = soma(lista, (k) => n(k.limite));
  const gasto = soma(lista, (k) => n(k.gastoMensal));
  return {
    quantidade: lista.length,
    limite,
    gasto,
    usoLimite: limite > 0 ? gasto / limite : 0,
    comMilhas: lista.filter((k) => k.milhas === true).length,
    semMilhas: lista.filter((k) => k.milhas !== true),
  };
}

export interface LinhaDespesa {
  id: string;
  label: string;
  bloco: "Fixa" | "Variável";
  valor: number;
  automatico?: boolean;
}

export function despesas(c: Cliente) {
  const dv = dividas(c);
  const dep = sucessao(c);
  const grupos = GRUPOS_DESPESA.map((g) => {
    const extras = c.despesasExtras.filter((e) => s(e.grupo) === g.id);
    let valor = g.itens.reduce((t, it) => t + n(c.despesas[chaveDespesa(g.id, it.id)]), 0) + soma(extras, (e) => n(e.valor));
    let automatico = false;
    // Parcelas e dependentes vêm de outras seções (substituem o valor digitado).
    if (g.automatico === "dividas" && dv.parcelas > 0) {
      valor = dv.parcelas;
      automatico = true;
    }
    if (g.automatico === "dependentes") {
      valor = dep.custoMensal;
      automatico = true;
    }
    return { id: g.id, label: g.label, bloco: g.bloco, valor, automatico, extras: extras.length };
  });
  const porCategoria: LinhaDespesa[] = grupos.map(({ id, label, bloco, valor, automatico }) => ({ id, label, bloco, valor, automatico }));
  const fixas = grupos.filter((x) => x.bloco === "Fixa").reduce((t, x) => t + x.valor, 0);
  const variaveis = grupos.filter((x) => x.bloco === "Variável").reduce((t, x) => t + x.valor, 0);
  const parcelas = grupos.find((x) => x.id === "financiamentos")?.valor ?? 0;
  return {
    porCategoria,
    fixas,
    variaveis,
    total: fixas + variaveis,
    parcelas,
    /** Custo de vida sem parcelas (padrão de vida). */
    custoVida: fixas + variaveis - parcelas,
  };
}

export function fluxo(c: Cliente) {
  const r = renda(c);
  const d = despesas(c);
  const dv = dividas(c);
  const sobra = r.total - d.total;
  return {
    renda: r.total,
    rendaPassiva: r.passiva,
    rendaConjuge: r.conjuge,
    fixas: d.fixas,
    variaveis: d.variaveis,
    despesas: d.total,
    parcelas: d.parcelas,
    sobra,
    taxaPoupanca: r.total > 0 ? sobra / r.total : 0,
    comprometimento: r.total > 0 ? dv.parcelas / r.total : 0,
  };
}

// ---------------------------------------------------------------------
//  Patrimônio e balanço patrimonial
// ---------------------------------------------------------------------
export function patrimonio(c: Cliente) {
  const imoveis = soma(c.imoveis, (i) => n(i.valor));
  const moveis = soma(c.moveis, (i) => n(i.valor));
  const investimentos = sim(c.investimentos.temInvestimento) ? n(c.investimentos.valor) : 0;
  const reserva = sim(c.protecao.temReserva) ? n(c.protecao.valorReserva) : 0;
  const previdencia = sim(c.protecao.temPrevidencia) ? n(c.protecao.valorPrevidencia) : 0;
  const empresa = sim(c.corporativo.possuiEmpresa) ? n(c.corporativo.valorParticipacao) : 0;
  const dv = dividas(c);
  const ativos = imoveis + moveis + reserva + investimentos + previdencia + empresa;
  return {
    imoveis,
    moveis,
    reserva,
    investimentos,
    previdencia,
    empresa,
    /** Recursos financeiros: reserva + investimentos + previdência. */
    financeiro: reserva + investimentos + previdencia,
    ativos,
    passivos: dv.passivos,
    liquido: ativos - dv.passivos,
    linhasAtivo: [
      { nome: "Imóveis", valor: imoveis },
      { nome: "Móveis (veículos e embarcações)", valor: moveis },
      { nome: "Reserva de emergência", valor: reserva },
      { nome: "Investimentos", valor: investimentos },
      { nome: "Previdência privada", valor: previdencia },
      { nome: "Participação em empresa", valor: empresa },
    ],
    linhasPassivo: [
      { nome: "Financiamentos (saldo)", valor: dv.saldoFin },
      { nome: "Empréstimos e dívidas (saldo estimado)", valor: dv.saldoEmp },
    ],
  };
}

export function reservaEmergencia(c: Cliente) {
  const { mesesReserva } = parametros(c.parametros);
  const custo = despesas(c).total;
  const atual = patrimonio(c).reserva;
  const meta = custo * mesesReserva;
  return { atual, meta, falta: Math.max(0, meta - atual), meses: custo > 0 ? atual / custo : 0, mesesMeta: mesesReserva };
}

// ---------------------------------------------------------------------
//  Objetivos (valor futuro em R$ nominais, rendendo o retorno nominal)
// ---------------------------------------------------------------------
const ORDEM_TIPO: Record<string, number> = { Essencial: 0, Desejo: 1, Sonho: 2 };
const ORDEM_PRIORIDADE: Record<string, number> = { Alta: 0, Média: 1, Baixa: 2 };

export function objetivo(c: Cliente, o: Item) {
  const { nominal } = parametros(c.parametros);
  const meses = Math.max(0, n(o.prazoMeses));
  return { meses, aporte: aporteNecessario(n(o.valorFuturo), 0, taxaMensal(nominal), meses) };
}

/**
 * Probabilidade sugerida: distribui a sobra mensal entre os objetivos na ordem
 * Essencial → Desejo → Sonho e, dentro de cada um, por prioridade. A sugestão
 * é a parte do aporte necessário que a sobra consegue cobrir (limitada a 95%).
 */
export function objetivos(c: Cliente) {
  const sobra = Math.max(0, fluxo(c).sobra);
  const ordenados = [...c.objetivos].sort(
    (a, b) =>
      (ORDEM_TIPO[s(a.tipo)] ?? 9) - (ORDEM_TIPO[s(b.tipo)] ?? 9) ||
      (ORDEM_PRIORIDADE[s(a.prioridade)] ?? 9) - (ORDEM_PRIORIDADE[s(b.prioridade)] ?? 9),
  );
  let disponivel = sobra;
  const sugestao: Record<string, number> = {};
  const aportes: Record<string, number> = {};
  ordenados.forEach((o) => {
    const { aporte } = objetivo(c, o);
    aportes[o.id] = aporte;
    const coberto = aporte > 0 ? Math.min(aporte, disponivel) : 0;
    disponivel -= coberto;
    sugestao[o.id] = aporte > 0 ? Math.min(95, Math.round(((coberto / aporte) * 100) / 5) * 5) : 0;
  });
  const aporteTotal = Object.values(aportes).reduce((t, x) => t + x, 0);
  const porTipo = (t: string) => c.objetivos.filter((o) => s(o.tipo) === t);
  return {
    sugestao,
    aportes,
    aporteTotal,
    valorTotal: soma(c.objetivos, (o) => n(o.valorFuturo)),
    cabeNaSobra: aporteTotal <= sobra,
    porTipo: Object.fromEntries(OPCOES.tipoObjetivo.map((t) => [t, porTipo(t)])) as Record<string, Item[]>,
  };
}

// ---------------------------------------------------------------------
//  Proteção — o que contratar de seguro de vida
//   • Educacional: escola até o fim do ensino médio + faculdade
//   • Padrão de vida: custo de vida atual × 12 × horizonte (1, 5 ou 15 anos)
//   • Sucessão patrimonial: ITCMD + honorários sobre o patrimônio quitado
//   • Quitação de dívidas: opcional (financiamento imobiliário já tem seguro MIP)
// ---------------------------------------------------------------------
/** Anos de escola restantes até o fim do ensino médio, por escolaridade atual. */
export const ANOS_ESCOLA_RESTANTES: Record<string, number> = {
  "Educação infantil": 13,
  "Fundamental I": 9,
  "Fundamental II": 5,
  "Ensino médio": 2,
  Graduação: 0,
  "Pós-graduação": 0,
  "Não estuda": 0,
};
const ANTES_DA_FACULDADE = ["Educação infantil", "Fundamental I", "Fundamental II", "Ensino médio"];

export function educacional(c: Cliente) {
  const pr = c.protecao;
  const mensalidadeFac = n(pr.mensalidadeFaculdade) || 3000;
  const duracao = n(pr.duracaoFaculdade) || 5;
  const lista = c.dependentes.filter(ehEscolar).map((d) => {
    const nivel = s(d.nivelEscola);
    const anosEscola = ANOS_ESCOLA_RESTANTES[nivel] ?? 0;
    const escola = mensalidadeDependente(d) * 12 * anosEscola;
    let faculdade = 0;
    if (ANTES_DA_FACULDADE.includes(nivel)) faculdade = mensalidadeFac * 12 * duracao;
    else if (nivel === "Graduação") faculdade = mensalidadeDependente(d) * 12 * Math.ceil(duracao / 2);
    return { item: d, anosEscola, escola, faculdade, total: escola + faculdade };
  });
  return { lista, total: lista.reduce((t, x) => t + x.total, 0) };
}

export function protecao(c: Cliente) {
  const pr = c.protecao;
  const d = despesas(c);
  const p = patrimonio(c);
  const ed = educacional(c);
  const horizonte = HORIZONTES_PADRAO_VIDA.includes(n(pr.horizonte)) ? n(pr.horizonte) : 5;
  // As mensalidades dos dependentes já entram no componente educacional.
  const custoMensal = Math.max(0, d.custoVida - sucessao(c).mensalidades);
  const padraoVida = Object.fromEntries(HORIZONTES_PADRAO_VIDA.map((a) => [a, custoMensal * 12 * a])) as Record<number, number>;
  const quitados =
    soma(c.imoveis.filter((b) => b.quitado === true), (b) => n(b.valor)) +
    soma(c.moveis.filter((b) => b.quitado === true), (b) => n(b.valor)) +
    p.investimentos +
    p.reserva +
    p.empresa;
  const itcmd = quitados * pct(pr.itcmd ?? 4);
  const honorarios = quitados * pct(pr.honorarios ?? 6);
  const sucessaoPatrimonial = itcmd + honorarios;
  const quitacao = pr.incluirQuitacao === true ? p.passivos : 0;
  const necessidade = ed.total + padraoVida[horizonte] + sucessaoPatrimonial + quitacao;
  // Previdência vai direto aos beneficiários; reserva e investimentos ficam com a família.
  const recursos = p.financeiro;
  const necessario = Math.max(0, necessidade - recursos);
  const atual = sim(pr.temSeguroVida) ? n(pr.capitalAtual) : 0;
  return {
    horizonte,
    custoMensal,
    padraoVida,
    educacional: ed,
    quitados,
    itcmd,
    honorarios,
    componentes: { educacional: ed.total, padraoVida: padraoVida[horizonte], sucessao: sucessaoPatrimonial, quitacao },
    necessidade,
    recursos,
    necessario,
    atual,
    empresa: n(pr.seguroEmpresa),
    gap: Math.max(0, necessario - atual),
    cobertura: necessario > 0 ? Math.min(1, atual / necessario) : atual > 0 ? 1 : 0,
  };
}

// ---------------------------------------------------------------------
//  Futuro — independência financeira (valores reais, R$ de hoje)
// ---------------------------------------------------------------------
export const TAXA_RETIRADA = 0.04; // regra dos 4% → patrimônio = 25× a renda anual

export function futuro(c: Cliente) {
  const fu = c.futuro;
  const f = fluxo(c);
  const d = despesas(c);
  const p = patrimonio(c);
  const { retornoReal } = parametros(c.parametros);
  const idadeAtual = idadePorNascimento(s(c.cadastro.nascimento)) ?? 0;
  const idadeAposentadoria = n(fu.idadeAposentadoria) || 60;
  const anos = Math.max(0, idadeAposentadoria - idadeAtual);
  const estilo = ESTILOS_VIDA.find((e) => e.id === s(fu.estiloVida));
  const rendaDesejadaAuto = d.custoVida * (estilo?.fator ?? 1);
  const rendaDesejada = nOpt(fu.rendaDesejada) ?? rendaDesejadaAuto;
  const outrasAuto = f.rendaPassiva;
  const outras = nOpt(fu.outrasRendas) ?? outrasAuto;
  const alvo = (Math.max(0, rendaDesejada - outras) * 12) / TAXA_RETIRADA;
  // A reserva de emergência não entra: ela existe para imprevistos.
  const atual = p.investimentos + p.previdencia;
  const aporteAtual = Math.max(0, f.sobra);
  const i = taxaMensal(retornoReal);
  const meses = anos * 12;
  const projetado = valorFuturo(atual, aporteAtual, i, meses);
  const aporte = aporteNecessario(alvo, atual, i, meses);
  const anoBase = new Date().getFullYear();
  return {
    idadeAtual,
    idadeAposentadoria,
    estilo: estilo?.id,
    anos,
    rendaDesejada,
    rendaDesejadaAuto,
    outras,
    outrasAuto,
    alvo,
    atual,
    aporteAtual,
    projetado,
    aporte,
    independencia: alvo > 0 ? projetado / alvo : 0,
    rendaProjetada: (projetado * TAXA_RETIRADA) / 12 + outras,
    serie: Array.from({ length: anos + 1 }, (_, k) => ({
      ano: anoBase + k,
      idade: idadeAtual + k,
      atual: Math.round(valorFuturo(atual, aporteAtual, i, k * 12)),
      necessaria: Math.round(valorFuturo(atual, aporte, i, k * 12)),
    })),
  };
}
