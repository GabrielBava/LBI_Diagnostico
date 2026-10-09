// Componentes do processo com o cliente: cabeçalho da etapa, roteiro da
// conversa (storytelling), anotações e navegação para a próxima etapa.
import { useState } from "react";
import { ArrowLeft, ArrowRight, BookOpenText, Check, ChevronDown, FileText, MessageSquareQuote, NotebookPen } from "lucide-react";
import { ETAPAS, etapaConcluida, fasePorId, type Etapa } from "@/config/etapas";
import { ROTEIRO } from "@/config/roteiro";
import { useCliente } from "@/lib/cliente-context";
import { usePreferencias } from "@/lib/preferencias";

export function CabecalhoEtapa({ etapa }: { etapa: Etapa }) {
  const { cliente, atualizar } = useCliente();
  const { apresentacao } = usePreferencias();
  const fase = fasePorId(etapa.fase);
  const guiadas = ETAPAS.filter((e) => e.guiada);
  const pos = guiadas.findIndex((e) => e.id === etapa.id);
  const naoAplica = !!cliente.naoAplica[etapa.id];
  const Icone = etapa.icone;

  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
          <Icone className="h-5 w-5" />
        </span>
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
            Fase {fase.numero} · {fase.nome}
            {pos >= 0 && <span className="text-muted-foreground"> · Etapa {pos + 1} de {guiadas.length}</span>}
          </div>
          <h1 className="text-lg font-semibold">{etapa.label}</h1>
        </div>
      </div>
      {etapa.opcional && !apresentacao && (
        <label className="no-print flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">
          <input
            type="checkbox"
            className="accent-[rgb(var(--primary))]"
            checked={naoAplica}
            onChange={(e) => atualizar((c) => ({ ...c, naoAplica: { ...c.naoAplica, [etapa.id]: e.target.checked } }))}
          />
          Não se aplica a este cliente
        </label>
      )}
    </div>
  );
}

