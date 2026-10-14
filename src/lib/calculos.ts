// =====================================================================
//  METODOLOGIA DE CÁLCULO
//  ---------------------------------------------------------------------
//  Todas as fórmulas do diagnóstico ficam aqui, em funções puras.
//  A explicação de cada uma está em docs/METODOLOGIA.md.
//  Convenção: taxas nos campos estão em % (ex.: 5 = 5%); aqui viram 0,05.
// =====================================================================

import type { Cliente, Item, Secao, Valor } from "@/types";
import { DEPENDENTES_ESCOLARES, ESTILOS_VIDA, HORIZONTES_PADRAO_VIDA, OPCOES, bemFinanciado } from "@/config/campos";
import { GRUPOS_DESPESA, MODELO_50_30_20, chaveDespesa, type ParteModelo } from "@/config/despesas";
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
  // Em branco, a inflação educacional acompanha a geral.
  const inflacaoEducacional = nOpt(p.inflacaoEducacional) !== undefined ? pct(p.inflacaoEducacional) : inflacao;
  return {
    inflacao,
    inflacaoEducacional,
    /** Quanto a educação sobe acima da inflação geral, por ano. */
    premioEducacional: (1 + inflacaoEducacional) / (1 + inflacao) - 1,
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
  mensalidadeDependente(d) + n(d.auxilio) + (s(d.categoria) && !ehEscolar(d) ? n(d.outrosCustos) : 0);

/** Nome do dependente, ou "<categoria> <n>" contando só dentro da categoria (igual em Sucessão, Despesas e 6.2). */
export function rotuloDependente(lista: Item[], d: Item) {
  if (s(d.nome)) return s(d.nome);
  const categoria = s(d.categoria);
  const i = lista.findIndex((x) => x === d || (!!d.id && x.id === d.id));
  const posicao = (i < 0 ? lista : lista.slice(0, i + 1)).filter((x) => s(x.categoria) === categoria).length;
  return `${categoria || "Dependente"} ${Math.max(1, posicao)}`;
}

export function sucessao(c: Cliente) {
  const filhos = c.dependentes.filter((d) => s(d.categoria) === "Filho(a)");
  return {
    filhos: filhos.length,
    /** Filhos, enteados e netos (dependentes com vida escolar). */
    escolares: c.dependentes.filter(ehEscolar).length,
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

/** Bem quitado (situação "Quitado"; dados antigos: quitado = sim). */
export const bemQuitado = (b: Item) => !bemFinanciado(b);

/** Bens (imóveis e móveis) financiados viram financiamentos automaticamente. */
export function financiamentosDoPatrimonio(c: Cliente) {
  const naoQuitado = (b: Item) => bemFinanciado(b) && (n(b.parcela) > 0 || n(b.saldo) > 0);
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
/** Rendas que seguem na aposentadoria sem depender dos investimentos (juros e dividendos já vêm do patrimônio projetado). */
export const RENDA_FUTURA = ["Aluguel", "Pensão / Aposentadoria"];

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
  // Renda marcada como do cônjuge só conta se o cadastro tiver cônjuge.
  const validas = c.outrasRendas.filter((r) => temConjuge(c) || s(r.pessoa) !== "Cônjuge");
  const outras = soma(validas, mensal);
  const passiva = soma(
    validas.filter((r) => RENDA_PASSIVA.includes(s(r.tipo))),
    mensal,
  );
  const futura = soma(
    validas.filter((r) => RENDA_FUTURA.includes(s(r.tipo))),
    mensal,
  );
  // Renda extra do cliente (campo único em 6 · Renda), líquida e mensal.
  const extra = Math.max(0, n(c.renda.rendaExtra));
  // 13º e bônus anual (valores do ano, líquidos): no fluxo mensal entram como média (÷ 12).
  const decimoTerceiro = Math.max(0, n(c.renda.decimoTerceiro));
  const bonusAnual = Math.max(0, n(c.renda.bonusAnual));
  const anualMensal = (decimoTerceiro + bonusAnual) / 12;
  // Outras rendas por pessoa (cliente, cônjuge ou outra pessoa).
  const outrasPorPessoa = OPCOES.pessoaRenda.map((pessoa) => ({
    pessoa,
    valor: soma(
      validas.filter((r) => (s(r.pessoa) || "Cliente") === pessoa),
      mensal,
    ),
  }));
  return {
    cliente,
    conjugeDetalhe: conjuge,
    principal: cliente.liquida,
    conjuge: conjuge.liquida,
    extra,
    decimoTerceiro,
    bonusAnual,
    /** 13º + bônus anual ÷ 12. */
    anualMensal,
    outras,
    outrasPorPessoa,
    passiva,
    futura,
    /** Renda familiar líquida mensal (13º e bônus como média mensal). */
    total: cliente.liquida + extra + anualMensal + conjuge.liquida + outras,
    brutaTotal: cliente.bruta + conjuge.bruta,
  };
}

export function cartoes(c: Cliente) {
  const lista = s(c.renda.temCartao) === "Sim" ? c.cartoes : [];
  const limite = soma(lista, (k) => n(k.limite));
  const gasto = soma(lista, (k) => n(k.gastoMensal));
  // Uso do limite considera só cartões com limite informado.
  const gastoComLimite = soma(lista.filter((k) => n(k.limite) > 0), (k) => n(k.gastoMensal));
  const comAnuidade = lista.filter((k) => k.pagaAnuidade === true);
  return {
    quantidade: lista.length,
    limite,
    gasto,
    usoLimite: limite > 0 ? gastoComLimite / limite : 0,
    comMilhas: lista.filter((k) => k.milhas === true).length,
    semMilhas: lista.filter((k) => k.milhas !== true),
    comAnuidade,
    /** Anuidades informadas (R$ por ano). */
    anuidadeAnual: soma(comAnuidade, (k) => n(k.valorAnuidade)),
  };
}

/** Manutenção e IPVA dos veículos (informados por ano em 7 · Patrimônio). */
export function custoVeiculos(c: Cliente) {
  const anual = soma(c.moveis, (m) => n(m.manutencaoAnual) + n(m.ipvaAnual));
  return { anual, mensal: anual / 12 };
}

/** Linha de despesa que vem de outra seção (não se digita em Despesas). */
export interface LinhaAutomatica {
  id: string;
  label: string;
  valor: number;
  /** Seção onde o valor é informado. */
  secao: string;
}

/** Linhas automáticas dentro dos blocos de despesa (somam no bloco). */
export function linhasAutomaticas(c: Cliente): Record<string, LinhaAutomatica[]> {
  const veiculos = custoVeiculos(c).mensal;
  const anuidades = cartoes(c).anuidadeAnual / 12;
  return {
    transporte: veiculos > 0 ? [{ id: "veiculos", label: "Manutenção e IPVA dos Veículos", valor: veiculos, secao: "patrimonio" }] : [],
    outrasFixas: anuidades > 0 ? [{ id: "anuidades", label: "Anuidade dos Cartões", valor: anuidades, secao: "renda" }] : [],
  };
}

export interface LinhaDespesa {
  id: string;
  label: string;
  bloco: "Fixa" | "Variável";
  /** Parte do modelo 50-30-20. */
  modelo: ParteModelo;
  valor: number;
  automatico?: boolean;
}

export function despesas(c: Cliente) {
  const dv = dividas(c);
  const dep = sucessao(c);
  const auto = linhasAutomaticas(c);
  const grupos = GRUPOS_DESPESA.map((g) => {
    const extras = c.despesasExtras.filter((e) => s(e.grupo) === g.id);
    let valor =
      g.itens.reduce((t, it) => t + n(c.despesas[chaveDespesa(g.id, it.id)]), 0) +
      soma(extras, (e) => n(e.valor)) +
      (auto[g.id] ?? []).reduce((t, x) => t + x.valor, 0);
    let automatico = false;
    // Parcelas (8 · Financiamento e crédito) e dependentes (4 · Sucessão) vêm de outras seções.
    if (g.automatico === "dividas") {
      valor = dv.parcelas;
      automatico = true;
    }
    if (g.automatico === "dependentes") {
      valor = dep.custoMensal;
      automatico = true;
    }
    return { id: g.id, label: g.label, bloco: g.bloco, modelo: g.modelo, valor, automatico, extras: extras.length };
  });
  const porCategoria: LinhaDespesa[] = grupos.map(({ id, label, bloco, modelo, valor, automatico }) => ({ id, label, bloco, modelo, valor, automatico }));
  const fixas = grupos.filter((x) => x.bloco === "Fixa").reduce((t, x) => t + x.valor, 0);
  const variaveis = grupos.filter((x) => x.bloco === "Variável").reduce((t, x) => t + x.valor, 0);
  const parcelas = grupos.find((x) => x.id === "financiamentos")?.valor ?? 0;
  return {
    porCategoria,
    linhasAutomaticas: auto,
    fixas,
    variaveis,
    total: fixas + variaveis,
    parcelas,
    /** Custo de vida sem parcelas (padrão de vida). */
    custoVida: fixas + variaveis - parcelas,
  };
}

/** Aportes mensais que o cliente já faz nos projetos (9 · Projetos). */
export const aportesProjetos = (c: Cliente) => soma(c.projetos, (p) => Math.max(0, n(p.aporteMensal)));

export function fluxo(c: Cliente) {
  const r = renda(c);
  const d = despesas(c);
  const sobra = r.total - d.total;
  const aportes = aportesProjetos(c);
  return {
    renda: r.total,
    rendaPassiva: r.passiva,
    rendaConjuge: r.conjuge,
    fixas: d.fixas,
    variaveis: d.variaveis,
    despesas: d.total,
    parcelas: d.parcelas,
    sobra,
    /** Aportes mensais em projetos (saem da sobra: fazem parte de "Projeto e Investimentos"). */
    aportesProjetos: aportes,
    /** Sobra depois dos aportes em projetos (o que fica livre para investir). */
    sobraLivre: sobra - aportes,
    taxaPoupanca: r.total > 0 ? sobra / r.total : 0,
    // Parcelas de 8 · Financiamento e crédito (incluem os bens financiados do Patrimônio).
    comprometimento: r.total > 0 ? d.parcelas / r.total : 0,
  };
}

// ---------------------------------------------------------------------
//  Modelo 50-30-20 (pré-diagnóstico)
//   Essencial até 50% da renda líquida, Estilo e Desejos até 30% e ao menos 20%
//   para poupança e investimentos (a sobra). A parte de cada bloco de
//   despesa está em src/config/despesas.ts (campo `modelo`).
// ---------------------------------------------------------------------
export function modelo503020(c: Cliente) {
  const f = fluxo(c);
  const d = despesas(c);
  const renda = Math.max(0, f.renda);
  const somaParte = (parte: ParteModelo) => d.porCategoria.filter((x) => x.modelo === parte).reduce((t, x) => t + x.valor, 0);
  const atual: Record<string, number> = {
    Necessidades: somaParte("Necessidades"),
    Desejos: somaParte("Desejos"),
    Poupança: Math.max(0, f.sobra),
  };
  const partes = MODELO_50_30_20.map((m) => {
    const ideal = renda * m.meta;
    const valor = atual[m.id];
    // Necessidades e desejos: acima do ideal é ruim. Poupança: abaixo do ideal é ruim.
    const excesso = m.id === "Poupança" ? ideal - valor : valor - ideal;
    return { ...m, atual: valor, pct: renda > 0 ? valor / renda : 0, ideal, diferenca: valor - ideal, foraDoModelo: excesso > 0.5 };
  });
  return {
    renda,
    despesas: f.despesas,
    sobra: f.sobra,
    /** Déficit (despesas acima da renda), quando houver. */
    deficit: Math.max(0, -f.sobra),
    partes,
    categorias: d.porCategoria.filter((x) => x.valor > 0).sort((a, b) => b.valor - a.valor),
    dentroDoModelo: renda > 0 && partes.every((p) => !p.foraDoModelo),
    /** Despesas atuais por natureza (fixas sem parcelas, variáveis, financiamentos, dívidas) + aportes em projetos. */
    despesasAtuais: (() => {
      const dv = dividas(c);
      const linhas = [
        { id: "fixas", nome: "Despesas fixas", valor: Math.max(0, d.fixas - d.parcelas) },
        { id: "variaveis", nome: "Despesas variáveis", valor: d.variaveis },
        { id: "financiamentos", nome: "Financiamentos e consórcios (parcelas)", valor: dv.parcelasFin + dv.parcelasCons },
        { id: "dividas", nome: "Dívidas (parcelas)", valor: dv.parcelasEmp },
        { id: "projetos", nome: "Aportes em projetos", valor: f.aportesProjetos },
      ];
      const total = linhas.reduce((t, x) => t + x.valor, 0);
      return { linhas, total, sobraLivre: f.renda - total };
    })(),
    aportesProjetos: f.aportesProjetos,
    sobraLivre: f.sobraLivre,
    /** Quanto o cliente diz que consegue poupar por mês (12 · Futuro), quando informado. */
    poupancaDeclarada: {
      minima: nOpt(c.futuro.poupancaMinima),
      maxima: nOpt(c.futuro.poupancaMaxima),
    },
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
  // Falta arredondada: frações de centavos não geram "faltam R$ 0".
  return { atual, meta, falta: Math.max(0, Math.round(meta - atual)), meses: custo > 0 ? atual / custo : 0, mesesMeta: mesesReserva };
}

// ---------------------------------------------------------------------
//  Objetivos (valor futuro em R$ nominais, rendendo o retorno nominal)
// ---------------------------------------------------------------------
const ORDEM_TIPO: Record<string, number> = { Essencial: 0, Desejo: 1, Sonho: 2 };
const ORDEM_PRIORIDADE: Record<string, number> = { Alta: 0, Média: 1, Baixa: 2 };

export function objetivo(c: Cliente, o: Item) {
  const { nominal } = parametros(c.parametros);
  const meses = Math.max(0, n(o.prazoMeses));
  // Sem prazo não há aporte mensal a calcular (não soma no total dos objetivos).
  const semPrazo = meses <= 0 && n(o.valorFuturo) > 0;
  return { meses, semPrazo, aporte: meses > 0 ? aporteNecessario(n(o.valorFuturo), 0, taxaMensal(nominal), meses) : 0 };
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
    /** Objetivos com valor e sem prazo (o aporte não é calculado). */
    semPrazo: c.objetivos.filter((o) => objetivo(c, o).semPrazo).length,
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

/**
 * Soma do custo anual por `anos` anos a partir do ano `inicio`, com o custo subindo
 * `g` ao ano acima da inflação (valores de hoje). Com g = 0: anual × anos.
 */
const custoCrescente = (anual: number, inicio: number, anos: number, g: number) => {
  let total = 0;
  for (let t = inicio; t < inicio + anos; t++) total += anual * Math.pow(1 + g, t);
  return total;
};

export function educacional(c: Cliente) {
  const pr = c.protecao;
  const mensalidadeFac = nOpt(pr.mensalidadeFaculdade) ?? 3000;
  const duracao = nOpt(pr.duracaoFaculdade) ?? 5;
  // Escola e faculdade sobem pela inflação educacional (acima da geral).
  const g = parametros(c.parametros).premioEducacional;
  const lista = c.dependentes.filter(ehEscolar).map((d) => {
    const nivel = s(d.nivelEscola);
    const anosEscola = ANOS_ESCOLA_RESTANTES[nivel] ?? 0;
    const escola = custoCrescente(mensalidadeDependente(d) * 12, 0, anosEscola, g);
    let faculdade = 0;
    if (ANTES_DA_FACULDADE.includes(nivel)) faculdade = custoCrescente(mensalidadeFac * 12, anosEscola, duracao, g);
    else if (nivel === "Graduação") faculdade = custoCrescente(mensalidadeDependente(d) * 12, 0, Math.ceil(duracao / 2), g);
    // Mensalidade atual que este componente substitui (sai do padrão de vida).
    const mensalidadeCoberta = ANTES_DA_FACULDADE.includes(nivel) || nivel === "Graduação" ? mensalidadeDependente(d) : 0;
    return { item: d, anosEscola, escola, faculdade, total: escola + faculdade, mensalidadeCoberta };
  });
  return { lista, total: lista.reduce((t, x) => t + x.total, 0), mensalidadesCobertas: lista.reduce((t, x) => t + x.mensalidadeCoberta, 0) };
}

export function protecao(c: Cliente) {
  const pr = c.protecao;
  const d = despesas(c);
  const p = patrimonio(c);
  const ed = educacional(c);
  const horizonte = HORIZONTES_PADRAO_VIDA.includes(n(pr.horizonte)) ? n(pr.horizonte) : 5;
  // Mensalidades de escola e graduação já entram no componente educacional.
  const custoMensal = Math.max(0, d.custoVida - ed.mensalidadesCobertas);
  const padraoVida = Object.fromEntries(HORIZONTES_PADRAO_VIDA.map((a) => [a, custoMensal * 12 * a])) as Record<number, number>;
  const quitados =
    soma(c.imoveis.filter(bemQuitado), (b) => n(b.valor)) +
    soma(c.moveis.filter(bemQuitado), (b) => n(b.valor)) +
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
    // Arredondado: digitar o capital exibido (sem centavos) zera o gap.
    gap: Math.max(0, Math.round(necessario - atual)),
    // Sem capital a contratar (recursos cobrem a necessidade), a família está coberta.
    cobertura: necessario > 0 ? Math.min(1, atual / necessario) : 1,
  };
}

// ---------------------------------------------------------------------
//  Mudanças de vida programadas (12 · Futuro)
// ---------------------------------------------------------------------
/** Mês/ano daqui a `meses` meses (ex.: "mar. de 2027"). */
export const mesFuturo = (meses: number, hoje = new Date()) =>
  new Date(hoje.getFullYear(), hoje.getMonth() + Math.max(0, Math.round(meses)), 1).toLocaleDateString("pt-BR", { month: "short", year: "numeric" });

/** Mudanças informadas (só com "Tem alguma mudança de vida programada?" = Sim), em ordem de data. */
export function mudancasVida(c: Cliente) {
  if (!sim(c.futuro.temMudanca)) return [];
  return c.mudancas
    .filter((m) => !!s(m.descricao) || n(m.valor) > 0)
    .map((m) => {
      const impacto = s(m.impacto);
      const valor = n(m.valor);
      const meses = Math.max(0, n(m.meses));
      return {
        item: m,
        descricao: s(m.descricao) || "Mudança",
        impacto,
        valor,
        meses,
        temData: nOpt(m.meses) !== undefined,
        quando: mesFuturo(meses),
        /** Efeito mensal na sobra (negativo = aperta o orçamento); gasto único não entra aqui. */
        efeitoMensal: impacto === "Aumenta despesas" || impacto === "Reduz renda" ? -valor : impacto === "Reduz despesas" || impacto === "Aumenta renda" ? valor : 0,
      };
    })
    .sort((a, b) => a.meses - b.meses);
}

// ---------------------------------------------------------------------
//  Futuro — independência financeira (valores reais, R$ de hoje)
// ---------------------------------------------------------------------
export const TAXA_RETIRADA = 0.04; // regra dos 4% → patrimônio = 25× a renda anual

/** Valores da simulação do 6.5 (sliders); em branco, valem os dados do cliente. */
export interface SimulacaoFuturo {
  aporte?: number;
  /** Retorno real ao ano (0,04 = 4%). */
  retornoReal?: number;
  idadeAposentadoria?: number;
  rendaDesejada?: number;
}

/** Marcos do plano de independência (patrimônio e renda passiva daqui a N anos). */
export const MARCOS_INDEPENDENCIA = [1, 5, 10];

/** Idade final da projeção de usufruto (fase em que o patrimônio paga a renda). */
export const IDADE_FINAL_PROJECAO = 95;

export function futuro(c: Cliente, simulacao?: SimulacaoFuturo) {
  const fu = c.futuro;
  const f = fluxo(c);
  const d = despesas(c);
  const p = patrimonio(c);
  const retornoReal = simulacao?.retornoReal ?? parametros(c.parametros).retornoReal;
  const idadeAtual = idadePorNascimento(s(c.cadastro.nascimento)) ?? 0;
  const idadeAposentadoria = simulacao?.idadeAposentadoria ?? (n(fu.idadeAposentadoria) || 60);
  const anos = Math.max(0, idadeAposentadoria - idadeAtual);
  const estilo = ESTILOS_VIDA.find((e) => e.id === s(fu.estiloVida));
  const rendaDesejadaAuto = d.custoVida * (estilo?.fator ?? 1);
  const rendaDesejada = simulacao?.rendaDesejada ?? nOpt(fu.rendaDesejada) ?? rendaDesejadaAuto;
  // Juros e dividendos ficam de fora: o capital que os gera já está em "atual".
  const outrasAuto = renda(c).futura;
  const outras = nOpt(fu.outrasRendas) ?? outrasAuto;
  const alvo = (Math.max(0, rendaDesejada - outras) * 12) / TAXA_RETIRADA;
  // A reserva de emergência não entra: ela existe para imprevistos.
  const atual = p.investimentos + p.previdencia;
  // Investimento mensal informado (12 · Futuro); em branco, a sobra livre do mês (depois dos aportes em projetos).
  const investimentoInformado = nOpt(fu.investimentoMensal);
  const aporteAtual = Math.max(0, simulacao?.aporte ?? investimentoInformado ?? f.sobraLivre);
  const i = taxaMensal(retornoReal);
  const meses = anos * 12;
  const projetado = valorFuturo(atual, aporteAtual, i, meses);
  /** Idade de aposentadoria já atingida (ou menor que a idade atual). */
  const idadeAtingida = idadeAtual > 0 && idadeAposentadoria <= idadeAtual;
  // Sem prazo para aportar não existe "aporte mensal": o que falta é um valor único.
  const aporte = idadeAtingida ? 0 : aporteNecessario(alvo, atual, i, meses);
  const anoBase = new Date().getFullYear();
  // Vida inteira: acumula até a aposentadoria e depois retira a renda que falta (desejada − outras rendas).
  const retiradaMensal = Math.max(0, rendaDesejada - outras);
  const idadeFinal = Math.max(IDADE_FINAL_PROJECAO, idadeAposentadoria + 5);
  const vida: { ano: number; idade: number; patrimonio: number; aportado: number; retirado: number; meta: number }[] = [];
  let saldo = atual;
  let aportado = atual;
  let retirado = 0;
  let esgotaAos: number | undefined;
  // Vai até a idade final ou, no mínimo, 10 anos (marcos do plano de independência).
  for (let k = 0; idadeAtual + k <= idadeFinal || k <= 10; k++) {
    vida.push({ ano: anoBase + k, idade: idadeAtual + k, patrimonio: Math.round(Math.max(0, saldo)), aportado, retirado: Math.round(retirado), meta: Math.round(alvo) });
    for (let m = 0; m < 12; m++) {
      const aposentado = idadeAtual + k >= idadeAposentadoria;
      saldo = saldo * (1 + i) + (aposentado ? -retiradaMensal : aporteAtual);
      if (!aposentado) aportado += aporteAtual;
      else if (saldo > 0) retirado += retiradaMensal;
      if (saldo <= 0 && aposentado && esgotaAos === undefined) esgotaAos = idadeAtual + k;
    }
    if (saldo <= 0 && esgotaAos !== undefined) saldo = 0;
  }
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
    /** O aporte atual veio do campo "Investimento mensal" (e não da sobra). */
    aporteInformado: investimentoInformado !== undefined,
    projetado,
    aporte,
    idadeAtingida,
    faltaHoje: Math.max(0, alvo - atual),
    // Se as outras rendas já cobrem a renda desejada, a independência está atingida.
    // Sem patrimônio a formar (outras rendas cobrem a renda desejada), a meta está atingida.
    independencia: alvo > 0 ? projetado / alvo : 1,
    rendaProjetada: (projetado * TAXA_RETIRADA) / 12 + outras,
    /** Retorno real usado (pode vir da simulação). */
    retornoReal,
    /**
     * Plano de independência em 1, 5 e 10 anos: patrimônio, % da meta e renda passiva (4%).
     * Mesma trajetória do gráfico: depois da aposentadoria, os aportes param e a renda é retirada.
     */
    marcos: MARCOS_INDEPENDENCIA.map((anosAte) => {
      const ponto = vida[anosAte];
      const patrimonioMarco = ponto.patrimonio;
      return {
        anos: anosAte,
        idade: idadeAtual > 0 ? idadeAtual + anosAte : undefined,
        patrimonio: patrimonioMarco,
        aportado: ponto.aportado,
        percentualMeta: alvo > 0 ? patrimonioMarco / alvo : 1,
        retirado: ponto.retirado,
        rendaPassiva: (patrimonioMarco * TAXA_RETIRADA) / 12 + outras,
      };
    }),
    /** Renda mensal que o patrimônio precisa pagar na aposentadoria (desejada − outras rendas). */
    retiradaMensal,
    /** Projeção ano a ano até os 95 anos: acumula até a aposentadoria e depois paga a renda. */
    vida,
    /** Idade em que o patrimônio acaba (undefined = dura até o fim da projeção). */
    esgotaAos,
    serie: Array.from({ length: anos + 1 }, (_, k) => ({
      ano: anoBase + k,
      idade: idadeAtual + k,
      atual: Math.round(valorFuturo(atual, aporteAtual, i, k * 12)),
      necessaria: Math.round(valorFuturo(atual, aporte, i, k * 12)),
    })),
  };
}
