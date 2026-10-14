// =====================================================================
//  DIAGNÓSTICO: pilares e sugestões para o plano de ação
//  (cartões dos planos e bússola: plano.ts · matriz: oportunidades.ts)
//  ---------------------------------------------------------------------
//  As regras e faixas abaixo são a "régua" da metodologia — ajuste aqui.
// =====================================================================

import type { Cliente, Item } from "@/types";
import { fmtBRL, fmtPct } from "./format";
import {
  fluxo,
  futuro,
  mudancasVida,
  objetivos,
  parametros,
  protecao,
  reservaEmergencia,
  s,
} from "./calculos";
import { oportunidades } from "./oportunidades";

export type Status = "ok" | "atencao" | "critico" | "sem-dados";

/** Dívidas de juros altos (as demais categorias, como consignado e FIES, não são "crédito caro"). */
export const DIVIDAS_CARAS = ["Cartão de crédito", "Cheque especial", "Carnê / crediário", "Renegociação", "Empréstimo pessoal"];
/** Dívida cara ou sem categoria (dados antigos). */
export const dividaCara = (categoria: string) => !categoria || DIVIDAS_CARAS.includes(categoria);

export interface Pilar {
  id: string;
  nome: string;
  nota: number;
  status: Status;
  resumo: string;
}

export const statusPorNota = (nota: number): Status => (nota >= 75 ? "ok" : nota >= 45 ? "atencao" : "critico");
const limitar = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

// ---------------------------------------------------------------------
//  Pilares (Panorama financeiro)
// ---------------------------------------------------------------------
export function pilares(c: Cliente): Pilar[] {
  const f = fluxo(c);
  const r = reservaEmergencia(c);
  const pr = protecao(c);
  const fu = futuro(c);
  const ob = objetivos(c);
  const { limite } = parametros(c.parametros);
  const out: Pilar[] = [];

  if (f.renda <= 0) out.push({ id: "fluxo", nome: "Fluxo de caixa", nota: 0, status: "sem-dados", resumo: "Informe a renda." });
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

  // Parcelas das despesas: as da seção 8 ou, sem elas, as digitadas em Despesas.
  if (f.renda <= 0) out.push({ id: "dividas", nome: "Dívidas", nota: 0, status: "sem-dados", resumo: "Informe a renda." });
  else if (f.parcelas <= 0) out.push({ id: "dividas", nome: "Dívidas", nota: 100, status: "ok", resumo: "Sem parcelas comprometendo a renda." });
  else {
    const nota = limitar(100 - (f.comprometimento / limite) * 60);
    out.push({
      id: "dividas",
      nome: "Dívidas",
      nota,
      status: f.comprometimento > limite ? "critico" : statusPorNota(nota),
      resumo: `${fmtPct(f.comprometimento)} da renda em parcelas (limite ${fmtPct(limite)}).`,
    });
  }

  if (!s(c.protecao.temSeguroVida))
    out.push({ id: "protecao", nome: "Proteção", nota: 0, status: "sem-dados", resumo: "Complete a etapa Proteção." });
  else if (pr.necessidade <= 0)
    out.push({ id: "protecao", nome: "Proteção", nota: 0, status: "sem-dados", resumo: "Informe as despesas e os dependentes." });
  else {
    const nota = limitar(pr.cobertura * 100);
    out.push({
      id: "protecao",
      nome: "Proteção",
      nota,
      status: statusPorNota(nota),
      resumo: pr.gap > 0 ? `Falta ${fmtBRL(pr.gap)} de capital segurado.` : "Família protegida.",
    });
  }

  if (fu.rendaDesejada <= 0 || !s(c.cadastro.nascimento))
    out.push({ id: "futuro", nome: "Independência financeira", nota: 0, status: "sem-dados", resumo: "Informe nascimento e renda desejada." });
  else {
    const nota = limitar(fu.independencia * 100);
    out.push({
      id: "futuro",
      nome: "Independência financeira",
      nota,
      status: statusPorNota(nota),
      resumo: `Projeção cobre ${fmtPct(Math.min(fu.independencia, 9.99))} da meta aos ${fu.idadeAposentadoria} anos.`,
    });
  }

  if (c.objetivos.length === 0)
    out.push({ id: "objetivos", nome: "Objetivos", nota: 0, status: "sem-dados", resumo: "Registre os objetivos." });
  else if (ob.aporteTotal <= 0 && ob.semPrazo > 0)
    out.push({ id: "objetivos", nome: "Objetivos", nota: 0, status: "sem-dados", resumo: "Informe o prazo dos objetivos." });
  else {
    // Sobra livre: o que já vai para os projetos não está disponível para os objetivos.
    const sobra = Math.max(0, f.sobraLivre);
    const nota = ob.aporteTotal <= 0 ? 100 : limitar((sobra / ob.aporteTotal) * 100);
    out.push({
      id: "objetivos",
      nome: "Objetivos",
      nota,
      status: statusPorNota(nota),
      resumo:
        `Precisa de ${fmtBRL(ob.aporteTotal)}/mês para ${c.objetivos.length - ob.semPrazo} objetivo(s).` +
        (ob.semPrazo > 0 ? ` ${ob.semPrazo} sem prazo definido.` : ""),
    });
  }

  return out;
}

