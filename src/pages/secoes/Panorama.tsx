// 6.1 · Panorama geral: perfil do cliente, perfil financeiro, nota LIFE e pilares,
// fluxo de caixa, maiores categorias de despesa e balanço patrimonial.
import type { ReactNode } from "react";
import { CircleCheck, CircleMinus, CircleX, Quote, TriangleAlert } from "lucide-react";
import { BarrasHorizontais, RendaVsDespesas } from "@/components/graficos";
import { Selo, SubBloco, corStatus, textoStatus } from "@/components/ui";
import { useCliente } from "@/lib/cliente-context";
import {
  despesas,
  fluxo,
  n,
  parametros,
  patrimonio,
  reservaEmergencia,
  s,
} from "@/lib/calculos";
import { notaGeral, pilares, temNota, type Status } from "@/lib/diagnostico";
import { fmtBRL, fmtPct } from "@/lib/format";
import { dadosPerfil, perfilFinanceiro } from "@/lib/plano";

export const iconeStatus: Record<Status, typeof CircleCheck> = {
  ok: CircleCheck,
  atencao: TriangleAlert,
  critico: CircleX,
  "sem-dados": CircleMinus,
};

const secaoDoPilar: Record<string, string> = {
  fluxo: "despesas",
  reserva: "protecao",
  dividas: "dividas",
  protecao: "protecao",
  futuro: "futuro",
  objetivos: "objetivos",
};

/** Par rótulo / valor do perfil. */
function Dado({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{rotulo}</dt>
      <dd className="mt-0.5 text-sm [overflow-wrap:anywhere]">{children}</dd>
    </div>
  );
}

const iniciais = (nome: string) =>
  nome
    .split(/\s+/)
    .filter(Boolean)
    .filter((_, i, a) => i === 0 || i === a.length - 1)
    .map((p) => p[0]!.toUpperCase())
    .join("") || "?";

function Perfil() {
  const { cliente: c } = useCliente();
  const pf = dadosPerfil(c);
  return (
    <SubBloco titulo="Perfil">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gold text-base font-bold text-primary-foreground">
          {iniciais(pf.nome)}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-semibold leading-tight [overflow-wrap:anywhere]">{pf.nome}</span>
            {pf.rotulo && <Selo className="border-primary/30 bg-primary/10 text-primary">{pf.rotulo}</Selo>}
          </div>
          {pf.linha.length > 0 && <p className="mt-0.5 text-sm text-muted-foreground">{pf.linha.join(" · ")}</p>}
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
        {pf.dados.map((d) => (
          <Dado key={d.rotulo} rotulo={d.rotulo}>
            {d.valor}
          </Dado>
        ))}
      </dl>
    </SubBloco>
  );
}

function PerfilFinanceiro() {
  const { cliente: c } = useCliente();
  const f = fluxo(c);
  const p = patrimonio(c);
  const r = reservaEmergencia(c);
  const { limite } = parametros(c.parametros);
  const pf = perfilFinanceiro(c);
  const meses = r.meses.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
  return (
    <SubBloco titulo="Perfil financeiro">
      <div className="rounded-lg border border-primary/30 bg-primary/[0.07] p-3">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Momento financeiro</div>
        <div className="mt-0.5 text-lg font-semibold text-primary">{pf.nome}</div>
        <p className="text-xs text-muted-foreground">{pf.descricao}</p>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
        <Dado rotulo="Renda líquida">
          <span className="font-semibold tabular-nums">{fmtBRL(f.renda)}</span>
          <span className="text-xs text-muted-foreground">/mês</span>
        </Dado>
        <Dado rotulo="Despesas">
          <span className="font-semibold tabular-nums">{fmtBRL(f.despesas)}</span>
          <span className="text-xs text-muted-foreground">/mês</span>
        </Dado>
        <Dado rotulo={f.sobra < 0 ? "Déficit" : "Sobra"}>
          <span className={`font-semibold tabular-nums ${f.sobra < 0 ? "text-destructive" : ""}`}>{fmtBRL(Math.abs(f.sobra))}</span>
          {f.renda > 0 && <span className="text-xs text-muted-foreground"> · {fmtPct(Math.abs(f.taxaPoupanca))} da renda</span>}
        </Dado>
        <Dado rotulo="Patrimônio líquido">
          <span className="font-semibold tabular-nums">{fmtBRL(p.liquido)}</span>
        </Dado>
        <Dado rotulo="Parcelas sobre a renda">
          <span className={`font-semibold tabular-nums ${f.comprometimento > limite ? "text-destructive" : ""}`}>{fmtPct(f.comprometimento)}</span>
          <span className="text-xs text-muted-foreground"> · limite {fmtPct(limite)}</span>
        </Dado>
        <Dado rotulo="Reserva de emergência">
          <span className={`font-semibold tabular-nums ${r.meta > 0 && r.falta > 0 ? "text-warning" : ""}`}>
            {r.meta > 0 ? `${meses} ${meses === "1" ? "mês" : "meses"}` : "—"}
          </span>
          {r.meta > 0 && <span className="text-xs text-muted-foreground"> · meta {r.mesesMeta}</span>}
        </Dado>
      </dl>
    </SubBloco>
  );
}

