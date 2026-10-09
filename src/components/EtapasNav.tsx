import { useEffect, useRef } from "react";
import { Check } from "lucide-react";
import { ETAPAS, FASES, etapaConcluida, progresso, type EtapaId } from "@/config/etapas";
import type { Cliente } from "@/types";
import { BarraProgresso } from "./ui";

export function EtapasNav({
  cliente,
  atual,
  onSelect,
}: {
  cliente: Cliente;
  atual: EtapaId;
  onSelect: (id: EtapaId) => void;
}) {
  const prog = progresso(cliente);
  const ativoRef = useRef<HTMLButtonElement>(null);
  // No celular o menu é uma faixa horizontal: centraliza a etapa atual.
  useEffect(() => {
    if (window.innerWidth < 768) ativoRef.current?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [atual]);

  return (
    <nav className="no-print min-w-0 max-w-full shrink-0 md:w-52 lg:w-60">
      <div className="sticky top-20 flex max-w-full flex-row gap-3 overflow-x-auto rounded-xl border border-border bg-card p-2 md:max-h-[calc(100vh-6rem)] md:flex-col md:overflow-y-auto md:overflow-x-visible md:p-3">
        <div className="hidden rounded-lg border border-primary/25 bg-primary/5 p-3 md:block">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">Progresso do plano</span>
            <span className="text-xs font-bold text-primary">{prog.pct}%</span>
          </div>
          <BarraProgresso valor={prog.pct} className="mt-2" />
          <p className="mt-2 text-[11px] leading-snug text-muted-foreground">{prog.mensagem}</p>
          {prog.proxima && prog.proxima.id !== atual && (
            <button
              type="button"
              onClick={() => onSelect(prog.proxima!.id)}
              className="mt-2 text-[11px] font-semibold text-primary hover:underline"
            >
              Continuar: {prog.proxima.label} →
            </button>
          )}
        </div>

        {FASES.map((fase) => (
          <div key={fase.id} className="flex shrink-0 flex-row gap-1 md:flex-col">
            <div className="hidden px-2 pb-1 pt-1 md:block">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">
                {fase.numero} · {fase.nome}
              </div>
            </div>
            {ETAPAS.filter((e) => e.fase === fase.id).map((e) => {
              const ativo = e.id === atual;
              const ok = etapaConcluida(cliente, e);
              const Icone = e.icone;
              return (
                <button
                  key={e.id}
                  ref={ativo ? ativoRef : undefined}
                  type="button"
                  onClick={() => onSelect(e.id)}
                  className={`flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-left text-xs font-medium transition md:whitespace-normal ${
                    ativo ? "bg-gold text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                  }`}
                >
                  <span
                    className={`hidden h-5 w-5 shrink-0 items-center justify-center rounded-full md:inline-flex ${
                      ativo ? "bg-primary-foreground/25" : ok ? "bg-success/20 text-success" : "bg-muted/60"
                    }`}
                  >
                    {ok ? <Check className="h-3 w-3" strokeWidth={3} /> : <Icone className="h-3 w-3" />}
                  </span>
                  <Icone className="h-3.5 w-3.5 md:hidden" />
                  <span className="min-w-0">{e.label}</span>
                  {cliente.naoAplica[e.id] && <span className="ml-auto hidden text-[9px] uppercase opacity-70 md:inline">n/a</span>}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </nav>
  );
}
