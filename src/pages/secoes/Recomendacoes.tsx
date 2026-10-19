// 5.2 · Recomendações: aberta pelo botão "Gerar recomendações" (logo abaixo do 5.1).
// Começa com três blocos de indicação (nome e contato); o consultor pode adicionar mais
// ou remover. Sem nada preenchido, dá para fechar a 5.2 e voltar ao botão.
import { Trash2, X } from "lucide-react";
import { CAMPOS_RECOMENDACAO } from "@/config/campos";
import { recomendacoesPreenchidas } from "@/config/estrutura";
import { Formulario } from "@/components/campos";
import { Botao, BotaoAdicionar } from "@/components/ui";
import { useCliente } from "@/lib/cliente-context";
import { uid } from "@/lib/format";
import { usePreferencias } from "@/lib/preferencias";
import type { Valor } from "@/types";

export default function Recomendacoes() {
  const { cliente, setLista, atualizar, irPara } = useCliente();
  const { apresentacao } = usePreferencias();
  const itens = cliente.recomendacoes;
  const preenchidas = recomendacoesPreenchidas(cliente);

  const alterar = (id: string, key: string, v: Valor) => setLista("recomendacoes", itens.map((i) => (i.id === id ? { ...i, [key]: v } : i)));
  const remover = (id: string) => setLista("recomendacoes", itens.filter((i) => i.id !== id));
  const fechar = () => {
    atualizar((c) => ({ ...c, recomendacoesAbertas: undefined, recomendacoes: [] }));
    window.setTimeout(() => irPara("gerar-recomendacoes"), 120);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="min-w-0 flex-1 basis-[260px] text-sm text-muted-foreground">
          Quem mais pode se beneficiar de um planejamento como este? Anote o nome e o melhor contato de cada indicação.
        </p>
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground" aria-live="polite">
          {preenchidas === 1 ? "1 recomendação preenchida" : `${preenchidas} recomendações preenchidas`}
        </span>
      </div>

      {itens.length === 0 ? (
        <p className="px-1 text-xs text-muted-foreground">Nenhuma recomendação. Adicione abaixo.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {itens.map((item, i) => (
            <li key={item.id} className="aparecer min-w-0 rounded-xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-primary/10 px-1 text-[11px] font-bold text-primary">
                    {i + 1}
                  </span>
                  Recomendação {i + 1}
                </span>
                <button
                  type="button"
                  aria-label={`Remover a recomendação ${i + 1}`}
                  title="Remover"
                  onClick={() => remover(item.id)}
                  className="no-print rounded-md p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <Formulario campos={CAMPOS_RECOMENDACAO} dados={item} cliente={cliente} colunas={2} onChange={(k, v) => alterar(item.id, k, v)} />
            </li>
          ))}
        </ul>
      )}

      <BotaoAdicionar onClick={() => setLista("recomendacoes", [...itens, { id: uid() }])}>Adicionar recomendação</BotaoAdicionar>

      {!apresentacao && preenchidas === 0 && (
        <div className="no-print flex justify-end">
          <Botao variante="fantasma" pequeno onClick={fechar} title="Tira a 5.2 do diagnóstico e volta ao botão Gerar recomendações">
            <X className="h-3 w-3" aria-hidden="true" /> Fechar recomendações
          </Botao>
        </div>
      )}
    </div>
  );
}
