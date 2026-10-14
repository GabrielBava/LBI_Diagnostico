// Relatório completo para impressão / PDF (tema claro). Segue a versão
// apresentação: seções ocultas para o cliente não entram no PDF.
import { useEffect, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Printer } from "lucide-react";
import { HORIZONTES_PADRAO_VIDA, PRAZOS_PLANO, TIPOS_OBJETIVO } from "@/config/campos";
import { APP } from "@/config/defaults";
import { secaoOculta, secaoPorId } from "@/config/estrutura";
import { Logo } from "@/components/Header";
import { BotaoOuro, Selo, corStatus, textoStatus } from "@/components/ui";
import { despesas, fluxo, futuro, modelo503020, n, nOpt, objetivos, patrimonio, protecao, renda, s, temConjuge } from "@/lib/calculos";
import { notaGeral, pilares, temNota } from "@/lib/diagnostico";
import { oportunidades } from "@/lib/oportunidades";
import {
  COLUNAS_PLANO,
  bussola,
  dadosPerfil,
  mesclarCards,
  perfilFinanceiro,
  planoAtual,
  planoOtimizacao,
  planoPotencial,
  type CardPlano,
  type ListaCards,
} from "@/lib/plano";
import { fmtBRL, fmtData, fmtPct } from "@/lib/format";
import { lerConfig, useClientes } from "@/lib/storage";
import type { Cliente } from "@/types";

/** Bloco do relatório. `longo`: pode quebrar entre páginas (cada cartão fica inteiro), sem deixar meia página em branco. */
function Bloco({ titulo, children, longo }: { titulo: string; children: ReactNode; longo?: boolean }) {
  return (
    <section className={`mt-8 ${longo ? "" : "print-avoid"}`}>
      <h2 className="mb-3 border-b-2 border-primary pb-1 text-sm font-bold uppercase tracking-widest text-primary [break-after:avoid]">{titulo}</h2>
      {children}
    </section>
  );
}

