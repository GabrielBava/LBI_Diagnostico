// 6.2 · Plano atual: categorias, renda × despesas, balanço patrimonial e o que contratar em proteção.
import type { ReactNode } from "react";
import { Banknote, CircleCheck, GraduationCap, House, Scale } from "lucide-react";
import { CAMPOS_PREMISSAS_PROTECAO, HORIZONTES_PADRAO_VIDA } from "@/config/campos";
import { Formulario } from "@/components/campos";
import { BarrasHorizontais, RendaVsDespesas } from "@/components/graficos";
import { Kpi, LinhaValor, SubBloco } from "@/components/ui";
import { useCliente } from "@/lib/cliente-context";
import { despesas, fluxo, n, patrimonio, protecao, rotuloDependente, s } from "@/lib/calculos";
import { fmtBRL, fmtPct } from "@/lib/format";
import { usePreferencias } from "@/lib/preferencias";

const fmtAnos = (a: number) => (a === 1 ? "1 ano" : `${a} anos`);
/** Percentual com até 1 casa decimal (4% / 4,5%). */
const fmtTaxa = (v: number) => fmtPct(v, Math.round(v * 1000) % 10 === 0 ? 0 : 1);

/** Cartão de um componente da necessidade de proteção. */
function Componente({ titulo, icone, valor, children }: { titulo: string; icone: ReactNode; valor: number; children: ReactNode }) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-card p-3">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="flex min-w-0 items-center gap-1.5 text-sm font-semibold">
          {icone}
          <span className="min-w-0">{titulo}</span>
        </span>
        <span className="shrink-0 text-sm font-semibold tabular-nums">{fmtBRL(valor)}</span>
      </div>
      {children}
    </div>
  );
}

