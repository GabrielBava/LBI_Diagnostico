// 6.7 · Plano de ação: prioridade, prazo (curto/médio/longo) e área.
import { Check, Plus } from "lucide-react";
import { CAMPOS_ACAO } from "@/config/campos";
import { ListaItens } from "@/components/ListaEditor";
import { BarraProgresso, Selo, SubBloco } from "@/components/ui";
import { useCliente } from "@/lib/cliente-context";
import { s } from "@/lib/calculos";
import { sugestoes } from "@/lib/diagnostico";
import { uid } from "@/lib/format";
import { usePreferencias } from "@/lib/preferencias";
import { corPrioridade } from "./Oportunidades";

export default function PlanoAcao() {
  const { cliente, setLista } = useCliente();
  const { apresentacao } = usePreferencias();
  const lista = sugestoes(cliente);
  const noPlano = new Set(cliente.plano.map((a) => s(a.origem)));
  const pendentes = lista.filter((x) => !noPlano.has(x.id));
  const concluidas = cliente.plano.filter((a) => s(a.status) === "Concluída").length;

  return (
    <div className="space-y-4">
      {!apresentacao && pendentes.length > 0 && (
        <SubBloco titulo="Sugestões do diagnóstico" className="no-print">
          <ul className="space-y-2">
            {pendentes.slice(0, 8).map((x) => (
              <li key={x.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-border bg-card p-3">
                <Selo className={corPrioridade[x.prioridade]}>{x.prioridade}</Selo>
                {/* O texto ganha largura mínima: em tela estreita, área e botão descem de linha. */}
                <span className="min-w-0 flex-1 basis-[calc(100%-6rem)] text-sm [overflow-wrap:break-word] lg:basis-64">{x.acao}</span>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {x.area} · {x.prazo}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setLista("plano", [
                      ...cliente.plano,
                      { id: uid(), origem: x.id, acao: x.acao, area: x.area, prioridade: x.prioridade, prazo: x.prazo, status: "Pendente" },
                    ])
                  }
                  className="inline-flex h-8 items-center gap-1 rounded-md border border-primary/50 px-2.5 text-[11px] font-semibold text-primary hover:bg-primary/10"
                >
                  <Plus className="h-3.5 w-3.5" /> Adicionar
                </button>
              </li>
            ))}
          </ul>
          {pendentes.length > 8 && <p className="mt-2 text-xs text-muted-foreground">+{pendentes.length - 8} sugestões na Matriz de oportunidades.</p>}
        </SubBloco>
      )}

      {cliente.plano.length > 0 && (
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <Check className="h-3.5 w-3.5 text-success" /> {concluidas} de {cliente.plano.length} ações concluídas
          <BarraProgresso valor={(concluidas / cliente.plano.length) * 100} className="w-40" />
        </div>
      )}
      <ListaItens
        campos={CAMPOS_ACAO}
        itens={cliente.plano}
        onChange={(i) => setLista("plano", i)}
        textoAdicionar="Adicionar ação"
        vazio={apresentacao ? "Nenhuma ação registrada ainda." : "Nenhuma ação ainda. Use as sugestões acima ou adicione manualmente."}
        tituloItem={(a, i) => `Ação ${i + 1}${s(a.area) ? ` · ${s(a.area)}` : ""}`}
      />
    </div>
  );
}
