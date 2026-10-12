import { CAMPOS_CADASTRO, CAMPOS_PARAMETROS } from "@/config/campos";
import { Formulario } from "@/components/campos";
import { SubBloco } from "@/components/ui";
import { useCliente } from "@/lib/cliente-context";
import { idadePorNascimento, s } from "@/lib/calculos";
import { uid } from "@/lib/format";
import { usePreferencias } from "@/lib/preferencias";
import type { Cliente, Item, Valor } from "@/types";

const vazio = (d: Item) => !s(d.nome) && !s(d.nivelEscola) && !d.mensalidade && !d.auxilio;

/** Ajusta os cartões de filhos em Sucessão para a quantidade informada no cadastro. */
function sincronizarFilhos(dependentes: Item[], qtd: number): Item[] {
  const filhos = dependentes.filter((d) => d.categoria === "Filho(a)");
  if (filhos.length < qtd)
    return [...dependentes, ...Array.from({ length: qtd - filhos.length }, () => ({ id: uid(), categoria: "Filho(a)" }))];
  if (filhos.length > qtd) {
    // Remove só cartões de filho ainda vazios, do último para o primeiro.
    const remover = new Set(
      filhos
        .filter(vazio)
        .reverse()
        .slice(0, filhos.length - qtd)
        .map((d) => d.id),
    );
    return dependentes.filter((d) => !remover.has(d.id));
  }
  return dependentes;
}

export default function Cadastro() {
  const { cliente, atualizar, setCampo } = useCliente();
  const { apresentacao } = usePreferencias();
  const idade = idadePorNascimento(s(cliente.cadastro.nascimento));

  const alterar = (key: string, v: Valor) =>
    atualizar((c): Cliente => {
      const cadastro = { ...c.cadastro, [key]: v };
      let dependentes = c.dependentes;
      if (key === "temFilhos" && v === "Sim") {
        cadastro.qtdFilhos = Number(cadastro.qtdFilhos) || 1;
        dependentes = sincronizarFilhos(dependentes, Number(cadastro.qtdFilhos));
      }
      if (key === "temFilhos" && v !== "Sim") dependentes = sincronizarFilhos(dependentes, 0);
      if (key === "qtdFilhos") dependentes = sincronizarFilhos(dependentes, Number(v) || 0);
      return { ...c, cadastro, dependentes };
    });

  return (
    <div className="space-y-4">
      <SubBloco titulo="Dados do cliente" total={idade !== undefined ? <span className="text-xs text-muted-foreground">{idade} anos</span> : undefined}>
        <Formulario campos={CAMPOS_CADASTRO} dados={cliente.cadastro} cliente={cliente} onChange={alterar} />
      </SubBloco>
      {!apresentacao && (
        <SubBloco titulo="Parâmetros financeiros · versão consultor" className="no-print">
          <Formulario campos={CAMPOS_PARAMETROS} dados={cliente.parametros} cliente={cliente} onChange={(k, v) => setCampo("parametros", k, v)} />
        </SubBloco>
      )}
    </div>
  );
}
