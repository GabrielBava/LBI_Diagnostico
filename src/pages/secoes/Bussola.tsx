// 6.7 · Bússola financeira: saúde da vida financeira em 4 direções
// (Organização, Patrimonial, Liberdade financeira e Gestão de ativos).
// A agulha aponta para o "norte": a direção que mais precisa de atenção agora.
import { CircleAlert, CircleCheck, Compass, Navigation } from "lucide-react";
import { BotaoLevarAoPlano } from "@/components/CardsPlano";
import { BarraProgresso, Selo, corStatus, textoStatus } from "@/components/ui";
import { useCliente } from "@/lib/cliente-context";
import { origensNoPlano, type Status } from "@/lib/diagnostico";
import { uid } from "@/lib/format";
import { bussola, type AcaoBussola, type DimensaoBussola, type IdDimensao } from "@/lib/plano";
import { usePreferencias } from "@/lib/preferencias";

/** Posição de cada direção na bússola (ângulo a partir do topo, sentido horário). */
const POSICAO: Record<IdDimensao, { angulo: number; letra: string }> = {
  organizacao: { angulo: 0, letra: "N" },
  patrimonial: { angulo: 90, letra: "L" },
  liberdade: { angulo: 180, letra: "S" },
  ativos: { angulo: 270, letra: "O" },
};

const COR: Record<Status, string> = {
  ok: "rgb(var(--success))",
  atencao: "rgb(var(--warning))",
  critico: "rgb(var(--destructive))",
  "sem-dados": "rgb(var(--muted-foreground))",
};

const C = 140;
const R = 88;
const ponto = (angulo: number, raio: number) => {
  const rad = ((angulo - 90) * Math.PI) / 180;
  return [C + raio * Math.cos(rad), C + raio * Math.sin(rad)] as const;
};

function Rosa({ dimensoes, norte }: { dimensoes: DimensaoBussola[]; norte?: DimensaoBussola }) {
  const poligono = dimensoes
    .map((d) => ponto(POSICAO[d.id].angulo, (R * (d.status === "sem-dados" ? 0 : Math.max(4, d.nota))) / 100).join(","))
    .join(" ");
  const angulo = norte ? POSICAO[norte.id].angulo : 0;
  const corAgulha = norte ? COR[norte.status] : COR["sem-dados"];
  const descricao = `Bússola financeira: ${dimensoes
    .map((d) => `${d.nome} ${d.status === "sem-dados" ? "sem dados" : d.nota}`)
    .join(", ")}.${norte ? ` A agulha aponta para ${norte.nome}.` : ""}`;
  return (
    <svg viewBox="0 0 280 280" role="img" aria-label={descricao} className="mx-auto block w-full max-w-[300px]">
      <circle cx={C} cy={C} r={132} fill="rgb(var(--card))" stroke="rgb(var(--border))" strokeWidth={1.5} />
      <circle cx={C} cy={C} r={118} fill="none" stroke="rgb(var(--border))" strokeOpacity={0.7} />
      {/* Marcações a cada 15° */}
      {Array.from({ length: 24 }, (_, k) => {
        const a = k * 15;
        const [x1, y1] = ponto(a, 131);
        const [x2, y2] = ponto(a, a % 90 === 0 ? 119 : a % 45 === 0 ? 123 : 127);
        return <line key={a} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgb(var(--muted-foreground))" strokeOpacity={a % 90 === 0 ? 0.9 : 0.45} />;
      })}
      {/* Anéis de 25 em 25 */}
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <circle key={f} cx={C} cy={C} r={R * f} fill="none" stroke="rgb(var(--border))" strokeDasharray={f === 1 ? undefined : "3 4"} />
      ))}
      {dimensoes.map((d) => {
        const [x, y] = ponto(POSICAO[d.id].angulo, R);
        return <line key={d.id} x1={C} y1={C} x2={x} y2={y} stroke="rgb(var(--border))" />;
      })}
      <polygon points={poligono} fill="var(--serie-1)" fillOpacity={0.22} stroke="var(--serie-1)" strokeWidth={2} strokeLinejoin="round" />
      {dimensoes.map((d) => {
        const [x, y] = ponto(POSICAO[d.id].angulo, (R * (d.status === "sem-dados" ? 0 : Math.max(4, d.nota))) / 100);
        const [lx, ly] = ponto(POSICAO[d.id].angulo, 105);
        return (
          <g key={d.id}>
            {d.status !== "sem-dados" && <circle cx={x} cy={y} r={4.5} fill={COR[d.status]} stroke="rgb(var(--card))" strokeWidth={1.5} />}
            <text x={lx} y={ly + 4} textAnchor="middle" fontSize={13} fontWeight={700} fill={norte?.id === d.id ? "rgb(var(--primary))" : "rgb(var(--foreground))"}>
              {POSICAO[d.id].letra}
            </text>
          </g>
        );
      })}
      {/* Agulha */}
      <g
        className="transition-transform duration-[900ms] ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none"
        style={{ transform: `rotate(${angulo}deg)`, transformOrigin: `${C}px ${C}px` }}
      >
        <polygon points={`${C},${C - 82} ${C + 8},${C} ${C - 8},${C}`} fill={corAgulha} />
        <polygon points={`${C},${C + 56} ${C + 8},${C} ${C - 8},${C}`} fill="rgb(var(--muted-foreground))" fillOpacity={0.55} />
      </g>
      <circle cx={C} cy={C} r={10} fill="rgb(var(--card))" stroke="rgb(var(--primary))" strokeWidth={2} />
      <circle cx={C} cy={C} r={3.5} fill="rgb(var(--primary))" />
    </svg>
  );
}