/** Há ao menos um pilar com dados (sem isso a nota geral não tem significado). */
export const temNota = (ps: Pilar[]) => ps.some((p) => p.status !== "sem-dados");

export function notaGeral(ps: Pilar[]) {
  const validos = ps.filter((p) => p.status !== "sem-dados");
  if (!validos.length) return 0;
  return Math.round(validos.reduce((t, p) => t + p.nota, 0) / validos.length);
}

// ---------------------------------------------------------------------
//  6.8 · Sugestões para o plano de ação (pontos de atuação priorizados)
// ---------------------------------------------------------------------
/** Texto de ação a partir do detalhe de uma oportunidade (sem o ponto final). */
export const textoAcao = (detalhe: string) => detalhe.trim().replace(/\.$/, "");

/** Ações equivalentes: levar uma ao plano marca as outras como "No plano". */
const EQUIVALENTES: string[][] = [["sg-reserva", "op-reserva"]];

/** Origens já no plano de ação (com as equivalentes). */
export function origensNoPlano(plano: Item[]) {
  const out = new Set(plano.map((a) => s(a.origem)).filter(Boolean));
  EQUIVALENTES.forEach((grupo) => {
    if (grupo.some((id) => out.has(id))) grupo.forEach((id) => out.add(id));
  });
  return out;
}

export interface Sugestao {
  id: string;
  acao: string;
  area: string;
  prioridade: "Alta" | "Média" | "Baixa";
  prazo: "Curto" | "Médio" | "Longo";
}

export function sugestoes(c: Cliente): Sugestao[] {
  const f = fluxo(c);
  const r = reservaEmergencia(c);
  const { limite } = parametros(c.parametros);
  const ob = objetivos(c);
  const out: Sugestao[] = [];

  if (f.renda > 0 && f.sobra < 0)
    out.push({ id: "sg-deficit", acao: `Eliminar o déficit de ${fmtBRL(-f.sobra)}/mês revisando despesas variáveis`, area: "Fluxo de caixa", prioridade: "Alta", prazo: "Curto" });
  else if (f.renda > 0 && f.taxaPoupanca < 0.1)
    out.push({ id: "sg-poupanca", acao: "Elevar a taxa de poupança para ao menos 10% da renda", area: "Fluxo de caixa", prioridade: "Média", prazo: "Curto" });
  const caras = [...new Set(c.emprestimos.filter((e) => dividaCara(s(e.categoria))).map((e) => s(e.categoria) || "empréstimos"))];
  if (caras.length)
    out.push({
      id: "sg-emprestimos",
      acao: `Quitar ou renegociar as dívidas caras (${caras.join(", ").toLowerCase()})`,
      area: "Dívidas",
      prioridade: "Alta",
      prazo: "Curto",
    });
  if (f.comprometimento > limite)
    out.push({ id: "sg-comprometimento", acao: `Reduzir parcelas para menos de ${fmtPct(limite)} da renda`, area: "Dívidas", prioridade: "Alta", prazo: "Médio" });
  if (r.falta > 0)
    out.push({ id: "sg-reserva", acao: `Completar a reserva de emergência (faltam ${fmtBRL(r.falta)})`, area: "Investimentos", prioridade: r.meses < 3 ? "Alta" : "Média", prazo: "Curto" });
  if (!ob.cabeNaSobra && c.objetivos.length)
    out.push({ id: "sg-objetivos", acao: "Repriorizar objetivos: o aporte necessário supera a sobra livre do mês", area: "Objetivos", prioridade: "Média", prazo: "Curto" });

  // Gasto único programado (12 · Futuro) vira reserva com prazo.
  mudancasVida(c)
    .filter((m) => m.impacto === "Gasto único" && m.valor > 0)
    .forEach((m) =>
      out.push({
        id: `sg-mudanca-${m.item.id}`,
        acao: `Reservar ${fmtBRL(m.valor)} para “${m.descricao}”${m.temData ? ` até ${m.quando}` : ""}`,
        area: "Objetivos",
        prioridade: "Média",
        prazo: !m.temData ? "Médio" : m.meses > 12 ? "Longo" : m.meses > 3 ? "Médio" : "Curto",
      }),
    );

  // Oportunidades da matriz também viram sugestões (na ordem do potencial).
  // "op-reserva" repete "sg-reserva", que já define a prioridade pelos meses cobertos.
  oportunidades(c)
    .filter((o) => o.id !== "op-reserva")
    .forEach((o) => out.push({ id: o.id, acao: textoAcao(o.detalhe), area: o.area, prioridade: o.prioridade, prazo: o.prazo }));
  const ordem = { Alta: 0, Média: 1, Baixa: 2 };
  return out.sort((a, b) => ordem[a.prioridade] - ordem[b.prioridade]);
}
