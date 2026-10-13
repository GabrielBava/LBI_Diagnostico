// 12 · Futuro (Etapa 3): idade de aposentadoria, estilo de vida, renda desejada e outras fontes.
// A projeção de independência financeira fica em 6.5 · Futuro. Com a renda desejada
// em branco, o cálculo usa o custo de vida × fator do estilo (ESTILOS_VIDA), sem exibir aqui.
import { Check } from "lucide-react";
import { CAMPOS_FUTURO, ESTILOS_VIDA } from "@/config/campos";
import { Formulario } from "@/components/campos";
import { SubBloco } from "@/components/ui";
import { useCliente } from "@/lib/cliente-context";
import { futuro, s } from "@/lib/calculos";

export default function Aposentadoria() {
  const { cliente, setCampo } = useCliente();
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
    </div>
  );
}
