// Engrenagem no topo do cliente: abre o pop-up com os parâmetros financeiros
// (inflação geral e educacional, meta de reserva, limite de parcela e retorno real).
// Só na versão consultor.
import { useEffect, useState } from "react";
import { Settings, X } from "lucide-react";
import { CAMPOS_PARAMETROS } from "@/config/campos";
import { useCliente } from "@/lib/cliente-context";
import { usePreferencias } from "@/lib/preferencias";
import { Formulario } from "./campos";
import { Botao } from "./ui";

export function ParametrosCliente() {
  const { cliente, setCampo } = useCliente();
  const { apresentacao } = usePreferencias();
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    if (!aberto) return;
    const fechar = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    window.addEventListener("keydown", fechar);
    return () => window.removeEventListener("keydown", fechar);
  }, [aberto]);

  if (apresentacao) return null;
  return (
    <>
      <Botao variante="secundario" onClick={() => setAberto(true)} title="Parâmetros financeiros do cliente" className="no-print">
        <Settings className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="hidden sm:inline">Parâmetros</span>
        <span className="sr-only sm:hidden">Parâmetros financeiros</span>
      </Botao>
      {aberto && (
        <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/50 p-4 pt-20" onClick={() => setAberto(false)}>
          <div
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
