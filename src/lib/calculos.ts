// =====================================================================
//  METODOLOGIA DE CÁLCULO
//  ---------------------------------------------------------------------
//  Todas as fórmulas do diagnóstico ficam aqui, em funções puras.
//  A explicação de cada uma está em docs/METODOLOGIA.md.
//  Convenção: taxas nos campos estão em % (ex.: 5 = 5%); aqui viram 0,05.
// =====================================================================

import type { Cliente, Item, Secao, Valor } from "@/types";

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
export const nOpt = (v: Valor): number | undefined =>
  v === undefined || v === null || v === "" ? undefined : n(v);
export const s = (v: Valor): string => (v === undefined || v === null ? "" : String(v));
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

/** Valor mensal equivalente (itens com frequência "Anual" são divididos por 12). */
export const mensal = (i: Item) => (s(i.frequencia) === "Anual" ? n(i.valor) / 12 : n(i.valor));

// ---------------------------------------------------------------------
//  Parâmetros do cliente
// ---------------------------------------------------------------------
export const parametros = (p: Secao) => ({
  inflacao: pct(p.inflacaoGeral),
  inflacaoEdu: pct(p.inflacaoEducacional),
  retornoReal: pct(p.retornoReal),
  mesesReserva: n(p.mesesReserva) || 6,
  limite: pct(p.limiteComprometimento) || 0.3,
});

// ---------------------------------------------------------------------
//  Fluxo de caixa
// ---------------------------------------------------------------------
export const PATRIMONIO_FINANCEIRO = ["Reserva / Caixa", "Renda fixa", "Renda variável", "Previdência"];
export const PATRIMONIO_APOSENTADORIA = ["Renda fixa", "Renda variável", "Previdência"];
export const LIQUIDEZ_RESERVA = ["Diária", "Até 30 dias"];

export const parcelaDivida = (d: Item) => pmt(n(d.saldo), taxaMensal(pct(d.taxa)), n(d.prazo));

export function fluxo(c: Cliente) {
  const renda = soma(c.receitas, mensal);
  const rendaPassiva = soma(
    c.receitas.filter((r) => s(r.tipo).startsWith("Passiva")),
    mensal,
  );
  const despesas = soma(c.despesas, mensal);
  const parcelas = soma(c.dividas, parcelaDivida);
  const sobra = renda - despesas - parcelas;
  const despesasPorTipo = c.despesas.reduce<Record<string, number>>((acc, d) => {
    const t = s(d.tipo) || "Outros";
    acc[t] = (acc[t] || 0) + mensal(d);
    return acc;
  }, {});
  return {
    renda,
    rendaPassiva,
    despesas,
    parcelas,
    sobra,
    taxaPoupanca: renda > 0 ? sobra / renda : 0,
    comprometimento: renda > 0 ? parcelas / renda : 0,
    despesasPorTipo,
  };
}

// ---------------------------------------------------------------------
//  Patrimônio e dívidas
// ---------------------------------------------------------------------
export function patrimonio(c: Cliente) {
  const total = soma(c.patrimonio, (i) => n(i.valor));
  const financeiro = soma(
    c.patrimonio.filter((i) => PATRIMONIO_FINANCEIRO.includes(s(i.tipo))),
    (i) => n(i.valor),
  );
  const reserva = soma(
    c.patrimonio.filter(
      (i) => PATRIMONIO_FINANCEIRO.includes(s(i.tipo)) && LIQUIDEZ_RESERVA.includes(s(i.liquidez)),
    ),
    (i) => n(i.valor),
  );
  const paraAposentadoria = soma(
    c.patrimonio.filter((i) => PATRIMONIO_APOSENTADORIA.includes(s(i.tipo))),
    (i) => n(i.valor),
  );
  const dividas = soma(c.dividas, (d) => n(d.saldo));
  const porTipo = c.patrimonio.reduce<Record<string, number>>((acc, i) => {
    const t = s(i.tipo) || "Outros";
    acc[t] = (acc[t] || 0) + n(i.valor);
    return acc;
  }, {});
  return { total, financeiro, reserva, paraAposentadoria, dividas, liquido: total - dividas, porTipo };
}

export function reservaEmergencia(c: Cliente) {
  const { mesesReserva } = parametros(c.parametros);
  const f = fluxo(c);
  const custoMensal = f.despesas + f.parcelas;
  const atual = patrimonio(c).reserva;
  const meta = custoMensal * mesesReserva;
  return {
    atual,
    meta,
    falta: Math.max(0, meta - atual),
    meses: custoMensal > 0 ? atual / custoMensal : 0,
    mesesMeta: mesesReserva,
  };
}

