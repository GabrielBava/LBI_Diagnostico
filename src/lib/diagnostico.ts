// =====================================================================
//  DIAGNÓSTICO: notas por pilar e sugestões de ação
//  ---------------------------------------------------------------------
//  Cada pilar recebe nota de 0 a 100 e um status (ok / atenção / crítico).
//  As regras e faixas abaixo são a "régua" da metodologia — ajuste aqui.
// =====================================================================

import type { Cliente } from "@/types";
import { fmtBRL, fmtPct } from "./format";
import {
  alavancagem,
  aposentadoria,
  dividaCara,
  fluxo,
  n,
  parametros,
  patrimonio,
  reservaEmergencia,
  s,
  seguroVida,
  sonhos,
  educacaoTotal,
} from "./calculos";

export type Status = "ok" | "atencao" | "critico" | "sem-dados";

export interface Pilar {
  id: string;
  nome: string;
  nota: number;
  status: Status;
  resumo: string;
}

export interface Sugestao {
  id: string;
  pilar: string;
  prioridade: "Alta" | "Média" | "Baixa";
  titulo: string;
  detalhe: string;
}

const statusPorNota = (nota: number): Status => (nota >= 75 ? "ok" : nota >= 45 ? "atencao" : "critico");
const limitar = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

export function pilares(c: Cliente): Pilar[] {
  const f = fluxo(c);
  const r = reservaEmergencia(c);
  const sv = seguroVida(c);
  const ap = aposentadoria(c);
  const so = sonhos(c);
  const { limite } = parametros(c.parametros);
  const temCara = c.dividas.some(dividaCara);
  const out: Pilar[] = [];

  // 1. Fluxo de caixa — taxa de poupança (meta: 20% da renda)
  if (f.renda <= 0) out.push({ id: "fluxo", nome: "Fluxo de caixa", nota: 0, status: "sem-dados", resumo: "Informe as receitas." });
  else {
    const nota = limitar((f.taxaPoupanca / 0.2) * 100);
    out.push({
      id: "fluxo",
      nome: "Fluxo de caixa",
      nota,
      status: f.sobra < 0 ? "critico" : statusPorNota(nota),
      resumo: `Sobra de ${fmtBRL(f.sobra)}/mês (${fmtPct(f.taxaPoupanca)} da renda).`,
    });
  }

  // 2. Reserva de emergência — meses cobertos vs meta
  if (r.meta <= 0) out.push({ id: "reserva", nome: "Reserva de emergência", nota: 0, status: "sem-dados", resumo: "Informe as despesas." });
  else {
    const nota = limitar((r.meses / r.mesesMeta) * 100);
    out.push({
      id: "reserva",
      nome: "Reserva de emergência",
      nota,
      status: statusPorNota(nota),
      resumo: `${r.meses.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} de ${r.mesesMeta} meses cobertos.`,
    });
  }

  // 3. Dívidas — comprometimento da renda e dívidas caras
  if (c.dividas.length === 0)
    out.push({ id: "dividas", nome: "Dívidas", nota: 100, status: "ok", resumo: "Sem dívidas registradas." });
  else {
    const nota = temCara ? Math.min(40, limitar(100 - (f.comprometimento / limite) * 60)) : limitar(100 - (f.comprometimento / limite) * 60);
    out.push({
      id: "dividas",
      nome: "Dívidas",
      nota,
      status: temCara ? "critico" : f.comprometimento > limite ? "critico" : statusPorNota(nota),
      resumo: `${fmtPct(f.comprometimento)} da renda em parcelas${temCara ? " · há dívida cara" : ""}.`,
    });
  }

  // 4. Proteção — cobertura do seguro de vida
  if (sv.necessario <= 0 && sv.atual <= 0)
    out.push({ id: "protecao", nome: "Proteção", nota: 0, status: "sem-dados", resumo: "Complete a etapa Seguro de Vida." });
  else {
    const nota = limitar(sv.cobertura * 100);
    out.push({
      id: "protecao",
      nome: "Proteção",
      nota,
      status: statusPorNota(nota),
      resumo: sv.gap > 0 ? `Falta ${fmtBRL(sv.gap)} de capital segurado.` : "Família protegida.",
    });
  }

  // 5. Independência financeira — aporte atual vs necessário
  if (ap.alvo <= 0)
    out.push({ id: "aposentadoria", nome: "Independência financeira", nota: 0, status: "sem-dados", resumo: "Complete a etapa Aposentadoria." });
  else {
    const nota = ap.aporte <= 0 ? 100 : limitar((ap.aporteAtual / ap.aporte) * 100);
    out.push({
      id: "aposentadoria",
      nome: "Independência financeira",
      nota,
      status: statusPorNota(nota),
      resumo: `${fmtPct(ap.progresso)} do patrimônio alvo · aporte necessário ${fmtBRL(ap.aporte)}/mês.`,
    });
  }

  // 6. Sonhos — aporte necessário cabe na sobra?
  if (c.sonhos.length === 0)
    out.push({ id: "sonhos", nome: "Sonhos", nota: 0, status: "sem-dados", resumo: "Registre os sonhos do cliente." });
  else {
    const livre = Math.max(0, f.sobra - ap.aporteAtual);
    const nota = so.aporteTotal <= 0 ? 100 : limitar((livre / so.aporteTotal) * 100);
    out.push({
      id: "sonhos",
      nome: "Sonhos",
      nota,
      status: statusPorNota(nota),
      resumo: `Precisa de ${fmtBRL(so.aporteTotal)}/mês para ${c.sonhos.length} sonho(s).`,
    });
  }

  return out;
}

