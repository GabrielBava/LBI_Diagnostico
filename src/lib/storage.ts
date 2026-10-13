// =====================================================================
//  ARMAZENAMENTO
//  ---------------------------------------------------------------------
//  Hoje os dados ficam no navegador (localStorage). Toda leitura/escrita
//  passa por este arquivo: para migrar para um banco (ex.: Supabase),
//  basta reimplementar as funções abaixo mantendo as mesmas assinaturas.
// =====================================================================

import { useSyncExternalStore } from "react";
import type { Cliente } from "@/types";
import { CAMPOS_FUTURO, CAMPOS_PARAMETROS, CAMPOS_PREMISSAS_PROTECAO, CAMPOS_PROTECAO, JORNADA_PADRAO, padroes } from "@/config/campos";
import { CONFIG_PADRAO, type ConfigConsultor } from "@/config/defaults";
import { uid } from "./format";
import { atualizarV4, atualizarV6, atualizarV8, migrarV1 } from "./migracao";

const CHAVE_CLIENTES = "life-diagnostico-v2:clientes";
const CHAVE_CLIENTES_V1 = "life-diagnostico:clientes";
const CHAVE_CONFIG = "life-diagnostico:config";

const ler = <T,>(chave: string, padrao: T): T => {
  try {
    const raw = localStorage.getItem(chave);
    return raw ? (JSON.parse(raw) as T) : padrao;
  } catch {
    return padrao;
  }
};
const gravar = (chave: string, valor: unknown) => {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    /* armazenamento indisponível (modo privado) — segue em memória */
  }
};

// ---------------------------------------------------------------------
//  Cliente novo / normalização (garante campos novos em dados antigos)
// ---------------------------------------------------------------------
export function novoCliente(nome = ""): Cliente {
  const agora = new Date().toISOString();
  return normalizar({ id: uid(), criadoEm: agora, atualizadoEm: agora, cadastro: { nome } });
}

export function normalizar(original: Partial<Cliente> & { id: string }): Cliente {
  const agora = new Date().toISOString();
  const c = atualizarV8(atualizarV6(atualizarV4(original)));
  return {
    id: c.id,
    versaoDados: c.versaoDados,
    coletaFinalizada: c.coletaFinalizada,
    criadoEm: c.criadoEm ?? agora,
    atualizadoEm: c.atualizadoEm ?? agora,
    cadastro: { ...(c.cadastro ?? {}) },
    parametros: { ...padroes(CAMPOS_PARAMETROS), ...(c.parametros ?? {}) },
    objetivos: c.objetivos ?? [],
    dependentes: c.dependentes ?? [],
    despesas: { ...(c.despesas ?? {}) },
    despesasExtras: c.despesasExtras ?? [],
    renda: { ...(c.renda ?? {}) },
    outrasRendas: c.outrasRendas ?? [],
    cartoes: c.cartoes ?? [],
    imoveis: c.imoveis ?? [],
    moveis: c.moveis ?? [],
    patrimonioGeral: { ...(c.patrimonioGeral ?? {}) },
    aquisicoes: c.aquisicoes ?? [],
    financiamentos: c.financiamentos ?? [],
    consorcios: c.consorcios ?? [],
    emprestimos: c.emprestimos ?? [],
    projetos: c.projetos ?? [],
    corporativo: { ...(c.corporativo ?? {}) },
    protecao: { ...padroes(CAMPOS_PROTECAO), ...padroes(CAMPOS_PREMISSAS_PROTECAO), horizonte: 5, ...(c.protecao ?? {}) },
    investimentos: { ...(c.investimentos ?? {}) },
    futuro: { ...padroes(CAMPOS_FUTURO), ...(c.futuro ?? {}) },
    mudancas: c.mudancas ?? [],
    planoAtual: c.planoAtual ?? [],
    planoPotencial: c.planoPotencial ?? [],
    planoOtimizacao: c.planoOtimizacao ?? [],
    cardsOcultos: c.cardsOcultos ?? {},
    simulacao: { ...(c.simulacao ?? {}) },
    plano: c.plano ?? [],
    jornada: c.jornada?.length
      ? c.jornada
      : JORNADA_PADRAO.map((r) => ({ id: uid(), titulo: r.titulo, descricao: r.descricao, status: "Pendente" })),
    notas: c.notas ?? {},
    naoAplica: c.naoAplica ?? {},
    roteiroFeito: c.roteiroFeito ?? {},
    ocultos: c.ocultos ?? {},
  };
}