function ProtecaoContratar() {
  const { cliente, setCampo } = useCliente();
  const { apresentacao } = usePreferencias();
  const pr = protecao(cliente);
  const ed = pr.educacional;
  const sucessaoTotal = pr.componentes.sucessao;
  const taxaItcmd = pr.quitados > 0 ? pr.itcmd / pr.quitados : n(cliente.protecao.itcmd ?? 4) / 100;
  const taxaHonorarios = pr.quitados > 0 ? pr.honorarios / pr.quitados : n(cliente.protecao.honorarios ?? 6) / 100;
  const icone = "h-4 w-4 shrink-0 text-primary";

  return (
    <SubBloco titulo="Proteção · o que contratar">
      <p className="mb-4 text-xs text-muted-foreground">
        Capital para a família manter o padrão de vida, garantir a educação dos filhos e cobrir os custos da sucessão.
      </p>

      <div className="space-y-4">
        {/* a) Padrão de vida */}
        <Componente titulo={`Padrão de vida (${fmtAnos(pr.horizonte)})`} icone={<House className={icone} aria-hidden="true" />} valor={pr.componentes.padraoVida}>
          <div role="radiogroup" aria-label="Horizonte do padrão de vida" className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {HORIZONTES_PADRAO_VIDA.map((h) => {
              const ativo = pr.horizonte === h;
              return (
                <button
                  key={h}
                  type="button"
                  role="radio"
                  aria-checked={ativo}
                  onClick={() => setCampo("protecao", "horizonte", h)}
                  className={`min-w-0 rounded-lg border p-3 text-left transition ${
                    ativo
                      ? "border-transparent bg-gold text-primary-foreground shadow-sm"
                      : "border-border bg-input hover:border-primary/50"
                  }`}
                >
                  <span className={`flex items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-widest ${ativo ? "opacity-80" : "text-muted-foreground"}`}>
                    {fmtAnos(h)}
                    {ativo && <CircleCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
                  </span>
                  <span className="mt-1 block truncate text-lg font-semibold tabular-nums">{fmtBRL(pr.padraoVida[h] ?? 0)}</span>
                  <span className={`mt-0.5 block text-[11px] ${ativo ? "opacity-80" : "text-muted-foreground"}`}>
                    custo de vida de {fmtBRL(pr.custoMensal)}/mês
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Despesas atuais sem parcelas de dívidas e sem mensalidades escolares (que entram no educacional). Toque em um horizonte para
            usá-lo no cálculo.
          </p>
        </Componente>

        <div className="grid gap-4 md:grid-cols-2">
          {/* b) Educacional */}
          <Componente titulo="Educacional" icone={<GraduationCap className={icone} aria-hidden="true" />} valor={ed.total}>
            {ed.lista.length === 0 ? (
              <p className="text-xs text-muted-foreground">Sem filhos em idade escolar.</p>
            ) : (
              <ul className="divide-y divide-border/60">
                {ed.lista.map((x, i) => {
                  const d = x.item;
                  const nome = rotuloDependente(cliente.dependentes, d);
                  const partes = [
                    ...(x.anosEscola > 0 ? [`escola ${fmtBRL(x.escola)} (${fmtAnos(x.anosEscola)})`] : []),
                    ...(x.faculdade > 0 ? [`faculdade ${fmtBRL(x.faculdade)}`] : []),
                  ];
                  return (
                    <li key={d.id || i} className="py-1.5">
                      <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="min-w-0 truncate">
                          {nome}
                          {s(d.nome) && s(d.categoria) && <span className="text-muted-foreground"> · {s(d.categoria)}</span>}
                        </span>
                        <span className="shrink-0 tabular-nums">{fmtBRL(x.total)}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {s(d.nivelEscola) || "Escolaridade não informada"}
                        {partes.length > 0 ? ` · ${partes.join(" + ")}` : " · sem custo previsto"}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Componente>

          {/* c) Sucessão patrimonial */}
          <Componente titulo="Sucessão patrimonial" icone={<Scale className={icone} aria-hidden="true" />} valor={sucessaoTotal}>
            <div className="divide-y divide-border/60">
              <LinhaValor rotulo="Patrimônio quitado" valor={fmtBRL(pr.quitados)} />
              <LinhaValor rotulo={`ITCMD (${fmtTaxa(taxaItcmd)})`} valor={fmtBRL(pr.itcmd)} />
              <LinhaValor rotulo={`Honorários e custas (${fmtTaxa(taxaHonorarios)})`} valor={fmtBRL(pr.honorarios)} />
              <LinhaValor rotulo="Total da sucessão" valor={fmtBRL(sucessaoTotal)} forte />
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Bens quitados, reserva, investimentos e participação em empresa. Previdência vai direto aos beneficiários.
            </p>
          </Componente>
        </div>

        {/* d) Quitação de dívidas (opcional) */}
        {pr.componentes.quitacao > 0 && (
          <Componente titulo="Quitação de dívidas" icone={<Banknote className={icone} aria-hidden="true" />} valor={pr.componentes.quitacao}>
            <p className="text-xs text-muted-foreground">Saldo de financiamentos e dívidas, para a família não herdar parcelas.</p>
          </Componente>
        )}

        {/* e) Resumo */}
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,18rem)] lg:items-start">
          <div className="min-w-0 divide-y divide-border/60 rounded-lg border border-border bg-card px-3 py-1.5">
            <LinhaValor rotulo="Educacional" valor={fmtBRL(pr.componentes.educacional)} />
            <LinhaValor rotulo={`Padrão de vida (${fmtAnos(pr.horizonte)})`} valor={fmtBRL(pr.componentes.padraoVida)} />
            <LinhaValor rotulo="Sucessão patrimonial" valor={fmtBRL(pr.componentes.sucessao)} />
            {pr.componentes.quitacao > 0 && <LinhaValor rotulo="Quitação de dívidas" valor={fmtBRL(pr.componentes.quitacao)} />}
            <LinhaValor rotulo="= Necessidade total" valor={fmtBRL(pr.necessidade)} forte />
            <LinhaValor rotulo="(−) Reserva, investimentos e previdência" valor={<span className="whitespace-nowrap">− {fmtBRL(pr.recursos)}</span>} />
            <LinhaValor rotulo="= Capital necessário" valor={fmtBRL(pr.necessario)} forte />
            <LinhaValor rotulo="(−) Seguro de vida atual" valor={<span className="whitespace-nowrap">− {fmtBRL(pr.atual)}</span>} />
            <LinhaValor rotulo="= A contratar" valor={fmtBRL(pr.gap)} forte />
          </div>
          {pr.necessidade <= 0 ? (
            <Kpi rotulo="A contratar" valor="—" detalhe="Informe despesas, dependentes e patrimônio para calcular." />
          ) : pr.gap > 0 ? (
            <Kpi
              rotulo="A contratar"
              valor={fmtBRL(pr.gap)}
              tom="ouro"
              detalhe={pr.atual > 0 ? `O seguro atual cobre ${fmtPct(pr.cobertura)} do capital necessário` : "Hoje não há seguro de vida individual"}
            />
          ) : (
            <Kpi
              rotulo="A contratar"
              valor={fmtBRL(0)}
              tom="sucesso"
              detalhe={
                <span className="inline-flex items-center gap-1">
                  <CircleCheck className="h-3.5 w-3.5 shrink-0 text-success" aria-hidden="true" />
                  {pr.necessario > 0 ? "O seguro atual cobre a necessidade" : "Os recursos atuais cobrem a necessidade"}
                </span>
              }
            />
          )}
        </div>

        {pr.empresa > 0 && (
          <p className="text-xs text-muted-foreground">O seguro pela empresa ({fmtBRL(pr.empresa)}) não entra: termina com o vínculo.</p>
        )}

        {/* f) Premissas (só consultor) */}
        {!apresentacao && (
          <details className="no-print rounded-xl border border-border p-3">
            <summary className="cursor-pointer text-xs font-semibold text-muted-foreground">Premissas do cálculo</summary>
            <div className="mt-3">
              <Formulario
                campos={CAMPOS_PREMISSAS_PROTECAO}
                dados={cliente.protecao}
                cliente={cliente}
                // Em branco, o cálculo usa estes valores (mostrados como "auto").
                automaticos={{ itcmd: 4, honorarios: 6, mensalidadeFaculdade: 3000, duracaoFaculdade: 5 }}
                onChange={(k, v) => setCampo("protecao", k, v)}
              />
            </div>
          </details>
        )}
      </div>
    </SubBloco>
  );
}

export default function PlanoAtualCompleto() {
  const { cliente } = useCliente();
  const d = despesas(cliente);
  const f = fluxo(cliente);
  const p = patrimonio(cliente);
  const maior = Math.max(p.ativos, p.passivos, 1);
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
        <SubBloco titulo="Maiores categorias de despesa">
          <BarrasHorizontais dados={topCategorias} ultimo="Demais categorias" />
        </SubBloco>
        <SubBloco titulo="Fluxo de caixa mensal">
          <RendaVsDespesas renda={f.renda} fixas={f.fixas} variaveis={f.variaveis} />
          {f.parcelas > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              Parcelas de financiamentos, consórcios e empréstimos ({fmtBRL(f.parcelas)}) estão dentro das despesas fixas.
            </p>
          )}
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
                    <div key={l.nome} className="flex justify-between py-1.5 text-sm">
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

      <ProtecaoContratar />
    </div>
  );
}