export default function Bussola() {
  const { cliente, setLista } = useCliente();
  const { apresentacao } = usePreferencias();
  const b = bussola(cliente);
  const noPlano = origensNoPlano(cliente.plano);
  const levar = (a: AcaoBussola) =>
    setLista("plano", [
      ...cliente.plano,
      { id: uid(), origem: a.id, acao: a.texto, area: a.area, prioridade: a.prioridade, prazo: a.prazo, status: "Pendente" },
    ]);

  if (!b.temDados) return <p className="text-sm text-muted-foreground">Complete a coleta (despesas, renda, proteção e investimentos) para montar a bússola.</p>;

  const norte = b.norte!;
  return (
    <div className="space-y-4">
      <div className="grid items-center gap-4 rounded-xl border border-border bg-secondary/20 p-4 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
        <Rosa dimensoes={b.dimensoes} norte={norte} />
        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Saúde financeira</div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold tabular-nums">{b.nota}</span>
                <span className="text-sm text-muted-foreground">/ 100</span>
              </div>
            </div>
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {b.dimensoes.map((d) => (
                <li key={d.id} className="flex items-center gap-1.5">
                  <span className="font-bold text-foreground">{POSICAO[d.id].letra}</span>
                  {d.nome}
                  <span className="font-semibold tabular-nums text-foreground">{d.status === "sem-dados" ? "—" : d.nota}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-primary/40 bg-primary/[0.07] p-4">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-primary">
              <Navigation className="h-3.5 w-3.5" aria-hidden="true" /> Seu norte agora
            </div>
            <div className="mt-1 text-lg font-semibold">{norte.nome}</div>
            <p className="text-sm text-muted-foreground">{norte.pergunta} {norte.resumo}</p>
            {norte.acoes.length > 0 && (
              <ol className="mt-3 space-y-1.5">
                {norte.acoes.slice(0, 3).map((a, i) => (
                  <li key={a.id} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold text-[11px] font-bold text-primary-foreground">
                      {i + 1}
                    </span>
                    <span className="min-w-0">{a.texto}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {b.dimensoes.map((d) => {
          const eNorte = d.id === norte.id;
          return (
            <section
              key={d.id}
              className={`print-avoid flex min-w-0 flex-col rounded-xl border bg-card p-4 ${eNorte ? "border-primary/60 ring-1 ring-primary/30" : "border-border"}`}
            >
              <header className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border text-sm font-bold">
                    {POSICAO[d.id].letra}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold">{d.nome}</h3>
                    <p className="text-xs text-muted-foreground">{d.pergunta}</p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Selo className={corStatus[d.status]}>{textoStatus[d.status]}</Selo>
                  {eNorte && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-primary">
                      <Compass className="h-3 w-3" aria-hidden="true" /> Norte
                    </span>
                  )}
                </div>
              </header>
              <div className="mt-3 flex items-center gap-3">
                <BarraProgresso valor={d.status === "sem-dados" ? 0 : d.nota} className="h-2 flex-1" />
                <span className="w-14 text-right text-sm font-semibold tabular-nums">{d.status === "sem-dados" ? "—" : `${d.nota}/100`}</span>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">{d.resumo}</p>
              {d.indicadores.length > 0 && (
                <ul className="mt-3 divide-y divide-border/60 border-y border-border/60">
                  {d.indicadores.map((x) => (
                    <li key={x.nome} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 py-1.5 text-sm">
                      <span className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
                        {x.ok ? (
                          <CircleCheck className="h-3.5 w-3.5 shrink-0 text-success" aria-label="ok" />
                        ) : (
                          <CircleAlert className="h-3.5 w-3.5 shrink-0 text-warning" aria-label="atenção" />
                        )}
                        <span className="min-w-0">{x.nome}</span>
                      </span>
                      <span className="shrink-0 text-right tabular-nums">{x.valor}</span>
                    </li>
                  ))}
                </ul>
              )}
              {d.acoes.length > 0 && (
                <div className="mt-3">
                  <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Ações</div>
                  <ul className="space-y-1.5">
                    {d.acoes.map((a) => (
                      <li key={a.id} className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                        <span className="min-w-0 flex-1 basis-40 text-sm">{a.texto}</span>
                        {!apresentacao && (
                          <span className="no-print">
                            <BotaoLevarAoPlano ja={noPlano.has(a.id)} onClick={() => levar(a)} />
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
