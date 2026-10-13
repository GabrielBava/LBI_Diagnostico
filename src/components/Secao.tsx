// Moldura de cada seção da página contínua: número, título, roteiro da
// conversa (gaveta), visibilidade na apresentação e "não se aplica".
import { useState, type ReactNode } from "react";
import { BookOpenText, Check, Eye, EyeOff, MessageSquareQuote, NotebookPen } from "lucide-react";
import { ETAPAS, etapaPorId, secaoConcluida, secaoOculta, type SecaoDef } from "@/config/estrutura";
import { ROTEIRO } from "@/config/roteiro";
import { useCliente } from "@/lib/cliente-context";
import { usePreferencias } from "@/lib/preferencias";

export function Secao({ def, children }: { def: SecaoDef; children: ReactNode }) {
  const { cliente, atualizar } = useCliente();
  const { apresentacao } = usePreferencias();
  const [roteiroAberto, setRoteiroAberto] = useState(false);
  const oculta = secaoOculta(cliente, def);
  const naoAplica = !!cliente.naoAplica[def.id];
  const ok = def.coleta && secaoConcluida(cliente, def);
  const r = ROTEIRO[def.id];
  if (apresentacao && oculta) return null;
  const Icone = def.icone;

  return (
    <section id={`sec-${def.id}`} data-secao={def.id} className="secao-ancora print-avoid rounded-2xl border border-border bg-card">
      <header className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-4">
        <span className="flex h-9 min-w-9 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 px-2 text-xs font-bold text-primary">
          {def.numero}
        </span>
        <div className="min-w-0 flex-1 basis-[180px]">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Icone className="h-4 w-4 text-primary" /> {def.titulo}
            {ok && <Check className="h-4 w-4 text-success" strokeWidth={3} aria-label="Concluída" />}
          </h2>
          {def.subtitulo && <p className="text-xs text-muted-foreground">{def.subtitulo}</p>}
        </div>
        {!apresentacao && (
          <div className="no-print flex flex-wrap items-center gap-1.5">
            {def.opcional && (
              <button
                type="button"
                onClick={() => atualizar((c) => ({ ...c, naoAplica: { ...c.naoAplica, [def.id]: !naoAplica } }))}
                className={`h-8 rounded-md border px-2.5 text-[11px] font-medium transition ${
                  naoAplica ? "border-primary/50 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {naoAplica ? "✓ Não se aplica" : "Não se aplica"}
              </button>
            )}
            {r && (
              <button
                type="button"
                onClick={() => setRoteiroAberto(!roteiroAberto)}
                className={`flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-[11px] font-medium transition ${
                  roteiroAberto ? "border-primary/50 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                <BookOpenText className="h-3.5 w-3.5" /> Roteiro
              </button>
            )}
            <button
              type="button"
              title={oculta ? "Oculta na versão apresentação — clique para mostrar" : "Visível na versão apresentação — clique para ocultar"}
              onClick={() => atualizar((c) => ({ ...c, ocultos: { ...c.ocultos, [def.id]: !oculta } }))}
              className={`flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-[11px] font-medium transition ${
                oculta ? "border-warning/40 bg-warning/10 text-warning" : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {oculta ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {oculta ? "Oculta na apresentação" : "Na apresentação"}
            </button>
          </div>
        )}
      </header>

      {!apresentacao && roteiroAberto && r && <GavetaRoteiro secaoId={def.id} />}

      <div className={`p-5 ${naoAplica ? "opacity-50" : ""}`}>{children}</div>
    </section>
  );
}

function GavetaRoteiro({ secaoId }: { secaoId: string }) {
  const { cliente, atualizar } = useCliente();
  const r = ROTEIRO[secaoId];
  const feitas = cliente.roteiroFeito[secaoId] ?? [];
  const marcar = (i: number) =>
    atualizar((c) => {
      const atual = c.roteiroFeito[secaoId] ?? [];
      const novo = atual.includes(i) ? atual.filter((x) => x !== i) : [...atual, i];
      return { ...c, roteiroFeito: { ...c.roteiroFeito, [secaoId]: novo } };
    });
  return (
    <div className="no-print aparecer grid gap-4 border-b border-primary/15 bg-primary/5 px-5 py-4 lg:grid-cols-2">
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-primary">Objetivo:</span> {r.objetivo}
        </p>
        {r.abertura && (
          <div className="flex gap-2 rounded-lg bg-card/80 p-3">
            <MessageSquareQuote className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p className="text-sm italic leading-relaxed">“{r.abertura}”</p>
          </div>
        )}
        {r.perguntas.length > 0 && (
          <ul className="space-y-0.5">
            {r.perguntas.map((p, i) => {
              const ok = feitas.includes(i);
              return (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => marcar(i)}
                    className={`flex w-full items-start gap-2 rounded-md px-2 py-1 text-left text-sm hover:bg-muted/40 ${ok ? "text-muted-foreground line-through" : ""}`}
                  >
                    <span
                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        ok ? "border-success bg-success/20 text-success" : "border-border"
                      }`}
                    >
                      {ok && <Check className="h-3 w-3" />}
                    </span>
                    {p}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <div className="space-y-3">
        {r.atencao.length > 0 && (
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {r.atencao.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        )}
        <label className="block">
          <span className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            <NotebookPen className="h-3.5 w-3.5" /> Anotações da conversa
          </span>
          <textarea
            rows={3}
            className="inp"
            placeholder="Frases do cliente, emoções, objeções…"
            value={cliente.notas[secaoId] ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              atualizar((c) => ({ ...c, notas: { ...c.notas, [secaoId]: v } }));
            }}
          />
        </label>
      </div>
    </div>
  );
}

/** Divisor entre etapas: número, nome e subtítulo da etapa. */
export function DivisorEtapa({ etapaId }: { etapaId: string }) {
  const e = etapaPorId(etapaId);
  return (
    <div id={`etapa-${etapaId}`} className="secao-ancora pt-4">
      <div className="flex items-end gap-4">
        <span className="text-gold text-5xl font-black leading-none tabular-nums">{e.numero}</span>
        <div className="pb-0.5">
          <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-primary">Etapa {e.numero} de {ETAPAS.length}</div>
          <h2 className="text-xl font-semibold">{e.nome}</h2>
          <p className="text-xs text-muted-foreground">{e.subtitulo}</p>
        </div>
      </div>
    </div>
  );
}
