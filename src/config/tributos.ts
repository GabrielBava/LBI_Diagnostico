// =====================================================================
//  ESTIMATIVA DE RENDA BRUTA ↔ LÍQUIDA (CLT ou PJ)
//  ---------------------------------------------------------------------
//  Usada só quando o cliente sabe apenas um dos dois valores. Mesmas regras
//  da calculadora CLT x PJ da Contabilizei (atualizada em 09/12/2025):
//   • CLT: bruta − INSS − IRRF (a dedução mais vantajosa e o redutor de 2026).
//   • PJ: bruta − Simples Nacional (Anexo III, faturamento anual = bruta × 12,
//     sem Fator R) − INSS de 11% sobre o pró-labore de um salário mínimo.
//  Referências (atualize aqui quando as tabelas mudarem):
//   • INSS empregado — tabela progressiva 2026 (Portaria Interministerial MPS/MF nº 13/2026)
//   • IRRF mensal — tabela vigente desde maio/2025, com desconto simplificado
//   • Redutor do IR a partir de 2026 (Lei 15.270/2025): isenção até
//     R$ 5.000 e redução parcial até R$ 7.350
//  Pró-labore, autônomos e PJ têm regras próprias: trate como estimativa.
// =====================================================================

const INSS: { ate: number; aliquota: number }[] = [
  { ate: 1621.0, aliquota: 0.075 },
  { ate: 2902.84, aliquota: 0.09 },
  { ate: 4354.27, aliquota: 0.12 },
  { ate: 8475.55, aliquota: 0.14 },
];

const IRRF: { ate: number; aliquota: number; deducao: number }[] = [
  { ate: 2428.8, aliquota: 0, deducao: 0 },
  { ate: 2826.65, aliquota: 0.075, deducao: 182.16 },
  { ate: 3751.05, aliquota: 0.15, deducao: 394.16 },
  { ate: 4664.68, aliquota: 0.225, deducao: 675.49 },
  { ate: Infinity, aliquota: 0.275, deducao: 908.73 },
];

const DESCONTO_SIMPLIFICADO = 607.2;
const REDUTOR = { isencaoAte: 5000, reducaoMaxima: 312.89, parcialAte: 7350, constante: 978.62, fator: 0.133145 };

export function inss(bruto: number) {
  let total = 0;
  let anterior = 0;
  for (const f of INSS) {
    if (bruto <= anterior) break;
    total += (Math.min(bruto, f.ate) - anterior) * f.aliquota;
    anterior = f.ate;
  }
  return total;
}

function irTabela(base: number) {
  const f = IRRF.find((x) => base <= x.ate)!;
  return Math.max(0, base * f.aliquota - f.deducao);
}

export function irrf(bruto: number) {
  const contribuicao = inss(bruto);
  // Usa a dedução mais vantajosa: INSS ou desconto simplificado.
  const imposto = Math.min(irTabela(bruto - contribuicao), irTabela(bruto - DESCONTO_SIMPLIFICADO));
  let reducao = 0;
  if (bruto <= REDUTOR.isencaoAte) reducao = REDUTOR.reducaoMaxima;
  else if (bruto <= REDUTOR.parcialAte) reducao = REDUTOR.constante - REDUTOR.fator * bruto;
  return Math.max(0, imposto - reducao);
}

/** Renda líquida estimada a partir da bruta. */
export const liquidaDeBruta = (bruto: number) => (bruto > 0 ? bruto - inss(bruto) - irrf(bruto) : 0);

/** Renda bruta estimada a partir da líquida (busca binária sobre liquidaDeBruta). */
export function brutaDeLiquida(liquido: number) {
  if (liquido <= 0) return 0;
  let baixo = liquido;
  let alto = liquido * 2 + 2000;
  for (let i = 0; i < 60; i++) {
    const meio = (baixo + alto) / 2;
    if (liquidaDeBruta(meio) < liquido) baixo = meio;
    else alto = meio;
  }
  return Math.round(((baixo + alto) / 2) * 100) / 100;
}

// ---------------------------------------------------------------------
//  PJ (Simples Nacional, Anexo III)
// ---------------------------------------------------------------------
/** Salário mínimo vigente (2026): base do pró-labore simulado do PJ. */
export const SALARIO_MINIMO = 1621.0;
/** INSS do sócio sobre o pró-labore (contribuinte individual). */
const INSS_PRO_LABORE = 0.11;
/** Anexo III do Simples Nacional: faixas de receita bruta em 12 meses. */
const SIMPLES_ANEXO_III: { ate: number; aliquota: number; deducao: number }[] = [
  { ate: 180_000, aliquota: 0.06, deducao: 0 },
  { ate: 360_000, aliquota: 0.112, deducao: 9_360 },
  { ate: 720_000, aliquota: 0.135, deducao: 17_640 },
  { ate: 1_800_000, aliquota: 0.16, deducao: 35_640 },
  { ate: 3_600_000, aliquota: 0.21, deducao: 125_640 },
  { ate: 4_800_000, aliquota: 0.33, deducao: 648_000 },
];

/** Imposto mensal do Simples (Anexo III) sobre um faturamento mensal; acima de R$ 4,8 mi/ano usa a última faixa. */
export function simplesAnexoIII(faturamentoMensal: number) {
  if (faturamentoMensal <= 0) return 0;
  const anual = faturamentoMensal * 12;
  const f = SIMPLES_ANEXO_III.find((x) => anual <= x.ate) ?? SIMPLES_ANEXO_III[SIMPLES_ANEXO_III.length - 1];
  const efetiva = (anual * f.aliquota - f.deducao) / anual;
  return faturamentoMensal * efetiva;
}

/** Descontos mensais do PJ: Simples + INSS do pró-labore (o IR do pró-labore de um salário mínimo é zero). */
export const descontosPJ = (bruto: number) =>
  bruto > 0 ? simplesAnexoIII(bruto) + Math.min(bruto, SALARIO_MINIMO) * INSS_PRO_LABORE + irrf(Math.min(bruto, SALARIO_MINIMO)) : 0;

/** Renda líquida PJ estimada a partir do faturamento (bruta). */
export const liquidaDeBrutaPJ = (bruto: number) => (bruto > 0 ? bruto - descontosPJ(bruto) : 0);

/** Renda bruta PJ estimada a partir da líquida (busca binária). */
export function brutaDeLiquidaPJ(liquido: number) {
  if (liquido <= 0) return 0;
  let baixo = liquido;
  let alto = liquido * 2 + 2000;
  for (let i = 0; i < 60; i++) {
    const meio = (baixo + alto) / 2;
    if (liquidaDeBrutaPJ(meio) < liquido) baixo = meio;
    else alto = meio;
  }
  return Math.round(((baixo + alto) / 2) * 100) / 100;
}

