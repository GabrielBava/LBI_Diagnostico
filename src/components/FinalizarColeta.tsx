// Botão "Finalizar coleta": fica depois da última seção de coleta.
// Ao clicar, libera o pré-diagnóstico (5.1) e o diagnóstico completo (etapa 6)
// e rola a página até o 5.1. Antes disso, essas etapas não aparecem.
import { ClipboardCheck, RotateCcw } from "lucide-react";
import { progresso } from "@/config/estrutura";
import { useCliente } from "@/lib/cliente-context";
import { fmtData } from "@/lib/format";
import { usePreferencias } from "@/lib/preferencias";
import { BarraProgresso, Botao, BotaoOuro } from "./ui";

export function FinalizarColeta() {
  const { cliente, atualizar, irPara } = useCliente();
  const { apresentacao } = usePreferencias();
  const prog = progresso(cliente);
  const finalizada = !!cliente.coletaFinalizada;

  const finalizar = () => {
    if (prog.pendentes.length > 0) {
      const nomes = prog.pendentes.map((x) => `${x.numero} · ${x.titulo}`).join(", ");
      const ok = window.confirm(`Ainda ${prog.pendentes.length === 1 ? "falta 1 seção" : `faltam ${prog.pendentes.length} seções`}: ${nomes}. Finalizar a coleta mesmo assim?`);
      if (!ok) return;
    }
    atualizar((c) => ({ ...c, coletaFinalizada: new Date().toISOString() }));
    // Espera o pré-diagnóstico aparecer na página para rolar até ele.
    window.setTimeout(() => irPara("plano-atual"), 120);
  };

  const reabrir = () => {
    if (window.confirm("Reabrir a coleta? O pré-diagnóstico e o diagnóstico ficam ocultos até finalizar de novo.")) {
      atualizar((c) => ({ ...c, coletaFinalizada: undefined }));
    }
  };

  if (finalizada) {
    if (apresentacao) return null;
    return (
      <div id="sec-finalizar-coleta" className="secao-ancora no-print flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-4 py-2.5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <ClipboardCheck className="h-3.5 w-3.5 text-success" aria-hidden="true" />
          Coleta finalizada em {fmtData(cliente.coletaFinalizada ?? "")}.
        </span>
        <Botao variante="fantasma" pequeno onClick={reabrir}>
          <RotateCcw className="h-3 w-3" aria-hidden="true" /> Reabrir coleta
        </Botao>
      </div>
    );
  }

  return (
    <section id="sec-finalizar-coleta" className="secao-ancora no-print rounded-2xl border border-primary/40 bg-primary/5 p-5 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">Fim da coleta</div>
          <h2 className="mt-1 text-xl font-semibold">Finalizar coleta</h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            O pré-diagnóstico (fluxo atual e modelo 50-30-20) e o diagnóstico completo aparecem depois deste passo.
          </p>
          <div className="mt-3 flex max-w-sm items-center gap-3 text-xs text-muted-foreground">
            <BarraProgresso valor={prog.pct} className="flex-1" />
            <span className="shrink-0 tabular-nums">
              {prog.feitas} de {prog.total} seções
            </span>
          </div>
          {prog.pendentes.length > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              {prog.pendentes.length === 1 ? "Falta" : "Faltam"}:{" "}
              {prog.pendentes.map((x, i) => (
                <span key={x.id}>
                  {i > 0 && ", "}
                  <button type="button" onClick={() => irPara(x.id)} className="font-medium text-primary underline-offset-2 hover:underline">
                    {x.numero} · {x.titulo}
                  </button>
                </span>
              ))}
            </p>
          )}
        </div>
        <BotaoOuro onClick={finalizar} className="shrink-0 justify-center self-start px-5 py-3 text-sm md:self-auto">
          <ClipboardCheck className="h-4 w-4" aria-hidden="true" /> Finalizar coleta
        </BotaoOuro>
      </div>
    </section>
  );
}