/** Dívidas consideradas caras: cartão ou taxa acima de 30% a.a. */
export const dividaCara = (d: Item) => s(d.tipo) === "Cartão" || n(d.taxa) >= 30;

// ---------------------------------------------------------------------
//  Sonhos (valores em R$ de hoje, com retorno real)
// ---------------------------------------------------------------------
export function sonho(c: Cliente, i: Item) {
  const { retornoReal } = parametros(c.parametros);
  const meses = Math.max(0, n(i.prazo) * 12);
  const aporte = aporteNecessario(n(i.valor), n(i.acumulado), taxaMensal(retornoReal), meses);
  return { meses, aporte, falta: Math.max(0, n(i.valor) - n(i.acumulado)) };
}

export function sonhos(c: Cliente) {
  const lista = c.sonhos.map((i) => ({ item: i, ...sonho(c, i) }));
  return { lista, aporteTotal: lista.reduce((t, x) => t + x.aporte, 0), valorTotal: soma(c.sonhos, (i) => n(i.valor)) };
}

// ---------------------------------------------------------------------
//  Educação dos filhos
//  Custo da faculdade cresce pela inflação educacional; o dinheiro rende
//  inflação geral + retorno real. Resultado em R$ nominais.
// ---------------------------------------------------------------------
export function educacao(c: Cliente, f: Item) {
  const { inflacao, inflacaoEdu, retornoReal } = parametros(c.parametros);
  const semFaculdade = s(f.faculdade) === "Não planejado" || n(f.mensalidadeFaculdade) <= 0;
  const anosAte = Math.max(0, n(f.idadeIngresso || 18) - n(f.idade));
  const custoHoje = semFaculdade ? 0 : n(f.mensalidadeFaculdade) * 12 * n(f.duracaoFaculdade || 5);
  const custoFuturo = custoHoje * Math.pow(1 + inflacaoEdu, anosAte);
  const nominal = (1 + inflacao) * (1 + retornoReal) - 1;
  const aporte = aporteNecessario(custoFuturo, 0, taxaMensal(nominal), anosAte * 12);
  const valorPresente = custoFuturo / Math.pow(1 + nominal, anosAte);
  return { anosAte, custoHoje, custoFuturo, aporte, valorPresente };
}

export function educacaoTotal(c: Cliente) {
  const lista = c.filhos.map((f) => ({ item: f, ...educacao(c, f) }));
  return {
    lista,
    aporteTotal: lista.reduce((t, x) => t + x.aporte, 0),
    valorPresenteTotal: lista.reduce((t, x) => t + x.valorPresente, 0),
    custoFuturoTotal: lista.reduce((t, x) => t + x.custoFuturo, 0),
  };
}

// ---------------------------------------------------------------------
//  Seguro de vida — necessidade de capital
// ---------------------------------------------------------------------
export function seguroVida(c: Cliente) {
  const sg = c.seguro;
  const f = fluxo(c);
  const p = patrimonio(c);
  const anos = n(sg.anosProtecao) || 5;
  const manutencao = Math.max(0, f.despesas - f.rendaPassiva) * 12 * anos;
  const dividas = s(sg.quitarDividas) !== "Não" ? p.dividas : 0;
  const educacaoFilhos = s(sg.incluirEducacao) !== "Não" ? educacaoTotal(c).valorPresenteTotal : 0;
  const inventario = p.total * pct(sg.custoInventario);
  const necessidadeBruta = manutencao + dividas + educacaoFilhos + inventario;
  const recursos = p.financeiro;
  const necessario = Math.max(0, necessidadeBruta - recursos);
  const atual = n(sg.capitalAtual) + (s(sg.contarSeguroEmpresa) === "Sim" ? n(sg.capitalEmpresa) : 0);
  return {
    componentes: { manutencao, dividas, educacaoFilhos, inventario },
    necessidadeBruta,
    recursos,
    necessario,
    atual,
    gap: Math.max(0, necessario - atual),
    cobertura: necessario > 0 ? Math.min(1, atual / necessario) : 1,
  };
}

