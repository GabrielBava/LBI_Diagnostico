import { CAMPOS_PROJETO } from "@/config/campos";
import { ListaItens } from "@/components/ListaEditor";
import { useCliente } from "@/lib/cliente-context";
import { usePreferencias } from "@/lib/preferencias";
import { n, s } from "@/lib/calculos";
import { fmtBRL } from "@/lib/format";

export default function Projetos() {
  const { cliente, setLista } = useCliente();
  const { apresentacao } = usePreferencias();
  const total = cliente.projetos.reduce((t, p) => t + n(p.valor), 0);
  return (
    <div className="space-y-3">
      {total > 0 && (
        <p className="text-sm text-muted-foreground">
          Investimento total previsto: <strong className="text-foreground">{fmtBRL(total)}</strong>
        </p>
      )}
      <ListaItens
        campos={CAMPOS_PROJETO}
        itens={cliente.projetos}
        onChange={(i) => setLista("projetos", i)}
        textoAdicionar="Adicionar projeto"
        vazio={
          apresentacao
            ? "Reformas, um negócio próprio, um investimento…"
            : "Reformas, um negócio próprio, um investimento… Se não houver, marque “Não se aplica”."
        }
        tituloItem={(x, i) => s(x.titulo) || `Projeto ${i + 1}`}
      />
    </div>
  );
}
