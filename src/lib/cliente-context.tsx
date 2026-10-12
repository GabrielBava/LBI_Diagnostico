// Contexto do cliente aberto: leitura e atualização (com salvamento automático).
import { createContext, useContext, type ReactNode } from "react";
import type { Cliente, Item, ListaId, SecaoId, Valor } from "@/types";
import { obterCliente, salvarCliente } from "./storage";

interface Ctx {
  cliente: Cliente;
  atualizar: (f: (c: Cliente) => Cliente) => void;
  setCampo: (secao: SecaoId, key: string, v: Valor) => void;
  setLista: (lista: ListaId, itens: Item[]) => void;
  /** Rola a página até a seção indicada. */
  irPara: (secaoId: string) => void;
}

const ClienteContext = createContext<Ctx | null>(null);

export function ClienteProvider({
  cliente,
  irPara,
  children,
}: {
  cliente: Cliente;
  irPara: (secaoId: string) => void;
  children: ReactNode;
}) {
  // Lê sempre a versão mais recente do armazenamento para não perder alterações seguidas.
  const atualizar = (f: (c: Cliente) => Cliente) => salvarCliente(f(obterCliente(cliente.id) ?? cliente));
  const ctx: Ctx = {
    cliente,
    atualizar,
    setCampo: (secao, key, v) => atualizar((c) => ({ ...c, [secao]: { ...c[secao], [key]: v } })),
    setLista: (lista, itens) => atualizar((c) => ({ ...c, [lista]: itens })),
    irPara,
  };
  return <ClienteContext.Provider value={ctx}>{children}</ClienteContext.Provider>;
}

export function useCliente() {
  const ctx = useContext(ClienteContext);
  if (!ctx) throw new Error("useCliente deve ser usado dentro de ClienteProvider");
  return ctx;
}
