// Editor genérico de listas (despesas, dívidas, sonhos...).
// As colunas vêm de LISTAS em src/config/campos.ts; colunas calculadas
// (somente leitura) podem ser passadas por `extras`.
import { Plus, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { padroes, type ListaDef } from "@/config/campos";
import type { Item, Valor } from "@/types";
import { uid } from "@/lib/format";
import { Controle, Rotulo } from "./campos";
import { Cartao } from "./ui";

export interface ColunaExtra {
  label: string;
  render: (item: Item) => ReactNode;
}

export function ListaEditor({
  def,
  itens,
  onChange,
  extras = [],
  rodape,
  titulo,
  subtitulo,
}: {
  def: ListaDef;
  itens: Item[];
  onChange: (itens: Item[]) => void;
  extras?: ColunaExtra[];
  rodape?: ReactNode;
  titulo?: ReactNode;
  subtitulo?: ReactNode;
}) {
  const adicionar = () => onChange([...itens, { id: uid(), ...padroes(def.colunas) }]);
  const remover = (id: string) => onChange(itens.filter((i) => i.id !== id));
  const alterar = (id: string, key: string, v: Valor) => onChange(itens.map((i) => (i.id === id ? { ...i, [key]: v } : i)));

  return (
    <Cartao
      titulo={titulo ?? def.titulo}
      subtitulo={subtitulo}
      acao={
        <button
          type="button"
          onClick={adicionar}
          className="no-print flex items-center gap-1 rounded-md px-2 py-1 text-xs text-primary hover:bg-muted"
        >
          <Plus className="h-3 w-3" /> {def.textoAdicionar ?? "Adicionar"}
        </button>
      }
    >
      <div className="space-y-2">
        {itens.length === 0 && (
          <button
            type="button"
            onClick={adicionar}
            className="w-full rounded-lg border border-dashed border-border p-4 text-left text-xs text-muted-foreground hover:border-primary/50 hover:text-foreground"
          >
            {def.vazio}
          </button>
        )}
        {itens.map((item) => (
          <div
            key={item.id}
            className="lista-compacta relative grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-x-3 gap-y-2 rounded-lg border border-border bg-secondary/30 p-3 pr-10"
          >
            {def.colunas.map((col) => (
              <label key={col.key} className={`block ${col.largura && col.largura > 1 ? "md:col-span-2" : ""}`}>
                <Rotulo compacto>{col.label}</Rotulo>
                <div className="mt-0.5">
                  <Controle campo={col} valor={item[col.key]} onChange={(v) => alterar(item.id, col.key, v)} />
                </div>
              </label>
            ))}
            {extras.map((ex) => (
              <div key={ex.label} className="block">
                <Rotulo compacto>{ex.label}</Rotulo>
                <div className="inp-wrap mt-0.5 text-sm tabular-nums" data-readonly="true">
                  {ex.render(item)}
                </div>
              </div>
            ))}
            <button
              type="button"
              aria-label="Remover"
              onClick={() => remover(item.id)}
              className="no-print absolute right-2 top-2 rounded-md p-1.5 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
      {rodape && <div className="mt-4 border-t border-border pt-3">{rodape}</div>}
    </Cartao>
  );
}
