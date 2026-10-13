// Converte um cliente da versão 1 (estrutura antiga) para a versão 2.
// Campos sem equivalente direto são preservados nas anotações do cliente.
import { DEPENDENTES_ESCOLARES, HORIZONTES_PADRAO_VIDA } from "@/config/campos";
import type { Cliente, Item } from "@/types";
import { uid } from "./format";

type V1 = Record<string, unknown>;
const lista = (v: unknown) => (Array.isArray(v) ? (v as Item[]) : []);
const obj = (v: unknown) => (v && typeof v === "object" ? (v as Record<string, unknown>) : {});
const num = (v: unknown) => (typeof v === "number" ? v : Number(v) || 0);

/** Escolaridade provável pela idade (a versão 1 não tinha o nível escolar). */
function nivelPorIdade(idade: number, escola: unknown, mensalidade: number) {
  if (escola === "Ainda não estuda") return "Não estuda";
  if (idade <= 0) return mensalidade > 0 ? "Fundamental I" : undefined;
  if (idade < 6) return "Educação infantil";
  if (idade < 11) return "Fundamental I";
  if (idade < 15) return "Fundamental II";
  if (idade < 18) return "Ensino médio";
  return mensalidade > 0 ? "Graduação" : "Não estuda";
}

const CATEGORIA_SONHO: Record<string, string> = {
  Imóvel: "Casa",
  Veículo: "Veículo",
  Viagem: "Viagem",
  Educação: "Educação",
  "Negócio próprio": "Profissional",
  "Família / Casamento": "Família",
  Experiência: "Hobby",
};