// ---------------------------------------------------------------------
//  Aposentadoria / independência financeira (valores reais, R$ de hoje)
// ---------------------------------------------------------------------
export function aposentadoria(c: Cliente) {
  const a = c.aposentadoria;
  const f = fluxo(c);
  const idadeAuto = idadePorNascimento(s(c.cadastro.nascimento));
  const idadeAtual = nOpt(a.idadeAtual) ?? idadeAuto ?? 0;
  const idadeAlvo = n(a.idadeAlvo);
  const anos = Math.max(0, idadeAlvo - idadeAtual);
  const despesasAnuaisAuto = f.despesas * 12;
  const despesasAnuais = nOpt(a.despesasAnuais) ?? despesasAnuaisAuto;
  const rendaAlvo = nOpt(a.rendaPassivaAlvo) ?? despesasAnuais / 12;
  const rendaPassivaAtual = n(a.rendaPassivaAtual);
  const taxaRetirada = pct(a.taxaRetirada) || 0.04;
  const multiplicador = 1 / taxaRetirada;
  const alvo = Math.max(0, rendaAlvo - rendaPassivaAtual) * 12 * multiplicador;
  const patrimonioAuto = patrimonio(c).paraAposentadoria;
  const atual = nOpt(a.patrimonioDestinado) ?? patrimonioAuto;
  const i = taxaMensal(pct(a.retornoReal));
  const meses = anos * 12;
  const aporte = aporteNecessario(alvo, atual, i, meses);
  const aporteAtual = n(a.aporteAtual);
  const projetadoAtual = valorFuturo(atual, aporteAtual, i, meses);

  const anoBase = new Date().getFullYear();
  const serie = Array.from({ length: anos + 1 }, (_, k) => ({
    ano: anoBase + k,
    idade: idadeAtual + k,
    atual: Math.round(valorFuturo(atual, aporteAtual, i, k * 12)),
    necessaria: Math.round(valorFuturo(atual, aporte, i, k * 12)),
  }));

  return {
    idadeAtual,
    idadeAuto,
    idadeAlvo,
    anos,
    despesasAnuais,
    despesasAnuaisAuto,
    rendaAlvo,
    multiplicador,
    alvo,
    atual,
    patrimonioAuto,
    gap: Math.max(0, alvo - atual),
    progresso: alvo > 0 ? Math.min(1, atual / alvo) : 0,
    aporte,
    aporteAtual,
    projetadoAtual,
    rendaProjetada: (projetadoAtual * taxaRetirada) / 12 + rendaPassivaAtual,
    serie,
  };
}

// ---------------------------------------------------------------------
//  Alavancagem patrimonial: financiamento x consórcio x poupar
//  Comparação justa: as três estratégias usam o MESMO orçamento mensal
//  (a parcela do financiamento) durante o prazo.
// ---------------------------------------------------------------------
export function alavancagem(c: Cliente) {
  const a = c.alavancagem;
  const valor = n(a.valorBem);
  const anos = Math.max(0, n(a.prazoAnos));
  const meses = anos * 12;
  const iFin = taxaMensal(pct(a.taxaFinanciamento));
  const iInv = taxaMensal(pct(a.retornoInvestido));
  const valorizacao = pct(a.valorizacaoBem);

  const parcelaFin = pmt(valor, iFin, meses);
  const totalFin = parcelaFin * meses;
  const totalCons = valor * (1 + pct(a.taxaConsorcio) + pct(a.fundoReserva));
  const parcelaCons = meses > 0 ? totalCons / meses : 0;
  const bemFinal = valor * Math.pow(1 + valorizacao, anos);

  const orcamento = Math.max(parcelaFin, parcelaCons);
  const patrimonioFin = bemFinal + valorFuturo(0, orcamento - parcelaFin, iInv, meses);
  const patrimonioCons = bemFinal + valorFuturo(0, orcamento - parcelaCons, iInv, meses);
  const poupado = valorFuturo(0, orcamento, iInv, meses);

  const f = fluxo(c);
  const { limite } = parametros(c.parametros);
  const capacidade = Math.max(0, f.renda * limite - f.parcelas);

  return {
    valor,
    anos,
    meses,
    parcelaFin,
    totalFin,
    parcelaCons,
    totalCons,
    economia: totalFin - totalCons,
    bemFinal,
    poupado,
    poupadoCompra: poupado >= bemFinal,
    capacidade,
    parcelaSaudavel: f.renda > 0 ? parcelaCons <= capacidade : undefined,
    comparativo: [
      { nome: "Poupar e comprar à vista", valor: poupado, uso: poupado >= bemFinal ? `Ao final de ${anos} anos` : "Saldo insuficiente no prazo" },
      { nome: "Financiamento bancário", valor: patrimonioFin, uso: "Imediato" },
      { nome: "Consórcio + investido", valor: patrimonioCons, uso: "Na contemplação (sorteio ou lance)" },
    ],
  };
}
