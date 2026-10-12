// Lista de itens em cartões (objetivos, imóveis, financiamentos...).
// Os campos de cada cartão vêm de src/config/campos.ts.
import type { ReactNode } from "react";
import { Trash2 } from "lucide-react";
import { padroes, type CampoDef } from "@/config/campos";
import type { Item, Valor } from "@/types";
import { uid } from "@/lib/format";
import { useCliente } from "@/lib/cliente-context";
import { Formulario } from "./campos";
import { BotaoAdicionar } from "./ui";

export function ListaItens({
  campos,
  itens,
  onChange,
  textoAdicionar = "Adicionar",
  vazio,
  tituloItem,
  rodapeItem,
  novo,
  colunas = 4,
  sugestoes,
}: {
  campos: CampoDef[];
  itens: Item[];
  onChange: (itens: Item[]) => void;
  textoAdicionar?: string;
  vazio?: string;
  tituloItem?: (item: Item, indice: number) => ReactNode;
  /** Informação calculada exibida no rodapé de cada cartão. */
  rodapeItem?: (item: Item) => ReactNode;
  /** Valores iniciais extras de um item novo. */
  novo?: () => Record<string, Valor>;
  colunas?: 2 | 3 | 4;
  sugestoes?: (item: Item) => Record<string, number | undefined>;
}) {
  const { cliente } = useCliente();
  const adicionar = () => onChange([...itens, { id: uid(), ...padroes(campos), ...(novo?.() ?? {}) }]);
  const remover = (id: string) => onChange(itens.filter((i) => i.id !== id));
  const alterar = (id: string, key: string, v: Valor) => onChange(itens.map((i) => (i.id === id ? { ...i, [key]: v } : i)));

  return (
    <div className="space-y-3">
      {itens.length === 0 && vazio && <p className="px-1 text-xs text-muted-foreground">{vazio}</p>}
      {itens.map((item, idx) => (
        <div key={item.id} className="aparecer rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-muted-foreground">{tituloItem ? tituloItem(item, idx) : `#${idx + 1}`}</span>
            <button
              type="button"
              aria-label="Remover"
              onClick={() => remover(item.id)}
              className="no-print rounded-md p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <Formulario
            campos={campos}
            dados={item}
            cliente={cliente}
            colunas={colunas}
            onChange={(k, v) => alterar(item.id, k, v)}
            sugestoes={sugestoes?.(item)}
          />
          {rodapeItem && <div className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">{rodapeItem(item)}</div>}
        </div>
      ))}
      <BotaoAdicionar onClick={adicionar}>{textoAdicionar}</BotaoAdicionar>
    </div>
  );
}
