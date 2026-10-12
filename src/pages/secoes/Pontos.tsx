// 6.3 / 6.4 · Pontos fortes (manter) e pontos de atuação.
import { CircleCheck, TriangleAlert } from "lucide-react";
import { CAMPOS_PONTO } from "@/config/campos";
import { BarrasDuplas } from "@/components/graficos";
import { ListaItens } from "@/components/ListaEditor";
import { SubBloco } from "@/components/ui";
import { useCliente } from "@/lib/cliente-context";
import { n, s } from "@/lib/calculos";
import { pontos } from "@/lib/diagnostico";

function ListaPontos({ tipo }: { tipo: "fortes" | "negativos" }) {
  const { cliente, setLista } = useCliente();
  const auto = pontos(cliente)[tipo];
  const Icone = tipo === "fortes" ? CircleCheck : TriangleAlert;
  const cor = tipo === "fortes" ? "text-success" : "text-warning";
  const lista = tipo === "fortes" ? "pontosFortes" : "pontosNegativos";
  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {auto.map((p) => (
          <li key={p.id} className="flex items-start gap-3 rounded-lg border border-border p-3">
            <Icone className={`mt-0.5 h-4 w-4 shrink-0 ${cor}`} />
            <div className="flex-1 text-sm">{p.texto}</div>
            <span className="shrink-0 text-[10px] uppercase tracking-widest text-muted-foreground">{p.area}</span>
          </li>
        ))}
        {auto.length === 0 && <li className="text-sm text-muted-foreground">Nenhum ponto identificado automaticamente ainda.</li>}
      </ul>
      <SubBloco titulo="Pontos acrescentados pelo consultor">
        <ListaItens
          campos={CAMPOS_PONTO}
          itens={cliente[lista]}
          onChange={(i) => setLista(lista, i)}
          textoAdicionar="Adicionar ponto"
          tituloItem={(_, i) => `Ponto ${i + 1}`}
        />
      </SubBloco>
    </div>
  );
}

export function PontosFortes() {
  return <ListaPontos tipo="fortes" />;
}

export function PontosNegativos() {
  const { cliente } = useCliente();
  const comProb = cliente.objetivos.filter((o) => s(o.probAtual) !== "" || s(o.probPlano) !== "");
  return (
    <div className="space-y-4">
      <ListaPontos tipo="negativos" />
      <SubBloco titulo="Probabilidade de os objetivos acontecerem">
        {comProb.length ? (
          <BarrasDuplas
            rotulos={["Cenário atual", "Com o plano"]}
            itens={comProb.map((o) => ({ nome: s(o.titulo) || s(o.categoria) || "Objetivo", a: n(o.probAtual), b: n(o.probPlano) }))}
          />
        ) : (
          <p className="text-sm text-muted-foreground">Preencha as probabilidades na seção Objetivos.</p>
        )}
      </SubBloco>
    </div>
  );
}
