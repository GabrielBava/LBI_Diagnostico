// Engrenagem no topo do cliente: abre o pop-up com os parâmetros financeiros
// (inflação geral e educacional, meta de reserva, limite de parcela e retorno real).
// Só na versão consultor.
import { useEffect, useRef, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { CAMPOS_PARAMETROS } from "@/config/campos";
import { useCliente } from "@/lib/cliente-context";
import { usePreferencias } from "@/lib/preferencias";
import { Formulario } from "./campos";
import { Botao } from "./ui";

export function ParametrosCliente() {
  const { cliente, setCampo } = useCliente();
  const { apresentacao } = usePreferencias();
  const [aberto, setAberto] = useState(false);

  const refDialogo = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!aberto) return;
    // Esc fecha; Tab fica dentro do pop-up; a página de trás não rola.
    const teclas = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAberto(false);
      if (e.key !== "Tab" || !refDialogo.current) return;
      const focaveis = [...refDialogo.current.querySelectorAll<HTMLElement>("button, input, select, textarea")].filter((el) => !el.hasAttribute("disabled"));
      if (!focaveis.length) return;
      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];
      if (e.shiftKey && document.activeElement === primeiro) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primeiro.focus();
      }
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", teclas);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", teclas);
    };
  }, [aberto]);

  if (apresentacao) return null;
  return (
    <>
      <Botao variante="secundario" onClick={() => setAberto(true)} title="Parâmetros financeiros do cliente" className="no-print">
        <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" /> Parâmetros
      </Botao>
      {aberto && (
        // O fundo rola quando o pop-up é mais alto que a tela (celular, paisagem).
        <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:pt-20" onClick={() => setAberto(false)}>
          <div
            ref={refDialogo}
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-parametros"
            className="w-full max-w-lg rounded-xl border border-border bg-popover p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 id="titulo-parametros" className="text-sm font-semibold">
                  Parâmetros financeiros
                </h2>
                <p className="text-xs text-muted-foreground">Valem só para este cliente e são salvos na hora.</p>
              </div>
              <button
                type="button"
                aria-label="Fechar"
                autoFocus
                onClick={() => setAberto(false)}
                className="rounded-md p-1.5 text-muted-foreground transition hover:bg-muted/50 hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <Formulario
              campos={CAMPOS_PARAMETROS}
              dados={cliente.parametros}
              cliente={cliente}
              colunas={2}
              onChange={(k, v) => setCampo("parametros", k, v)}
            />
            <div className="mt-5 flex justify-end">
              <Botao variante="primario" onClick={() => setAberto(false)}>
                Concluir
              </Botao>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
