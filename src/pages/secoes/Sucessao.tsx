// 4 · Sucessão: filhos (criados pelo Cadastro) e outros dependentes.
// Não há cartão de exemplo: a categoria é escolhida no botão de adicionar,
// e a config esconde a escolaridade para quem não é escolar (ex.: Pai / Mãe).
import { CAMPOS_DEPENDENTE, OPCOES } from "@/config/campos";
import { ListaItens } from "@/components/ListaEditor";
import { Botao } from "@/components/ui";
import { useCliente } from "@/lib/cliente-context";
import { custoDependente, ehEscolar, n, nOpt, rotuloDependente, s } from "@/lib/calculos";
import { fmtBRL } from "@/lib/format";

export default function Sucessao() {
  const { cliente, atualizar, irPara } = useCliente();
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
      {itens.length === 0 && (
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
        onChange={(novos) =>
          // Mantém o Cadastro coerente: filhos adicionados ou removidos aqui atualizam a quantidade.
          atualizar((c) => {
            const filhos = novos.filter((d) => s(d.categoria) === "Filho(a)").length;
            const cadastro =
              filhos > 0
                ? { ...c.cadastro, temFilhos: "Sim", qtdFilhos: filhos }
                : s(c.cadastro.temFilhos) === "Sim"
                  ? { ...c.cadastro, temFilhos: "Não", qtdFilhos: undefined }
                  : c.cadastro;
            return { ...c, dependentes: novos, cadastro };
          })
        }
        textoAdicionar="Adicionar dependente"
        acoesAdicionar={OPCOES.categoriaDependente
          // Se o Cadastro diz que não tem filhos, o botão de filho não aparece.
          .filter((categoria) => !(semFilhos && categoria === "Filho(a)"))
          .map((categoria) => ({ label: categoria, novo: () => ({ categoria }) }))}
        colunas={3}
        tituloItem={(d) => (
          <span className="text-sm font-semibold text-foreground">
            {rotuloDependente(itens, d)}
            {s(d.nome) && s(d.categoria) && <span className="ml-2 text-xs font-normal text-muted-foreground">{s(d.categoria)}</span>}
            {ehEscolar(d) && nOpt(d.idade) !== undefined && (
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {n(d.idade)} {n(d.idade) === 1 ? "ano" : "anos"}
              </span>
            )}
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
