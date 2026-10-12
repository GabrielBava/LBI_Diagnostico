// =====================================================================
//  METODOLOGIA DE CÁLCULO
//  ---------------------------------------------------------------------
//  Todas as fórmulas do diagnóstico ficam aqui, em funções puras.
//  A explicação de cada uma está em docs/METODOLOGIA.md.
//  Convenção: taxas nos campos estão em % (ex.: 5 = 5%); aqui viram 0,05.
// =====================================================================

import type { Cliente, Item, Secao, Valor } from "@/types";
import { CATEGORIAS_DESPESA, OPCOES } from "@/config/campos";

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
export const s = (v: Valor): string => (v === undefined || v === null ? "" : String(v));
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
export const custoDependente = (d: Item) => n(d.mensalidade) + n(d.auxilio);

export function sucessao(c: Cliente) {
  const filhos = c.dependentes.filter((d) => s(d.categoria) === "Filho(a)" || s(d.categoria) === "Enteado(a)");
  return {
    filhos: filhos.length,
    dependentes: c.dependentes.length,
    custoMensal: soma(c.dependentes, custoDependente),
    mensalidades: soma(c.dependentes, (d) => n(d.mensalidade)),
    auxilios: soma(c.dependentes, (d) => n(d.auxilio)),
  };
}

// ---------------------------------------------------------------------
//  Financiamentos e dívidas
// ---------------------------------------------------------------------
export function dividas(c: Cliente) {
  const parcelasFin = soma(c.financiamentos, (f) => n(f.parcela));
  const parcelasCons = soma(c.consorcios, (f) => n(f.parcela));
  const parcelasEmp = soma(c.emprestimos, (f) => n(f.parcela));
  const saldoFin = soma(c.financiamentos, (f) => n(f.saldo) || n(f.parcela) * n(f.prazo));
  // Empréstimos não informam saldo: estimado por parcela × prazo restante (teto, inclui juros).
  const saldoEmp = soma(c.emprestimos, (f) => n(f.parcela) * n(f.prazo));
  const creditoConsorcio = soma(c.consorcios, (f) => n(f.credito));
  return {
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

export function renda(c: Cliente) {
  const principal = n(c.renda.renda);
  const conjuge = temConjuge(c) ? n(c.renda.rendaConjuge) : 0;
  const outras = soma(c.outrasRendas, mensal);
  const passiva = soma(
    c.outrasRendas.filter((r) => RENDA_PASSIVA.includes(s(r.tipo))),
    mensal,
  );
  return { principal, conjuge, outras, passiva, total: principal + conjuge + outras };
}

export function despesas(c: Cliente) {
  const dv = dividas(c);
  const dep = sucessao(c);
  const porCategoria: { id: string; label: string; bloco: "Fixa" | "Variável"; valor: number; automatico?: boolean }[] = [];

  CATEGORIAS_DESPESA.forEach((cat) => {
    let valor = n(c.despesas[cat.id]);
    let automatico = false;
    // Parcelas informadas em "Financiamentos e dívidas" substituem o valor manual.
    if (cat.id === "financiamentos" && dv.parcelas > 0) {
      valor = dv.parcelas;
      automatico = true;
    }
    porCategoria.push({ id: cat.id, label: cat.label, bloco: cat.bloco, valor, automatico });
  });
  if (dep.custoMensal > 0)
    porCategoria.push({ id: "dependentes", label: "Dependentes (Sucessão)", bloco: "Fixa", valor: dep.custoMensal, automatico: true });
  c.despesasExtras.forEach((e) =>
    porCategoria.push({
      id: e.id,
      label: s(e.descricao) || "Outra despesa",
      bloco: s(e.bloco) === "Variável" ? "Variável" : "Fixa",
      valor: n(e.valor),
    }),
  );

  const fixas = porCategoria.filter((x) => x.bloco === "Fixa").reduce((t, x) => t + x.valor, 0);
  const variaveis = porCategoria.filter((x) => x.bloco === "Variável").reduce((t, x) => t + x.valor, 0);
  const parcelas = porCategoria.find((x) => x.id === "financiamentos")?.valor ?? 0;
  return {
    porCategoria,
    fixas,
    variaveis,
    total: fixas + variaveis,
    parcelas,
    /** Custo de vida sem parcelas (usado no seguro de vida). */
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
  const previdencia = sim(c.protecao.temPrevidencia) ? n(c.protecao.valorPrevidencia) : 0;
  const empresa = sim(c.corporativo.possuiEmpresa) ? n(c.corporativo.valorParticipacao) : 0;
  const dv = dividas(c);
  const ativos = imoveis + moveis + investimentos + previdencia + empresa;
  return {
    imoveis,
    moveis,
    investimentos,
    previdencia,
    empresa,
    financeiro: investimentos + previdencia,
    ativos,
    passivos: dv.passivos,
    liquido: ativos - dv.passivos,
    reserva: sim(c.investimentos.temInvestimento) ? Math.min(n(c.investimentos.liquidez), investimentos || Infinity) : 0,
    linhasAtivo: [
      { nome: "Imóveis", valor: imoveis },
      { nome: "Móveis (veículos e embarcações)", valor: moveis },
      { nome: "Investimentos", valor: investimentos },
      { nome: "Previdência privada", valor: previdencia },
      { nome: "Participação em empresa", valor: empresa },
    ],
    linhasPassivo: [
      { nome: "Financiamentos (saldo)", valor: dv.saldoFin },
      { nome: "Empréstimos e dívidas (parcelas a pagar)", valor: dv.saldoEmp },
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
//  Proteção — capital de seguro de vida necessário
// ---------------------------------------------------------------------
export function protecao(c: Cliente) {
  const pr = c.protecao;
  const d = despesas(c);
  const r = renda(c);
  const p = patrimonio(c);
  const anos = n(pr.anosProtecao) || 5;
  // A renda do cônjuge e a renda passiva continuam se o cliente faltar.
  const manutencao = Math.max(0, d.custoVida - r.passiva - r.conjuge) * 12 * anos;
  const quitacao = p.passivos;
  const inventario = p.ativos * pct(pr.custoInventario);
  const necessidade = manutencao + quitacao + inventario;
  const necessario = Math.max(0, necessidade - p.financeiro);
  const atual = sim(pr.temSeguroVida) ? n(pr.capitalAtual) : 0;
  return {
    componentes: { manutencao, quitacao, inventario },
    anos,
    necessidade,
    recursos: p.financeiro,
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
  const rendaDesejadaAuto = d.custoVida;
  const rendaDesejada = nOpt(fu.rendaDesejada) ?? rendaDesejadaAuto;
  const outrasAuto = f.rendaPassiva;
  const outras = nOpt(fu.outrasRendas) ?? outrasAuto;
  const alvo = (Math.max(0, rendaDesejada - outras) * 12) / TAXA_RETIRADA;
  const atual = p.financeiro;
  const aporteAtual = Math.max(0, f.sobra);
  const i = taxaMensal(retornoReal);
  const meses = anos * 12;
  const projetado = valorFuturo(atual, aporteAtual, i, meses);
  const aporte = aporteNecessario(alvo, atual, i, meses);
  const anoBase = new Date().getFullYear();
  return {
    idadeAtual,
    idadeAposentadoria,
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
