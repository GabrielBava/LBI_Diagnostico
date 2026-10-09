// Preferências da interface guardadas no navegador: tema e modo apresentação.
import { useSyncExternalStore } from "react";

type Prefs = { tema: "dark" | "light"; apresentacao: boolean };

const ler = (): Prefs => {
  try {
    return {
      tema: localStorage.getItem("life-theme") === "light" ? "light" : "dark",
      apresentacao: localStorage.getItem("life-modo-apresentacao") === "1",
    };
  } catch {
    return { tema: "dark", apresentacao: false };
  }
};

let atual = ler();
const ouvintes = new Set<() => void>();

function aplicarTema(t: Prefs["tema"]) {
  const el = document.documentElement;
  el.classList.toggle("light", t === "light");
  el.classList.toggle("dark", t === "dark");
  el.style.colorScheme = t;
}

function definir(p: Partial<Prefs>) {
  atual = { ...atual, ...p };
  try {
    localStorage.setItem("life-theme", atual.tema);
    localStorage.setItem("life-modo-apresentacao", atual.apresentacao ? "1" : "0");
  } catch {
    /* ignora */
  }
  aplicarTema(atual.tema);
  ouvintes.forEach((f) => f());
}

export function usePreferencias() {
  const prefs = useSyncExternalStore(
    (f) => {
      ouvintes.add(f);
      return () => ouvintes.delete(f);
    },
    () => atual,
  );
  return {
    ...prefs,
    alternarTema: () => definir({ tema: prefs.tema === "dark" ? "light" : "dark" }),
    alternarApresentacao: () => definir({ apresentacao: !prefs.apresentacao }),
  };
}
