// 6.2 · Plano atual (Diagnóstico · Motivo · Risco da inação)
// 6.3 · Plano potencial (Oportunidade identificada · Como podemos atuar juntos · Objetivo desejado)
// 6.4 · Plano otimização (Descrição · Motivo da escolha · Como melhorar)
import { useState } from "react";
import {
  CircleCheck,
  Handshake,
  Lightbulb,
  Search,
  Sparkles,
  Stethoscope,
  Target,
  ThumbsUp,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";
import { CAMPOS_CARD_ATUAL, CAMPOS_CARD_OTIMIZACAO, CAMPOS_CARD_POTENCIAL } from "@/config/campos";
import { BotaoLevarAoPlano, CardsPlano, selosVisiveis } from "@/components/CardsPlano";
import { Selo } from "@/components/ui";
import { useCliente } from "@/lib/cliente-context";
import { uid } from "@/lib/format";
import { origensNoPlano, textoAcao } from "@/lib/diagnostico";
import { planoAtual, planoOtimizacao, planoPotencial } from "@/lib/plano";
import { usePreferencias } from "@/lib/preferencias";
import ProtecaoContratar from "./ProtecaoContratar";

/** Faixa de contagem no topo de cada plano (ex.: 3 de gravidade alta). */
// ---------------------------------------------------------------------
//  6.2 · Plano atual
// ---------------------------------------------------------------------
/** Abas de gravidade do 6.2: uma por vez, para a lista não ficar longa. */
const GRAVIDADES = [
  { id: "Alta", rotulo: "Alta", cor: "border-destructive/40 bg-destructive/10 text-destructive" },
  { id: "Média", rotulo: "Média", cor: "border-warning/40 bg-warning/10 text-warning" },
  { id: "Baixa", rotulo: "Baixa", cor: "border-border bg-muted/50 text-foreground" },
  { id: "", rotulo: "Todas", cor: "border-primary/40 bg-primary/10 text-primary" },
] as const;

export function PlanoAtualCards() {
  const { cliente } = useCliente();
  const cards = planoAtual(cliente);
  const selos = selosVisiveis(cliente, "planoAtual", cards);
  const conta = (g: string) => (g ? selos.filter((x) => x === g).length : selos.length);
  // Abre na gravidade mais alta que tiver cartões.
  const [escolha, setEscolha] = useState<string | null>(null);
  const gravidade = escolha ?? (GRAVIDADES.find((g) => g.id && conta(g.id) > 0)?.id || "");
  return (
    <div className="space-y-4">
      <div role="tablist" aria-label="Gravidade" className="flex flex-wrap gap-2">
        {GRAVIDADES.map((g) => {
          const ativa = gravidade === g.id;
          return (
            <button
              key={g.rotulo}
              type="button"
              role="tab"
              aria-selected={ativa}
              onClick={() => setEscolha(g.id)}
              className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs font-medium transition ${
                ativa ? `${g.cor} shadow-sm` : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
              }`}
            >
              {g.id ? `Gravidade ${g.rotulo.toLowerCase()}` : g.rotulo}
              <span className="rounded-full bg-background/60 px-1.5 tabular-nums">{conta(g.id)}</span>
            </button>
          );
        })}
      </div>
      <CardsPlano
        lista="planoAtual"
        automaticos={cards}
        campos={CAMPOS_CARD_ATUAL}
        colunas={[
          { key: "diagnostico", rotulo: "Diagnóstico", icone: Stethoscope },
          { key: "motivo", rotulo: "Motivo", icone: Search },
          { key: "risco", rotulo: "Risco da inação", icone: TriangleAlert },
        ]}
        rotuloSelo="Gravidade"
        destaque="destructive"
        filtroSelo={gravidade || undefined}
        textoAdicionar="Adicionar diagnóstico"
        vazio={
          gravidade && selos.length
            ? `Nenhum ponto de gravidade ${gravidade.toLowerCase()}. Veja as outras gravidades acima.`
            : "Nenhum ponto de atenção identificado com os dados preenchidos."
        }
      />
    </div>
  );
}

// ---------------------------------------------------------------------
//  6.3 · Plano potencial
// ---------------------------------------------------------------------
const COR_PRODUTO: Record<string, string> = {
  Seguro: "border-primary/40 bg-primary/10 text-primary",
  Consórcio: "border-primary/40 bg-primary/10 text-primary",
};

export function PlanoPotencial() {
  const { cliente, setLista } = useCliente();
  const { apresentacao } = usePreferencias();
  const cards = planoPotencial(cliente);
  const noPlano = origensNoPlano(cliente.plano);
  return (
    <div className="space-y-4">
      {!apresentacao && (
        <p className="no-print text-xs text-muted-foreground">
          Em ordem de potencial (matriz de oportunidades, 6.6). Personalize o texto ou oculte o que não for apresentar.
        </p>
      )}
      <CardsPlano
        lista="planoPotencial"
        automaticos={cards}
        campos={CAMPOS_CARD_POTENCIAL}
        colunas={[
          { key: "oportunidade", rotulo: "Oportunidade identificada", icone: Lightbulb },
          { key: "comoAtuar", rotulo: "Como podemos atuar juntos", icone: Handshake },
          { key: "objetivo", rotulo: "Objetivo desejado", icone: Target },
        ]}
        rotuloSelo="Prioridade"
        destaque="primary"
        textoAdicionar="Adicionar oportunidade"
        vazio="Nenhuma oportunidade identificada com os dados preenchidos."
        limite={6}
        extraCabecalho={(card) =>
          card.produto ? <Selo className={COR_PRODUTO[card.produto] ?? "border-border bg-muted/40 text-muted-foreground"}>{card.produto}</Selo> : null
        }
        acoes={(card) => (
          <BotaoLevarAoPlano
            ja={noPlano.has(card.id)}
            onClick={() =>
              setLista("plano", [
                ...cliente.plano,
                {
                  id: uid(),
                  origem: card.id,
                  // Personalizado: o texto do consultor; automático: a ação da oportunidade.
                  acao: textoAcao((card.item ? card.textos.comoAtuar : card.acao ?? card.textos.comoAtuar) || card.titulo),
                  area: card.area || "Objetivos",
                  prioridade: card.selo ?? "Média",
                  prazo: "Curto",
                  status: "Pendente",
                },
              ])
            }
          />
        )}
      />
      <ProtecaoContratar />
    </div>
  );
}

// ---------------------------------------------------------------------
//  6.4 · Plano otimização
// ---------------------------------------------------------------------
export function PlanoOtimizacao() {
  const { cliente } = useCliente();
  const cards = planoOtimizacao(cliente);
  const visiveis = selosVisiveis(cliente, "planoOtimizacao", cards).length;
  return (
    <div className="space-y-4">
      {visiveis > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4 shrink-0 text-success" aria-hidden="true" />
          {visiveis === 1 ? "1 ponto que o cliente já faz bem" : `${visiveis} pontos que o cliente já faz bem`}
        </div>
      )}
      <CardsPlano
        lista="planoOtimizacao"
        automaticos={cards}
        campos={CAMPOS_CARD_OTIMIZACAO}
        colunas={[
          { key: "descricao", rotulo: "Descrição", icone: CircleCheck },
          { key: "motivo", rotulo: "Motivo da escolha", icone: ThumbsUp },
          { key: "comoMelhorar", rotulo: "Como melhorar", icone: TrendingUp },
        ]}
        destaque="success"
        textoAdicionar="Adicionar ponto forte"
        vazio="Nenhum ponto forte identificado com os dados preenchidos."
      />
    </div>
  );
}
