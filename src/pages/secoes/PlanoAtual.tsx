// 5.1 · Pré-diagnóstico: liberado pelo botão "Finalizar coleta".
// Renda total (cliente e dependentes) e despesas atuais (fixas, variáveis, financiamentos,
// dívidas e aportes em projetos); o gráfico renda × hoje × modelo 50-30-20 (renda líquida);
// embaixo, o resumo da análise 50-30-20 (esquerda) e as despesas por categoria (direita).
import { CircleCheck, TriangleAlert } from "lucide-react";
import { Grafico503020 } from "@/components/graficos";
import { SubBloco } from "@/components/ui";
import { modelo503020, renda, s } from "@/lib/calculos";
import { MODELO_50_30_20 } from "@/config/despesas";
import { useCliente } from "@/lib/cliente-context";
import { fmtBRL, fmtPct } from "@/lib/format";

/** Percentual da renda; abaixo de 1% mostra "<1%" em vez de "0%". */
const pctCurto = (v: number) => (v > 0 && v < 0.005 ? "<1%" : fmtPct(v));

const COR_PARTE: Record<string, string> = {
  Necessidades: "var(--serie-2)",
  Desejos: "var(--serie-3)",
};
/** "Essencial (50)", "Estilo e Desejos (30)", "Projeto e Investimentos (20)". */
const tituloParte = (id: string) => {
  const m = MODELO_50_30_20.find((x) => x.id === id)!;
  return `${m.label} (${Math.round(m.meta * 100)})`;
};

/** Linha de total (soma em negrito, com o % da renda). */
function LinhaTotal({ nome, valor, base, perigo }: { nome: string; valor: number; base: number; perigo?: boolean }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-3 border-t border-border pt-2 text-sm">
      <span className="font-semibold">{nome}</span>
      <span className={`font-semibold tabular-nums ${perigo ? "text-destructive" : ""}`}>
        {fmtBRL(valor)}
        {base > 0 && <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">{fmtPct(Math.abs(valor) / base)}</span>}
      </span>
    </div>
  );
}