export function notaGeral(ps: Pilar[]) {
  const validos = ps.filter((p) => p.status !== "sem-dados");
  if (!validos.length) return 0;
  return Math.round(validos.reduce((t, p) => t + p.nota, 0) / validos.length);
}

/**
 * Sugestões automáticas para o plano de ação, já na ordem recomendada:
 * 1) fluxo negativo  2) dívidas caras  3) reserva  4) proteção
 * 5) aposentadoria  6) educação  7) sonhos  8) alavancagem
 */
export function sugestoes(c: Cliente): Sugestao[] {
  const f = fluxo(c);
  const r = reservaEmergencia(c);
  const sv = seguroVida(c);
  const ap = aposentadoria(c);
  const so = sonhos(c);
  const ed = educacaoTotal(c);
  const al = alavancagem(c);
  const p = patrimonio(c);
  const { limite } = parametros(c.parametros);
  const out: Sugestao[] = [];

  if (f.renda > 0 && f.sobra < 0) {
    const luxo = (f.despesasPorTipo["Luxo"] || 0) + (f.despesasPorTipo["Variável"] || 0);
    out.push({
      id: "fluxo-negativo",
      pilar: "Fluxo de caixa",
      prioridade: "Alta",
      titulo: `Eliminar o déficit mensal de ${fmtBRL(-f.sobra)}`,
      detalhe: `Revisar despesas variáveis e de luxo (${fmtBRL(luxo)}/mês) e renegociar parcelas.`,
    });
  } else if (f.renda > 0 && f.taxaPoupanca < 0.1) {
    out.push({
      id: "fluxo-baixo",
      pilar: "Fluxo de caixa",
      prioridade: "Média",
      titulo: "Aumentar a taxa de poupança para pelo menos 10–20%",
      detalhe: `Hoje sobram ${fmtBRL(f.sobra)}/mês (${fmtPct(f.taxaPoupanca)}). Meta 20%: ${fmtBRL(f.renda * 0.2)}/mês.`,
    });
  }

  c.dividas.filter(dividaCara).forEach((d) =>
    out.push({
      id: `divida-${d.id}`,
      pilar: "Dívidas",
      prioridade: "Alta",
      titulo: `Quitar ou renegociar “${s(d.descricao) || s(d.tipo)}”`,
      detalhe: `Saldo de ${fmtBRL(n(d.saldo))} a ${n(d.taxa)}% a.a. Trocar por crédito mais barato ou usar parte da reserva excedente.`,
    }),
  );
  if (f.comprometimento > limite)
    out.push({
      id: "comprometimento",
      pilar: "Dívidas",
      prioridade: "Alta",
      titulo: `Reduzir o comprometimento da renda (${fmtPct(f.comprometimento)} > ${fmtPct(limite)})`,
      detalhe: "Alongar prazos, portabilidade de crédito ou amortizar a dívida de maior taxa.",
    });

  if (r.falta > 0)
    out.push({
      id: "reserva",
      pilar: "Reserva",
      prioridade: r.meses < 3 ? "Alta" : "Média",
      titulo: `Completar a reserva de emergência (faltam ${fmtBRL(r.falta)})`,
      detalhe: `Meta de ${r.mesesMeta} meses de custo de vida em aplicação de liquidez diária. Ex.: ${fmtBRL(r.falta / 12)}/mês por 12 meses.`,
    });

  if (sv.gap > 0)
    out.push({
      id: "seguro",
      pilar: "Proteção",
      prioridade: "Alta",
      titulo: `Contratar ${fmtBRL(sv.gap)} de capital segurado`,
      detalhe: "Seguro de vida individual cobrindo manutenção da família, dívidas, educação e inventário.",
    });
  if (s(c.seguro.temInvalidez) === "Não")
    out.push({
      id: "invalidez",
      pilar: "Proteção",
      prioridade: "Média",
      titulo: "Avaliar cobertura de invalidez e diária por incapacidade (DIT)",
      detalhe: "Protege a renda caso o cliente fique impossibilitado de trabalhar.",
    });

  if (ap.alvo > 0 && ap.aporte > ap.aporteAtual)
    out.push({
      id: "aposentadoria",
      pilar: "Aposentadoria",
      prioridade: "Média",
      titulo: `Aumentar o aporte para independência em ${fmtBRL(ap.aporte - ap.aporteAtual)}/mês`,
      detalhe: `Aporte necessário de ${fmtBRL(ap.aporte)}/mês para atingir ${fmtBRL(ap.alvo)} aos ${ap.idadeAlvo} anos.`,
    });

  if (ed.aporteTotal > 0)
    out.push({
      id: "educacao",
      pilar: "Sonhos",
      prioridade: "Média",
      titulo: `Criar fundo de educação dos filhos (${fmtBRL(ed.aporteTotal)}/mês)`,
      detalhe: `Custo futuro estimado de ${fmtBRL(ed.custoFuturoTotal)} corrigido pela inflação educacional.`,
    });

  so.lista
    .filter((x) => x.aporte > 0)
    .sort((a, b) => ordemPrioridade(s(a.item.prioridade)) - ordemPrioridade(s(b.item.prioridade)))
    .forEach((x) =>
      out.push({
        id: `sonho-${x.item.id}`,
        pilar: "Sonhos",
        prioridade: (s(x.item.prioridade) as Sugestao["prioridade"]) || "Média",
        titulo: `Investir ${fmtBRL(x.aporte)}/mês para “${s(x.item.descricao) || "sonho"}”`,
        detalhe: `Meta de ${fmtBRL(n(x.item.valor))} em ${n(x.item.prazo)} anos${s(x.item.motivo) ? ` — “${s(x.item.motivo)}”` : ""}.`,
      }),
    );

  if (al.valor > 0 && al.economia > 0)
    out.push({
      id: "alavancagem",
      pilar: "Alavancagem",
      prioridade: "Baixa",
      titulo: `Avaliar consórcio para “${s(c.alavancagem.bemDesejado) || "o bem desejado"}”`,
      detalhe: `Economia estimada de ${fmtBRL(al.economia)} vs financiamento; parcela de ${fmtBRL(al.parcelaCons)}/mês${
        al.parcelaSaudavel === false ? " (acima da capacidade saudável)" : ""
      }.`,
    });

  if (p.total > 0 && p.financeiro / p.total < 0.2 && p.total > 300000)
    out.push({
      id: "liquidez",
      pilar: "Outros",
      prioridade: "Baixa",
      titulo: "Aumentar a parcela líquida do patrimônio",
      detalhe: `Apenas ${fmtPct(p.financeiro / p.total)} do patrimônio é financeiro. Avaliar imóveis/veículos que não geram renda.`,
    });

  return out;
}

