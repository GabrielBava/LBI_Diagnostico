// =====================================================================
//  ESTIMATIVA DE RENDA BRUTA ↔ LÍQUIDA (assalariado CLT)
//  ---------------------------------------------------------------------
//  Usada só quando o cliente sabe apenas um dos dois valores.
//  Referências (atualize aqui quando as tabelas mudarem):
//   • INSS empregado — tabela progressiva 2025
//   • IRRF mensal — tabela vigente desde maio/2025, com desconto simplificado
//   • Redutor do IR a partir de 2026 (Lei 15.270/2025): isenção até
//     R$ 5.000 e redução parcial até R$ 7.350
//  Pró-labore, autônomos e PJ têm regras próprias: trate como estimativa.
// =====================================================================

const INSS: { ate: number; aliquota: number }[] = [
  { ate: 1518.0, aliquota: 0.075 },
  { ate: 2793.88, aliquota: 0.09 },
  { ate: 4190.83, aliquota: 0.12 },
  { ate: 8157.41, aliquota: 0.14 },
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
