// Converte um cliente da versão 1 (estrutura antiga) para a versão 2.
// Campos sem equivalente direto são preservados nas anotações do cliente.
import type { Cliente, Item } from "@/types";
import { uid } from "./format";

type V1 = Record<string, unknown>;
const lista = (v: unknown) => (Array.isArray(v) ? (v as Item[]) : []);
const obj = (v: unknown) => (v && typeof v === "object" ? (v as Record<string, unknown>) : {});
const num = (v: unknown) => (typeof v === "number" ? v : Number(v) || 0);

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
  const conjuge = receitas.find((r) => r.titular === "Cônjuge" && r !== principal);
  const financeiros = patrimonio.filter((p) => ["Reserva / Caixa", "Renda fixa", "Renda variável"].includes(String(p.tipo)));
  const liquidos = financeiros.filter((p) => ["Diária", "Até 30 dias"].includes(String(p.liquidez)));
  const previdencia = patrimonio.filter((p) => p.tipo === "Previdência");
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
      valorFuturo: s.valor,
      prazoMeses: num(s.prazo) * 12 || undefined,
      prioridade: s.prioridade,
      motivo: s.motivo,
    })),
    dependentes: filhos.map((f) => ({
      id: f.id,
      categoria: "Filho(a)",
      nome: f.nome,
      escola: f.escola === "Pública" || f.escola === "Particular" ? f.escola : undefined,
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
      .map((d) => ({ id: d.id, instituicao: d.descricao, prazo: d.prazo, parcela: Math.round(pmt(num(d.saldo), num(d.taxa), num(d.prazo))) })),
    investimentos: financeiros.length
      ? {
          temInvestimento: "Sim",
          valor: financeiros.reduce((t, p) => t + num(p.valor), 0),
          liquidez: liquidos.reduce((t, p) => t + num(p.valor), 0),
        }
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
    notas: obj(v1.notas) as Record<string, string>,
  };
}

/**
 * Ajusta clientes salvos na versão 4 para a estrutura atual (v5).
 * Idempotente: pode rodar a cada carregamento sem alterar dados já convertidos.
 */
export function atualizarV4(c: Partial<Cliente> & { id: string }): Partial<Cliente> & { id: string } {
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
  if (investimentos.liquidez !== undefined && protecao.temReserva === undefined && num(investimentos.liquidez) > 0) {
    protecao.temReserva = "Sim";
    protecao.valorReserva = investimentos.liquidez;
    investimentos.valor = Math.max(0, num(investimentos.valor) - num(investimentos.liquidez));
  }
  delete investimentos.liquidez;
  delete protecao.anosProtecao;
  delete protecao.custoInventario;

  return { ...c, despesas, despesasExtras: extras, renda, investimentos, protecao };
}