const ordemPrioridade = (p: string) => (p === "Alta" ? 0 : p === "Média" ? 1 : 2);

/** Indicadores-chave gravados no histórico (fotografias do diagnóstico). */
export function indicadores(c: Cliente): Record<string, number> {
  const f = fluxo(c);
  const p = patrimonio(c);
  const r = reservaEmergencia(c);
  const ap = aposentadoria(c);
  const sv = seguroVida(c);
  return {
    renda: Math.round(f.renda),
    despesas: Math.round(f.despesas),
    sobra: Math.round(f.sobra),
    patrimonio: Math.round(p.total),
    dividas: Math.round(p.dividas),
    patrimonioLiquido: Math.round(p.liquido),
    mesesReserva: Math.round(r.meses * 10) / 10,
    progressoIF: Math.round(ap.progresso * 1000) / 10,
    coberturaSeguro: Math.round(sv.cobertura * 1000) / 10,
    nota: notaGeral(pilares(c)),
  };
}

export const ROTULOS_INDICADORES: Record<string, { label: string; tipo: "moeda" | "num" | "pct" }> = {
  nota: { label: "Nota LIFE", tipo: "num" },
  renda: { label: "Renda mensal", tipo: "moeda" },
  despesas: { label: "Despesas mensais", tipo: "moeda" },
  sobra: { label: "Sobra mensal", tipo: "moeda" },
  patrimonio: { label: "Patrimônio", tipo: "moeda" },
  dividas: { label: "Dívidas", tipo: "moeda" },
  patrimonioLiquido: { label: "Patrimônio líquido", tipo: "moeda" },
  mesesReserva: { label: "Reserva (meses)", tipo: "num" },
  progressoIF: { label: "Independência (%)", tipo: "pct" },
  coberturaSeguro: { label: "Cobertura seguro (%)", tipo: "pct" },
};
