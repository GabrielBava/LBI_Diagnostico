import { CAMPOS_PROJETO } from "@/config/campos";
import { ListaItens } from "@/components/ListaEditor";
import { useCliente } from "@/lib/cliente-context";
import { usePreferencias } from "@/lib/preferencias";
import { s } from "@/lib/calculos";

export default function Projetos() {
  const { cliente, setLista } = useCliente();
  const { apresentacao } = usePreferencias();
  return (
    <div className="space-y-3">
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
