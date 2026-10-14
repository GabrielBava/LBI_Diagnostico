// 3 · Objetivos: ponto de partida (motivação e satisfação) e os objetivos em Essencial, Desejo e Sonho.
// O aporte necessário de cada objetivo aparece só na versão consultor.
import { HeartHandshake } from "lucide-react";
import { CAMPOS_OBJETIVO, CAMPOS_PONTO_PARTIDA, ICONES_OBJETIVO, TIPOS_OBJETIVO } from "@/config/campos";
import { Formulario } from "@/components/campos";
import { ListaItens } from "@/components/ListaEditor";
import { SubBloco } from "@/components/ui";
import { useCliente } from "@/lib/cliente-context";
import { usePreferencias } from "@/lib/preferencias";
import { fluxo, n, objetivos, s } from "@/lib/calculos";
import { fmtBRL } from "@/lib/format";
import type { Item } from "@/types";

const COR_TIPO: Record<string, string> = {
  Essencial: "bg-accent",
  Desejo: "bg-primary",
  Sonho: "bg-gold",
};

function TituloObjetivo({ o }: { o: Item }) {
  const categoria = s(o.categoria);
  const Icone = categoria ? ICONES_OBJETIVO[categoria] : undefined;
  return (
    // Em tela estreita a categoria desce para baixo do título (não espreme as palavras).
    <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-sm font-semibold text-foreground">
      {Icone && (
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-gold text-primary-foreground">
          <Icone className="h-4 w-4" aria-hidden="true" />
        </span>
      )}
      <span className="min-w-0 hyphens-auto break-words">{s(o.titulo) || "Novo objetivo"}</span>
      {categoria && <span className="shrink-0 text-xs font-normal text-muted-foreground">{categoria}</span>}
    </span>
  );
}

export default function Objetivos() {
  const { cliente, setLista, setCampo } = useCliente();
  const { apresentacao } = usePreferencias();
  const ob = objetivos(cliente);
  const f = fluxo(cliente);

  return (
    <div className="space-y-4">
      {/* Ponto de partida (antes no V1): fica no cadastro do cliente e volta no Panorama e no PDF. */}
      <SubBloco
        titulo={
          <span className="flex items-center gap-2">
            <HeartHandshake className="h-3.5 w-3.5 text-primary" /> Ponto de partida
          </span>
        }
      >
        <Formulario campos={CAMPOS_PONTO_PARTIDA} dados={cliente.cadastro} cliente={cliente} onChange={(k, v) => setCampo("cadastro", k, v)} />
      </SubBloco>
      {TIPOS_OBJETIVO.map((t) => {
        const doTipo = ob.porTipo[t.id] ?? [];
        return (
          <SubBloco
            key={t.id}
            titulo={
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className={`h-2.5 w-2.5 rounded-full ${COR_TIPO[t.id]}`} />
                <span className="text-foreground">{t.titulo}</span>
                <span className="font-normal normal-case tracking-normal">· {t.descricao}</span>
              </span>
            }
          >
            <ListaItens
              campos={CAMPOS_OBJETIVO}
              itens={doTipo}
              onChange={(novos) => setLista("objetivos", [...cliente.objetivos.filter((o) => s(o.tipo) !== t.id), ...novos])}
              novo={() => ({ tipo: t.id })}
              textoAdicionar={`Adicionar objetivo ${t.titulo.toLowerCase()}`}
              tituloItem={(o) => <TituloObjetivo o={o} />}
              // Botão à direita do cartão oculta os campos e deixa só este resumo.
              resumoItem={(o) =>
                [
                  n(o.valorFuturo) > 0 ? fmtBRL(n(o.valorFuturo)) : null,
                  n(o.prazoMeses) > 0 ? `${n(o.prazoMeses)} meses` : null,
                  s(o.prioridade) ? `prioridade ${s(o.prioridade).toLowerCase()}` : null,
                ]
                  .filter(Boolean)
                  .join(" · ") || "Sem valores preenchidos"
              }
              sugestoes={(o) => ({ probAtual: f.renda > 0 ? ob.sugestao[o.id] : undefined })}
              rodapeItem={
                apresentacao
                  ? undefined
                  : (o) =>
                      n(o.prazoMeses) <= 0 ? (
                        <span className="no-print">Informe o prazo para calcular o aporte necessário.</span>
                      ) : (
                        <span className="no-print">
                          Aporte necessário: <strong className="text-foreground">{fmtBRL(ob.aportes[o.id] ?? 0)}/mês</strong>
                          {` por ${n(o.prazoMeses)} meses`}
                          {f.renda > 0 && ` · a sobra atual cobre ${ob.sugestao[o.id] ?? 0}% deste aporte`}
                        </span>
                      )
              }
            />
          </SubBloco>
        );
      })}
    </div>
  );
}
