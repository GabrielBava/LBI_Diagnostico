// =====================================================================
//  DIAGNÓSTICO: pilares, pontos fortes/de atuação, oportunidades e plano
//  ---------------------------------------------------------------------
//  As regras e faixas abaixo são a "régua" da metodologia — ajuste aqui.
// =====================================================================

import type { Cliente } from "@/types";
import { fmtBRL, fmtPct } from "./format";
import {
  bemQuitado,
  cartoes,
  dividas,
  fluxo,
  futuro,
  modelo503020,
  n,
  objetivos,
  parametros,
  patrimonio,
  protecao,
  reservaEmergencia,
  s,
  sim,
  sucessao,
} from "./calculos";

export type Status = "ok" | "atencao" | "critico" | "sem-dados";

/** Dívidas de juros altos (as demais categorias, como consignado e FIES, não são "crédito caro"). */
const DIVIDAS_CARAS = ["Cartão de crédito", "Cheque especial", "Carnê / crediário", "Renegociação", "Empréstimo pessoal"];
/** Dívida cara ou sem categoria (dados antigos). */
const dividaCara = (categoria: string) => !categoria || DIVIDAS_CARAS.includes(categoria);

export interface Pilar {
  id: string;
  nome: string;
  nota: number;
  status: Status;
  resumo: string;
}

const statusPorNota = (nota: number): Status => (nota >= 75 ? "ok" : nota >= 45 ? "atencao" : "critico");
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
    const sobra = Math.max(0, f.sobra);
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
//  6.3 / 6.4 · Pontos fortes e pontos de atuação (automáticos)
// ---------------------------------------------------------------------
export interface Ponto {
  id: string;
  texto: string;
  area: string;
}