function Tabela({ cab, linhas }: { cab: string[]; linhas: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-[10px] uppercase tracking-widest text-muted-foreground">
            {cab.map((c, i) => (
              <th key={c} className={`py-1.5 font-medium ${i > 0 ? "pl-4 text-right" : ""}`}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {linhas.map((l, i) => (
            <tr key={i}>
              {l.map((c, j) => (
                <td key={j} className={`py-1.5 ${j > 0 ? "pl-4 text-right tabular-nums" : ""}`}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const anos = (a: number) => (a === 1 ? "1 ano" : `${a} anos`);

/** Cartões de um plano (os ocultos na apresentação ficam de fora). */
function CardsRelatorio({ cliente, lista, automaticos, limite }: { cliente: Cliente; lista: ListaCards; automaticos: CardPlano[]; limite?: number }) {
  const cfg = COLUNAS_PLANO[lista];
  const todos = mesclarCards(cliente, lista, automaticos, cfg.chaves, cfg.selo).filter((c) => !c.oculto);
  const cards = limite ? todos.slice(0, limite) : todos;
  if (!cards.length) return <p className="text-sm text-muted-foreground">Nenhum item.</p>;
  return (
    <div className="space-y-3">
      {todos.length > cards.length && (
        // Instrução de uso: só na tela, fora do PDF.
        <p className="no-print text-xs text-muted-foreground">
          O PDF traz as {cards.length} primeiras oportunidades (de {todos.length}). Oculte cartões na seção 6.3 para escolher quais entram aqui.
        </p>
      )}
      {cards.map((c) => (
        <div key={c.id} className="print-avoid rounded-lg border border-border">
          <div className="flex flex-wrap items-baseline gap-x-2 border-b border-border px-3 py-2">
            <span className="text-sm font-semibold">{c.titulo}</span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {[c.area, c.selo && `${lista === "planoAtual" ? "gravidade" : "prioridade"} ${c.selo.toLowerCase()}`].filter(Boolean).join(" · ")}
            </span>
          </div>
          <div className="grid gap-3 px-3 py-2 text-xs md:grid-cols-3">
            {cfg.chaves.map((k, i) => (
              <div key={k}>
                <div className="text-[9px] font-semibold uppercase tracking-widest text-primary">{cfg.rotulos[i]}</div>
                <p className="mt-0.5 whitespace-pre-line">{c.textos[k] || "—"}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Indicador({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{rotulo}</div>
      <div className="mt-0.5 text-lg font-semibold tabular-nums">{valor}</div>
    </div>
  );
}

export default function Relatorio() {
  const { id } = useParams();
  const navigate = useNavigate();
  const cliente = useClientes().find((c) => c.id === id);
  useEffect(() => {
    if (!cliente) navigate("/clientes", { replace: true });
  }, [cliente, navigate]);
  if (!cliente) return null;
  // O diagnóstico só existe depois de "Finalizar coleta".
  if (!cliente.coletaFinalizada)
    return (
      <div className="mx-auto max-w-lg px-6 py-16 text-center">
        <p className="text-sm text-muted-foreground">Finalize a coleta para gerar o diagnóstico em PDF.</p>
        <Link to={`/clientes/${cliente.id}?secao=finalizar-coleta`} className="mt-4 inline-flex items-center gap-1 text-xs text-primary hover:underline">
          <ArrowLeft className="h-3 w-3" /> Voltar ao diagnóstico
        </Link>
      </div>
    );

  const mostra = (secaoId: string) => {
    const def = secaoPorId(secaoId);
    return !!def && !secaoOculta(cliente, def);
  };
  const cfg = lerConfig();
  const f = fluxo(cliente);
  const d = despesas(cliente);
  const p = patrimonio(cliente);
  const ps = pilares(cliente);
  const nota = notaGeral(ps);
  const pf = perfilFinanceiro(cliente);
  const perfil = dadosPerfil(cliente);
  const bu = bussola(cliente);
  // Futuro: com a simulação do 6.5, quando houver.
  const sm = cliente.simulacao;
  const fu = futuro(cliente, {
    aporte: nOpt(sm.aporte),
    retornoReal: nOpt(sm.retornoReal) !== undefined ? n(sm.retornoReal) / 100 : undefined,
    idadeAposentadoria: nOpt(sm.idadeAposentadoria),
    rendaDesejada: nOpt(sm.rendaDesejada),
  });
  const simulado = ["aporte", "retornoReal", "idadeAposentadoria", "rendaDesejada"].some((k) => nOpt(sm[k]) !== undefined);
  const ob = objetivos(cliente);
  const pr = protecao(cliente);
  const rd = renda(cliente);
  const orc = modelo503020(cliente);
  const nome = s(cliente.cadastro.nome) || "Cliente";
  const rotuloBruto = temConjuge(cliente) ? "Salário bruto (cliente + cônjuge)" : "Salário bruto";

  return (
    <div className="light min-h-screen bg-background text-foreground">
      <div className="no-print sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-card px-4 py-3 md:px-8">
        <Link to={`/clientes/${cliente.id}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-3 w-3" /> Voltar ao diagnóstico
        </Link>
        <span className="flex-1 text-xs text-muted-foreground">Na janela de impressão, escolha “Salvar como PDF”.</span>
        <BotaoOuro onClick={() => window.print()}>
          <Printer className="h-3.5 w-3.5" /> Imprimir / Salvar PDF
        </BotaoOuro>
      </div>

      <article className="mx-auto max-w-4xl bg-card px-6 py-10 md:px-12">
        <header className="print-page flex min-h-[60vh] flex-col justify-between">
          <Logo />
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-primary">Diagnóstico financeiro</div>
            <h1 className="mt-2 text-4xl font-semibold">{nome}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Preparado por {cfg.consultor} · {cfg.empresa} · {fmtData(new Date().toISOString())}
            </p>
            {s(cliente.cadastro.motivacao) && <p className="mt-8 max-w-2xl text-lg italic">“{s(cliente.cadastro.motivacao)}”</p>}
          </div>
          <div className="flex items-end justify-between">
            <div className="rounded-xl bg-gold px-6 py-4 text-primary-foreground">
              <div className="text-[10px] font-semibold uppercase tracking-widest opacity-80">Nota LIFE</div>
              <div className="text-4xl font-bold">
                {temNota(ps) ? nota : "—"}
                <span className="text-sm font-medium opacity-80"> / 100</span>
              </div>
            </div>
            <span className="text-[10px] text-muted-foreground">
              {APP.nome} {APP.versao}
            </span>
          </div>
        </header>

        {mostra("panorama") && (
          <Bloco titulo="Panorama geral">
            <div className="mb-4">
              <p className="text-sm">
                <strong>{perfil.nome}</strong>
                {perfil.rotulo && ` · ${perfil.rotulo}`}
                {perfil.linha.length > 0 && <span className="text-muted-foreground"> · {perfil.linha.join(" · ")}</span>}
              </p>
              <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm md:grid-cols-3">
                {perfil.dados.map((x) => (
                  <div key={x.rotulo}>
                    <dt className="text-[10px] uppercase tracking-widest text-muted-foreground">{x.rotulo}</dt>
                    <dd>{x.valor}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <p className="mb-3 text-sm">
              <strong>Perfil financeiro: {pf.nome}.</strong> {pf.descricao}
            </p>
            <div className={`grid grid-cols-2 gap-3 ${rd.brutaTotal > 0 ? "md:grid-cols-5" : "md:grid-cols-4"}`}>
              {rd.brutaTotal > 0 && <Indicador rotulo={rotuloBruto} valor={fmtBRL(rd.brutaTotal)} />}
              <Indicador rotulo={rd.brutaTotal > 0 ? "Renda líquida familiar" : "Renda mensal"} valor={fmtBRL(f.renda)} />
              <Indicador rotulo="Despesas mensais" valor={fmtBRL(f.despesas)} />
              <Indicador rotulo="Sobra mensal" valor={fmtBRL(f.sobra)} />
              <Indicador rotulo="Taxa de poupança" valor={fmtPct(f.taxaPoupanca)} />
            </div>
            <div className="mt-4 space-y-2">
              {ps.map((pl) => (
                <div key={pl.id} className="flex items-center gap-3">
                  <span className="w-48 text-sm font-medium">{pl.nome}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-gold" style={{ width: `${pl.status === "sem-dados" ? 0 : pl.nota}%` }} />
                  </div>
                  <Selo className={`w-24 justify-center ${corStatus[pl.status]}`}>{textoStatus[pl.status]}</Selo>
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-6 md:grid-cols-2">
              <Tabela
                cab={["Fluxo mensal", "Valor"]}
                linhas={[
                  ...(rd.brutaTotal > 0 ? [[rotuloBruto, fmtBRL(rd.brutaTotal)]] : []),
                  [rd.brutaTotal > 0 ? "Renda líquida familiar (com outras rendas)" : "Renda", fmtBRL(f.renda)],
                  ["(−) Despesas fixas", fmtBRL(f.fixas)],
                  ["(−) Despesas variáveis", fmtBRL(f.variaveis)],
                  [<strong key="a">Sobra</strong>, <strong key="b">{fmtBRL(f.sobra)}</strong>],
                ]}
              />
              <Tabela
                cab={["Maiores categorias", "Valor"]}
                linhas={[...d.porCategoria]
                  .filter((x) => x.valor > 0)
                  .sort((a, b) => b.valor - a.valor)
                  .slice(0, 6)
                  .map((x) => [x.label, fmtBRL(x.valor)])}
              />
            </div>
            <div className="mt-4 grid gap-6 md:grid-cols-2">
              <Tabela
                cab={["Ativos", "Valor"]}
                linhas={[...p.linhasAtivo.filter((l) => l.valor > 0).map((l) => [l.nome, fmtBRL(l.valor)]), [<strong key="a">Total</strong>, <strong key="b">{fmtBRL(p.ativos)}</strong>]]}
              />
              <Tabela
                cab={["Passivos", "Valor"]}
                linhas={[
                  ...p.linhasPassivo.filter((l) => l.valor > 0).map((l) => [l.nome, fmtBRL(l.valor)]),
                  [<strong key="a">Patrimônio líquido</strong>, <strong key="b">{fmtBRL(p.liquido)}</strong>],
                ]}
              />
            </div>
          </Bloco>
        )}

        {mostra("plano-atual") && orc.renda > 0 && (
          <Bloco titulo="Pré-diagnóstico · plano atual">
            <div className="mb-4 grid gap-6 md:grid-cols-2">
              <Tabela
                cab={["Renda total (cliente e dependentes)", "Valor"]}
                linhas={[
                  ...(
                    [
                      ["Renda líquida do cliente", rd.cliente.liquida],
                      ["Renda extra", rd.extra],
                      ["13º e bônus (média mensal)", rd.anualMensal],
                      ["Renda líquida do cônjuge", rd.conjuge],
                      ...rd.outrasPorPessoa.map((x) => [`Outras rendas · ${x.pessoa.toLowerCase()}`, x.valor]),
                    ] as [string, number][]
                  )
                    .filter(([, v]) => v > 0)
                    .map(([nome, v]): ReactNode[] => [nome, fmtBRL(v)]),
                  [<strong key="a">Renda total</strong>, <strong key="b">{fmtBRL(orc.renda)}</strong>],
                ]}
              />
              <Tabela
                cab={["Despesas atuais", "Valor"]}
                linhas={[
                  ...orc.despesasAtuais.linhas.filter((x) => x.valor > 0).map((x) => [x.nome, fmtBRL(x.valor)]),
                  [<strong key="a">Total de saídas</strong>, <strong key="b">{fmtBRL(orc.despesasAtuais.total)}</strong>],
                  [
                    <strong key="c">{orc.despesasAtuais.sobraLivre >= 0 ? "Sobra livre" : "Déficit"}</strong>,
                    <strong key="d">{fmtBRL(Math.abs(orc.despesasAtuais.sobraLivre))}</strong>,
                  ],
                ]}
              />
            </div>
            <div className="mb-1 text-xs font-semibold">Modelo 50-30-20 (renda líquida)</div>
            <Tabela
              cab={["Parte da renda", "Hoje", "% da renda", "Ideal", "Situação"]}
              linhas={orc.partes.map((p) => [
                `${p.label} (${Math.round(p.meta * 100)})`,
                fmtBRL(p.atual),
                fmtPct(p.pct),
                `${fmtBRL(p.ideal)} (${p.id === "Poupança" ? "mín." : "máx."} ${fmtPct(p.meta)})`,
                p.foraDoModelo
                  ? p.id === "Poupança"
                    ? `${fmtBRL(-p.diferenca)} abaixo`
                    : `${fmtBRL(p.diferenca)} acima`
                  : "Dentro do ideal",
              ])}
            />
          </Bloco>
        )}

        {mostra("plano-atual-completo") && (
          <Bloco titulo="Plano atual — diagnóstico" longo>
            <CardsRelatorio cliente={cliente} lista="planoAtual" automaticos={planoAtual(cliente)} />
          </Bloco>
        )}
        {mostra("plano-potencial") && (
          <Bloco titulo="Plano potencial — como podemos atuar juntos" longo>
            <CardsRelatorio cliente={cliente} lista="planoPotencial" automaticos={planoPotencial(cliente)} limite={8} />
          </Bloco>
        )}
        {mostra("plano-otimizacao") && (
          <Bloco titulo="Plano otimização — o que você já faz bem" longo>
            <CardsRelatorio cliente={cliente} lista="planoOtimizacao" automaticos={planoOtimizacao(cliente)} />
          </Bloco>
        )}

        {mostra("objetivos") && cliente.objetivos.length > 0 && (
          <Bloco titulo="Objetivos">
            <Tabela
              cab={["Objetivo", "Valor futuro", "Prazo", "Aporte/mês", "Prob. atual → com plano"]}
              linhas={TIPOS_OBJETIVO.flatMap((t) =>
                (ob.porTipo[t.id] ?? []).map((o) => [
                  <span key="n">
                    <span className="mr-2 text-[10px] uppercase tracking-widest text-primary">{t.titulo}</span>
                    <span className="font-medium">{s(o.titulo)}</span>
                    {s(o.motivo) && <span className="block text-xs italic text-muted-foreground">“{s(o.motivo)}”</span>}
                  </span>,
                  fmtBRL(n(o.valorFuturo)),
                  n(o.prazoMeses) > 0 ? `${n(o.prazoMeses)} meses` : "—",
                  n(o.prazoMeses) > 0 ? fmtBRL(ob.aportes[o.id] ?? 0) : "—",
                  `${n(o.probAtual)}% → ${n(o.probPlano)}%`,
                ]),
              )}
            />
          </Bloco>
        )}

        {(mostra("protecao") || mostra("plano-potencial")) && pr.necessidade > 0 && (
          <Bloco titulo="Proteção da família">
            <Tabela
              cab={["Componente", "Valor"]}
              linhas={[
                ["Educacional (escola e faculdade)", fmtBRL(pr.componentes.educacional)],
                [`Padrão de vida (${anos(pr.horizonte)})`, fmtBRL(pr.componentes.padraoVida)],
                ["Sucessão patrimonial (ITCMD + honorários)", fmtBRL(pr.componentes.sucessao)],
                ...(pr.componentes.quitacao > 0 ? [["Quitação de financiamentos e dívidas", fmtBRL(pr.componentes.quitacao)]] : []),
                [<strong key="a">Necessidade total</strong>, <strong key="b">{fmtBRL(pr.necessidade)}</strong>],
                ["(−) Reserva, investimentos e previdência", `− ${fmtBRL(pr.recursos)}`],
                [<strong key="c">Capital necessário</strong>, <strong key="d">{fmtBRL(pr.necessario)}</strong>],
                ["Capital atual (seguro de vida)", fmtBRL(pr.atual)],
                [<strong key="e">A contratar</strong>, <strong key="f">{fmtBRL(pr.gap)}</strong>],
              ]}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Padrão de vida ({fmtBRL(pr.custoMensal)}/mês):{" "}
              {HORIZONTES_PADRAO_VIDA.map((h) => `${anos(h)} ${fmtBRL(pr.padraoVida[h] ?? 0)}`).join(" · ")}. Sucessão sobre patrimônio quitado de{" "}
              {fmtBRL(pr.quitados)}: ITCMD {fmtBRL(pr.itcmd)} + honorários {fmtBRL(pr.honorarios)}.
              {pr.empresa > 0 && ` O seguro pela empresa (${fmtBRL(pr.empresa)}) não entra: termina com o vínculo.`}
            </p>
          </Bloco>
        )}

        {mostra("futuro") && fu.rendaDesejada > 0 && s(cliente.cadastro.nascimento) && (
          <Bloco titulo="Futuro — independência financeira">
            {fu.alvo <= 0 ? (
              <p className="text-sm">
                <strong>Independência atingida (100%):</strong> as outras rendas ({fmtBRL(fu.outras)}/mês) já cobrem a renda desejada de{" "}
                {fmtBRL(fu.rendaDesejada)}/mês na aposentadoria.
              </p>
            ) : fu.idadeAtingida ? (
              <>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  <Indicador rotulo="Patrimônio necessário" valor={fmtBRL(fu.alvo)} />
                  <Indicador rotulo="Investimentos e previdência hoje" valor={fmtBRL(fu.atual)} />
                  <Indicador rotulo="Falta para a meta" valor={fmtBRL(fu.faltaHoje)} />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  A idade de aposentadoria ({fu.idadeAposentadoria} anos) já foi atingida: o cliente tem {fu.idadeAtual} anos. Meta: renda de{" "}
                  {fmtBRL(fu.rendaDesejada)}/mês (valores de hoje).
                </p>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <Indicador rotulo="Patrimônio necessário" valor={fmtBRL(fu.alvo)} />
                  <Indicador rotulo="Independência atingida" valor={fmtPct(Math.min(fu.independencia, 9.99))} />
                  <Indicador rotulo="Aporte necessário" valor={`${fmtBRL(fu.aporte)}/mês`} />
                  <Indicador rotulo="Renda projetada" valor={`${fmtBRL(fu.rendaProjetada)}/mês`} />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {simulado ? "Simulação: " : "Meta: "}renda de {fmtBRL(fu.rendaDesejada)}/mês aos {fu.idadeAposentadoria} anos, investindo{" "}
                  {simulado || fu.aporteInformado ? "" : "a sobra livre de "}
                  {fmtBRL(fu.aporteAtual)}/mês com retorno real de {fmtPct(fu.retornoReal, 1)} a.a. (valores de hoje).
                  {fu.retiradaMensal > 0 &&
                    ` Retirando a renda, o patrimônio dura ${fu.esgotaAos !== undefined ? `até os ${fu.esgotaAos} anos` : "além dos 95 anos"}.`}
                </p>
                <div className="mt-4">
                  <div className="mb-1 text-xs font-semibold">Plano de independência</div>
                  <Tabela
                    cab={["Marco", "Patrimônio", "% da meta", "Renda passiva", "Total aportado"]}
                    linhas={fu.marcos.map((m) => [
                      `${anos(m.anos)}${m.idade !== undefined ? ` (${m.idade} anos)` : ""}`,
                      fmtBRL(m.patrimonio),
                      fmtPct(Math.min(m.percentualMeta, 9.99)),
                      `${fmtBRL(m.rendaPassiva)}/mês`,
                      fmtBRL(m.aportado),
                    ])}
                  />
                </div>
              </>
            )}
          </Bloco>
        )}

        {mostra("oportunidades") && oportunidades(cliente).length > 0 && (
          <Bloco titulo="Matriz de oportunidades" longo>
            <Tabela
              cab={["Oportunidade", "Área", "Produto", "Potencial"]}
              linhas={oportunidades(cliente).map((o) => [
                <span key="t">
                  <span className="font-medium">{o.titulo}</span>
                  <span className="block text-xs text-muted-foreground">{o.oferta}</span>
                </span>,
                o.area,
                o.produto,
                String(o.potencial),
              ])}
            />
          </Bloco>
        )}

        {mostra("bussola") && bu.temDados && (
          <Bloco titulo="Bússola financeira">
            <p className="mb-3 text-sm">
              Saúde financeira: <strong>{bu.nota}/100</strong>
              {bu.norte && (
                <>
                  {" "}
                  · Norte agora: <strong>{bu.norte.nome}</strong> — {bu.norte.pergunta.toLowerCase()}
                </>
              )}
            </p>
            <div className="space-y-2">
              {bu.dimensoes.map((x) => (
                <div key={x.id} className="print-avoid rounded-lg border border-border px-3 py-2">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <span className="text-sm font-semibold">{x.nome}</span>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {x.status === "sem-dados" ? "—" : `${x.nota}/100`} · {textoStatus[x.status]}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{x.resumo}</p>
                  {x.acoes.length > 0 && (
                    <ul className="mt-1 list-disc pl-5 text-xs">
                      {x.acoes.map((a) => (
                        <li key={a.id}>{a.texto}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </Bloco>
        )}

        {mostra("plano-acao") && cliente.plano.length > 0 && (
          <Bloco titulo="Plano de ação">
            {Object.entries(PRAZOS_PLANO).map(([chave, pz]) => {
              const acoes = cliente.plano.filter((a) => (s(a.prazo) || "Curto") === chave);
              if (!acoes.length) return null;
              return (
                <div key={chave} className="mb-4">
                  <div className="mb-1 text-xs font-semibold">{pz.titulo}</div>
                  <Tabela cab={["Ação", "Área", "Prioridade", "Status"]} linhas={acoes.map((a) => [s(a.acao), s(a.area), s(a.prioridade), s(a.status) || "Pendente"])} />
                </div>
              );
            })}
          </Bloco>
        )}

        {mostra("jornada-cliente") && (
          <Bloco titulo="Jornada e próximos passos">
            <Tabela
              cab={["Encontro", "Data", "Status"]}
              linhas={cliente.jornada.map((r) => [s(r.titulo), s(r.data) ? fmtData(s(r.data)) : "A agendar", s(r.status) || "Pendente"])}
            />
            <p className="mt-6 text-[10px] text-muted-foreground">
              Projeções baseadas nas informações fornecidas, com inflação de {n(cliente.parametros.inflacaoGeral)}% a.a. e retorno real de{" "}
              {n(cliente.parametros.retornoReal)}% a.a. Não constituem garantia de rentabilidade.
            </p>
          </Bloco>
        )}
      </article>
    </div>
  );
}
