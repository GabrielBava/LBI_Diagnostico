// 5.1 · Pré-diagnóstico: liberado pelo botão "Finalizar coleta".
// Em cima, renda × despesas atuais × modelo 50-30-20. Embaixo, a análise
// 50-30-20 (esquerda) e o fluxo atual por categoria (direita).
import { CircleCheck, TriangleAlert } from "lucide-react";
import { Grafico503020 } from "@/components/graficos";
import { SubBloco } from "@/components/ui";
import { modelo503020, renda, s } from "@/lib/calculos";
import { useCliente } from "@/lib/cliente-context";
import { fmtBRL, fmtPct } from "@/lib/format";

/** Percentual da renda; abaixo de 1% mostra "<1%" em vez de "0%". */
const pctCurto = (v: number) => (v > 0 && v < 0.005 ? "<1%" : fmtPct(v));

const COR_PARTE: Record<string, string> = {
  Necessidades: "var(--serie-2)",
  Desejos: "var(--serie-3)",
};

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
  // Quanto falta para chegar ao modelo: o excesso de necessidades e desejos vira poupança.
  const reduzir = [nec, des].filter((p) => p.diferenca > 0.5);
  const entradas = [
    { nome: "Renda líquida do cliente", valor: r.cliente.liquida },
    { nome: "Renda líquida do cônjuge", valor: r.conjuge },
    { nome: "Outras rendas", valor: r.outras },
  ].filter((x) => x.valor > 0);

  return (
    <div className="space-y-4">
      <p className="text-lg leading-relaxed">
        {nome} ganha <strong>{fmtBRL(m.renda)}</strong> por mês, gasta <strong>{fmtBRL(m.despesas)}</strong> e{" "}
        {m.sobra >= 0 ? (
          <>
            sobram <strong className="text-gold">{fmtBRL(m.sobra)}</strong>
            {m.renda > 0 && ` (${fmtPct(m.sobra / m.renda)} da renda)`}.
          </>
        ) : (
          <>
            fica <strong className="text-destructive">{fmtBRL(m.deficit)} no vermelho</strong> todo mês.
          </>
        )}
      </p>

      <SubBloco titulo="Renda, despesas atuais e modelo 50-30-20">
        <Grafico503020 renda={m.renda} necessidades={nec.atual} desejos={des.atual} />
      </SubBloco>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <SubBloco titulo="Análise 50-30-20">
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
                    ? ehPoupanca
                      ? "Na meta ou acima"
                      : "Dentro do ideal"
                    : ehPoupanca
                      ? `${fmtBRL(-p.diferenca)} abaixo do ideal`
                      : `${fmtBRL(p.diferenca)} acima do ideal`;
                  return (
                    <li key={p.id}>
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                        <span className="text-sm font-semibold">
                          {p.label}{" "}
                          <span className="text-xs font-normal text-muted-foreground">
                            · {ehPoupanca ? `ideal: pelo menos ${fmtPct(p.meta)}` : `ideal até ${fmtPct(p.meta)}`}
                          </span>
                        </span>
                        <span className="text-sm tabular-nums">
                          <strong>{fmtPct(p.pct)}</strong> <span className="text-xs text-muted-foreground">{fmtBRL(p.atual)}</span>
                        </span>
                      </div>
                      {/* Barra em % da renda; o traço marca a meta do modelo. */}
                      <div className="relative mt-1.5 h-2.5 rounded-full bg-muted/60">
                        <div
                          className={`h-full rounded-full ${ehPoupanca ? "border border-dashed border-success bg-success/25" : ""}`}
                          style={{ width: `${Math.min(100, p.pct * 100)}%`, background: cor }}
                        />
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
                    </li>
                  );
                })}
              </ul>
              <div className="mt-4 rounded-lg border border-border bg-secondary/30 p-3 text-sm">
                {m.dentroDoModelo ? (
                  <p>Dentro do modelo: necessidades e desejos abaixo das metas e pelo menos 20% da renda livre para poupar e investir.</p>
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
                        levar a poupança a <strong className="tabular-nums">{fmtBRL(pou.ideal)}/mês</strong> (hoje{" "}
                        {fmtBRL(pou.atual)})
                      </>
                    )}
                    .
                  </p>
                )}
              </div>
            </>
          )}
        </SubBloco>

        <SubBloco titulo="Fluxo atual por categoria">
          {entradas.length > 0 && (
            <>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Entradas</div>
              <ul className="mb-3 divide-y divide-border/60">
                {entradas.map((x) => (
                  <LinhaCategoria key={x.nome} nome={x.nome} valor={x.valor} base={m.renda} />
                ))}
              </ul>
            </>
          )}
          {(["Necessidades", "Desejos"] as const).map((id) => {
            const p = parte(id);
            const cats = m.categorias.filter((c) => c.modelo === id);
            if (!cats.length) return null;
            return (
              <div key={id} className="mb-3">
                <div className="flex items-baseline justify-between gap-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: COR_PARTE[id] }} aria-hidden="true" />
                    {p.label}
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
          <div className="flex flex-wrap items-baseline justify-between gap-3 border-t border-border pt-2 text-sm">
            <span className="font-semibold">{m.sobra >= 0 ? "Sobra para poupar e investir" : "Déficit"}</span>
            <span className={`font-semibold tabular-nums ${m.sobra < 0 ? "text-destructive" : ""}`}>
              {fmtBRL(Math.abs(m.sobra))}
              {m.renda > 0 && <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">{fmtPct(Math.abs(m.sobra) / m.renda)}</span>}
            </span>
          </div>
        </SubBloco>
      </div>
      <p className="text-xs text-muted-foreground">Visão breve. A leitura completa, com proteção, futuro e plano de ação, está na etapa 6.</p>
    </div>
  );
}
