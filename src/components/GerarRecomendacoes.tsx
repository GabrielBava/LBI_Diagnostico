// Botão "Gerar recomendações": fica logo depois do pré-diagnóstico (5.1).
// Ao clicar, abre a 5.2 · Recomendações com três blocos de indicação (nome e
// contato) e rola a página até ela. Antes disso, a 5.2 não aparece.
import { UserPlus } from "lucide-react";
import { RECOMENDACOES_INICIAIS } from "@/config/campos";
import { useCliente } from "@/lib/cliente-context";
import { uid } from "@/lib/format";
import { BotaoOuro } from "./ui";

export function GerarRecomendacoes() {
  const { atualizar, irPara } = useCliente();

  const gerar = () => {
    atualizar((c) => ({
      ...c,
      recomendacoesAbertas: new Date().toISOString(),
      // Recomendações já guardadas (ex.: 5.2 fechada e aberta de novo) são mantidas.
      recomendacoes: c.recomendacoes.length ? c.recomendacoes : Array.from({ length: RECOMENDACOES_INICIAIS }, () => ({ id: uid() })),
    }));
    // Espera a 5.2 aparecer na página para rolar até ela.
    window.setTimeout(() => irPara("recomendacoes"), 120);
  };

  return (
    <section id="sec-gerar-recomendacoes" className="secao-ancora no-print rounded-2xl border border-primary/40 bg-primary/5 p-5 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">5.2 · Recomendações</div>
          <h2 className="mt-1 text-xl font-semibold">Gerar recomendações</h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Peça ao cliente indicações de pessoas que também podem se beneficiar do planejamento. Abre três blocos com nome e contato, e dá para
            adicionar mais.
          </p>
        </div>
        <BotaoOuro onClick={gerar} className="shrink-0 justify-center self-start px-5 py-3 text-sm md:self-auto">
          <UserPlus className="h-4 w-4" aria-hidden="true" /> Gerar recomendações
        </BotaoOuro>
      </div>
    </section>
  );
}
