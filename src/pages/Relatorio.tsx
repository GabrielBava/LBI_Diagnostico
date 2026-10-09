// Relatório completo para impressão / PDF (sempre em tema claro).
import { useEffect, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Printer } from "lucide-react";
import { APP } from "@/config/defaults";
import { Logo } from "@/components/Header";
import { BotaoOuro, Selo, corStatus, textoStatus } from "@/components/ui";
import {
  alavancagem,
  aposentadoria,
  educacaoTotal,
  fluxo,
  n,
  patrimonio,
  reservaEmergencia,
  s,
  seguroVida,
  sonhos,
} from "@/lib/calculos";
import { notaGeral, pilares, sugestoes } from "@/lib/diagnostico";
import { fmtBRL, fmtData, fmtPct } from "@/lib/format";
import { lerConfig, useClientes } from "@/lib/storage";

function Bloco({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="print-avoid mt-8">
      <h2 className="mb-3 border-b-2 border-primary pb-1 text-sm font-bold uppercase tracking-widest text-primary">{titulo}</h2>
      {children}
    </section>
  );
}

function Tabela({ cab, linhas }: { cab: string[]; linhas: ReactNode[][] }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-border text-left text-[10px] uppercase tracking-widest text-muted-foreground">
          {cab.map((c, i) => (
            <th key={c} className={`py-1.5 font-medium ${i > 0 ? "text-right" : ""}`}>
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {linhas.map((l, i) => (
          <tr key={i}>
            {l.map((c, j) => (
              <td key={j} className={`py-1.5 ${j > 0 ? "text-right tabular-nums" : ""}`}>
                {c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
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

  const cfg = lerConfig();
  const f = fluxo(cliente);
  const p = patrimonio(cliente);
  const r = reservaEmergencia(cliente);
  const ps = pilares(cliente);
  const nota = notaGeral(ps);
  const sug = sugestoes(cliente).slice(0, 3);
  const so = sonhos(cliente);
  const ed = educacaoTotal(cliente);
  const sv = seguroVida(cliente);
  const ap = aposentadoria(cliente);
  const al = alavancagem(cliente);
  const nome = s(cliente.cadastro.nome) || "Cliente";

  return (
    <div className="light min-h-screen bg-background text-foreground">
      <div className="no-print sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-card px-4 py-3 md:px-8">
        <Link to={`/clientes/${cliente.id}?etapa=visao-geral`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-3 w-3" /> Voltar ao diagnóstico
        </Link>
        <span className="flex-1 text-xs text-muted-foreground">Dica: na janela de impressão escolha “Salvar como PDF”.</span>
        <BotaoOuro onClick={() => window.print()}>
          <Printer className="h-3.5 w-3.5" /> Imprimir / Salvar PDF
        </BotaoOuro>
      </div>

      <article className="mx-auto max-w-4xl bg-card px-6 py-10 md:px-12">
        {/* Capa */}
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
              <div className="text-4xl font-bold">{nota}<span className="text-sm font-medium opacity-80"> / 100</span></div>
            </div>
            <span className="text-[10px] text-muted-foreground">{APP.nome} {APP.versao}</span>
          </div>
        </header>

        <Bloco titulo="Retrato atual">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Indicador rotulo="Renda mensal" valor={fmtBRL(f.renda)} />
            <Indicador rotulo="Despesas + parcelas" valor={fmtBRL(f.despesas + f.parcelas)} />
            <Indicador rotulo="Sobra mensal" valor={fmtBRL(f.sobra)} />
            <Indicador rotulo="Taxa de poupança" valor={fmtPct(f.taxaPoupanca)} />
            <Indicador rotulo="Patrimônio" valor={fmtBRL(p.total)} />
            <Indicador rotulo="Dívidas" valor={fmtBRL(p.dividas)} />
            <Indicador rotulo="Patrimônio líquido" valor={fmtBRL(p.liquido)} />
            <Indicador rotulo="Reserva (meses)" valor={r.meses.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} />
          </div>
        </Bloco>

        <Bloco titulo="Pilares">
          <div className="space-y-2">
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
        </Bloco>

        {sug.length > 0 && (
          <Bloco titulo="Prioridades">
            <ol className="space-y-2">
              {sug.map((x, i) => (
                <li key={x.id} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold text-xs font-bold text-primary-foreground">{i + 1}</span>
                  <div>
                    <div className="text-sm font-semibold">{x.titulo}</div>
                    <p className="text-xs text-muted-foreground">{x.detalhe}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Bloco>
        )}

        {cliente.sonhos.length > 0 && (
          <Bloco titulo="Sonhos e objetivos">
            <Tabela
              cab={["Sonho", "Valor hoje", "Prazo", "Aporte mensal"]}
              linhas={so.lista.map((x) => [
                <span key="n">
                  <span className="font-medium">{s(x.item.descricao)}</span>
                  {s(x.item.motivo) && <span className="block text-xs italic text-muted-foreground">“{s(x.item.motivo)}”</span>}
                </span>,
                fmtBRL(n(x.item.valor)),
                `${n(x.item.prazo)} anos`,
                fmtBRL(x.aporte),
              ])}
            />
            {ed.aporteTotal > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                Educação dos filhos: custo futuro de {fmtBRL(ed.custoFuturoTotal)}, aporte de {fmtBRL(ed.aporteTotal)}/mês.
              </p>
            )}
          </Bloco>
        )}

        <Bloco titulo="Proteção da família">
          <Tabela
            cab={["Componente", "Valor"]}
            linhas={[
              ["Manutenção do padrão de vida", fmtBRL(sv.componentes.manutencao)],
              ["Quitação de dívidas", fmtBRL(sv.componentes.dividas)],
              ["Educação dos filhos", fmtBRL(sv.componentes.educacaoFilhos)],
              ["Inventário e sucessão", fmtBRL(sv.componentes.inventario)],
              ["(−) Patrimônio financeiro disponível", `− ${fmtBRL(sv.recursos)}`],
              [<strong key="a">Capital necessário</strong>, <strong key="b">{fmtBRL(sv.necessario)}</strong>],
              ["Capital atual", fmtBRL(sv.atual)],
              [<strong key="c">Gap de proteção</strong>, <strong key="d">{fmtBRL(sv.gap)}</strong>],
            ]}
          />
        </Bloco>

        {ap.alvo > 0 && (
          <Bloco titulo="Independência financeira">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Indicador rotulo={`Patrimônio alvo (${Math.round(ap.multiplicador)}x)`} valor={fmtBRL(ap.alvo)} />
              <Indicador rotulo="Progresso" valor={fmtPct(ap.progresso)} />
              <Indicador rotulo="Aporte necessário" valor={`${fmtBRL(ap.aporte)}/mês`} />
              <Indicador rotulo="Aporte atual" valor={`${fmtBRL(ap.aporteAtual)}/mês`} />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Meta: renda de {fmtBRL(ap.rendaAlvo)}/mês aos {ap.idadeAlvo} anos. Mantido o aporte atual, o patrimônio projetado é de{" "}
              {fmtBRL(ap.projetadoAtual)} (valores de hoje).
            </p>
          </Bloco>
        )}

        {al.valor > 0 && cliente.naoAplica.alavancagem !== true && (
          <Bloco titulo={`Alavancagem: ${s(cliente.alavancagem.bemDesejado) || "bem desejado"}`}>
            <Tabela
              cab={["Estratégia", "Parcela", "Total pago", `Patrimônio em ${al.anos} anos`]}
              linhas={[
                ["Poupar e comprar à vista", fmtBRL(Math.max(al.parcelaFin, al.parcelaCons)), fmtBRL(Math.max(al.parcelaFin, al.parcelaCons) * al.meses), fmtBRL(al.comparativo[0].valor)],
                ["Financiamento bancário", fmtBRL(al.parcelaFin), fmtBRL(al.totalFin), fmtBRL(al.comparativo[1].valor)],
                ["Consórcio + investido", fmtBRL(al.parcelaCons), fmtBRL(al.totalCons), fmtBRL(al.comparativo[2].valor)],
              ]}
            />
          </Bloco>
        )}

        {cliente.plano.length > 0 && (
          <Bloco titulo="Plano de ação">
            <Tabela
              cab={["Ação", "Responsável", "Prazo", "Status"]}
              linhas={cliente.plano.map((a) => [s(a.acao), s(a.responsavel), fmtData(s(a.prazo)), s(a.status)])}
            />
          </Bloco>
        )}

        <Bloco titulo="Próximos passos">
          <p className="text-sm">
            {s(cliente.cadastro.proximaRevisao)
              ? `Próxima revisão agendada para ${fmtData(s(cliente.cadastro.proximaRevisao))}.`
              : "Agende a próxima revisão com o seu consultor."}
            {s(cliente.cadastro.combinados) && ` Combinados: ${s(cliente.cadastro.combinados)}`}
          </p>
          <p className="mt-6 text-[10px] text-muted-foreground">
            Projeções baseadas nas informações fornecidas e nos parâmetros de inflação ({n(cliente.parametros.inflacaoGeral)}% a.a.) e
            retorno real ({n(cliente.parametros.retornoReal)}% a.a.). Não constituem garantia de rentabilidade.
          </p>
        </Bloco>
      </article>
    </div>
  );
}