export function migrarV1(v1: V1): Partial<Cliente> & { id: string } {
  const cad = obj(v1.cadastro);
  const receitas = lista(v1.receitas);
  const patrimonio = lista(v1.patrimonio);
  const dividas = lista(v1.dividas);
  const filhos = lista(v1.filhos);

  const principal = receitas.find((r) => r.titular !== "Cônjuge" && String(r.tipo ?? "").startsWith("Ativa") && r.frequencia !== "Anual");
  // Mesma regra do principal: salário é renda ativa e mensal (bônus anual vai para outras rendas).
  const conjuge = receitas.find((r) => r.titular === "Cônjuge" && String(r.tipo ?? "").startsWith("Ativa") && r.frequencia !== "Anual");
  const financeiros = patrimonio.filter((p) => ["Reserva / Caixa", "Renda fixa", "Renda variável"].includes(String(p.tipo)));
  const liquidos = financeiros.filter((p) => ["Diária", "Até 30 dias"].includes(String(p.liquidez)));
  const previdencia = patrimonio.filter((p) => p.tipo === "Previdência");
  const empresas = patrimonio.filter((p) => p.tipo === "Empresa / Participação");
  const outrosBens = patrimonio.filter((p) => p.tipo === "Outros");
  const pmt = (saldo: number, taxa: number, meses: number) => {
    const i = Math.pow(1 + taxa / 100, 1 / 12) - 1;
    return meses <= 0 ? 0 : i === 0 ? saldo / meses : (saldo * i) / (1 - Math.pow(1 + i, -meses));
  };

  return {
    id: String(v1.id ?? uid()),
    criadoEm: v1.criadoEm as string,
    atualizadoEm: v1.atualizadoEm as string,
    cadastro: {
      nome: cad.nome as string,
      email: cad.email as string,
      telefone: cad.telefone as string,
      nascimento: cad.nascimento as string,
      ocupacao: cad.ocupacao as string,
      regimeTrabalho: cad.regimeTrabalho as string,
      perfil: cad.perfil as string,
      estadoCivil: cad.estadoCivil as string,
      conjuge: cad.conjuge as string,
      temFilhos: filhos.length ? "Sim" : undefined,
      qtdFilhos: filhos.length || undefined,
      motivacao: cad.motivacao as string,
      satisfacao: cad.satisfacao as number,
    },
    parametros: obj(v1.parametros) as Cliente["parametros"],
    objetivos: lista(v1.sonhos).map((s) => ({
      id: s.id,
      tipo: s.prioridade === "Alta" ? "Essencial" : "Desejo",
      titulo: s.descricao,
      categoria: CATEGORIA_SONHO[String(s.categoria)] ?? "Outro",
      // O que já foi acumulado sai do valor que ainda falta juntar.
      valorFuturo: num(s.acumulado) > 0 ? Math.max(0, num(s.valor) - num(s.acumulado)) : s.valor,
      prazoMeses: num(s.prazo) * 12 || undefined,
      prioridade: s.prioridade,
      motivo: s.motivo,
    })),
    dependentes: filhos.map((f) => ({
      id: f.id,
      categoria: "Filho(a)",
      nome: f.nome,
      escola: f.escola === "Pública" || f.escola === "Particular" ? f.escola : undefined,
      idade: num(f.idade) > 0 ? num(f.idade) : undefined,
      nivelEscola: nivelPorIdade(num(f.idade), f.escola, num(f.mensalidadeEscola)),
      mensalidade: f.mensalidadeEscola,
    })),
    despesasExtras: lista(v1.despesas).map((d) => ({
      id: d.id,
      descricao: d.categoria,
      bloco: d.tipo === "Variável" || d.tipo === "Luxo" ? "Variável" : "Fixa",
      valor: d.frequencia === "Anual" ? num(d.valor) / 12 : num(d.valor),
    })),
    renda: { renda: principal?.valor, rendaConjuge: conjuge?.valor },
    outrasRendas: receitas
      .filter((r) => r !== principal && r !== conjuge)
      .map((r) => ({
        id: r.id,
        descricao: r.fonte,
        tipo: String(r.tipo ?? "").startsWith("Passiva") ? "Aluguel" : r.frequencia === "Anual" ? "Bônus / PLR" : "Outros",
        pessoa: r.titular === "Cônjuge" ? "Cônjuge" : r.titular === "Família" ? "Outra pessoa" : "Cliente",
        valor: r.valor,
        frequencia: r.frequencia,
      })),
    imoveis: patrimonio
      .filter((p) => p.tipo === "Imóvel")
      .map((p) => ({ id: p.id, categoria: "Moradia", tipo: "Apartamento", valor: p.valor, quitado: true })),
    moveis: patrimonio
      .filter((p) => p.tipo === "Veículo")
      .map((p) => ({ id: p.id, tipo: "Carro", nome: p.descricao, valor: p.valor, quitado: true })),
    financiamentos: dividas
      .filter((d) => d.tipo === "Financiamento")
      .map((d) => ({ id: d.id, tipo: "Outro", saldo: d.saldo, prazo: d.prazo, parcela: Math.round(pmt(num(d.saldo), num(d.taxa), num(d.prazo))) })),
    emprestimos: dividas
      .filter((d) => d.tipo !== "Financiamento")
      // O saldo informado é mantido (dívida sem prazo, como cartão, fica só com o saldo).
      .map((d) => ({ id: d.id, instituicao: d.descricao, saldo: d.saldo, prazo: d.prazo, parcela: Math.round(pmt(num(d.saldo), num(d.taxa), num(d.prazo))) })),
    // "Outros" bens não têm categoria própria: entram nos investimentos (e ficam anotados).
    investimentos:
      financeiros.length || outrosBens.length
        ? {
            temInvestimento: "Sim",
            valor: [...financeiros, ...outrosBens].reduce((t, p) => t + num(p.valor), 0),
            liquidez: liquidos.reduce((t, p) => t + num(p.valor), 0),
          }
        : {},
    corporativo: empresas.length
      ? { possuiEmpresa: "Sim", valorParticipacao: empresas.reduce((t, p) => t + num(p.valor), 0) }
      : {},
    protecao: {
      temSeguroVida: num(obj(v1.seguro).capitalAtual) > 0 ? "Sim" : undefined,
      capitalAtual: obj(v1.seguro).capitalAtual as number,
      seguroEmpresa: obj(v1.seguro).capitalEmpresa as number,
      temInvalidez: obj(v1.seguro).temInvalidez as string,
      temSaude: obj(v1.seguro).temSaude as string,
      temPrevidencia: previdencia.length ? "Sim" : undefined,
      valorPrevidencia: previdencia.reduce((t, p) => t + num(p.valor), 0) || undefined,
    },
    futuro: { idadeAposentadoria: obj(v1.aposentadoria).idadeAlvo as number },
    notas: {
      ...(obj(v1.notas) as Record<string, string>),
      ...(outrosBens.length
        ? {
            investimentos: [
              obj(v1.notas).investimentos,
              `Versão anterior — "Outros" bens somados aos investimentos: ${outrosBens.map((p) => `${String(p.descricao ?? "Outro")} (${num(p.valor)})`).join(", ")}.`,
            ]
              .filter(Boolean)
              .join("\n"),
          }
        : {}),
    },
  };
}