export function pontos(c: Cliente): { fortes: Ponto[]; negativos: Ponto[] } {
  const f = fluxo(c);
  const r = reservaEmergencia(c);
  const pr = protecao(c);
  const fu = futuro(c);
  const p = patrimonio(c);
  const dv = dividas(c);
  const { limite } = parametros(c.parametros);
  const fortes: Ponto[] = [];
  const negativos: Ponto[] = [];

  if (f.renda > 0) {
    if (f.taxaPoupanca >= 0.2)
      fortes.push({ id: "poupanca", area: "Fluxo de caixa", texto: `Poupa ${fmtPct(f.taxaPoupanca)} da renda (${fmtBRL(f.sobra)}/mês).` });
    else if (f.sobra < 0)
      negativos.push({ id: "deficit", area: "Fluxo de caixa", texto: `Gasta mais do que ganha: déficit de ${fmtBRL(-f.sobra)}/mês.` });
    else
      negativos.push({
        id: "poupanca-baixa",
        area: "Fluxo de caixa",
        // Uma casa decimal, arredondando para baixo: 19,96% não pode aparecer como "20%, abaixo dos 20%".
        texto: `Taxa de poupança de ${(Math.floor(f.taxaPoupanca * 1000) / 10).toLocaleString("pt-BR")}%, abaixo dos 20% recomendados.`,
      });
  }
  // Modelo 50-30-20 (o mesmo do pré-diagnóstico).
  const orc = modelo503020(c);
  if (orc.renda > 0) {
    const parte = (id: string) => orc.partes.find((p) => p.id === id)!;
    const nec = parte("Necessidades");
    const des = parte("Desejos");
    if (orc.dentroDoModelo) fortes.push({ id: "503020", area: "Fluxo de caixa", texto: "Orçamento dentro do modelo 50-30-20." });
    if (nec.foraDoModelo)
      negativos.push({
        id: "necessidades",
        area: "Fluxo de caixa",
        texto: `Necessidades consomem ${fmtPct(nec.pct)} da renda (modelo 50-30-20: até 50%).`,
      });
    if (des.foraDoModelo)
      negativos.push({
        id: "desejos",
        area: "Fluxo de caixa",
        texto: `Desejos consomem ${fmtPct(des.pct)} da renda (modelo 50-30-20: até 30%).`,
      });
  }

  if (r.meta > 0) {
    if (r.falta <= 0) fortes.push({ id: "reserva", area: "Investimentos", texto: `Reserva de emergência completa (${r.mesesMeta} meses).` });
    else
      negativos.push({
        id: "reserva",
        area: "Investimentos",
        texto: `Reserva cobre ${r.meses.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} meses; faltam ${fmtBRL(r.falta)}.`,
      });
  }

  if (f.parcelas === 0 && f.renda > 0) fortes.push({ id: "sem-dividas", area: "Dívidas", texto: "Nenhuma parcela comprometendo a renda." });
  else if (f.comprometimento > limite)
    negativos.push({
      id: "comprometimento",
      area: "Dívidas",
      texto: `${fmtPct(f.comprometimento)} da renda comprometida com parcelas (limite ${fmtPct(limite)}).`,
    });
  if (c.emprestimos.length > 0) {
    const categorias = [...new Set(c.emprestimos.map((e) => s(e.categoria)).filter(Boolean))];
    const caras = c.emprestimos.some((e) => dividaCara(s(e.categoria)));
    negativos.push({
      id: "emprestimos",
      area: "Dívidas",
      texto:
        `${c.emprestimos.length} dívida(s) ativa(s)${categorias.length ? ` (${categorias.join(", ")})` : ""}` +
        (dv.parcelasEmp > 0 ? ` somando ${fmtBRL(dv.parcelasEmp)}/mês` : "") +
        (caras ? ": crédito caro." : "."),
    });
  }

  const quitados = c.imoveis.filter(bemQuitado).length;
  if (quitados > 0) fortes.push({ id: "imoveis-quitados", area: "Patrimonial", texto: `${quitados} imóvel(is) quitado(s).` });
  if (p.liquido > 0 && p.ativos > 0 && p.passivos / p.ativos < 0.2)
    fortes.push({ id: "alavancagem-baixa", area: "Patrimonial", texto: `Patrimônio líquido de ${fmtBRL(p.liquido)} com baixo endividamento.` });

  if (s(c.protecao.temSeguroVida)) {
    if (pr.gap <= 0 && pr.necessario > 0) fortes.push({ id: "seguro", area: "Seguros", texto: "Seguro de vida cobre a necessidade da família." });
    else if (pr.gap > 0) negativos.push({ id: "seguro", area: "Seguros", texto: `Família descoberta em ${fmtBRL(pr.gap)} de capital segurado.` });
  }
  if (s(c.protecao.temSaude) === "Sim") fortes.push({ id: "saude", area: "Seguros", texto: "Possui plano de saúde." });
  if (s(c.protecao.temSaude) === "Não") negativos.push({ id: "saude", area: "Seguros", texto: "Sem plano de saúde." });
  const semSeguro = c.moveis.filter((m) => m.temSeguro !== true);
  if (semSeguro.length > 0)
    negativos.push({ id: "auto", area: "Seguros", texto: `${semSeguro.length} veículo(s)/embarcação(ões) sem seguro.` });
  const imoveisSemSeguro = c.imoveis.filter((m) => m.temSeguro !== true);
  if (imoveisSemSeguro.length > 0)
    negativos.push({ id: "residencial", area: "Seguros", texto: `${imoveisSemSeguro.length} imóvel(is) sem seguro.` });
  if (c.imoveis.length > 0 && imoveisSemSeguro.length === 0)
    fortes.push({ id: "residencial", area: "Seguros", texto: "Todos os imóveis têm seguro." });

  const ct = cartoes(c);
  if (ct.quantidade > 0 && ct.usoLimite > 0.8)
    negativos.push({ id: "limite", area: "Fluxo de caixa", texto: `Usa ${fmtPct(ct.usoLimite)} do limite dos cartões todo mês.` });
  if (ct.comMilhas > 0) fortes.push({ id: "milhas", area: "Fluxo de caixa", texto: "Acumula milhas/pontos com os gastos do cartão." });
  if (ct.anuidadeAnual > 0)
    negativos.push({
      id: "anuidade",
      area: "Fluxo de caixa",
      texto: `Paga ${fmtBRL(ct.anuidadeAnual)}/ano de anuidade em ${ct.comAnuidade.length} cartão(ões): dá para negociar isenção.`,
    });

  // Previdência × modelo da declaração do IR.
  const ir = s(c.renda.declaracaoIR);
  const tipoPrev = s(c.protecao.tipoPrevidencia);
  if (sim(c.protecao.temPrevidencia) && ir === "Simplificada" && tipoPrev.includes("PGBL"))
    negativos.push({
      id: "pgbl-simplificada",
      area: "Futuro",
      texto: "Tem PGBL, mas declara no modelo simplificado: o benefício fiscal do PGBL não é aproveitado.",
    });

  if (sim(c.investimentos.temInvestimento)) {
    fortes.push({ id: "investe", area: "Investimentos", texto: `Já investe ${fmtBRL(p.investimentos)}.` });
    if (s(c.investimentos.temAssessor) === "Sim") fortes.push({ id: "assessor", area: "Investimentos", texto: "Conta com assessoria de investimentos." });
  } else if (s(c.investimentos.temInvestimento) === "Não")
    negativos.push({ id: "nao-investe", area: "Investimentos", texto: "Ainda não possui investimentos." });

  if (fu.rendaDesejada > 0 && s(c.cadastro.nascimento)) {
    if (fu.independencia >= 1) fortes.push({ id: "futuro", area: "Futuro", texto: `No ritmo atual, atinge a independência aos ${fu.idadeAposentadoria} anos.` });
    else if (fu.idadeAtingida)
      negativos.push({
        id: "futuro",
        area: "Futuro",
        texto: `Idade de aposentadoria (${fu.idadeAposentadoria} anos) já atingida; faltam ${fmtBRL(fu.faltaHoje)} para a meta de independência.`,
      });
    else
      negativos.push({
        id: "futuro",
        area: "Futuro",
        texto: `Projeção cobre ${fmtPct(fu.independencia)} da independência; aporte necessário de ${fmtBRL(fu.aporte)}/mês.`,
      });
  }

  const baixas = c.objetivos.filter((o) => s(o.probAtual) !== "" && n(o.probAtual) < 50);
  if (baixas.length)
    negativos.push({
      id: "objetivos",
      area: "Objetivos",
      texto: `${baixas.length} objetivo(s) com menos de 50% de chance de acontecer no cenário atual.`,
    });

  return { fortes, negativos };
}

