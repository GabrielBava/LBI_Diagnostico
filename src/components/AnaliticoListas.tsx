// Listas editáveis do 8 · Analítico (dores, notas, perfil…): cada item tem uma
// frase curta e, quando houver, o trecho da fala do cliente que o sustenta.
import { useState, type ReactNode } from "react";
import { Check, Pencil, Quote, Trash2, X } from "lucide-react";
import type { ItemAnalise } from "@/lib/analitico-tipos";
import { uid } from "@/lib/format";
import { BotaoAdicionar, Selo } from "./ui";

const NOVO = "__novo__";
const botaoIcone = "rounded-md p-1.5 text-muted-foreground transition hover:bg-muted/60 hover:text-foreground";

export function ListaAnalise({
  titulo,
  descricao,
  icone,
  itens,
  onChange,
  comEvidencia = true,
  vazio = "Nada por aqui ainda.",
  placeholder = "Escreva uma frase curta",
  numerada,
  estiloFrase,
  className = "",
}: {
  titulo: string;
  descricao?: string;
  icone?: ReactNode;
  itens: ItemAnalise[];
  onChange: (itens: ItemAnalise[]) => void;
  /** Mostra e edita o trecho da fala do cliente (evidência). */
  comEvidencia?: boolean;
  vazio?: string;
  placeholder?: string;
  numerada?: boolean;
  /** Itens como frases prontas (entre aspas, em destaque). */
  estiloFrase?: boolean;
  className?: string;
}) {
  // Item em edição (NOVO = item ainda não salvo, que só entra na lista ao salvar).
  const [editando, setEditando] = useState<string | null>(null);
  const [rascunho, setRascunho] = useState<ItemAnalise | null>(null);

  const abrir = (item: ItemAnalise) => {
    setEditando(item.id);
    setRascunho({ ...item });
  };
  const fechar = () => {
    setEditando(null);
    setRascunho(null);
  };
  const salvar = () => {
    if (!rascunho) return;
    const texto = rascunho.texto.trim();
    const evidencia = rascunho.evidencia?.replace(/^["“”\s]+|["“”\s]+$/g, "") || undefined;
    const pronto: ItemAnalise = { id: editando === NOVO ? uid() : rascunho.id, texto, ...(evidencia ? { evidencia } : {}), ...(rascunho.fraca ? { fraca: true } : {}) };
    if (editando === NOVO) {
      if (texto) onChange([...itens, pronto]);
    } else if (!texto) onChange(itens.filter((i) => i.id !== rascunho.id));
    else onChange(itens.map((i) => (i.id === rascunho.id ? pronto : i)));
    fechar();
  };
  const adicionar = () => {
    if (editando && editando !== NOVO) salvar();
    setEditando(NOVO);
    setRascunho({ id: NOVO, texto: "" });
  };
  const remover = (id: string) => {
    if (editando === id) fechar();
    onChange(itens.filter((i) => i.id !== id));
  };
  const teclas = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") fechar();
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      salvar();
    }
  };

  const formulario = (chave: string) =>
    rascunho && (
  <li key={chave} className="aparecer space-y-2 rounded-lg border border-primary/50 bg-card p-3">
                <label className="block">
                  <span className="sr-only">Texto do item</span>
                  <textarea
                    autoFocus
                    rows={2}
                    className="inp resize-y"
                    placeholder={placeholder}
                    value={rascunho.texto}
                    onChange={(e) => setRascunho({ ...rascunho, texto: e.target.value })}
                    onKeyDown={teclas}
                  />
                </label>
                {comEvidencia && (
                  <>
                    <label className="block">
                      <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Fala do cliente (evidência, opcional)</span>
                      <input
                        className="inp"
                        placeholder="Trecho do que o cliente disse"
                        value={rascunho.evidencia ?? ""}
                        onChange={(e) => setRascunho({ ...rascunho, evidencia: e.target.value })}
                        onKeyDown={teclas}
                      />
                    </label>
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <input type="checkbox" checked={!!rascunho.fraca} onChange={(e) => setRascunho({ ...rascunho, fraca: e.target.checked })} />
                      Evidência fraca (inferência, precisa confirmar)
                    </label>
                  </>
                )}
                <div className="flex justify-end gap-1.5">
                  <button type="button" onClick={fechar} className="inline-flex h-8 items-center gap-1 rounded-md px-2.5 text-[11px] font-semibold text-muted-foreground hover:bg-muted">
                    <X className="h-3.5 w-3.5" /> Cancelar
                  </button>
                  <button type="button" onClick={salvar} className="bg-gold inline-flex h-8 items-center gap-1 rounded-md px-3 text-[11px] font-semibold text-primary-foreground">
                    <Check className="h-3.5 w-3.5" /> Salvar
                  </button>
                </div>
              </li>
    );

  return (
    <div className={`flex flex-col rounded-xl border border-border bg-secondary/20 p-4 ${className}`}>
      <div className="mb-3">
        <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {icone}
          {titulo}
          {itens.length > 0 && <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-foreground">{itens.length}</span>}
        </h3>
        {descricao && <p className="mt-1 text-xs text-muted-foreground">{descricao}</p>}
      </div>
      {itens.length === 0 && editando !== NOVO && <p className="mb-3 text-xs text-muted-foreground">{vazio}</p>}
      <ul className="mb-3 space-y-2">
        {itens.map((item, idx) =>
          editando === item.id && rascunho ? (
            formulario(item.id)
          ) : (
            <li key={item.id} className="group flex items-start gap-2 rounded-lg border border-border bg-card px-3 py-2.5">
              {numerada ? (
                <span className="mt-0.5 w-4 shrink-0 text-xs font-semibold tabular-nums text-primary">{idx + 1}.</span>
              ) : (
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
              )}
              <div className="min-w-0 flex-1 [overflow-wrap:anywhere]">
                <p className={`text-sm leading-snug ${estiloFrase ? "font-medium italic" : ""}`}>{estiloFrase ? `“${item.texto}”` : item.texto}</p>
                {comEvidencia && item.evidencia && (
                  <p className="mt-1 flex gap-1.5 text-xs italic leading-snug text-muted-foreground">
                    <Quote className="mt-0.5 h-3 w-3 shrink-0 text-primary/70" aria-hidden="true" />
                    <span>“{item.evidencia}”</span>
                  </p>
                )}
                {comEvidencia && item.fraca && <Selo className="mt-1.5 border-warning/30 bg-warning/10 text-warning">Evidência fraca</Selo>}
              </div>
              <div className="no-print -mr-1 flex shrink-0 items-center opacity-80 transition group-hover:opacity-100">
                <button type="button" aria-label="Editar" title="Editar" onClick={() => abrir(item)} className={botaoIcone}>
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Remover"
                  title="Remover"
                  onClick={() => remover(item.id)}
                  className="rounded-md p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ),
        )}
        {editando === NOVO && formulario(NOVO)}
      </ul>
      <div className="mt-auto">
        <BotaoAdicionar onClick={adicionar}>Adicionar</BotaoAdicionar>
      </div>
    </div>
  );
}

/** Lista de frases simples (perfil): mesma edição, sem evidência. */
export function ListaTextos({
  itens,
  onChange,
  ...resto
}: Omit<Parameters<typeof ListaAnalise>[0], "itens" | "onChange" | "comEvidencia"> & { itens: string[]; onChange: (itens: string[]) => void }) {
  return (
    <ListaAnalise
      {...resto}
      comEvidencia={false}
      itens={itens.map((texto, i) => ({ id: `t${i}`, texto }))}
      onChange={(lista) => onChange(lista.map((i) => i.texto))}
    />
  );
}
