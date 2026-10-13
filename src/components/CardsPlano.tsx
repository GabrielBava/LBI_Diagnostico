// Cartões dos planos do diagnóstico completo (6.2 atual, 6.3 potencial, 6.4 otimização).
// Cada cartão tem três colunas (ex.: Diagnóstico · Motivo · Risco da inação).
// Os cartões automáticos saem dos dados; o consultor pode personalizar o texto,
// ocultar o cartão na apresentação ou acrescentar cartões próprios.
import { useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Check, ChevronDown, Eye, EyeOff, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import type { CampoDef } from "@/config/campos";
import { padroes } from "@/config/campos";
import type { Cliente, Item } from "@/types";
import { useCliente } from "@/lib/cliente-context";
import { uid } from "@/lib/format";
import { COLUNAS_PLANO, mesclarCards, type CardMesclado, type CardPlano, type ListaCards } from "@/lib/plano";
import { usePreferencias } from "@/lib/preferencias";
import { Formulario } from "./campos";
import { BotaoAdicionar, Selo, corPrioridade } from "./ui";

/** Cartão na tela: automático, personalizado (manual com origem) ou acrescentado. */
type CardTela = CardMesclado;

export interface ColunaCard {
  key: string;
  rotulo: string;
  icone: LucideIcon;
}

const BORDA: Record<string, string> = {
  Alta: "border-l-destructive",
  Média: "border-l-warning",
  Baixa: "border-l-border",
};

const botaoIcone =
  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground";

export function CardsPlano({
  lista,
  automaticos,
  campos,
  colunas,
  rotuloSelo,
  destaque = "primary",
  textoAdicionar,
  vazio,
  limite,
  acoes,
  extraCabecalho,
}: {
  lista: ListaCards;
  automaticos: CardPlano[];
  /** Campos do formulário de edição (CAMPOS_CARD_*). */
  campos: CampoDef[];
  /** As três colunas do cartão. */
  colunas: [ColunaCard, ColunaCard, ColunaCard];
  /** Nome do selo (Gravidade / Prioridade). Sem ele, o cartão não mostra selo. */
  rotuloSelo?: string;
  /** Cor da última coluna (risco, objetivo, como melhorar). */
  destaque?: "destructive" | "primary" | "success";
  textoAdicionar: string;
  vazio: string;
  /** Quantos cartões mostrar antes de "Ver mais". */
  limite?: number;
  /** Ações extras do cartão (ex.: levar ao plano de ação). */
  acoes?: (card: CardTela) => ReactNode;
  /** Conteúdo extra no cabeçalho (ex.: produto). */
  extraCabecalho?: (card: CardTela) => ReactNode;
}) {
  const { cliente, atualizar } = useCliente();
  const { apresentacao } = usePreferencias();
  const [editando, setEditando] = useState<string | null>(null);
  const [todos, setTodos] = useState(false);

  // Automáticos (ou a versão personalizada deles) e, depois, os acrescentados.
  const cards = mesclarCards(cliente, lista, automaticos, colunas.map((c) => c.key), !!rotuloSelo);
  const visiveis = apresentacao ? cards.filter((c) => !c.oculto) : cards;
  const mostrados = limite && !todos ? visiveis.slice(0, limite) : visiveis;

  const salvarItens = (f: (itens: Item[]) => Item[]) => atualizar((c) => ({ ...c, [lista]: f(c[lista]) }));
  const alternarOculto = (id: string) =>
    atualizar((c) => {
      const novo = { ...c.cardsOcultos };
      if (novo[id]) delete novo[id];
      else novo[id] = true;
      return { ...c, cardsOcultos: novo };
    });
  const personalizar = (card: CardTela) => {
    const id = uid();
    salvarItens((lst) => [
      ...lst,
      { id, origem: card.id, titulo: card.titulo, area: card.area, ...(card.selo ? { selo: card.selo } : {}), ...card.textos },
    ]);
    setEditando(id);
  };
  const remover = (item: Item) => {
    salvarItens((lst) => lst.filter((i) => i.id !== item.id));
    if (editando === item.id) setEditando(null);
  };
  const acrescentar = () => {
    const id = uid();
    salvarItens((lst) => [...lst, { id, ...padroes(campos) }]);
    setEditando(id);
  };

  return (
    <div className="space-y-3">
      {visiveis.length === 0 && <p className="text-sm text-muted-foreground">{vazio}</p>}
      {mostrados.map((card) => {
        const oculto = card.oculto;
        const emEdicao = !apresentacao && !!card.item && editando === card.item.id;
        const selo = rotuloSelo ? card.selo : undefined;
        return (
          <article
            key={card.item?.id ?? card.id}
            className={`print-avoid rounded-xl border border-l-4 border-border bg-card ${
              selo ? BORDA[selo] : destaque === "success" ? "border-l-success" : "border-l-primary"
            } ${oculto ? "opacity-60" : ""}`}
          >
            <header className="flex flex-wrap items-start gap-x-3 gap-y-2 px-4 pt-3">
              <div className="min-w-0 flex-1 basis-56">
                <div className="flex flex-wrap items-center gap-1.5">
                  {card.area && <Selo className="border-border bg-muted/40 text-muted-foreground">{card.area}</Selo>}
                  {extraCabecalho?.(card)}
                  {selo && (
                    <Selo className={corPrioridade[selo]}>
                      {rotuloSelo} {selo.toLowerCase()}
                    </Selo>
                  )}
                  {!apresentacao && card.item && card.automatico && (
                    <Selo className="border-primary/30 bg-primary/10 text-primary">Personalizado</Selo>
                  )}
                  {!apresentacao && oculto && <Selo className="border-border bg-muted/40 text-muted-foreground">Oculto na apresentação</Selo>}
                </div>
                <h3 className="mt-1.5 text-sm font-semibold leading-snug [overflow-wrap:anywhere]">{card.titulo || "Sem título"}</h3>
              </div>
              {!apresentacao && (
                <div className="no-print -mr-1.5 flex items-center gap-0.5">
                  {acoes?.(card)}
                  {card.item ? (
                    <button
                      type="button"
                      className={botaoIcone}
                      title={emEdicao ? "Concluir edição" : "Editar"}
                      aria-label={emEdicao ? "Concluir edição" : "Editar"}
                      onClick={() => setEditando(emEdicao ? null : card.item!.id)}
                    >
                      {emEdicao ? <Check className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                    </button>
                  ) : (
                    <button type="button" className={botaoIcone} title="Personalizar o texto" aria-label="Personalizar o texto" onClick={() => personalizar(card)}>
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    className={botaoIcone}
                    title={oculto ? "Mostrar na apresentação" : "Ocultar na apresentação"}
                    aria-label={oculto ? "Mostrar na apresentação" : "Ocultar na apresentação"}
                    onClick={() => alternarOculto(card.id)}
                  >
                    {oculto ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  {card.item && (
                    <button
                      type="button"
                      className={`${botaoIcone} hover:text-destructive`}
                      title={card.automatico ? "Voltar ao texto automático" : "Remover"}
                      aria-label={card.automatico ? "Voltar ao texto automático" : "Remover"}
                      onClick={() => remover(card.item!)}
                    >
                      {card.automatico ? <RotateCcw className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  )}
                </div>
              )}
            </header>

            {emEdicao && card.item ? (
              <div className="no-print p-4">
                <Formulario
                  campos={campos}
                  dados={card.item}
                  cliente={cliente}
                  onChange={(k, v) => salvarItens((lst) => lst.map((i) => (i.id === card.item!.id ? { ...i, [k]: v } : i)))}
                />
              </div>
            ) : (
              <div className="mt-3 grid border-t border-border/70 md:grid-cols-3 md:divide-x md:divide-border/70">
                {colunas.map((col, k) => {
                  const Icone = col.icone;
                  const ultima = k === colunas.length - 1;
                  const tom = ultima
                    ? destaque === "destructive"
                      ? "bg-destructive/[0.06]"
                      : destaque === "success"
                        ? "bg-success/[0.06]"
                        : "bg-primary/[0.06]"
                    : "";
                  const corIcone = ultima ? (destaque === "destructive" ? "text-destructive" : destaque === "success" ? "text-success" : "text-primary") : "text-primary";
                  return (
                    <div
                      key={col.key}
                      className={`min-w-0 px-4 py-3 ${k > 0 ? "border-t border-border/70 md:border-t-0" : ""} ${tom} ${ultima ? "rounded-b-xl md:rounded-bl-none md:rounded-br-xl" : ""}`}
                    >
                      <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                        <Icone className={`h-3.5 w-3.5 shrink-0 ${corIcone}`} aria-hidden="true" />
                        {col.rotulo}
                      </div>
                      <p className="whitespace-pre-line text-sm leading-relaxed [overflow-wrap:anywhere]">
                        {card.textos[col.key] || <span className="text-muted-foreground">—</span>}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </article>
        );
      })}

      {limite && visiveis.length > limite && (
        <button
          type="button"
          onClick={() => setTodos(!todos)}
          className="no-print mx-auto flex h-9 items-center gap-1.5 rounded-md px-3 text-xs font-semibold text-primary hover:bg-primary/10"
        >
          <ChevronDown className={`h-4 w-4 transition ${todos ? "rotate-180" : ""}`} />
          {todos ? "Mostrar menos" : `Ver mais ${visiveis.length - limite}`}
        </button>
      )}

      {!apresentacao && (
        <BotaoAdicionar onClick={acrescentar}>{textoAdicionar}</BotaoAdicionar>
      )}
    </div>
  );
}

/** Selos dos cartões que aparecem na apresentação (para contagens: "3 de gravidade alta"). */
export function selosVisiveis(cliente: Cliente, lista: ListaCards, automaticos: CardPlano[]) {
  const cfg = COLUNAS_PLANO[lista];
  return mesclarCards(cliente, lista, automaticos, cfg.chaves, cfg.selo)
    .filter((c) => !c.oculto)
    .map((c) => c.selo);
}

/** Botão "Levar ao plano" (plano de ação). */
export function BotaoLevarAoPlano({ ja, onClick }: { ja: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={ja}
      onClick={onClick}
      title={ja ? "Já está no plano de ação" : "Levar ao plano de ação"}
      className="inline-flex h-8 items-center gap-1 rounded-md border border-primary/50 px-2.5 text-[11px] font-semibold text-primary hover:bg-primary/10 disabled:border-success/40 disabled:text-success"
    >
      {ja ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />} {ja ? "No plano" : "Levar ao plano"}
    </button>
  );
}