export default function Panorama() {
  const { cliente, irPara } = useCliente();
  const ps = pilares(cliente);
  const nota = notaGeral(ps);
  const f = fluxo(cliente);
  const d = despesas(cliente);
  const p = patrimonio(cliente);
  const maior = Math.max(p.ativos, p.passivos, 1);
  const motivacao = s(cliente.cadastro.motivacao);
  const motivos = cliente.objetivos.filter((o) => s(o.motivo)).slice(0, 3);
  // As 8 maiores categorias; o restante é somado em "Demais categorias".
  const ordenadas = d.porCategoria.filter((x) => x.valor > 0).sort((a, b) => b.valor - a.valor);
  const demais = ordenadas.slice(8).reduce((t, x) => t + x.valor, 0);
  const topCategorias = [
    ...ordenadas.slice(0, 8).map((x) => ({ nome: x.label, valor: x.valor })),
    ...(demais > 0 ? [{ nome: "Demais categorias", valor: demais }] : []),
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-2">
        <Perfil />
        <PerfilFinanceiro />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="rounded-xl bg-gold p-5 text-primary-foreground">
          <div className="text-[10px] font-semibold uppercase tracking-widest opacity-80">Nota LIFE</div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-5xl font-bold tabular-nums">{temNota(ps) ? nota : "—"}</span>
            <span className="text-sm opacity-80">/ 100</span>
          </div>
          <p className="mt-2 text-xs opacity-90">Média dos pilares com dados preenchidos.</p>
        </div>
        <div className="rounded-xl border border-border p-5 lg:col-span-2">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            <Quote className="h-3.5 w-3.5 text-primary" /> Nas palavras do cliente
          </div>
          {motivacao || motivos.length ? (
            <div className="mt-2 space-y-1.5">
              {motivacao && <p className="text-base italic">“{motivacao}”</p>}
              {motivos.map((o) => (
                <p key={o.id} className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{s(o.titulo)}:</span> “{s(o.motivo)}”
                </p>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">Registre a motivação no ponto de partida (3 · Objetivos) e o “porquê” de cada objetivo.</p>
          )}
          {s(cliente.cadastro.satisfacao) !== "" && (
            <p className="mt-2 text-xs text-muted-foreground">Satisfação financeira declarada: {n(cliente.cadastro.satisfacao)}/10</p>
          )}
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {ps.map((x) => {
          const I = iconeStatus[x.status];
          return (
            <button
              key={x.id}
              type="button"
              onClick={() => irPara(secaoDoPilar[x.id])}
              className="rounded-lg border border-border bg-secondary/30 p-3 text-left transition hover:border-primary/50"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold">{x.nome}</span>
                <Selo className={`gap-1 ${corStatus[x.status]}`}>
                  <I className="h-3 w-3" /> {textoStatus[x.status]}
                </Selo>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-gold" style={{ width: `${x.status === "sem-dados" ? 0 : x.nota}%` }} />
                </div>
                <span className="w-8 text-right text-xs tabular-nums text-muted-foreground">{x.status === "sem-dados" ? "—" : x.nota}</span>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">{x.resumo}</p>
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SubBloco titulo="Fluxo de caixa mensal">
          <RendaVsDespesas renda={f.renda} fixas={f.fixas} variaveis={f.variaveis} />
          {f.parcelas > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              Parcelas de financiamentos, consórcios e empréstimos ({fmtBRL(f.parcelas)}) estão dentro das despesas fixas.
            </p>
          )}
        </SubBloco>
        <SubBloco titulo="Maiores categorias de despesa">
          <BarrasHorizontais dados={topCategorias} ultimo="Demais categorias" />
        </SubBloco>
      </div>

      <SubBloco titulo="Balanço patrimonial" total={<span>Patrimônio líquido: {fmtBRL(p.liquido)}</span>}>
        <div className="grid gap-6 md:grid-cols-2">
          {[
            { titulo: "Ativos", total: p.ativos, linhas: p.linhasAtivo, cor: "bg-gold" },
            { titulo: "Passivos", total: p.passivos, linhas: p.linhasPassivo, cor: "bg-muted-foreground/50" },
          ].map((lado) => (
            <div key={lado.titulo}>
              <div className="mb-2 flex items-baseline justify-between">
                <span className="text-sm font-semibold">{lado.titulo}</span>
                <span className="text-sm font-semibold tabular-nums">{fmtBRL(lado.total)}</span>
              </div>
              <div className="mb-3 h-3 rounded-full bg-muted/50">
                <div className={`h-full rounded-full ${lado.cor}`} style={{ width: `${(lado.total / maior) * 100}%` }} />
              </div>
              <div className="divide-y divide-border/60">
                {lado.linhas
                  .filter((l) => l.valor > 0)
                  .map((l) => (
                    <div key={l.nome} className="flex justify-between gap-3 py-1.5 text-sm">
                      <span className="text-muted-foreground">{l.nome}</span>
                      <span className="tabular-nums">{fmtBRL(l.valor)}</span>
                    </div>
                  ))}
                {lado.linhas.every((l) => l.valor <= 0) && <p className="py-1.5 text-xs text-muted-foreground">Nada registrado.</p>}
              </div>
            </div>
          ))}
        </div>
      </SubBloco>
    </div>
  );
}
