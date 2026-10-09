// =====================================================================
//  ARMAZENAMENTO
//  ---------------------------------------------------------------------
//  Hoje os dados ficam no navegador (localStorage). Toda leitura/escrita
//  passa por este arquivo: para migrar para um banco (ex.: Supabase),
//  basta reimplementar as funções abaixo mantendo as mesmas assinaturas.
// =====================================================================

import { useSyncExternalStore } from "react";
import type { Cliente } from "@/types";
import {
  CAMPOS_ALAVANCAGEM,
  CAMPOS_APOSENTADORIA,
  CAMPOS_PARAMETROS,
  CAMPOS_SEGURO,
  padroes,
} from "@/config/campos";
import { CONFIG_PADRAO, type ConfigConsultor } from "@/config/defaults";
import { uid } from "./format";

const CHAVE_CLIENTES = "life-diagnostico:clientes";
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

export function normalizar(c: Partial<Cliente> & { id: string }): Cliente {
  const agora = new Date().toISOString();
  return {
    id: c.id,
    criadoEm: c.criadoEm ?? agora,
    atualizadoEm: c.atualizadoEm ?? agora,
    cadastro: { ...(c.cadastro ?? {}) },
    parametros: { ...padroes(CAMPOS_PARAMETROS), ...(c.parametros ?? {}) },
    sonhos: c.sonhos ?? [],
    filhos: c.filhos ?? [],
    receitas: c.receitas ?? [],
    despesas: c.despesas ?? [],
    patrimonio: c.patrimonio ?? [],
    dividas: c.dividas ?? [],
    seguro: { ...padroes(CAMPOS_SEGURO), ...(c.seguro ?? {}) },
    aposentadoria: { ...padroes(CAMPOS_APOSENTADORIA), ...(c.aposentadoria ?? {}) },
    alavancagem: { ...padroes(CAMPOS_ALAVANCAGEM), ...(c.alavancagem ?? {}) },
    plano: c.plano ?? [],
    historico: c.historico ?? [],
    notas: c.notas ?? {},
    naoAplica: c.naoAplica ?? {},
    roteiroFeito: c.roteiroFeito ?? {},
  };
}

// ---------------------------------------------------------------------
//  Store simples com assinatura (para o React re-renderizar)
// ---------------------------------------------------------------------
let cache: Cliente[] | null = null;
const ouvintes = new Set<() => void>();
const avisar = () => ouvintes.forEach((f) => f());

const carregar = (): Cliente[] => {
  if (!cache) cache = ler<Cliente[]>(CHAVE_CLIENTES, []).map(normalizar);
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
    historico: [],
  });
  persistir([copia, ...carregar()]);
  return copia;
}

export function exportarJSON(ids?: string[]) {
  const dados = ids ? carregar().filter((c) => ids.includes(c.id)) : carregar();
  return JSON.stringify({ app: "diagnostico-life", versao: 1, exportadoEm: new Date().toISOString(), clientes: dados }, null, 2);
}

/** Importa clientes de um backup. Clientes com o mesmo id são substituídos. */
export function importarJSON(texto: string) {
  const json = JSON.parse(texto);
  const recebidos: Cliente[] = (Array.isArray(json) ? json : json.clientes ?? []).map(normalizar);
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
