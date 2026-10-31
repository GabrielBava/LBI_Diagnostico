// =====================================================================
//  ESTRELA LIFE (6.1 · Panorama geral)
//  ---------------------------------------------------------------------
//  8 pilares e 20 sub-pilares de 5 pontos cada (total 100): pilar de
//  10 pontos tem 2 sub-pilares; pilar de 15 tem 3.
//  Cada sub-pilar vira uma fração de 0 a 1 (régua abaixo) e a nota é
//  fração × 5, arredondada para inteiro. Sem dados: nota 0 e semDados.
//  Estado do pilar: statusPorNota sobre o % (nota ÷ máximo).
//  A Nota LIFE (Panorama e lista de clientes) é o total da estrela.
// =====================================================================

import type { Cliente } from "@/types";
import { POUPANCA_MENSAL_MAX } from "@/config/campos";
import { fmtBRL, fmtPct, juntar, plural } from "./format";
import {
  cartoes,
  dividas,
  fluxo,
  futuro,
  idadePorNascimento,
  lista,
  modelo503020,
  n,
  nOpt,
  objetivos,
  parametros,
  patrimonio,
  poupancaDeclarada,
  protecao,
  renda,
  reservaEmergencia,
  s,
  sim,
  temConjuge,
} from "./calculos";
import { dividaCara, statusPorNota, type Status } from "./diagnostico";

export const PONTOS_SUB = 5;

export interface SubPilar {
  id: string;
  nome: string;
  /** Nome curto para o gráfico. */
  curto: string;
  /** 0 a 5. */
  nota: number;
  /** 0 a 100. */
  pct: number;
  status: Status;
  /** O que pesou na nota, com os números do cliente. */
  pesou: string;
  semDados?: boolean;
}

export interface PilarEstrela {
  id: string;
  nome: string;
  /** Nome curto (gráfico em telas estreitas). */
  curto: string;
  /** Nome quebrado em linhas para o gráfico. */
  linhas: string[];
  /** O que é, em uma frase. */
  descricao: string;
  nota: number;
  maximo: number;
  /** 0 a 100. */
  pct: number;
  status: Status;
  subs: SubPilar[];
}

export interface Estrela {
  pilares: PilarEstrela[];
  /** Soma das notas dos pilares (0 a 100). */
  total: number;
  maximo: number;
  /** Algum sub-pilar tem dados (sem isso a nota não tem significado). */
  temDados: boolean;
}

/** Resultado da régua: fração de 0 a 1 (sem fração = sem dados) e o que pesou. */
type Medida = { fracao?: number; pesou: string };

const limitar01 = (v: number) => Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));
/** Fração → nota inteira de 0 a 5 (o arredondamento interno evita 3,4999… virar 3). */
const notaDe = (fracao: number) => Math.round(Math.round(limitar01(fracao) * PONTOS_SUB * 1e6) / 1e6);
/** Média ponderada das partes com dados (undefined = sem dados). */
const media = (partes: [number | undefined, number][]) => {
  const validas = partes.filter((p): p is [number, number] => p[0] !== undefined);
  const peso = validas.reduce((t, [, w]) => t + w, 0);
  return peso > 0 ? validas.reduce((t, [v, w]) => t + limitar01(v) * w, 0) / peso : undefined;
};
/** Uma casa decimal, arredondando para baixo: 19,96% não vira "20%, meta 20%". */
const pctPiso = (v: number) => `${(Math.floor(v * 1000) / 10).toLocaleString("pt-BR")}%`;
const fmtMeses = (m: number) => (Math.floor(m * 10) / 10).toLocaleString("pt-BR");
const frase = (t: string) => (t ? t[0].toUpperCase() + t.slice(1) : t);
/** "A favor: x e y. Falta: z." */
const aFavorFalta = (aFavor: string[], falta: string[]) =>
  [aFavor.length ? `A favor: ${juntar(aFavor)}.` : "", falta.length ? `Falta: ${juntar(falta)}.` : ""].filter(Boolean).join(" ");

