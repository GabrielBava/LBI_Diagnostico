// 6.6 · Matriz de oportunidades — ecossistema (cross-sell). Uso interno do consultor.
// Radar com as 6 áreas (Proteção, Futuro, Patrimonial, Investimentos, Sucessão e
// Fiscal/Tributário) e a lista de oportunidades em ordem de potencial, com o que
// oferecer e por quê. Seguros e consórcios pesam mais no potencial (receita).
import { useState } from "react";
import { Handshake, Lightbulb, ShieldCheck, Target, Wallet } from "lucide-react";
import { BotaoLevarAoPlano } from "@/components/CardsPlano";
import { RadarOportunidades } from "@/components/graficos";
import { Selo, corPrioridade } from "@/components/ui";
import { useCliente } from "@/lib/cliente-context";
import { s } from "@/lib/calculos";
import { fmtBRL, uid } from "@/lib/format";
import { AREAS_RADAR, focoReceita, oportunidades, radarOportunidades, type Oportunidade } from "@/lib/oportunidades";

type Filtro = "Todas" | "Seguros e consórcios" | (typeof AREAS_RADAR)[number];

const DESTAQUE = ["Seguro", "Consórcio"];

function Potencial({ valor }: { valor: number }) {
  return (
    <div className="flex items-center gap-2" title={`Potencial ${valor} de 100`}>
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-gold" style={{ width: `${valor}%` }} />
      </div>
      <span className="w-7 text-right text-xs font-semibold tabular-nums">{valor}</span>
    </div>
  );
}

