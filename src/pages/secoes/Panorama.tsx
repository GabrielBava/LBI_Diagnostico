// 6.1 · Panorama geral: perfil do cliente, perfil financeiro, nota LIFE, Estrela LIFE
// (radar dos pilares e resumo do diagnóstico), fluxo de caixa, maiores categorias de
// despesa e balanço patrimonial.
import { useState, type ReactNode } from "react";
import { ChevronDown, CircleCheck, CircleMinus, CircleX, Quote, TriangleAlert } from "lucide-react";
import { Interruptor } from "@/components/campos";
import { Estrela } from "@/components/Estrela";
import { BarrasHorizontais, RendaVsDespesas } from "@/components/graficos";
import { Selo, SubBloco, corStatus, textoStatus } from "@/components/ui";
import { secaoPorId } from "@/config/estrutura";
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
import type { Status } from "@/lib/diagnostico";
import { estrela, porEstado, type Estrela as DadosEstrela, type PilarEstrela } from "@/lib/estrela";
import { fmtBRL, fmtPct } from "@/lib/format";
import { dadosPerfil, perfilFinanceiro } from "@/lib/plano";

export const iconeStatus: Record<Status, typeof CircleCheck> = {
  ok: CircleCheck,
  atencao: TriangleAlert,
  critico: CircleX,
  "sem-dados": CircleMinus,
};

/** Seção da coleta com os dados de cada pilar da estrela. */
const secaoDoPilar: Record<string, string> = {
  organizacao: "despesas",
  comportamento: "investimentos",
  protecao: "protecao",
  objetivos: "objetivos",
  acumulo: "dividas",
  aposentadoria: "aposentadoria",
  expansao: "patrimonio",
  sucessao: "protecao",
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

/** Barra fina de 0 a 100%. */
function Barrinha({ pct, className = "" }: { pct: number; className?: string }) {
  return (
    <div className={`h-1.5 overflow-hidden rounded-full bg-muted ${className}`}>
      <div className="h-full rounded-full bg-gold" style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
    </div>
  );
}

/** Um pilar do resumo: o que é, nota, estado e barra; aberto, mostra os sub-pilares e o que pesou. */
function LinhaPilar({ pilar, aberto, onAlternar }: { pilar: PilarEstrela; aberto: boolean; onAlternar: () => void }) {
  const { irPara } = useCliente();
  const I = iconeStatus[pilar.status];
  const semDados = pilar.status === "sem-dados";
  const secao = secaoPorId(secaoDoPilar[pilar.id] ?? "");
  return (
    <li className={`rounded-lg border bg-card/60 transition ${aberto ? "border-primary/50" : "border-border"}`}>
      <button type="button" aria-expanded={aberto} onClick={onAlternar} className="w-full rounded-lg p-3 text-left hover:bg-muted/30">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-sm font-semibold">{pilar.nome}</span>
              <Selo className={`gap-1 ${corStatus[pilar.status]}`}>
                <I className="h-3 w-3" /> {textoStatus[pilar.status]}
              </Selo>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">{pilar.descricao}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="whitespace-nowrap tabular-nums">
              <span className="text-lg font-bold">{semDados ? "—" : pilar.nota}</span>
              <span className="text-xs text-muted-foreground"> / {pilar.maximo}</span>
            </span>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition ${aberto ? "rotate-180" : ""}`} aria-hidden />
          </div>
        </div>
        <Barrinha pct={semDados ? 0 : pilar.pct} className="mt-2" />
      </button>
      {aberto && (
        <div className="border-t border-border/60 px-3 pb-3 pt-2">
          <ul className="divide-y divide-border/60">
            {pilar.subs.map((x) => (
              <li key={x.id} className="py-2">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[13px] font-medium">{x.nome}</span>
                  <span className="shrink-0 whitespace-nowrap text-xs tabular-nums">
                    <span className="font-semibold">{x.semDados ? "—" : x.nota}</span>
                    <span className="text-muted-foreground"> / 5</span>
                  </span>
                </div>
                <Barrinha pct={x.semDados ? 0 : x.pct} className="mt-1 h-1" />
                <p className="mt-1 text-xs text-muted-foreground">
                  {x.semDados && <span className="font-medium text-foreground">Sem dados. </span>}
                  {x.pesou}
                </p>
              </li>
            ))}
          </ul>
          {secao && (
            <button
              type="button"
              onClick={() => irPara(secao.id)}
              className="no-print mt-1 text-[11px] font-semibold text-primary hover:underline"
            >
              Ver os dados em {secao.numero} · {secao.titulo}
            </button>
          )}
        </div>
      )}
    </li>
  );
}

/** Estrela LIFE à esquerda e o resumo do diagnóstico (crítico → atenção → saudável) à direita. */
function EstrelaLife({ dados }: { dados: DadosEstrela }) {
  const [subPilares, setSubPilares] = useState(false);
  const [aberto, setAberto] = useState<string>();
  const alternar = (id: string) => setAberto((a) => (a === id ? undefined : id));
  return (
    <section className="rounded-xl border border-border bg-secondary/20 p-3 sm:p-4">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Estrela LIFE</h3>
            <div className="no-print w-52">
              <Interruptor label="Exibir sub-pilares" valor={subPilares} onChange={setSubPilares} />
            </div>
          </div>
          <Estrela dados={dados} subPilares={subPilares} selecionado={aberto} onSelecionar={alternar} />
          <p className="mt-2 text-[11px] text-muted-foreground">
            Cada pilar soma 5 pontos por sub-pilar (total 100). Quanto mais longe do centro, melhor. Toque num pilar para ver o que pesou.
          </p>
        </div>
        <div className="min-w-0">
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Resumo do diagnóstico</h3>
            <span className="text-right text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              <span className="hidden sm:inline">Nota conquistada / máxima</span>
              <span className="sm:hidden">Nota / máxima</span>
            </span>
          </div>
          <ul className="space-y-2">
            {porEstado(dados.pilares).map((x) => (
              <LinhaPilar key={x.id} pilar={x} aberto={subPilares || aberto === x.id} onAlternar={() => alternar(x.id)} />
            ))}
          </ul>
          <div className="mt-3 flex items-baseline justify-between gap-3 rounded-lg border border-primary/30 bg-primary/[0.07] px-3 py-2">
            <span className="text-sm font-semibold">Total</span>
            <span className="tabular-nums">
              <span className="text-lg font-bold text-primary">{dados.temDados ? dados.total : "—"}</span>
              <span className="text-xs text-muted-foreground"> / {dados.maximo}</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Panorama() {
  const { cliente } = useCliente();
  const est = estrela(cliente);
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
            <span className="text-5xl font-bold tabular-nums">{est.temDados ? est.total : "—"}</span>
            <span className="text-sm opacity-80">/ {est.maximo}</span>
          </div>
          <p className="mt-2 text-xs opacity-90">Soma dos 8 pilares da Estrela LIFE, logo abaixo.</p>
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
          {s(cliente.cadastro.controleGastos) !== "" && (
            <p className="mt-1 text-xs text-muted-foreground">
              Controle de gastos: {s(cliente.cadastro.controleGastos)}
              {s(cliente.cadastro.controleGastos) !== "Nenhum" && s(cliente.cadastro.frequenciaControle) ? ` · ${s(cliente.cadastro.frequenciaControle).toLowerCase()}` : ""}
            </p>
          )}
        </div>
      </div>

      <EstrelaLife dados={est} />

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
