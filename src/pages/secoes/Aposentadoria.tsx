// 12 · Futuro (Etapa 3): idade de aposentadoria, investimento mensal, renda desejada, outras fontes,
// estilo de vida e mudanças de vida programadas (impacto, quando e quanto).
// A projeção de independência financeira fica em 6.5 · Futuro. Com a renda desejada
// em branco, o cálculo usa o custo de vida × fator do estilo (ESTILOS_VIDA), sem exibir aqui.
import { Check } from "lucide-react";
import { CAMPOS_FUTURO, CAMPOS_FUTURO_MUDANCA, CAMPOS_MUDANCA, ESTILOS_VIDA, padroes } from "@/config/campos";
import { Formulario } from "@/components/campos";
import { ListaItens } from "@/components/ListaEditor";
import { SubBloco } from "@/components/ui";
import { useCliente } from "@/lib/cliente-context";
import { futuro, mesFuturo, n, nOpt, s, sim } from "@/lib/calculos";
import { fmtBRL, uid } from "@/lib/format";
import type { Item } from "@/types";

/** Rodapé da mudança: quando e o efeito no orçamento. */
function resumoMudanca(m: Item) {
  const partes: string[] = [];
  if (nOpt(m.meses) !== undefined) partes.push(`em ${mesFuturo(n(m.meses))}`);
  const valor = n(m.valor);
  if (valor > 0) {
    const impacto = s(m.impacto);
    partes.push(
      impacto === "Gasto único"
        ? `gasto único de ${fmtBRL(valor)}`
        : impacto
          ? `${impacto.toLowerCase()} em ${fmtBRL(valor)}/mês`
          : `${fmtBRL(valor)}`,
    );
  }
  return partes.length ? partes.join(" · ") : null;
}

export default function Aposentadoria() {
  const { cliente, setCampo, atualizar, setLista } = useCliente();
  const temMudanca = sim(cliente.futuro.temMudanca);
  const fu = futuro(cliente);
  const selecionado = s(cliente.futuro.estiloVida);

  return (
    <div className="space-y-4">
      <Formulario
        campos={CAMPOS_FUTURO}
        dados={cliente.futuro}
        cliente={cliente}
        colunas={4}
        onChange={(k, v) => setCampo("futuro", k, v)}
        automaticos={{ idadeAposentadoria: 60, outrasRendas: fu.outrasAuto || undefined }}
      />

      <SubBloco titulo="Estilo de vida na aposentadoria">
        <div role="radiogroup" aria-label="Estilo de vida na aposentadoria" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {ESTILOS_VIDA.map((e) => {
            const ativo = selecionado === e.id;
            return (
              <button
                key={e.id}
                type="button"
                role="radio"
                aria-checked={ativo}
                onClick={() => setCampo("futuro", "estiloVida", ativo ? undefined : e.id)}
                className={`min-w-0 rounded-lg border p-3 text-left transition ${
                  ativo ? "border-primary/60 bg-primary/10 shadow-sm" : "border-border bg-card hover:border-primary/50"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-semibold">{e.id}</span>
                  {ativo && (
                    <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
                      <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" /> Escolhido
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{e.descricao}</p>
              </button>
            );
          })}
        </div>
      </SubBloco>

      <SubBloco titulo="Mudanças de vida programadas">
        <Formulario
          campos={CAMPOS_FUTURO_MUDANCA}
          dados={cliente.futuro}
          cliente={cliente}
          // "Sim" com a lista vazia já abre a primeira mudança.
          onChange={(k, v) =>
            atualizar((c) => ({
              ...c,
              futuro: { ...c.futuro, [k]: v },
              mudancas: k === "temMudanca" && v === "Sim" && c.mudancas.length === 0 ? [{ id: uid(), ...padroes(CAMPOS_MUDANCA) }] : c.mudancas,
            }))
          }
        />
        {temMudanca && (
          <div className="mt-4">
            <ListaItens
              campos={CAMPOS_MUDANCA}
              itens={cliente.mudancas}
              onChange={(i) => setLista("mudancas", i)}
              textoAdicionar="Adicionar mudança"
              vazio="Casamento, filho, faculdade, mudança de cidade, aposentadoria do cônjuge…"
              tituloItem={(x, i) => s(x.descricao) || `Mudança ${i + 1}`}
              rodapeItem={resumoMudanca}
            />
          </div>
        )}
      </SubBloco>
    </div>
  );
}
