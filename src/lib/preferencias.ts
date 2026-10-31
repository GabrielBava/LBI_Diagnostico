// Preferências da interface: o tema fica guardado no navegador; o diagnóstico sempre
// abre na versão apresentação (vai até o pré-diagnóstico) e o consultor alterna para a versão consultor.
import { useSyncExternalStore } from "react";

type Prefs = { tema: "dark" | "light"; apresentacao: boolean };

const ler = (): Prefs => {
  try {
    return {
      tema: localStorage.getItem("life-theme") === "light" ? "light" : "dark",
      apresentacao: true,
    };
  } catch {
    return { tema: "dark", apresentacao: true };
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