/**
 * Ajusta clientes salvos na versão 4 para a estrutura atual (v5).
 * Idempotente: pode rodar a cada carregamento sem alterar dados já convertidos.
 */
export function atualizarV4(c: Partial<Cliente> & { id: string }): Partial<Cliente> & { id: string } {
  // Conversões que não podem repetir (somam ou movem valores) rodam só uma vez.
  const primeiraVez = (c.versaoDados ?? 0) < 5;
  const despesas: Record<string, number | undefined> = {};
  const extras: Item[] = [...(c.despesasExtras ?? [])].map((e) =>
    e.grupo ? e : { ...e, grupo: e.bloco === "Variável" ? "outros" : "outrasFixas" },
  );
  const GRUPOS_V4 = [
    "casa", "alimentacao", "transporte", "saude", "cuidados", "impostos", "servicosFinanceiros", "profissionais",
    "mercado", "seguros", "educacao", "restaurantes", "lazer", "roupas", "assinaturas", "compras", "esportes", "viagens", "outros",
  ];
  Object.entries(c.despesas ?? {}).forEach(([chave, valor]) => {
    if (chave.includes(".")) despesas[chave] = valor;
    else if (chave === "financiamentos") despesas["financiamentos.parcelas"] = valor;
    else if (num(valor) > 0)
      // Valor por categoria da versão anterior vira um item do bloco correspondente.
      extras.push({ id: uid(), grupo: GRUPOS_V4.includes(chave) ? chave : "outrasFixas", descricao: "Total (versão anterior)", valor });
  });

  const renda = { ...(c.renda ?? {}) };
  if (renda.renda !== undefined && renda.liquidaCliente === undefined) renda.liquidaCliente = renda.renda;
  if (renda.rendaConjuge !== undefined && renda.liquidaConjuge === undefined) renda.liquidaConjuge = renda.rendaConjuge;
  delete renda.renda;
  delete renda.rendaConjuge;

  const investimentos = { ...(c.investimentos ?? {}) };
  const protecao = { ...(c.protecao ?? {}) };
  if (primeiraVez && investimentos.temInvestimento === "Sim" && protecao.temReserva === undefined && num(investimentos.liquidez) > 0) {
    // A parte com liquidez vira a reserva, limitada ao valor investido (não cria dinheiro novo).
    const reserva = Math.min(num(investimentos.liquidez), num(investimentos.valor));
    if (reserva > 0) {
      protecao.temReserva = "Sim";
      protecao.valorReserva = reserva;
      investimentos.valor = num(investimentos.valor) - reserva;
    }
  }
  // Anos de proteção da v4 viram o horizonte mais próximo (1, 5 ou 15 anos).
  if (primeiraVez && num(protecao.anosProtecao) > 0 && protecao.horizonte === undefined) {
    const anos = num(protecao.anosProtecao);
    protecao.horizonte = HORIZONTES_PADRAO_VIDA.reduce((melhor, h) => (Math.abs(h - anos) < Math.abs(melhor - anos) ? h : melhor));
  }
  delete investimentos.liquidez;
  delete protecao.anosProtecao;
  delete protecao.custoInventario;

  // Na v4 todo dependente tinha mensalidade. Na v5 só filhos, enteados e netos estudam:
  // a mensalidade dos demais vira "outros custos" (e a categoria "Cônjuge" deixou de existir).
  const dependentes = primeiraVez
    ? (c.dependentes ?? []).map((d) => {
        const categoria = d.categoria === "Cônjuge" ? "Outro dependente" : d.categoria;
        if (!categoria || DEPENDENTES_ESCOLARES.includes(String(categoria)) || num(d.mensalidade) <= 0) return { ...d, categoria };
        const { mensalidade, nivelEscola: _nivel, escola: _escola, ...resto } = d;
        return { ...resto, categoria, outrosCustos: num(d.outrosCustos) + num(mensalidade) };
      })
    : c.dependentes;

  return { ...c, versaoDados: Math.max(5, c.versaoDados ?? 0), despesas, despesasExtras: extras, renda, investimentos, protecao, dependentes };
}

