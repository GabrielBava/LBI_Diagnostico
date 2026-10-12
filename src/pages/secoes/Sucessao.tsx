// 4 · Sucessão: filhos (criados pelo Cadastro) e outros dependentes.
// Não há cartão de exemplo: a categoria é escolhida no botão de adicionar,
// e a config esconde a escolaridade para quem não é escolar (ex.: Pai / Mãe).
import { CAMPOS_DEPENDENTE, OPCOES } from "@/config/campos";
import { ListaItens } from "@/components/ListaEditor";
import { Botao, Kpi } from "@/components/ui";
import { useCliente } from "@/lib/cliente-context";
import { custoDependente, s, sucessao } from "@/lib/calculos";
import { fmtBRL } from "@/lib/format";
import type { Item } from "@/types";

/** Título do cartão: nome, ou "<categoria> <n>" contando só dentro da categoria. */
function titulo(itens: Item[], d: Item, i: number) {
  const categoria = s(d.categoria);
  if (s(d.nome)) return s(d.nome);
  const posicao = itens.slice(0, i + 1).filter((x) => s(x.categoria) === categoria).length;
  return `${categoria || "Dependente"} ${posicao}`;
}

export default function Sucessao() {
  const { cliente, setLista, irPara } = useCliente();
  const su = sucessao(cliente);
  const itens = cliente.dependentes;
  const temFilhos = s(cliente.cadastro.temFilhos);
  const semFilhos = temFilhos === "Não";

  const vazio =
    temFilhos === "Não"
      ? "Sem filhos. Há outras pessoas que dependem financeiramente do cliente (pais, enteados, netos)?"
      : temFilhos === "Sim"
        ? "Ajuste a quantidade de filhos no Cadastro ou adicione abaixo."
        : "Informe no Cadastro se o cliente tem filhos. Para pais ou outros dependentes, adicione abaixo.";

  return (
    <div className="space-y-4">
      {itens.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <Kpi tom="ouro" rotulo="Filhos" valor={su.filhos} detalhe={semFilhos ? "Informado no cadastro: não tem filhos" : "Vem do cadastro"} />
          <Kpi rotulo="Dependentes no total" valor={su.dependentes} />
          <Kpi rotulo="Custo mensal" valor={fmtBRL(su.custoMensal)} sufixo="/mês" detalhe="Entra nas despesas fixas automaticamente" />
        </div>
      ) : (
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-secondary/20 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="min-w-0 text-sm text-muted-foreground">{vazio}</p>
          {!semFilhos && (
            <Botao pequeno variante="fantasma" className="no-print shrink-0 self-start sm:self-auto" onClick={() => irPara("cadastro")}>
              Ir para o Cadastro
            </Botao>
          )}
        </div>
      )}
      <ListaItens
        campos={CAMPOS_DEPENDENTE}
        itens={itens}
        onChange={(i) => setLista("dependentes", i)}
        textoAdicionar="Adicionar dependente"
        acoesAdicionar={OPCOES.categoriaDependente.map((categoria) => ({ label: categoria, novo: () => ({ categoria }) }))}
        colunas={3}
        tituloItem={(d, i) => (
          <span className="text-sm font-semibold text-foreground">
            {titulo(itens, d, i)}
            {s(d.nome) && s(d.categoria) && <span className="ml-2 text-xs font-normal text-muted-foreground">{s(d.categoria)}</span>}
          </span>
        )}
        rodapeItem={(d) => (
          <>
            Custo mensal: <strong className="text-foreground">{fmtBRL(custoDependente(d))}</strong>
          </>
        )}
      />
    </div>
  );
}
