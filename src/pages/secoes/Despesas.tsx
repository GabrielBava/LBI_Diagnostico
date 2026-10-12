import { Lock } from "lucide-react";
import { CAMPOS_DESPESA_EXTRA, CATEGORIAS_DESPESA } from "@/config/campos";
import { CampoMoeda } from "@/components/campos";
import { ListaItens } from "@/components/ListaEditor";
import { SubBloco } from "@/components/ui";
import { useCliente } from "@/lib/cliente-context";
import { despesas, fluxo } from "@/lib/calculos";
import { fmtBRL, fmtPct } from "@/lib/format";

export default function Despesas() {
  const { cliente, atualizar, setLista } = useCliente();
  const d = despesas(cliente);
  const f = fluxo(cliente);
  const definir = (id: string, v: number | undefined) => atualizar((c) => ({ ...c, despesas: { ...c.despesas, [id]: v } }));

  const bloco = (nome: "Fixa" | "Variável") => {
    const linhas = d.porCategoria.filter(
      (x) => x.bloco === nome && (CATEGORIAS_DESPESA.some((k) => k.id === x.id) || x.id === "dependentes"),
    );
    const total = nome === "Fixa" ? d.fixas : d.variaveis;
    return (
      <SubBloco
        titulo={nome === "Fixa" ? "Despesas fixas" : "Despesas variáveis"}
        total={
          <span>
            {fmtBRL(total)}
            {f.renda > 0 && <span className="ml-1 text-xs font-normal text-muted-foreground">({fmtPct(total / f.renda)} da renda)</span>}
          </span>
        }
      >
        <div className="divide-y divide-border/60">
          {linhas.map((x) => {
            const cat = CATEGORIAS_DESPESA.find((k) => k.id === x.id);
            return (
              <div key={x.id} className="grid grid-cols-[1fr_minmax(130px,170px)] items-center gap-3 py-1.5">
                <div className="min-w-0">
                  <div className="text-sm">{x.label}</div>
                  {(cat?.dica || x.automatico) && (
                    <div className="truncate text-[11px] text-muted-foreground">
                      {x.automatico ? (x.id === "dependentes" ? "Calculado em Sucessão" : "Calculado em Financiamentos e dívidas") : cat?.dica}
                    </div>
                  )}
                </div>
                {x.automatico ? (
                  <div className="inp-wrap justify-end text-sm font-medium tabular-nums" data-readonly="true">
                    <Lock className="h-3 w-3 text-muted-foreground" /> {fmtBRL(x.valor)}
                  </div>
                ) : (
                  <CampoMoeda valor={cliente.despesas[x.id]} onChange={(v) => definir(x.id, v)} ariaLabel={x.label} />
                )}
              </div>
            );
          })}
        </div>
      </SubBloco>
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        {bloco("Fixa")}
        {bloco("Variável")}
      </div>
      <SubBloco titulo="Outras despesas">
        <ListaItens
          campos={CAMPOS_DESPESA_EXTRA}
          itens={cliente.despesasExtras}
          onChange={(i) => setLista("despesasExtras", i)}
          textoAdicionar="Adicionar outra despesa"
          tituloItem={(_, i) => `Despesa extra ${i + 1}`}
        />
      </SubBloco>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-secondary/30 px-4 py-3">
        <span className="text-sm text-muted-foreground">Total de despesas mensais</span>
        <span className="text-lg font-semibold tabular-nums">
          {fmtBRL(d.total)}
          {f.renda > 0 && <span className="ml-2 text-xs font-normal text-muted-foreground">{fmtPct(d.total / f.renda)} da renda</span>}
        </span>
      </div>
    </div>
  );
}