/**
 * Subcategorias de despesa removidas na versão 6: o valor já salvo vira um
 * item extra (com o nome antigo) para não sumir do total.
 */
export const DESPESAS_REMOVIDAS: Record<string, { grupo: string; descricao: string }> = {
  "mercado.limpeza": { grupo: "mercado", descricao: "Limpeza e higiene" },
  "transporte.manutencao": { grupo: "transporte", descricao: "Manutenção do veículo" },
  "transporte.ipva": { grupo: "transporte", descricao: "IPVA e licenciamento" },
  "impostos.ir": { grupo: "outrasFixas", descricao: "Imposto de renda (parcelas)" },
  "impostos.outros": { grupo: "outrasFixas", descricao: "Outros impostos e taxas" },
  "servicosFinanceiros.tarifas": { grupo: "outrasFixas", descricao: "Tarifas bancárias" },
  "servicosFinanceiros.anuidade": { grupo: "outrasFixas", descricao: "Anuidade de cartão" },
  "compras.casa": { grupo: "outros", descricao: "Casa e decoração" },
  "compras.eletronicos": { grupo: "outros", descricao: "Eletrônicos" },
  "compras.presentes": { grupo: "outros", descricao: "Presentes" },
};
/** Blocos removidos na versão 6 → bloco que recebe os itens extras. */
const GRUPOS_REMOVIDOS: Record<string, string> = {
  impostos: "outrasFixas",
  servicosFinanceiros: "outrasFixas",
  compras: "outros",
  financiamentos: "outrasFixas",
};

/**
 * Versão 6: despesas sem os blocos removidos, parcelas só em 8 · Financiamento
 * e crédito, situação do bem (Quitado/Financiado) no lugar do sim/não "quitado".
 * Roda uma vez por cliente (marcador versaoDados).
 */
export function atualizarV6(c: Partial<Cliente> & { id: string }): Partial<Cliente> & { id: string } {
  if ((c.versaoDados ?? 0) >= 6) return c;
  const despesas: Record<string, number | undefined> = {};
  const extras: Item[] = (c.despesasExtras ?? []).map((e) =>
    GRUPOS_REMOVIDOS[String(e.grupo)] ? { ...e, grupo: GRUPOS_REMOVIDOS[String(e.grupo)] } : e,
  );
  let parcelasDigitadas = 0;
  Object.entries(c.despesas ?? {}).forEach(([chave, valor]) => {
    const removida = DESPESAS_REMOVIDAS[chave];
    if (chave === "financiamentos.parcelas") parcelasDigitadas = num(valor);
    else if (removida) {
      if (num(valor) > 0) extras.push({ id: uid(), grupo: removida.grupo, descricao: removida.descricao, valor });
    } else despesas[chave] = valor;
  });

  const situacao = (b: Item): Item => {
    if (b.situacao) return b;
    const { quitado, ...resto } = b;
    return { ...resto, situacao: quitado === true ? "Quitado" : "Financiado" };
  };
  const imoveis = (c.imoveis ?? []).map(situacao);
  const moveis = (c.moveis ?? []).map(situacao);

  // Parcelas digitadas em Despesas valiam quando nenhuma dívida tinha parcela (mesma regra da v5):
  // nesse caso viram um financiamento, para o total não cair.
  const parcelasCadastradas =
    [...(c.financiamentos ?? []), ...(c.consorcios ?? []), ...(c.emprestimos ?? [])].reduce((t, d) => t + num(d.parcela), 0) +
    [...imoveis, ...moveis].filter((b) => b.situacao === "Financiado").reduce((t, b) => t + num(b.parcela), 0);
  const financiamentos =
    parcelasDigitadas > 0 && parcelasCadastradas <= 0
      ? [...(c.financiamentos ?? []), { id: uid(), tipo: "Outro", parcela: parcelasDigitadas }]
      : c.financiamentos;

  return { ...c, versaoDados: 6, despesas, despesasExtras: extras, imoveis, moveis, financiamentos };
}
