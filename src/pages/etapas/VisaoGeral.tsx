import { AlertTriangle, CheckCircle2, CircleMinus, Quote, XCircle } from "lucide-react";
import type { EtapaId } from "@/config/etapas";
import { BarrasHorizontais } from "@/components/graficos";
import { Cartao, Kpi, Selo, corStatus, textoStatus } from "@/components/ui";
import { useCliente } from "@/lib/cliente-context";
import { fluxo, n, patrimonio, s, sonhos } from "@/lib/calculos";
import { notaGeral, pilares, sugestoes, type Status } from "@/lib/diagnostico";
import { fmtBRL, fmtPct } from "@/lib/format";

export const iconeStatus: Record<Status, typeof CheckCircle2> = {
  ok: CheckCircle2,
  atencao: AlertTriangle,
  critico: XCircle,
  "sem-dados": CircleMinus,
};

const etapaDoPilar: Record<string, EtapaId> = {
  fluxo: "despesas",
  reserva: "patrimonio",
  dividas: "dividas",
  protecao: "seguro",
  aposentadoria: "aposentadoria",
  sonhos: "sonhos",
};

export default function VisaoGeral() {
  const { cliente, irPara } = useCliente();
  const f = fluxo(cliente);
  const p = patrimonio(cliente);
  const ps = pilares(cliente);
  const nota = notaGeral(ps);
  const prioridades = sugestoes(cliente).slice(0, 3);
  const so = sonhos(cliente);
  const motivacao = s(cliente.cadastro.motivacao);
  const comMotivo = so.lista.filter((x) => s(x.item.motivo));

  return (
    <div className="space-y-5">
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="rounded-xl bg-gold p-5 text-primary-foreground">
          <div className="text-[10px] font-semibold uppercase tracking-widest opacity-80">Nota LIFE</div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-5xl font-bold tabular-nums">{nota}</span>
            <span className="text-sm opacity-80">/ 100</span>
          </div>
          <p className="mt-2 text-xs opacity-90">Média das notas dos pilares com dados preenchidos.</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            <Quote className="h-3.5 w-3.5 text-primary" /> Nas palavras do cliente
          </div>
          {motivacao || comMotivo.length ? (
            <div className="mt-2 space-y-2">
              {motivacao && <p className="text-base italic">“{motivacao}”</p>}
              {comMotivo.slice(0, 3).map((x) => (
                <p key={x.item.id} className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{s(x.item.descricao)}:</span> “{s(x.item.motivo)}”
                </p>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              Registre a motivação na Apresentação e o “porquê” de cada sonho: eles abrem a conversa do diagnóstico.
            </p>
          )}
          {s(cliente.cadastro.satisfacao) !== "" && (
            <p className="mt-3 text-xs text-muted-foreground">Satisfação financeira declarada: {n(cliente.cadastro.satisfacao)}/10</p>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi rotulo="Renda mensal" valor={fmtBRL(f.renda)} />
        <Kpi rotulo="Despesas + parcelas" valor={fmtBRL(f.despesas + f.parcelas)} />
        <Kpi
          rotulo="Sobra mensal"
          valor={fmtBRL(f.sobra)}
          tom={f.renda > 0 && f.sobra < 0 ? "perigo" : "neutro"}
          detalhe={f.renda > 0 ? `${fmtPct(f.taxaPoupanca)} da renda` : undefined}
        />
        <Kpi rotulo="Patrimônio líquido" valor={fmtBRL(p.liquido)} detalhe={`Bens ${fmtBRL(p.total)} · Dívidas ${fmtBRL(p.dividas)}`} />
      </div>

      <Cartao titulo="Pilares do diagnóstico" subtitulo="Clique em um pilar para abrir a etapa correspondente.">
        <div className="grid gap-2 md:grid-cols-2">
          {ps.map((pl) => {
            const I = iconeStatus[pl.status];
            return (
              <button
                key={pl.id}
                type="button"
                onClick={() => irPara(etapaDoPilar[pl.id])}
                className="rounded-lg border border-border bg-secondary/30 p-3 text-left transition hover:border-primary/50"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{pl.nome}</span>
                  <Selo className={`gap-1 ${corStatus[pl.status]}`}>
                    <I className="h-3 w-3" /> {textoStatus[pl.status]}
                  </Selo>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-gold" style={{ width: `${pl.status === "sem-dados" ? 0 : pl.nota}%` }} />
                  </div>
                  <span className="w-8 text-right text-xs tabular-nums text-muted-foreground">{pl.status === "sem-dados" ? "—" : pl.nota}</span>
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">{pl.resumo}</p>
              </button>
            );
          })}
        </div>
      </Cartao>

      <Cartao
        titulo="As 3 prioridades"
        subtitulo="Foco gera ação: comece por aqui."
        acao={
          <button type="button" onClick={() => irPara("plano")} className="no-print text-xs font-semibold text-primary hover:underline">
            Montar plano de ação →
          </button>
        }
      >
        {prioridades.length === 0 ? (
          <p className="text-sm text-muted-foreground">Complete as etapas guiadas para gerar as prioridades.</p>
        ) : (
          <ol className="space-y-2">
            {prioridades.map((sg, i) => (
              <li key={sg.id} className="flex gap-3 rounded-lg border border-border p-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold text-xs font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <div>
                  <div className="text-sm font-semibold">{sg.titulo}</div>
                  <p className="text-xs text-muted-foreground">{sg.detalhe}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Cartao>

      <div className="grid gap-5 lg:grid-cols-2">
        <Cartao titulo="Despesas por tipo">
          <BarrasHorizontais dados={Object.entries(f.despesasPorTipo).map(([nome, valor]) => ({ nome, valor }))} />
        </Cartao>
        <Cartao titulo="Composição do patrimônio">
          <BarrasHorizontais dados={Object.entries(p.porTipo).map(([nome, valor]) => ({ nome, valor }))} />
        </Cartao>
      </div>
    </div>
  );
}