/** Gasto mensal em cartões sem milhas a partir do qual vale um cartão com benefícios (igual à matriz). */
const GASTO_CARTAO_RELEVANTE = 3000;
/** Classes de investimento entre os temas de 4 · Investimentos. */
const CLASSES_INVESTIMENTO = [
  "Tesouro Direto",
  "CDB, LCI e LCA",
  "Fundos de investimento",
  "Ações",
  "Fundos imobiliários (FIIs)",
  "Investimentos no exterior",
  "Criptoativos",
  "Derivativos e opções",
];
const IMOVEL_DE_RENDA = ["Renda (aluguel)", "Investimento", "Comercial"];

// Estrutura: pilares no sentido horário a partir do topo do gráfico.
type DefSub = { id: string; nome: string; curto: string; regra: () => Medida };
type DefPilar = Omit<PilarEstrela, "nota" | "maximo" | "pct" | "status" | "subs"> & { subs: DefSub[] };

export function estrela(c: Cliente): Estrela {
  const f = fluxo(c);
  const r = renda(c);
  const orc = modelo503020(c);
  const res = reservaEmergencia(c);
  const pr = protecao(c);
  const ob = objetivos(c);
  const fu = futuro(c);
  const p = patrimonio(c);
  const dv = dividas(c);
  const ct = cartoes(c);
  const { limite } = parametros(c.parametros);
  const temRenda = f.renda > 0;
  const temOrcamento = temRenda && f.despesas > 0;
  const semOrcamento = temRenda ? "Informe as despesas do mês." : "Informe a renda e as despesas.";
  const bens = [...c.imoveis, ...c.moveis];
  const valorBens = bens.reduce((t, b) => t + Math.max(0, n(b.valor)), 0);
  const tipoPrev = sim(c.protecao.temPrevidencia) ? s(c.protecao.tipoPrevidencia) : "";

  const defs: DefPilar[] = [
    {
      id: "organizacao",
      nome: "Organização Financeira",
      curto: "Organização",
      linhas: ["Organização", "Financeira"],
      descricao: "Se o dinheiro do mês fecha no azul e segue um orçamento equilibrado.",
      subs: [
        {
          id: "fluxo",
          nome: "Fluxo de caixa",
          curto: "Fluxo de caixa",
          // Taxa de poupança ÷ 20% (déficit = 0).
          regra: () =>
            !temOrcamento
              ? { pesou: semOrcamento }
              : f.sobra < 0
                ? { fracao: 0, pesou: `Déficit de ${fmtBRL(-f.sobra)}/mês: gasta mais do que ganha.` }
                : { fracao: f.taxaPoupanca / 0.2, pesou: `Sobra de ${fmtBRL(f.sobra)}/mês (${pctPiso(f.taxaPoupanca)} da renda); a meta é 20%.` },
        },
        {
          id: "orcamento",
          nome: "Orçamento Mensal",
          curto: "Orçamento",
          // 50-30-20: essencial até 50% e estilo e desejos até 30% da renda; 30 pontos percentuais de excesso zeram.
          regra: () => {
            if (!temOrcamento) return { pesou: semOrcamento };
            const nec = orc.partes.find((x) => x.id === "Necessidades")!;
            const des = orc.partes.find((x) => x.id === "Desejos")!;
            const excesso = Math.max(0, nec.pct - 0.5) + Math.max(0, des.pct - 0.3);
            return {
              fracao: 1 - excesso / 0.3,
              pesou: `Essencial em ${fmtPct(nec.pct)} da renda (até 50%) e estilo e desejos em ${fmtPct(des.pct)} (até 30%).`,
            };
          },
        },
      ],
    },
    {
      id: "comportamento",
      nome: "Comportamento",
      curto: "Comportamento",
      linhas: ["Comportamento"],
      descricao: "Hábitos que fazem o dinheiro render: poupar todo mês e usar benefícios a seu favor.",
      subs: [
        {
          id: "estrategias",
          nome: "Estratégias Complementares",
          curto: "Estratégias",
          // Três pontos iguais: cartão a favor (milhas ou pouco gasto sem benefício), renda extra ou passiva e previdência privada.
          regra: () => {
            const aFavor: string[] = [];
            const falta: string[] = [];
            const temCartao = s(c.renda.temCartao);
            const gastoSemMilhas = ct.semMilhas.reduce((t, k) => t + n(k.gastoMensal), 0);
            let cartao: number | undefined;
            if (temCartao === "Não") {
              cartao = 1;
              aFavor.push("não depende de cartão de crédito");
            } else if (temCartao === "Sim") {
              cartao = gastoSemMilhas < GASTO_CARTAO_RELEVANTE ? 1 : 0;
              if (cartao) aFavor.push(ct.comMilhas ? "cartão com milhas" : "pouco gasto no cartão sem benefícios");
              else falta.push(`benefícios para os ${fmtBRL(gastoSemMilhas)}/mês gastos no cartão sem milhas`);
            }
            const extra = temRenda ? (r.extra > 0 || r.passiva > 0 ? 1 : 0) : undefined;
            if (extra) aFavor.push(r.extra > 0 ? `renda extra de ${fmtBRL(r.extra)}/mês` : `renda passiva de ${fmtBRL(r.passiva)}/mês`);
            else if (extra === 0) falta.push("renda extra ou passiva");
            const prev = s(c.protecao.temPrevidencia) ? (sim(c.protecao.temPrevidencia) ? 1 : 0) : undefined;
            if (prev) aFavor.push("previdência privada");
            else if (prev === 0) falta.push("previdência privada");
            const fracao = media([
              [cartao, 1],
              [extra, 1],
              [prev, 1],
            ]);
            return fracao === undefined ? { pesou: "Informe renda, cartões e previdência." } : { fracao, pesou: aFavorFalta(aFavor, falta) };
          },
        },
        {
          id: "disciplina",
          nome: "Disciplina de Investimentos",
          curto: "Disciplina",
          // 4 pontos: quanto consegue poupar por mês ÷ 20% da renda; 1 ponto: já tem investimentos ou previdência.
          regra: () => {
            const declarada = poupancaDeclarada(c);
            if (!temRenda || (declarada === undefined && !temOrcamento)) return { pesou: semOrcamento };
            // A régua do ponto de partida vai até R$ 5.000: no topo, vale o maior entre ela e a sobra livre.
            const poupa =
              declarada === undefined
                ? Math.max(0, f.sobraLivre)
                : declarada >= POUPANCA_MENSAL_MAX
                  ? Math.max(declarada, f.sobraLivre)
                  : declarada;
            const investido = p.investimentos + p.previdencia;
            return {
              fracao: (4 * limitar01(poupa / (0.2 * f.renda)) + (investido > 0 ? 1 : 0)) / 5,
              pesou:
                `${declarada !== undefined ? "Consegue poupar" : "Sobra livre de"} ${fmtBRL(poupa)}/mês (${pctPiso(poupa / f.renda)} da renda; a meta é 20%)` +
                (investido > 0 ? ` e já tem ${fmtBRL(investido)} investidos.` : "; ainda não tem investimentos."),
            };
          },
        },
      ],
    },
    {
      id: "protecao",
      nome: "Proteção Financeira",
      curto: "Proteção",
      linhas: ["Proteção", "Financeira"],
      descricao: "Se a família, a renda e os bens estão protegidos contra imprevistos.",
      subs: [
        {
          id: "riscos",
          nome: "Gestão de Riscos",
          curto: "Gestão de riscos",
          // 70%: seguro de vida atual ÷ capital necessário (protecao()); 30%: cobertura de invalidez/DIT (aposentado não conta).
          regra: () => {
            const vida = s(c.protecao.temSeguroVida) && pr.necessidade > 0 ? pr.cobertura : undefined;
            const aposentado = s(c.cadastro.regimeTrabalho) === "Aposentado";
            const inv = !aposentado && s(c.protecao.temInvalidez) ? (sim(c.protecao.temInvalidez) ? 1 : 0) : undefined;
            const fracao = media([
              [vida, 0.7],
              [inv, 0.3],
            ]);
            if (fracao === undefined) return { pesou: "Complete 11 · Proteção (seguro de vida e invalidez) e as despesas." };
            const partes = [
              vida === undefined
                ? ""
                : pr.necessario <= 0
                  ? "reserva e investimentos já cobrem a necessidade da família"
                  : pr.gap <= 0
                    ? "o seguro de vida cobre a necessidade da família"
                    : pr.atual > 0
                      ? `o seguro de vida cobre ${fmtPct(pr.cobertura)} do necessário (faltam ${fmtBRL(pr.gap)})`
                      : `sem seguro de vida individual (necessário: ${fmtBRL(pr.gap)})`,
              inv === undefined ? "" : inv ? "tem cobertura de invalidez/DIT" : "sem cobertura de invalidez/DIT",
            ].filter(Boolean);
            return { fracao, pesou: frase(`${partes.join("; ")}.`) };
          },
        },
        {
          id: "reserva",
          nome: "Reserva de Emergência",
          curto: "Reserva",
          // Meses cobertos ÷ meta de meses (reservaEmergencia()).
          regra: () =>
            res.meta <= 0
              ? { pesou: semOrcamento }
              : !s(c.protecao.temReserva)
                ? { pesou: "Informe se tem reserva de emergência (11 · Proteção)." }
                : {
                    fracao: res.meses / res.mesesMeta,
                    pesou:
                      res.atual > 0
                        ? `A reserva de ${fmtBRL(res.atual)} cobre ${fmtMeses(res.meses)} de ${res.mesesMeta} meses de despesas.`
                        : `Sem reserva; a meta é ${fmtBRL(res.meta)} (${res.mesesMeta} meses de despesas).`,
                  },
        },
        {
          id: "patrimonial",
          nome: "Proteção Patrimonial",
          curto: "Patrimonial",
          // Parte do valor dos imóveis e veículos com seguro (sem valores informados, pela quantidade de bens).
          regra: () => {
            if (!bens.length) return { pesou: "Nenhum imóvel ou veículo registrado." };
            const seg = bens.filter((b) => b.temSeguro === true);
            const valorSeg = seg.reduce((t, b) => t + Math.max(0, n(b.valor)), 0);
            const fracao = valorBens > 0 ? valorSeg / valorBens : seg.length / bens.length;
            return {
              fracao,
              pesou: `${seg.length} de ${plural(bens.length, "bem", "bens")} com seguro${valorBens > 0 ? ` (${fmtPct(fracao)} do valor)` : ""}.`,
            };
          },
        },
      ],
    },
    {
      id: "objetivos",
      nome: "Objetivos Financeiros",
      curto: "Objetivos",
      linhas: ["Objetivos", "Financeiros"],
      descricao: "Se os sonhos têm valor, prazo e dinheiro separado para acontecer.",
      subs: [
        {
          id: "clareza",
          nome: "Clareza dos Objetivos",
          curto: "Clareza",
          // 80%: objetivos com valor e prazo; 20%: objetivos com o porquê registrado.
          regra: () => {
            const total = c.objetivos.length;
            if (!total) return { pesou: "Nenhum objetivo registrado (3 · Objetivos)." };
            const definidos = c.objetivos.filter((o) => n(o.valorFuturo) > 0 && n(o.prazoMeses) > 0).length;
            const comMotivo = c.objetivos.filter((o) => !!s(o.motivo)).length;
            return {
              fracao: 0.8 * (definidos / total) + 0.2 * (comMotivo / total),
              pesou: `${definidos} de ${plural(total, "objetivo", "objetivos")} com valor e prazo; ${comMotivo} com o porquê registrado.`,
            };
          },
        },
        {
          id: "execucao",
          nome: "Execução",
          curto: "Execução",
          // Sobra livre do mês ÷ aporte mensal necessário de todos os objetivos (objetivos()).
          regra: () => {
            if (!c.objetivos.length) return { pesou: "Nenhum objetivo registrado (3 · Objetivos)." };
            if (ob.aporteTotal <= 0) return { pesou: ob.semPrazo > 0 ? "Informe o prazo dos objetivos." : "Informe o valor dos objetivos." };
            if (!temOrcamento) return { pesou: semOrcamento };
            const sobra = Math.max(0, f.sobraLivre);
            return {
              fracao: sobra / ob.aporteTotal,
              pesou: `Sobra livre de ${fmtBRL(sobra)}/mês para ${fmtBRL(ob.aporteTotal)}/mês necessários nos objetivos.`,
            };
          },
        },
        {
          id: "conclusao",
          nome: "Conclusão dos Objetivos",
          curto: "Conclusão",
          // Objetivos cujo aporte cabe inteiro na sobra livre (na ordem de prioridade) contam 1; os que cabem em parte, metade da cobertura.
          regra: () => {
            const comAporte = c.objetivos.filter((o) => (ob.aportes[o.id] ?? 0) > 0);
            if (!c.objetivos.length) return { pesou: "Nenhum objetivo registrado (3 · Objetivos)." };
            if (!comAporte.length) return { pesou: ob.semPrazo > 0 ? "Informe o prazo dos objetivos." : "Informe o valor dos objetivos." };
            if (!temOrcamento) return { pesou: semOrcamento };
            const cobertura = (id: string) => Math.max(0, Math.min(100, ob.sugestao[id] ?? 0)) / 100;
            const inteiros = comAporte.filter((o) => cobertura(o.id) >= 1).length;
            const parciais = comAporte.filter((o) => cobertura(o.id) > 0 && cobertura(o.id) < 1);
            return {
              fracao: (inteiros + 0.5 * parciais.reduce((t, o) => t + cobertura(o.id), 0)) / comAporte.length,
              pesou:
                (inteiros === 0
                  ? comAporte.length === 1
                    ? "O objetivo ainda não cabe inteiro na sobra livre"
                    : `Nenhum dos ${comAporte.length} objetivos cabe inteiro na sobra livre`
                  : `${inteiros} de ${plural(comAporte.length, "objetivo", "objetivos")} ${inteiros === 1 ? "cabe inteiro" : "cabem inteiros"} na sobra livre`) +
                (parciais.length ? `; ${plural(parciais.length, "cabe", "cabem")} em parte.` : "."),
            };
          },
        },
      ],
    },
    {
      id: "acumulo",
      nome: "Acúmulo de Capital",
      curto: "Acúmulo",
      linhas: ["Acúmulo", "de Capital"],
      descricao: "Se o dinheiro se acumula sem depender de crédito caro e bem distribuído.",
      subs: [
        {
          id: "bancaria",
          nome: "Independência Bancária",
          curto: "Indep. bancária",
          // Metade: sem dívidas caras; metade: parcelas sobre a renda (1 − comprometimento ÷ limite × 0,6, como no pilar Dívidas).
          regra: () => {
            if (!temRenda) return { pesou: "Informe a renda." };
            const caras = c.emprestimos.filter((e) => dividaCara(s(e.categoria)));
            const categorias = [...new Set(caras.map((e) => (s(e.categoria) || "sem categoria").toLowerCase()))];
            const parcelas = f.parcelas <= 0 ? 1 : 1 - (f.comprometimento / limite) * 0.6;
            return {
              fracao: ((caras.length ? 0 : 1) + limitar01(parcelas)) / 2,
              pesou:
                (caras.length ? `${frase(plural(caras.length, "dívida cara", "dívidas caras"))} (${juntar(categorias)})` : "Sem dívidas caras") +
                (f.parcelas > 0 ? `; parcelas em ${fmtPct(f.comprometimento)} da renda (limite ${fmtPct(limite)}).` : " e sem parcelas."),
            };
          },
        },
        {
          id: "diversificacao",
          nome: "Diversificação de Portfólio",
          curto: "Diversificação",
          // 60%: classes de investimento ÷ 4 (temas estudados em 4 · Investimentos para quem investe, previdência e imóvel de renda);
          // 40%: parte financeira do patrimônio ÷ 20% (abaixo disso a matriz sugere aumentar o patrimônio financeiro).
          regra: () => {
            const respondido = !!s(c.investimentos.temInvestimento) || !!s(c.protecao.temPrevidencia) || bens.length > 0;
            if (!respondido) return { pesou: "Complete 13 · Investimentos e 11 · Proteção (previdência)." };
            const temas = lista(c.investimentos.temas).filter((t) => CLASSES_INVESTIMENTO.includes(t)).length;
            const imovelRenda = c.imoveis.some((i) => IMOVEL_DE_RENDA.includes(s(i.categoria)));
            const classes = (p.investimentos > 0 ? Math.max(1, temas) : 0) + (p.previdencia > 0 ? 1 : 0) + (imovelRenda ? 1 : 0);
            const parteFin = p.ativos > 0 ? p.financeiro / p.ativos : 0;
            return {
              fracao: 0.6 * limitar01(classes / 4) + 0.4 * limitar01(parteFin / 0.2),
              pesou: `${Math.min(classes, 4)} de 4 classes de investimento (aplicações, previdência e imóveis de renda); ${fmtPct(parteFin)} do patrimônio em aplicações financeiras (meta: 20%).`,
            };
          },
        },
      ],
    },
    {
      id: "aposentadoria",
      nome: "Planejamento da Aposentadoria",
      curto: "Aposentadoria",
      linhas: ["Planejamento da", "Aposentadoria"],
      descricao: "Se o futuro está sendo construído para manter o padrão de vida.",
      subs: [
        {
          id: "investApos",
          nome: "Investimentos para Aposentadoria",
          curto: "Investimentos",
          // Projeção ÷ patrimônio necessário na aposentadoria (futuro().independencia).
          regra: () => {
            if (fu.rendaDesejada <= 0 || !s(c.cadastro.nascimento)) return { pesou: "Informe a data de nascimento e a renda desejada na aposentadoria." };
            return {
              fracao: fu.independencia,
              pesou:
                fu.alvo <= 0
                  ? "As outras rendas já cobrem a renda desejada na aposentadoria."
                  : `A projeção chega a ${fmtPct(Math.min(fu.independencia, 9.99))} da meta de ${fmtBRL(fu.alvo)} aos ${fu.idadeAposentadoria} anos.`,
            };
          },
        },
        {
          id: "projecao",
          nome: "Projeção e Planejamento",
          curto: "Projeção",
          // 70%: aporte mensal atual ÷ aporte necessário (futuro()); 30%: definiu como quer viver (estilo de vida ou renda desejada).
          regra: () => {
            if (fu.rendaDesejada <= 0 || !s(c.cadastro.nascimento)) return { pesou: "Informe a data de nascimento e a renda desejada na aposentadoria." };
            const aporte = fu.idadeAtingida ? (fu.faltaHoje <= 0 ? 1 : 0) : fu.aporte > 0 ? fu.aporteAtual / fu.aporte : 1;
            const definiu = nOpt(c.futuro.rendaDesejada) !== undefined || !!s(c.futuro.estiloVida);
            return {
              fracao: 0.7 * limitar01(aporte) + 0.3 * (definiu ? 1 : 0),
              pesou:
                (fu.idadeAtingida
                  ? `A idade de aposentadoria (${fu.idadeAposentadoria} anos) já chegou${fu.faltaHoje > 0 ? `; faltam ${fmtBRL(fu.faltaHoje)} para a meta` : ""}`
                  : fu.aporte <= 0
                    ? "O patrimônio atual já leva à meta"
                    : `Investe ${fmtBRL(fu.aporteAtual)}/mês de ${fmtBRL(fu.aporte)}/mês necessários`) +
                (definiu ? "." : "; falta definir o estilo de vida na aposentadoria."),
            };
          },
        },
        {
          id: "tributario",
          nome: "Conhecimento Tributário",
          curto: "Tributário",
          // 40%: declaração do IR informada; 60%: previdência coerente com o IR (PGBL só vale com a declaração completa).
          regra: () => {
            const ir = s(c.renda.declaracaoIR);
            if (!ir || !s(c.protecao.temPrevidencia)) return { pesou: "Informe a declaração do IR (6 · Renda) e a previdência (11 · Proteção)." };
            const completa = ir === "Completa";
            const modelo = completa ? "Declara no modelo completo" : ir === "Simplificada" ? "Declara no simplificado" : "Não declara IR";
            let coerente: number;
            let detalhe: string;
            if (!tipoPrev) {
              coerente = completa ? 0 : 0.5;
              detalhe = completa ? "não aproveita a dedução do PGBL (até 12% da renda bruta)" : "não tem previdência privada";
            } else if (tipoPrev === "Não sabe") {
              coerente = 0.25;
              detalhe = "não sabe o tipo do plano de previdência";
            } else if (completa) {
              coerente = tipoPrev.includes("PGBL") ? 1 : 0.5;
              detalhe = tipoPrev.includes("PGBL") ? "usa PGBL, que deduz até 12% da renda bruta" : "a previdência é VGBL: o PGBL deduziria até 12% da renda bruta";
            } else {
              coerente = tipoPrev === "VGBL" ? 1 : tipoPrev.includes("VGBL") ? 0.5 : 0;
              detalhe = tipoPrev === "VGBL" ? "usa VGBL, o plano indicado para esse caso" : "tem PGBL, cujo benefício fiscal só vale na declaração completa";
            }
            return { fracao: 0.4 + 0.6 * coerente, pesou: `${modelo}; ${detalhe}.` };
          },
        },
      ],
    },
    {
      id: "expansao",
      nome: "Expansão de Capital",
      curto: "Expansão",
      linhas: ["Expansão", "de Capital"],
      descricao: "Se os bens são conquistados sem juros e o patrimônio cresce com a idade.",
      subs: [
        {
          id: "aquisicao",
          nome: "Aquisição de Bens",
          curto: "Aquisição",
          // 60%: parte do valor dos bens já paga (valor − saldo dos financiamentos); 40%: futuras aquisições por consórcio ou à vista.
          regra: () => {
            const planejadas = sim(c.patrimonioGeral.pretendeAdquirir) ? c.aquisicoes.filter((a) => !!s(a.estrategia)) : [];
            if (!bens.length && !planejadas.length) return { pesou: "Nenhum bem ou aquisição planejada registrada (7 · Patrimônio)." };
            const pago = valorBens > 0 ? limitar01((valorBens - dv.saldoFin) / valorBens) : undefined;
            const valorPlan = planejadas.reduce((t, a) => t + Math.max(0, n(a.valorDesejado)), 0);
            const semJuros = planejadas.filter((a) => s(a.estrategia) !== "Financiamento");
            const valorSemJuros = semJuros.reduce((t, a) => t + Math.max(0, n(a.valorDesejado)), 0);
            const planejado = planejadas.length ? (valorPlan > 0 ? valorSemJuros / valorPlan : semJuros.length / planejadas.length) : undefined;
            const fracao = media([
              [pago, 0.6],
              [planejado, 0.4],
            ]);
            if (fracao === undefined) return { pesou: "Informe o valor dos bens (7 · Patrimônio)." };
            const partes = [
              pago === undefined ? "" : `${fmtPct(pago)} do valor dos bens já está pago${dv.saldoFin > 0 ? ` (${fmtBRL(dv.saldoFin)} financiados)` : ""}`,
              planejado === undefined ? "" : `${semJuros.length} de ${plural(planejadas.length, "aquisição planejada", "aquisições planejadas")} por consórcio ou à vista`,
            ].filter(Boolean);
            return { fracao, pesou: frase(`${partes.join("; ")}.`) };
          },
        },
        {
          id: "crescimento",
          nome: "Crescimento Patrimonial",
          curto: "Crescimento",
          // Patrimônio líquido ÷ patrimônio esperado (idade × renda líquida anual ÷ 10, a regra clássica).
          regra: () => {
            const idade = idadePorNascimento(s(c.cadastro.nascimento));
            if (!idade || idade <= 0 || !temRenda) return { pesou: "Informe a data de nascimento e a renda." };
            const esperado = (idade * f.renda * 12) / 10;
            return {
              fracao: p.liquido / esperado,
              pesou: `Patrimônio líquido de ${fmtBRL(p.liquido)} para ${fmtBRL(esperado)} esperados pela idade e renda (idade × renda anual ÷ 10).`,
            };
          },
        },
      ],
    },
    {
      id: "sucessao",
      nome: "Sucessão Patrimonial",
      curto: "Sucessão",
      linhas: ["Sucessão", "Patrimonial"],
      descricao: "Se o patrimônio chega à família de forma rápida, barata e segura.",
      subs: [
        {
          id: "conhecimento",
          nome: "Conhecimento sobre Sucessão",
          curto: "Conhecimento",
          // Estudou planejamento sucessório (temas de 4 · Investimentos) = 1; senão, nível de conhecimento avançado 0,4 e intermediário 0,2.
          regra: () => {
            const temas = lista(c.investimentos.temas);
            const nivel = s(c.investimentos.conhecimento);
            if (!temas.length && !nivel) return { pesou: "Informe os temas estudados e o nível de conhecimento (13 · Investimentos)." };
            if (temas.includes("Planejamento sucessório")) return { fracao: 1, pesou: "Já estudou planejamento sucessório." };
            return {
              fracao: nivel === "Avançado" ? 0.4 : nivel === "Intermediário" ? 0.2 : 0,
              pesou: `Ainda não estudou planejamento sucessório${nivel ? ` (conhecimento ${nivel.toLowerCase()} em investimentos)` : ""}.`,
            };
          },
        },
        {
          id: "implementacao",
          nome: "Implementação",
          curto: "Implementação",
          // Instrumentos que passam fora do inventário: seguro de vida individual, previdência com saldo e, com empresa, acordo de sócios.
          regra: () => {
            const aFavor: string[] = [];
            const falta: string[] = [];
            const vida = s(c.protecao.temSeguroVida) ? (pr.atual > 0 ? 1 : 0) : undefined;
            if (vida) aFavor.push("seguro de vida individual");
            else if (vida === 0) falta.push("seguro de vida individual");
            const prev = s(c.protecao.temPrevidencia) ? (p.previdencia > 0 ? 1 : 0) : undefined;
            if (prev) aFavor.push("previdência com beneficiários");
            else if (prev === 0) falta.push("previdência com beneficiários");
            const socios = sim(c.corporativo.possuiEmpresa) ? (c.corporativo.acordoSocios === true ? 1 : 0) : undefined;
            if (socios) aFavor.push("acordo de sócios");
            else if (socios === 0) falta.push("acordo de sócios");
            const fracao = media([
              [vida, 1],
              [prev, 1],
              [socios, 1],
            ]);
            return fracao === undefined ? { pesou: "Informe seguro de vida e previdência (11 · Proteção)." } : { fracao, pesou: aFavorFalta(aFavor, falta) };
          },
        },
        {
          id: "legado",
          nome: "Segurança do Legado",
          curto: "Legado",
          // Metade: seguro de vida individual + previdência ÷ custo do inventário (ITCMD e honorários);
          // metade (com cônjuge ou dependentes): cobertura do seguro de vida sobre a necessidade da família.
          regra: () => {
            const custo = pr.itcmd + pr.honorarios;
            const fora = pr.atual + p.previdencia;
            const liquidez = custo > 0 ? fora / custo : undefined;
            const familia = (c.dependentes.length > 0 || temConjuge(c)) && s(c.protecao.temSeguroVida) && pr.necessidade > 0 ? pr.cobertura : undefined;
            const fracao = media([
              [liquidez, 0.5],
              [familia, 0.5],
            ]);
            if (fracao === undefined) return { pesou: "Registre bens quitados, dependentes e seguro de vida." };
            const partes = [
              liquidez === undefined
                ? ""
                : fora <= 0
                  ? `nada fora do inventário para pagar os ${fmtBRL(custo)} de ITCMD e honorários`
                  : `seguro e previdência (${fmtBRL(fora)}) cobrem ${liquidez >= 1 ? "todo o" : `${fmtPct(liquidez)} do`} custo do inventário (${fmtBRL(custo)})`,
              familia === undefined ? "" : `a família tem ${fmtPct(familia)} da proteção necessária`,
            ].filter(Boolean);
            return { fracao, pesou: frase(`${partes.join("; ")}.`) };
          },
        },
      ],
    },
  ];

  const pilares: PilarEstrela[] = defs.map(({ subs, ...d }) => {
    const itens = subs.map((x): SubPilar => {
      const m = x.regra();
      const semDados = m.fracao === undefined;
      const nota = semDados ? 0 : notaDe(m.fracao!);
      const pct = (nota / PONTOS_SUB) * 100;
      return { id: x.id, nome: x.nome, curto: x.curto, nota, pct, status: semDados ? "sem-dados" : statusPorNota(pct), pesou: m.pesou, ...(semDados ? { semDados } : {}) };
    });
    const nota = itens.reduce((t, x) => t + x.nota, 0);
    const maximo = itens.length * PONTOS_SUB;
    const pct = Math.round((nota / maximo) * 100);
    return { ...d, nota, maximo, pct, status: itens.every((x) => x.semDados) ? "sem-dados" : statusPorNota(pct), subs: itens };
  });

  return {
    pilares,
    total: pilares.reduce((t, x) => t + x.nota, 0),
    maximo: pilares.reduce((t, x) => t + x.maximo, 0),
    temDados: pilares.some((x) => x.subs.some((y) => !y.semDados)),
  };
}

/** Ordem do resumo: crítico → atenção → saudável → sem dados (no mesmo estado, o menor % primeiro). */
const ORDEM_ESTADO: Record<Status, number> = { critico: 0, atencao: 1, ok: 2, "sem-dados": 3 };
export const porEstado = (ps: PilarEstrela[]) => [...ps].sort((a, b) => ORDEM_ESTADO[a.status] - ORDEM_ESTADO[b.status] || a.pct - b.pct);

/** Nota LIFE: total da estrela, ou undefined sem nenhum dado. */
export const notaLife = (c: Cliente) => {
  const e = estrela(c);
  return e.temDados ? e.total : undefined;
};
