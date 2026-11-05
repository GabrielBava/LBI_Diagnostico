// 9.1 · Apresentação V2 (só na versão consultor): resumo do que vai nos slides e o botão que
// abre a apresentação numa aba nova (rota /clientes/:id/v2). A apresentação não permite
// download nem impressão: o diagnóstico completo vai em PDF.
import { BadgeDollarSign, CircleCheck, CircleMinus, Lock, MonitorPlay } from "lucide-react";
import { BotaoOuro, Selo, SubBloco } from "@/components/ui";
import { useCliente } from "@/lib/cliente-context";
import { especificacao } from "@/lib/especificacao";
import { estrela } from "@/lib/estrela";
import { fluxo } from "@/lib/calculos";
import { fmtBRL } from "@/lib/format";
import { mesclarCards, COLUNAS_PLANO, planoAtual, planoOtimizacao, planoPotencial } from "@/lib/plano";

export default function ApresentacaoV2Secao() {
  const { cliente, irPara } = useCliente();
  const e = especificacao(cliente);
  const f = fluxo(cliente);
  const visiveis = (lista: "planoAtual" | "planoPotencial" | "planoOtimizacao", auto: Parameters<typeof mesclarCards>[2]) =>
    mesclarCards(cliente, lista, auto, COLUNAS_PLANO[lista].chaves, COLUNAS_PLANO[lista].selo).filter((c) => !c.oculto).length;
  const topicos: { titulo: string; ok: boolean; detalhe: string }[] = [
    { titulo: "Visão executiva", ok: true, detalhe: "Atual × necessário × decisão" },
    { titulo: "Indicadores financeiros", ok: f.renda > 0, detalhe: "Receita líquida, superávit, proteção, reserva, futuro e patrimônio" },
    { titulo: "Estrela LIFE", ok: estrela(cliente).temDados, detalhe: "Os 8 pilares e a nota LIFE" },
    { titulo: "Fluxo de caixa", ok: f.renda > 0, detalhe: "Receita, despesa, superávit e o 50-30-20" },
    { titulo: "Despesas por categoria", ok: f.despesas > 0, detalhe: "As maiores categorias do mês" },
    { titulo: "Plano potencial", ok: visiveis("planoPotencial", planoPotencial(cliente)) > 0, detalhe: "Até 6 oportunidades visíveis no 6.3" },
    { titulo: "Plano otimização", ok: visiveis("planoOtimizacao", planoOtimizacao(cliente)) > 0, detalhe: "Até 6 pontos fortes visíveis no 6.4" },
    { titulo: "Alertas críticos", ok: visiveis("planoAtual", planoAtual(cliente)) > 0, detalhe: "Até 6 alertas do 6.2, do mais grave" },
    { titulo: "Plano de ação estruturado", ok: true, detalhe: cliente.plano.length ? "Ações do 6.8 por prazo" : "Sugestões do plano, por prazo" },
    { titulo: "Investimento e Dashplan", ok: e.valor > 0, detalhe: `Life Planejamento · ${fmtBRL(e.valor, true)}` },
  ];
  const abrir = () => {
    const base = window.location.href.split("#")[0];
    window.open(`${base}#/clientes/${cliente.id}/v2`, "_blank", "noopener");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 rounded-2xl border border-primary/40 bg-primary/5 p-5 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">Etapa 9 · V2</div>
          <h3 className="mt-1 text-lg font-semibold">Apresentação para o cliente</h3>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            O resumo do diagnóstico em slides interativos, com a marca Life Planejamento. Abre numa aba nova; use as setas ou os pontos para navegar e F
            para tela cheia.
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" /> Sem download e sem impressão: o diagnóstico completo vai em PDF.
          </p>
        </div>
        <BotaoOuro onClick={abrir} className="shrink-0 justify-center self-start px-5 py-3 text-sm md:self-auto">
          <MonitorPlay className="h-4 w-4" aria-hidden="true" /> Abrir apresentação V2
        </BotaoOuro>
      </div>

      <SubBloco titulo="O que vai nos slides">
        <ol className="grid gap-2 sm:grid-cols-2">
          {topicos.map((t, i) => (
            <li key={t.titulo} className="flex items-start gap-3 rounded-lg border border-border bg-card px-3 py-2.5">
              <span className="w-6 shrink-0 text-sm font-bold tabular-nums text-primary">{String(i + 1).padStart(2, "0")}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{t.titulo}</span>
                <span className="block text-xs text-muted-foreground">{t.detalhe}</span>
              </span>
              {t.ok ? (
                <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-label="Com dados" />
              ) : (
                <CircleMinus className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-label="Sem dados" />
              )}
            </li>
          ))}
        </ol>
      </SubBloco>

      <SubBloco titulo="Investimento que vai na apresentação">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <span className="flex flex-wrap items-center gap-2">
            <BadgeDollarSign className="h-4 w-4 text-primary" aria-hidden="true" />
            <strong>Valor do plano</strong>
            <Selo className="border-border bg-muted/40 text-muted-foreground">{fmtBRL(e.valor, true)}</Selo>
            <span className="text-muted-foreground">
              · Pix/boleto {fmtBRL(e.pix.total, true)} · cartão{" "}
              {e.parcelas === 1 ? `à vista ${fmtBRL(e.cartao.total, true)}` : `${e.parcelas}× de ${fmtBRL(e.cartao.parcela, true)}`}
            </span>
          </span>
          <button type="button" onClick={() => irPara("especificacao")} className="text-xs font-semibold text-primary underline-offset-2 hover:underline">
            Ajustar em 7 · Precificação
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Na apresentação não dá para mudar o valor nem dar desconto: ajuste na 7.1. Com a apresentação aberta, clique no logo do slide 11 para
          atualizar o valor sem voltar ao início.
        </p>
      </SubBloco>
    </div>
  );
}