/** Painel com o roteiro da conversa. Oculto no Modo apresentação. */
export function PainelRoteiro({ etapa }: { etapa: Etapa }) {
  const { cliente, atualizar } = useCliente();
  const { apresentacao } = usePreferencias();
  const [aberto, setAberto] = useState(true);
  const r = ROTEIRO[etapa.id];
  if (!r || apresentacao) return null;
  const feitas = cliente.roteiroFeito[etapa.id] ?? [];
  const marcar = (i: number) =>
    atualizar((c) => {
      const atual = c.roteiroFeito[etapa.id] ?? [];
      const novo = atual.includes(i) ? atual.filter((x) => x !== i) : [...atual, i];
      return { ...c, roteiroFeito: { ...c.roteiroFeito, [etapa.id]: novo } };
    });

  return (
    <section className="no-print rounded-xl border border-primary/25 bg-primary/5">
      <button
        type="button"
        onClick={() => setAberto(!aberto)}
        className="flex w-full items-center gap-3 px-5 py-3 text-left"
      >
        <BookOpenText className="h-4 w-4 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">Roteiro da conversa</div>
          <div className="truncate text-xs text-muted-foreground">{r.objetivo}</div>
        </div>
        <span className="hidden text-[11px] text-muted-foreground sm:inline">
          {feitas.length}/{r.perguntas.length} perguntas
        </span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition ${aberto ? "rotate-180" : ""}`} />
      </button>
      {aberto && (
        <div className="grid gap-4 border-t border-primary/15 px-5 py-4 lg:grid-cols-2">
          <div className="space-y-3">
            <div className="flex gap-2 rounded-lg bg-card/70 p-3">
              <MessageSquareQuote className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p className="text-sm italic leading-relaxed">“{r.abertura}”</p>
            </div>
            <div>
              <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Perguntas-chave
              </div>
              <ul className="space-y-1">
                {r.perguntas.map((p, i) => {
                  const ok = feitas.includes(i);
                  return (
                    <li key={i}>
                      <button
                        type="button"
                        onClick={() => marcar(i)}
                        className={`flex w-full items-start gap-2 rounded-md px-2 py-1 text-left text-sm transition hover:bg-muted/40 ${
                          ok ? "text-muted-foreground line-through" : ""
                        }`}
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
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Pontos de atenção
              </div>
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {r.atencao.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
            <DocumentosFase etapa={etapa} />
          </div>
        </div>
      )}
    </section>
  );
}

/** Na primeira etapa de cada fase, lembra quais documentos pedir. */
function DocumentosFase({ etapa }: { etapa: Etapa }) {
  const proxima = ETAPAS[ETAPAS.findIndex((e) => e.id === etapa.id) + 1];
  const proximaFase = proxima && proxima.fase !== etapa.fase ? fasePorId(proxima.fase) : undefined;
  const faseAtual = fasePorId(etapa.fase);
  const primeiraDaFase = ETAPAS.find((e) => e.fase === etapa.fase)?.id === etapa.id;
  const docs = proximaFase?.documentos ? { fase: proximaFase, quando: "Peça ao cliente para a próxima fase" } : primeiraDaFase && faseAtual.documentos ? { fase: faseAtual, quando: "Documentos desta fase" } : undefined;
  if (!docs) return null;
  return (
    <div className="rounded-lg border border-border bg-card/70 p-3">
      <div className="mb-1.5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-primary">
        <FileText className="h-3.5 w-3.5" /> {docs.quando} · {docs.fase.nome}
      </div>
      <ul className="list-disc space-y-0.5 pl-5 text-xs text-muted-foreground">
        {docs.fase.documentos!.map((d) => (
          <li key={d}>{d}</li>
        ))}
      </ul>
    </div>
  );
}

/** Anotações livres do consultor nesta etapa. */
export function NotasEtapa({ etapa }: { etapa: Etapa }) {
  const { cliente, atualizar } = useCliente();
  const { apresentacao } = usePreferencias();
  if (apresentacao) return null;
  return (
    <section className="no-print rounded-xl border border-dashed border-border p-4">
      <label className="block">
        <span className="mb-1.5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          <NotebookPen className="h-3.5 w-3.5" /> Anotações da conversa
        </span>
        <textarea
          rows={3}
          className="inp"
          placeholder="Frases do cliente, emoções, objeções, combinados… (não aparece no Modo apresentação)"
          value={cliente.notas[etapa.id] ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            atualizar((c) => ({ ...c, notas: { ...c.notas, [etapa.id]: v } }));
          }}
        />
      </label>
    </section>
  );
}

/** Rodapé com a frase de transição e botões de navegação. */
export function RodapeEtapa({ etapa }: { etapa: Etapa }) {
  const { cliente, irPara } = useCliente();
  const { apresentacao } = usePreferencias();
  const i = ETAPAS.findIndex((e) => e.id === etapa.id);
  const anterior = ETAPAS[i - 1];
  const proxima = ETAPAS[i + 1];
  const transicao = ROTEIRO[etapa.id]?.transicao;
  const concluida = etapaConcluida(cliente, etapa);

  return (
    <div className="no-print space-y-3">
      {transicao && proxima && !apresentacao && (
        <div className="flex gap-3 rounded-xl border border-border bg-card p-4">
          <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Transição para {proxima.label}
            </div>
            <p className="mt-0.5 text-sm italic">“{transicao}”</p>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between gap-3">
        {anterior ? (
          <button
            type="button"
            onClick={() => irPara(anterior.id)}
            className="flex items-center gap-1.5 rounded-md px-3 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> {anterior.label}
          </button>
        ) : (
          <span />
        )}
        {proxima && (
          <button
            type="button"
            onClick={() => irPara(proxima.id)}
            className="flex items-center gap-2 rounded-md bg-gold px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:brightness-105"
          >
            {etapa.guiada && !concluida ? "Pular para" : "Próxima etapa:"} {proxima.label} <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