/** Linha "nome · valor · % da renda" com barra fina proporcional à renda. */
function LinhaCategoria({ nome, valor, base, cor }: { nome: string; valor: number; base: number; cor?: string }) {
  const pct = base > 0 ? valor / base : 0;
  return (
    <li className="py-1.5">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="min-w-0 break-words">{nome}</span>
        <span className="shrink-0 tabular-nums">
          {fmtBRL(valor)}
          {base > 0 && <span className="ml-1.5 text-[11px] text-muted-foreground">{pctCurto(pct)}</span>}
        </span>
      </div>
      {cor && (
        <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted/60">
          <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct * 100)}%`, background: cor }} />
        </div>
      )}
    </li>
  );
}

export default function PlanoAtual() {
  const { cliente } = useCliente();
  const m = modelo503020(cliente);
  const r = renda(cliente);
  const nome = s(cliente.cadastro.nome).split(" ")[0] || "O cliente";

  if (m.renda <= 0 && m.despesas <= 0)
    return <p className="text-sm text-muted-foreground">Preencha renda e despesas para gerar o pré-diagnóstico.</p>;

  const parte = (id: string) => m.partes.find((p) => p.id === id)!;
  const nec = parte("Necessidades");
  const des = parte("Desejos");
  const pou = parte("Poupança");
  const da = m.despesasAtuais;
  // Quanto falta para chegar ao modelo: o excesso de essencial e de estilo e desejos vira projeto e investimentos.
  const reduzir = [nec, des].filter((p) => p.diferenca > 0.5);
  const outrasPessoa = (pessoa: string) => r.outrasPorPessoa.find((x) => x.pessoa === pessoa)?.valor ?? 0;
  const entradas = [
    { nome: "Renda líquida do cliente", valor: r.cliente.liquida },
    { nome: "Renda extra", valor: r.extra },
    {
      nome: `13º e bônus (${fmtBRL(r.decimoTerceiro + r.bonusAnual)}/ano ÷ 12)`,
      valor: r.anualMensal,
    },
    { nome: "Renda líquida do cônjuge", valor: r.conjuge },
    { nome: "Outras rendas do cliente", valor: outrasPessoa("Cliente") },
    { nome: "Outras rendas do cônjuge", valor: outrasPessoa("Cônjuge") },
    { nome: "Rendas de outras pessoas", valor: outrasPessoa("Outra pessoa") },
  ].filter((x) => x.valor > 0);
  const { minima, maxima } = m.poupancaDeclarada;

  return (
    <div className="space-y-4">
      <p className="text-lg leading-relaxed">
        {nome} tem renda total de <strong>{fmtBRL(m.renda)}</strong> por mês e despesas atuais de <strong>{fmtBRL(m.despesas)}</strong>
        {m.aportesProjetos > 0 && (
          <>
            , além de <strong>{fmtBRL(m.aportesProjetos)}</strong> em aportes nos projetos
          </>
        )}
        .{" "}
        {da.sobraLivre >= 0 ? (
          <>
            Sobram <strong className="text-gold">{fmtBRL(da.sobraLivre)}</strong> livres
            {m.renda > 0 && ` (${fmtPct(da.sobraLivre / m.renda)} da renda)`}.
          </>
        ) : m.sobra >= 0 ? (
          <>
            Os aportes nos projetos passam a sobra em <strong className="text-destructive">{fmtBRL(-da.sobraLivre)}</strong> por mês.
          </>
        ) : (
          <>
            Faltam <strong className="text-destructive">{fmtBRL(-da.sobraLivre)}</strong> todo mês.
          </>
        )}
      </p>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <SubBloco titulo="Renda total (cliente e dependentes)">
          {entradas.length ? (
            <ul className="divide-y divide-border/60">
              {entradas.map((x) => (
                <LinhaCategoria key={x.nome} nome={x.nome} valor={x.valor} base={m.renda} />
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma renda informada.</p>
          )}
          <LinhaTotal nome="Renda total" valor={m.renda} base={0} />
        </SubBloco>

        <SubBloco titulo="Despesas atuais">
          <ul className="divide-y divide-border/60">
            {da.linhas.map((x) => (
              <LinhaCategoria key={x.id} nome={x.nome} valor={x.valor} base={m.renda} cor={x.id === "projetos" ? "var(--serie-1)" : "rgb(var(--muted-foreground) / 0.6)"} />
            ))}
          </ul>
          <LinhaTotal nome="Total de saídas" valor={da.total} base={m.renda} />
          <div className="mt-2">
            <LinhaTotal nome={da.sobraLivre >= 0 ? "Sobra livre" : "Déficit"} valor={Math.abs(da.sobraLivre)} base={m.renda} perigo={da.sobraLivre < 0} />
          </div>
        </SubBloco>
      </div>

      <SubBloco titulo="Modelo 50-30-20 (renda líquida)">
        <Grafico503020 renda={m.renda} necessidades={nec.atual} desejos={des.atual} aportes={m.aportesProjetos} />
      </SubBloco>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        {/* No desktop o resumo acompanha a rolagem da lista de categorias ao lado. */}
        <SubBloco titulo="Resumo da análise 50-30-20" className="lg:sticky lg:top-20">
          {m.renda <= 0 ? (
            <p className="text-sm text-muted-foreground">Informe a renda para comparar com o modelo.</p>
          ) : (
            <>
              <ul className="space-y-4">
                {m.partes.map((p) => {
                  const ok = !p.foraDoModelo;
                  const Icone = ok ? CircleCheck : TriangleAlert;
                  const ehPoupanca = p.id === "Poupança";
                  const cor = COR_PARTE[p.id];
                  const situacao = ok
                    ? "Dentro da meta"
                    : ehPoupanca
                      ? `${fmtBRL(-p.diferenca)} abaixo`
                      : `${fmtBRL(p.diferenca)} acima`;
                  return (
                    <li key={p.id}>
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                        <span className="text-sm font-semibold">
                          {tituloParte(p.id)}{" "}
                          <span className="text-xs font-normal text-muted-foreground">
                            · meta: {ehPoupanca ? `pelo menos ${fmtPct(p.meta)}` : `até ${fmtPct(p.meta)}`}
                          </span>
                        </span>
                        <span className="text-sm tabular-nums">
                          <strong>{fmtPct(p.pct)}</strong> <span className="text-xs text-muted-foreground">{fmtBRL(p.atual)}</span>
                        </span>
                      </div>
                      {/* Barra em % da renda; o traço marca a meta do modelo. */}
                      <div className="relative mt-1.5 h-2.5 rounded-full bg-muted/60">
                        {p.pct > 0 && (
                          <div
                            className={`h-full rounded-full ${ehPoupanca ? "border border-dashed border-success bg-success/25" : ""}`}
                            style={{ width: `${Math.min(100, p.pct * 100)}%`, background: cor }}
                          />
                        )}
                        <span
                          className="absolute -top-1 h-[18px] w-0.5 rounded bg-foreground"
                          style={{ left: `calc(${p.meta * 100}% - 1px)` }}
                          aria-hidden="true"
                        />
                      </div>
                      <p className={`mt-1 flex items-center gap-1 text-xs ${ok ? "text-muted-foreground" : "font-medium text-warning"}`}>
                        <Icone className={`h-3.5 w-3.5 shrink-0 ${ok ? "text-success" : ""}`} aria-hidden="true" />
                        {situacao} · ideal {fmtBRL(p.ideal)}
                      </p>
                      {ehPoupanca &&
                        m.aportesProjetos > 0 &&
                        (m.sobraLivre >= 0 ? (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {fmtBRL(m.aportesProjetos)} em aportes nos projetos
                            {m.sobraLivre > 0 ? ` + ${fmtBRL(m.sobraLivre)} de sobra livre` : ""}.
                          </p>
                        ) : (
                          <p className="mt-0.5 text-xs font-medium text-warning">
                            {m.sobra > 0
                              ? `Os aportes declarados nos projetos (${fmtBRL(m.aportesProjetos)}) passam a sobra em ${fmtBRL(-m.sobraLivre)}.`
                              : `Não há sobra para os aportes declarados nos projetos (${fmtBRL(m.aportesProjetos)}).`}
                          </p>
                        ))}
                    </li>
                  );
                })}
              </ul>
              <div className="mt-4 space-y-2 rounded-lg border border-border bg-secondary/30 p-3 text-sm">
                {m.dentroDoModelo ? (
                  <p>Dentro do modelo: essencial e estilo e desejos abaixo das metas e pelo menos 20% da renda para projetos e investimentos.</p>
                ) : (
                  <p>
                    Para chegar ao 50-30-20
                    {reduzir.length > 0 ? (
                      <>
                        , reduzir{" "}
                        {reduzir.map((p, i) => (
                          <span key={p.id}>
                            {i > 0 && " e "}
                            <strong className="tabular-nums">{fmtBRL(p.diferenca)}</strong> em {p.label.toLowerCase()}
                          </span>
                        ))}
                      </>
                    ) : null}
                    {pou.foraDoModelo && (
                      <>
                        {reduzir.length > 0 ? " e " : ", "}
                        levar projeto e investimentos a <strong className="tabular-nums">{fmtBRL(pou.ideal)}/mês</strong> (hoje{" "}
                        {fmtBRL(pou.atual)})
                      </>
                    )}
                    .
                  </p>
                )}
                {(minima !== undefined || maxima !== undefined) && (
                  <p className="text-muted-foreground">
                    O cliente diz que consegue poupar{" "}
                    <strong className="text-foreground">
                      {minima !== undefined && maxima !== undefined
                        ? `de ${fmtBRL(minima)} a ${fmtBRL(maxima)}`
                        : minima !== undefined
                          ? `ao menos ${fmtBRL(minima)}`
                          : `até ${fmtBRL(maxima!)}`}
                    </strong>{" "}
                    por mês
                    {maxima !== undefined && maxima < pou.ideal
                      ? `: abaixo dos ${fmtBRL(pou.ideal)} do modelo.`
                      : minima !== undefined && minima >= pou.ideal
                        ? `: já cobre os ${fmtBRL(pou.ideal)} do modelo.`
                        : `; o modelo pede ${fmtBRL(pou.ideal)}.`}
                  </p>
                )}
              </div>
            </>
          )}
        </SubBloco>

        <SubBloco titulo="Despesas por categoria">
          {(["Necessidades", "Desejos"] as const).map((id) => {
            const p = parte(id);
            const cats = m.categorias.filter((c) => c.modelo === id);
            if (!cats.length) return null;
            return (
              <div key={id} className="mb-3">
                <div className="flex items-baseline justify-between gap-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: COR_PARTE[id] }} aria-hidden="true" />
                    {tituloParte(id)}
                  </span>
                  <span className="tabular-nums">
                    {fmtBRL(p.atual)}
                    {m.renda > 0 && ` · ${fmtPct(p.pct)}`}
                  </span>
                </div>
                <ul className="divide-y divide-border/60">
                  {cats.map((c) => (
                    <LinhaCategoria key={c.id} nome={c.label} valor={c.valor} base={m.renda} cor={COR_PARTE[id]} />
                  ))}
                </ul>
              </div>
            );
          })}
          {m.sobra >= 0 ? (
            <div>
              <div className="flex items-baseline justify-between gap-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-sm border border-dashed border-success bg-success/25" aria-hidden="true" />
                  {tituloParte("Poupança")}
                </span>
                <span className="tabular-nums">
                  {fmtBRL(m.sobra)}
                  {m.renda > 0 && ` · ${fmtPct(m.sobra / m.renda)}`}
                </span>
              </div>
              <ul className="divide-y divide-border/60">
                {m.aportesProjetos > 0 && (
                  <LinhaCategoria nome="Aportes em projetos" valor={Math.min(m.aportesProjetos, m.sobra)} base={m.renda} cor="var(--serie-1)" />
                )}
                {m.sobraLivre >= 0 && <LinhaCategoria nome="Sobra livre" valor={m.sobraLivre} base={m.renda} cor="rgb(var(--success))" />}
              </ul>
              {m.sobraLivre < 0 && (
                <p className="mt-1.5 text-xs font-medium text-warning">Aportes declarados acima da sobra: {fmtBRL(-m.sobraLivre)} por mês.</p>
              )}
            </div>
          ) : (
            <>
              {m.aportesProjetos > 0 && (
                <ul className="divide-y divide-border/60">
                  <LinhaCategoria nome="Aportes em projetos (sem sobra para cobrir)" valor={m.aportesProjetos} base={m.renda} cor="rgb(var(--warning))" />
                </ul>
              )}
              {/* O mesmo déficit do topo e das despesas atuais: despesas + aportes − renda. */}
              <LinhaTotal nome="Déficit" valor={-da.sobraLivre} base={m.renda} perigo />
            </>
          )}
        </SubBloco>
      </div>
      <p className="text-xs text-muted-foreground">Visão breve. A leitura completa, com proteção, futuro e plano de ação, está na etapa 6.</p>
    </div>
  );
}
