// 12 · Futuro (Etapa 3): idade de aposentadoria, estilo de vida e renda desejada.
// A projeção de independência financeira fica em 6.5 · Futuro.
import { Check } from "lucide-react";
import { CAMPOS_FUTURO, ESTILOS_VIDA } from "@/config/campos";
import { Formulario } from "@/components/campos";
import { Botao, SubBloco } from "@/components/ui";
import { useCliente } from "@/lib/cliente-context";
import { despesas, futuro, nOpt, s } from "@/lib/calculos";
import { fmtBRL } from "@/lib/format";

export default function Aposentadoria() {
  const { cliente, setCampo, irPara } = useCliente();
  const fu = futuro(cliente);
  const custoVida = despesas(cliente).custoVida;
  const selecionado = s(cliente.futuro.estiloVida);
  const rendaManual = nOpt(cliente.futuro.rendaDesejada) !== undefined;

  return (
    <div className="space-y-4">
      <Formulario
        campos={CAMPOS_FUTURO}
        dados={cliente.futuro}
        cliente={cliente}
        colunas={4}
        onChange={(k, v) => setCampo("futuro", k, v)}
        automaticos={{ rendaDesejada: fu.rendaDesejadaAuto || undefined, outrasRendas: fu.outrasAuto || undefined }}
      />

      <SubBloco titulo="Estilos de vida">
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
                <p className="mt-2 text-sm font-semibold tabular-nums">
                  {custoVida > 0 ? `≈ ${fmtBRL(custoVida * e.fator)}/mês` : "—"}
                </p>
                <p className="text-[11px] text-muted-foreground">{Math.round(e.fator * 100)}% do custo de vida atual</p>
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">
          {custoVida > 0
            ? `Sobre o custo de vida atual de ${fmtBRL(custoVida)}/mês (sem parcelas de dívidas).`
            : "Preencha as despesas para estimar a renda de cada estilo."}{" "}
          {rendaManual ? "A renda desejada digitada prevalece sobre o estilo." : "Com a renda desejada em branco, vale a sugestão do estilo escolhido."}
        </p>
      </SubBloco>

      <div className="flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="min-w-0 text-xs text-muted-foreground">A projeção de independência financeira aparece em 6.5 · Futuro.</p>
        <Botao pequeno variante="fantasma" className="no-print -ml-3 shrink-0 self-start sm:ml-0 sm:self-auto" onClick={() => irPara("futuro")}>
          Ver em 6.5
        </Botao>
      </div>
    </div>
  );
}