// ---------------------------------------------------------------------
//  6.6 · Matriz de oportunidades — ecossistema (cross-sell)
// ---------------------------------------------------------------------
export interface Oportunidade {
  id: string;
  quadrante: "Seguros" | "Patrimonial" | "Investimentos" | "Futuro";
  titulo: string;
  detalhe: string;
  prioridade: "Alta" | "Média" | "Baixa";
  prazo: "Curto" | "Médio" | "Longo";
}

export const QUADRANTES: Oportunidade["quadrante"][] = ["Seguros", "Patrimonial", "Investimentos", "Futuro"];

export function oportunidades(c: Cliente): Oportunidade[] {
  const pr = protecao(c);
  const p = patrimonio(c);
  const r = reservaEmergencia(c);
  const fu = futuro(c);
  const dv = dividas(c);
  const su = sucessao(c);
  const out: Oportunidade[] = [];

  // Seguros
  if (pr.gap > 0)
    out.push({
      id: "op-vida",
      quadrante: "Seguros",
      titulo: "Seguro de vida",
      detalhe: `Capital de ${fmtBRL(pr.gap)} para fechar o gap de proteção.`,
      prioridade: "Alta",
      prazo: "Curto",
    });
  if (s(c.protecao.temInvalidez) === "Não")
    out.push({ id: "op-dit", quadrante: "Seguros", titulo: "Invalidez e DIT", detalhe: "Proteção da renda em caso de afastamento.", prioridade: "Média", prazo: "Curto" });
  if (s(c.protecao.temSaude) === "Não")
    out.push({ id: "op-saude", quadrante: "Seguros", titulo: "Plano de saúde", detalhe: "Cliente e dependentes sem cobertura.", prioridade: "Alta", prazo: "Curto" });
  const semSeguro = c.moveis.filter((m) => m.temSeguro !== true);
  if (semSeguro.length)
    out.push({
      id: "op-auto",
      quadrante: "Seguros",
      titulo: "Seguro auto / náutico",
      detalhe: semSeguro.map((m) => s(m.nome) || s(m.tipo)).join(", "),
      prioridade: "Média",
      prazo: "Curto",
    });
  const imoveisSemSeguro = c.imoveis.filter((m) => m.temSeguro !== true);
  if (imoveisSemSeguro.length)
    out.push({
      id: "op-residencial",
      quadrante: "Seguros",
      titulo: "Seguro residencial / patrimonial",
      detalhe: `${imoveisSemSeguro.length} imóvel(is) sem seguro, somando ${fmtBRL(imoveisSemSeguro.reduce((t, m) => t + n(m.valor), 0))}.`,
      prioridade: "Média",
      prazo: "Curto",
    });
  if (sim(c.corporativo.possuiEmpresa) && c.corporativo.seguroEmpresarial !== true)
    out.push({ id: "op-empresarial", quadrante: "Seguros", titulo: "Seguro empresarial", detalhe: "Empresa sem seguro do patrimônio/operação.", prioridade: "Média", prazo: "Médio" });
  if (sim(c.corporativo.possuiEmpresa) && n(c.corporativo.socios) > 1 && c.corporativo.acordoSocios !== true)
    out.push({ id: "op-socio", quadrante: "Seguros", titulo: "Seguro de sócio (key person)", detalhe: "Protege a continuidade da empresa.", prioridade: "Média", prazo: "Médio" });

  // Patrimonial
  // Futuras aquisições que já viram consórcio: o objetivo do mesmo segmento não repete a sugestão.
  const aquisicoes = sim(c.patrimonioGeral.pretendeAdquirir) ? c.aquisicoes.filter((a) => n(a.valorDesejado) > 0) : [];
  const segmentoComConsorcio = (segmento: string) =>
    aquisicoes.some((a) => s(a.segmento) === segmento && ["Financiamento", "Consórcio"].includes(s(a.estrategia)));
  c.objetivos
    .filter((o) => ["Casa", "Veículo"].includes(s(o.categoria)) && n(o.valorFuturo) > 0)
    .filter((o) => !segmentoComConsorcio(s(o.categoria) === "Casa" ? "Imóvel" : "Veículo"))
    .forEach((o) =>
      out.push({
        id: `op-cons-${o.id}`,
        quadrante: "Patrimonial",
        titulo: `Consórcio para “${s(o.titulo) || s(o.categoria)}”`,
        detalhe: `Carta de ${fmtBRL(n(o.valorFuturo))} em vez de financiamento.`,
        prioridade: "Média",
        prazo: "Médio",
      }),
    );
  const ampliar = c.moveis.filter((m) => m.pensaAmpliacao === true);
  if (ampliar.length)
    out.push({
      id: "op-troca",
      quadrante: "Patrimonial",
      titulo: "Troca / ampliação de bens",
      detalhe: `Cliente pensa em trocar: ${ampliar
        .map((m) => `${s(m.nome) || s(m.tipo)}${s(m.modeloDesejado) ? ` → ${s(m.modeloDesejado)}` : ""}`)
        .join(", ")}.`,
      prioridade: "Baixa",
      prazo: "Médio",
    });
  // Futuras aquisições (7 · Patrimônio): consórcio no lugar do financiamento; à vista pede investimento dedicado.
  aquisicoes.forEach((a) => {
    // Imóvel: "Casa · Veraneio"; veículo: "Carro · Novo".
    const partes = s(a.segmento) === "Veículo" ? [s(a.categoria), s(a.tipo)] : [s(a.tipo), s(a.categoria)];
    const nome = partes.filter(Boolean).join(" · ") || s(a.segmento) || "aquisição";
    const valor = fmtBRL(n(a.valorDesejado));
    if (s(a.estrategia) === "Financiamento" || s(a.estrategia) === "Consórcio")
      out.push({
        id: `op-aq-${a.id}`,
        quadrante: "Patrimonial",
        titulo: `Consórcio para ${nome}`,
        detalhe:
          s(a.estrategia) === "Financiamento"
            ? `Carta de ${valor} em vez de financiamento: sem juros, só taxa de administração.`
            : `Carta de ${valor}, como o cliente pretende.`,
        prioridade: "Média",
        prazo: "Médio",
      });
        else if (s(a.estrategia) === "À vista")
          out.push({
            id: `op-aq-${a.id}`,
            quadrante: "Investimentos",
            titulo: `Investimento para compra à vista (${nome})`,
            detalhe: `Juntar ${valor} em aplicação compatível com o prazo da compra.`,
            prioridade: "Baixa",
            prazo: "Médio",
          });
      });
  if (dv.saldoFin > 0)
    out.push({
      id: "op-portabilidade",
      quadrante: "Patrimonial",
      titulo: "Portabilidade / amortização de financiamento",
      detalhe: `Saldo devedor de ${fmtBRL(dv.saldoFin)}.`,
      prioridade: "Média",
      prazo: "Curto",
    });
  if (c.imoveis.length >= 2 || p.ativos >= 2_000_000)
    out.push({
      id: "op-holding",
      quadrante: "Patrimonial",
      titulo: "Planejamento sucessório / holding",
      detalhe: `Patrimônio de ${fmtBRL(p.ativos)} — reduzir custos e prazo de inventário.`,
      prioridade: "Média",
      prazo: "Longo",
    });

  // Investimentos
  if (s(c.investimentos.temInvestimento) === "Não")
    out.push({ id: "op-comecar", quadrante: "Investimentos", titulo: "Início dos investimentos", detalhe: "Abrir conta e definir carteira inicial.", prioridade: "Alta", prazo: "Curto" });
  if (r.falta > 0)
    out.push({
      id: "op-reserva",
      quadrante: "Investimentos",
      titulo: "Reserva de emergência",
      detalhe: `Faltam ${fmtBRL(r.falta)} em aplicação de liquidez diária.`,
      prioridade: "Alta",
      prazo: "Curto",
    });
  if (sim(c.investimentos.temInvestimento) && s(c.investimentos.temAssessor) === "Não")
    out.push({ id: "op-assessoria", quadrante: "Investimentos", titulo: "Assessoria de investimentos", detalhe: "Cliente investe sem acompanhamento.", prioridade: "Média", prazo: "Curto" });
  const ct = cartoes(c);
  // Só o gasto dos cartões que não acumulam pontos.
  const gastoSemMilhas = ct.semMilhas.reduce((t, k) => t + n(k.gastoMensal), 0);
  if (gastoSemMilhas >= 3000)
    out.push({
      id: "op-cartao",
      quadrante: "Investimentos",
      titulo: "Cartão com milhas ou cashback",
      detalhe: `Gasta ${fmtBRL(gastoSemMilhas)}/mês em cartão sem acumular pontos.`,
      prioridade: "Baixa",
      prazo: "Curto",
    });
  if (!s(c.investimentos.perfil) || s(c.investimentos.perfil) === "Não sabe")
    out.push({ id: "op-suitability", quadrante: "Investimentos", titulo: "Definir perfil de investidor", detalhe: "Aplicar suitability e alinhar carteira.", prioridade: "Baixa", prazo: "Curto" });
  if (p.ativos > 0 && p.financeiro / p.ativos < 0.2 && p.ativos > 300_000)
    out.push({
      id: "op-liquidez",
      quadrante: "Investimentos",
      titulo: "Aumentar patrimônio financeiro",
      detalhe: `Só ${fmtPct(p.financeiro / p.ativos)} do patrimônio gera rendimento líquido.`,
      prioridade: "Baixa",
      prazo: "Longo",
    });

  // Futuro
  const ir = s(c.renda.declaracaoIR);
  if (s(c.protecao.temPrevidencia) === "Não")
    out.push({
      id: "op-previdencia",
      quadrante: "Futuro",
      titulo: ir === "Completa" ? "Previdência privada (PGBL)" : ir === "Simplificada" ? "Previdência privada (VGBL)" : "Previdência privada (PGBL/VGBL)",
      detalhe:
        ir === "Completa"
          ? "Declara no modelo completo: o PGBL deduz até 12% da renda bruta tributável no IR."
          : ir === "Simplificada"
            ? "Declara no modelo simplificado: VGBL, com eficiência sucessória."
            : "Eficiência fiscal e sucessória.",
      prioridade: "Média",
      prazo: "Médio",
    });
  else if (sim(c.protecao.temPrevidencia) && ir === "Completa" && !s(c.protecao.tipoPrevidencia).includes("PGBL"))
    out.push({
      id: "op-pgbl",
      quadrante: "Futuro",
      titulo: "Avaliar PGBL",
      detalhe: "Declara no modelo completo: aportes em PGBL deduzem até 12% da renda bruta tributável.",
      prioridade: "Média",
      prazo: "Curto",
    });
  if (fu.alvo > 0 && fu.aporte > fu.aporteAtual)
    out.push({
      id: "op-independencia",
      quadrante: "Futuro",
      titulo: "Plano de independência financeira",
      detalhe: `Aporte de ${fmtBRL(fu.aporte)}/mês para ${fmtBRL(fu.alvo)} aos ${fu.idadeAposentadoria} anos.`,
      prioridade: "Média",
      prazo: "Longo",
    });
  if (su.escolares > 0)
    out.push({
      id: "op-educacao",
      quadrante: "Futuro",
      titulo: "Fundo de educação dos filhos",
      detalhe: `${su.escolares} filho(s)/dependente(s) em idade escolar; mensalidades atuais de ${fmtBRL(su.mensalidades)}/mês.`,
      prioridade: "Média",
      prazo: "Longo",
    });

  return out;
}

// ---------------------------------------------------------------------
//  6.7 · Sugestões para o plano de ação (pontos de atuação priorizados)
// ---------------------------------------------------------------------
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
  if (ob.aporteTotal > Math.max(0, f.sobra) && c.objetivos.length)
    out.push({ id: "sg-objetivos", acao: "Repriorizar objetivos: o aporte necessário supera a sobra mensal", area: "Objetivos", prioridade: "Média", prazo: "Curto" });

  // Oportunidades também viram sugestões (mesma área do quadrante).
  // "op-reserva" repete "sg-reserva", que já define a prioridade pelos meses cobertos.
  oportunidades(c)
    .filter((o) => o.id !== "op-reserva")
    .forEach((o) => out.push({ id: o.id, acao: `${o.titulo}: ${o.detalhe}`, area: o.quadrante, prioridade: o.prioridade, prazo: o.prazo }));
  const ordem = { Alta: 0, Média: 1, Baixa: 2 };
  return out.sort((a, b) => ordem[a.prioridade] - ordem[b.prioridade]);
}