// ---------------------------------------------------------------------
//  Store simples com assinatura (para o React re-renderizar)
// ---------------------------------------------------------------------
let cache: Cliente[] | null = null;
const ouvintes = new Set<() => void>();
const avisar = () => ouvintes.forEach((f) => f());

const carregar = (): Cliente[] => {
  if (!cache) {
    const v2 = ler<Cliente[] | null>(CHAVE_CLIENTES, null);
    if (v2) cache = v2.map(normalizar);
    else {
      // Primeira abertura da versão 2: traz os clientes da versão anterior
      // (os dados antigos continuam guardados, sem alteração).
      cache = ler<Record<string, unknown>[]>(CHAVE_CLIENTES_V1, []).map((v1) => normalizar(migrarV1(v1)));
      if (cache.length) gravar(CHAVE_CLIENTES, cache);
    }
  }
  return cache;
};
const persistir = (lista: Cliente[]) => {
  cache = lista;
  gravar(CHAVE_CLIENTES, lista);
  avisar();
};

export const listarClientes = () => carregar();
export const obterCliente = (id: string) => carregar().find((c) => c.id === id);

export function salvarCliente(c: Cliente) {
  const atualizado = { ...c, atualizadoEm: new Date().toISOString() };
  const lista = carregar();
  const i = lista.findIndex((x) => x.id === c.id);
  persistir(i >= 0 ? lista.map((x) => (x.id === c.id ? atualizado : x)) : [atualizado, ...lista]);
  return atualizado;
}

export function excluirCliente(id: string) {
  persistir(carregar().filter((c) => c.id !== id));
}

export function duplicarCliente(id: string) {
  const c = obterCliente(id);
  if (!c) return;
  const agora = new Date().toISOString();
  const copia = normalizar({
    ...structuredClone(c),
    id: uid(),
    criadoEm: agora,
    atualizadoEm: agora,
    cadastro: { ...c.cadastro, nome: `${c.cadastro.nome ?? "Cliente"} (cópia)` },
  });
  persistir([copia, ...carregar()]);
  return copia;
}

export function exportarJSON(ids?: string[]) {
  const dados = ids ? carregar().filter((c) => ids.includes(c.id)) : carregar();
  return JSON.stringify({ app: "diagnostico-life", versao: 2, exportadoEm: new Date().toISOString(), clientes: dados }, null, 2);
}

/** Importa clientes de um backup. Clientes com o mesmo id são substituídos. */
export function importarJSON(texto: string) {
  const json = JSON.parse(texto);
  const lista: Record<string, unknown>[] = Array.isArray(json) ? json : json.clientes ?? [];
  // Backups da versão 1 (com "sonhos"/"receitas") são convertidos automaticamente.
  const recebidos: Cliente[] = lista.map((c) => normalizar("sonhos" in c || "receitas" in c ? migrarV1(c) : (c as unknown as Cliente)));
  const porId = new Map(carregar().map((c) => [c.id, c]));
  recebidos.forEach((c) => porId.set(c.id, c));
  persistir([...porId.values()]);
  return recebidos.length;
}

export function useClientes() {
  return useSyncExternalStore(
    (f) => {
      ouvintes.add(f);
      return () => ouvintes.delete(f);
    },
    carregar,
    carregar,
  );
}

// ---------------------------------------------------------------------
//  Preferências (consultor, tema, modo apresentação)
// ---------------------------------------------------------------------
export const lerConfig = (): ConfigConsultor => ({ ...CONFIG_PADRAO, ...ler(CHAVE_CONFIG, {}) });
export const salvarConfig = (c: ConfigConsultor) => {
  gravar(CHAVE_CONFIG, c);
  avisar();
};

export function baixarArquivo(nome: string, conteudo: string, tipo = "application/json") {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
