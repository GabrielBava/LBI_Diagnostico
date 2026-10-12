// 7.1 · Jornada do cliente   /   7.2 · Cronograma de implementação
import { CalendarCheck2 } from "lucide-react";
import { CAMPOS_REUNIAO, PRAZOS_PLANO } from "@/config/campos";
import { ListaItens } from "@/components/ListaEditor";
import { Selo } from "@/components/ui";
import { useCliente } from "@/lib/cliente-context";
import { s } from "@/lib/calculos";
import { fmtData } from "@/lib/format";
import { corPrioridade } from "./Oportunidades";

const corReuniao: Record<string, string> = {
  Realizada: "bg-success text-white",
  Agendada: "bg-gold text-primary-foreground",
  Pendente: "bg-muted text-muted-foreground",
};

export function JornadaCliente() {
  const { cliente, setLista } = useCliente();
  return (
    <div className="space-y-5">
      <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {cliente.jornada.map((r, i) => {
          const st = s(r.status) || "Pendente";
          return (
            <li key={r.id} className="relative rounded-xl border border-border bg-secondary/20 p-3">
              <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${corReuniao[st]}`}>{i + 1}</span>
              <div className="mt-2 text-xs font-semibold">{s(r.titulo)}</div>
              {s(r.descricao) && <p className="mt-0.5 text-[11px] text-muted-foreground">{s(r.descricao)}</p>}
              <div className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
                <CalendarCheck2 className="h-3 w-3" /> {s(r.data) ? fmtData(s(r.data)) : "Sem data"} · {st}
              </div>
            </li>
          );
        })}
      </ol>
      <details className="no-print rounded-xl border border-border p-3">
        <summary className="cursor-pointer text-xs font-semibold text-muted-foreground">Editar encontros, datas e status</summary>
        <div className="mt-3">
          <ListaItens
            campos={CAMPOS_REUNIAO}
            itens={cliente.jornada}
            onChange={(i) => setLista("jornada", i)}
            textoAdicionar="Adicionar encontro"
            tituloItem={(_, i) => `Encontro ${i + 1}`}
          />
        </div>
      </details>
    </div>
  );
}

/** Soma meses a uma data e devolve "mmm/aa". */
const mesAno = (base: Date, meses: number) =>
  new Date(base.getFullYear(), base.getMonth() + meses, 1).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }).replace(". de ", "/").replace(".", "");

export function Cronograma() {
  const { cliente } = useCliente();
  // O cronograma começa na data do fechamento (encontro 4) ou hoje.
  const fechamento = cliente.jornada.find((r) => /fechamento/i.test(s(r.titulo)));
  const inicio = s(fechamento?.data) ? new Date(`${s(fechamento?.data)}T12:00:00`) : new Date();

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Início do plano: {inicio.toLocaleDateString("pt-BR")} (data do fechamento ou hoje).</p>
      <div className="grid gap-3 lg:grid-cols-3">
        {Object.entries(PRAZOS_PLANO).map(([chave, p]) => {
          const acoes = cliente.plano.filter((a) => (s(a.prazo) || "Curto") === chave);
          const [de, ate] = p.meses;
          return (
            <div key={chave} className="rounded-xl border border-border bg-secondary/20 p-4">
              <div className="flex items-baseline justify-between">
                <h3 className="text-sm font-semibold">{p.titulo}</h3>
                <span className="text-[11px] text-muted-foreground">
                  {mesAno(inicio, de)} → {ate === null ? "em diante" : mesAno(inicio, ate)}
                </span>
              </div>
              <ul className="mt-3 space-y-2">
                {acoes.map((a) => (
                  <li key={a.id} className={`rounded-lg border border-border bg-card p-2.5 ${s(a.status) === "Concluída" ? "opacity-60" : ""}`}>
                    <div className="text-sm">{s(a.acao) || "Ação sem título"}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {s(a.prioridade) && <Selo className={corPrioridade[s(a.prioridade)]}>{s(a.prioridade)}</Selo>}
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        {s(a.area)} · {s(a.status) || "Pendente"}
                      </span>
                    </div>
                  </li>
                ))}
                {acoes.length === 0 && <li className="text-xs text-muted-foreground">Sem ações neste prazo.</li>}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
