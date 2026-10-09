import { Check, Plus } from "lucide-react";
import { LISTAS } from "@/config/campos";
import { ListaEditor } from "@/components/ListaEditor";
import { Rotulo } from "@/components/campos";
import { BarraProgresso, Cartao, Selo } from "@/components/ui";
import { useCliente } from "@/lib/cliente-context";
import { s } from "@/lib/calculos";
import { sugestoes } from "@/lib/diagnostico";
import { uid } from "@/lib/format";

const corPrioridade: Record<string, string> = {
  Alta: "text-destructive border-destructive/30 bg-destructive/10",
  Média: "text-warning border-warning/30 bg-warning/10",
  Baixa: "text-muted-foreground border-border bg-muted/40",
};

export default function PlanoAcao() {
  const { cliente, setLista, setCampo } = useCliente();
  const lista = sugestoes(cliente);
  const origens = new Set(cliente.plano.map((a) => s(a.origem)));
  const concluidas = cliente.plano.filter((a) => s(a.status) === "Concluída").length;

  const adicionar = (id: string) => {
    const sg = lista.find((x) => x.id === id);
    if (!sg) return;
    const prazo = new Date(Date.now() + (sg.prioridade === "Alta" ? 30 : sg.prioridade === "Média" ? 90 : 180) * 864e5)
      .toISOString()
      .slice(0, 10);
    setLista("plano", [
      ...cliente.plano,
      {
        id: uid(),
        origem: sg.id,
        acao: sg.titulo,
        pilar: sg.pilar,
        prioridade: sg.prioridade,
        prazo,
        responsavel: "Cliente",
        status: "Pendente",
      },
    ]);
  };

  return (
    <div className="space-y-5">
      <Cartao
        titulo="Sugestões do diagnóstico"
        subtitulo="Geradas a partir dos dados, na ordem recomendada. Escolha com o cliente o que entra no plano."
        className="no-print"
      >
        {lista.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem sugestões no momento. Complete as etapas guiadas para gerar recomendações.</p>
        ) : (
          <ul className="space-y-2">
            {lista.map((sg) => {
              const ja = origens.has(sg.id);
              return (
                <li key={sg.id} className="flex flex-wrap items-start gap-3 rounded-lg border border-border bg-secondary/30 p-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Selo className={corPrioridade[sg.prioridade]}>{sg.prioridade}</Selo>
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{sg.pilar}</span>
                    </div>
                    <div className="mt-1 text-sm font-semibold">{sg.titulo}</div>
                    <p className="text-xs text-muted-foreground">{sg.detalhe}</p>
                  </div>
                  <button
                    type="button"
                    disabled={ja}
                    onClick={() => adicionar(sg.id)}
                    className="flex items-center gap-1 rounded-md border border-primary/50 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/10 disabled:border-success/40 disabled:text-success"
                  >
                    {ja ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />} {ja ? "No plano" : "Adicionar ao plano"}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Cartao>

      <ListaEditor
        def={LISTAS.plano}
        itens={cliente.plano}
        onChange={(i) => setLista("plano", i)}
        subtitulo={
          cliente.plano.length > 0 ? (
            <span className="flex items-center gap-3">
              {concluidas} de {cliente.plano.length} ações concluídas
              <BarraProgresso valor={(concluidas / cliente.plano.length) * 100} className="w-32" />
            </span>
          ) : undefined
        }
      />

      <Cartao titulo="Compromisso de acompanhamento">
        <div className="grid gap-3 md:grid-cols-3">
          <label className="block">
            <Rotulo>Próxima revisão</Rotulo>
            <input
              type="date"
              className="inp mt-1"
              value={s(cliente.cadastro.proximaRevisao)}
              onChange={(e) => setCampo("cadastro", "proximaRevisao", e.target.value)}
            />
          </label>
          <label className="block md:col-span-2">
            <Rotulo>Combinados da reunião</Rotulo>
            <input
              className="inp mt-1"
              placeholder="Ex.: cliente envia extratos até sexta; consultor apresenta cotação de seguro"
              value={s(cliente.cadastro.combinados)}
              onChange={(e) => setCampo("cadastro", "combinados", e.target.value)}
            />
          </label>
        </div>
      </Cartao>
    </div>
  );
}