export default function Oportunidades() {
  const { cliente, setLista } = useCliente();
  const [filtro, setFiltro] = useState<Filtro>("Todas");
  const ops = oportunidades(cliente);
  const radar = radarOportunidades(ops);
  const foco = focoReceita(ops);
  const noPlano = new Set(cliente.plano.map((a) => s(a.origem)));
  const adicionar = (o: Oportunidade) =>
    setLista("plano", [
      ...cliente.plano,
      { id: uid(), origem: o.id, acao: `${o.titulo}: ${o.detalhe}`, area: o.area, prioridade: o.prioridade, prazo: o.prazo, status: "Pendente" },
    ]);
  const lista =
    filtro === "Todas" ? ops : filtro === "Seguros e consórcios" ? ops.filter((o) => DESTAQUE.includes(o.produto)) : ops.filter((o) => o.area === filtro);
  const alternar = (f: Filtro) => setFiltro((atual) => (atual === f ? "Todas" : f));

  if (!ops.length) return <p className="text-sm text-muted-foreground">Nenhuma oportunidade identificada com os dados preenchidos.</p>;

  return (
    <div className="space-y-4">
      {/* Foco em receita: seguros e consórcios */}
      <div className="grid gap-3 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => alternar("Seguros e consórcios")}
          className={`rounded-xl p-4 text-left transition sm:col-span-1 ${
            filtro === "Seguros e consórcios" ? "bg-gold text-primary-foreground" : "border border-primary/40 bg-primary/10 hover:bg-primary/15"
          }`}
        >
          <div className={`text-[10px] font-semibold uppercase tracking-widest ${filtro === "Seguros e consórcios" ? "opacity-80" : "text-primary"}`}>
            Foco em receita
          </div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">
            {foco.seguros.quantidade + foco.consorcios.quantidade}
            <span className={`ml-1 text-xs font-medium ${filtro === "Seguros e consórcios" ? "opacity-80" : "text-muted-foreground"}`}>
              de {ops.length} oportunidades
            </span>
          </div>
          <div className={`mt-1 text-xs ${filtro === "Seguros e consórcios" ? "opacity-90" : "text-muted-foreground"}`}>
            Seguros e consórcios · toque para filtrar
          </div>
        </button>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" aria-hidden="true" /> Seguros
          </div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">{foco.seguros.quantidade}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {foco.seguros.volume > 0 ? `${fmtBRL(foco.seguros.volume)} em capital de vida sugerido` : "oportunidades de proteção"}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            <Wallet className="h-3.5 w-3.5 text-primary" aria-hidden="true" /> Consórcios
          </div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">{foco.consorcios.quantidade}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {foco.consorcios.volume > 0 ? `${fmtBRL(foco.consorcios.volume)} em cartas` : "cartas para os planos do cliente"}
          </div>
        </div>
      </div>

      {/* Radar + resumo por área */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="min-w-0 rounded-xl border border-border bg-secondary/20 p-1 sm:p-4">
          <div className="px-3 pt-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground sm:px-0 sm:pt-0">
            Radar de oportunidades · potencial de 0 a 100
          </div>
          <RadarOportunidades dados={radar} selecionada={AREAS_RADAR.includes(filtro as never) ? filtro : undefined} onSelecionar={(a) => alternar(a as Filtro)} />
        </div>
        <ul className="min-w-0 space-y-2">
          {[...radar]
            .sort((a, b) => b.potencial - a.potencial)
            .map((r) => {
              const primeira = ops.find((o) => o.area === r.area);
              const ativa = filtro === r.area;
              return (
                <li key={r.area}>
                  <button
                    type="button"
                    onClick={() => alternar(r.area)}
                    aria-pressed={ativa}
                    className={`w-full rounded-lg border p-3 text-left transition ${
                      ativa ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/50"
                    } ${r.quantidade ? "" : "opacity-60"}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold">{r.area}</span>
                      <Potencial valor={r.potencial} />
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {r.quantidade ? `${r.quantidade} ${r.quantidade === 1 ? "oportunidade" : "oportunidades"} · maior: ${primeira!.titulo}` : "Nenhuma oportunidade nesta área."}
                    </p>
                  </button>
                </li>
              );
            })}
        </ul>
      </div>

      {/* Lista por potencial */}
      <div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {(["Todas", "Seguros e consórcios", ...AREAS_RADAR] as Filtro[]).map((f) => {
            const qtd =
              f === "Todas" ? ops.length : f === "Seguros e consórcios" ? ops.filter((o) => DESTAQUE.includes(o.produto)).length : ops.filter((o) => o.area === f).length;
            const ativo = filtro === f;
            return (
              <button
                key={f}
                type="button"
                aria-pressed={ativo}
                onClick={() => setFiltro(f)}
                disabled={!qtd}
                className={`h-8 rounded-full border px-3 text-xs font-medium transition disabled:opacity-40 ${
                  ativo ? "border-transparent bg-gold text-primary-foreground" : "border-border bg-input hover:border-primary/50"
                }`}
              >
                {f} <span className={ativo ? "opacity-80" : "text-muted-foreground"}>{qtd}</span>
              </button>
            );
          })}
        </div>
        <ol className="space-y-2">
          {lista.map((o) => {
            const rank = ops.indexOf(o) + 1;
            return (
              <li key={o.id} className="print-avoid rounded-xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold tabular-nums">{rank}</span>
                  <div className="min-w-0 flex-1 basis-48">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Selo className="border-border bg-muted/40 text-muted-foreground">{o.area}</Selo>
                      <Selo
                        className={DESTAQUE.includes(o.produto) ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-muted/40 text-muted-foreground"}
                      >
                        {o.produto}
                      </Selo>
                      <Selo className={corPrioridade[o.prioridade]}>{o.prioridade}</Selo>
                    </div>
                    <h3 className="mt-1.5 text-sm font-semibold leading-snug">{o.titulo}</h3>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <Potencial valor={o.potencial} />
                    <span className="no-print">
                      <BotaoLevarAoPlano ja={noPlano.has(o.id)} onClick={() => adicionar(o)} />
                    </span>
                  </div>
                </div>
                <dl className="mt-3 grid gap-3 text-sm md:grid-cols-3">
                  <div className="min-w-0">
                    <dt className="mb-0.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      <Handshake className="h-3.5 w-3.5 text-primary" aria-hidden="true" /> O que oferecer
                    </dt>
                    <dd className="[overflow-wrap:anywhere]">{o.oferta}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="mb-0.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      <Lightbulb className="h-3.5 w-3.5 text-primary" aria-hidden="true" /> Por quê
                    </dt>
                    <dd className="[overflow-wrap:anywhere]">{o.porque}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="mb-0.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      <Target className="h-3.5 w-3.5 text-primary" aria-hidden="true" /> Objetivo para o cliente
                    </dt>
                    <dd className="[overflow-wrap:anywhere]">{o.objetivo}</dd>
                  </div>
                </dl>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
