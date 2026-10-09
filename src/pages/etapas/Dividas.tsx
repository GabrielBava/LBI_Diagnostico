import { AlertTriangle } from "lucide-react";
import { LISTAS } from "@/config/campos";
import { ListaEditor } from "@/components/ListaEditor";
import { Kpi } from "@/components/ui";
import { useCliente } from "@/lib/cliente-context";
import { dividaCara, fluxo, n, parametros, parcelaDivida, patrimonio } from "@/lib/calculos";
import { fmtBRL, fmtPct } from "@/lib/format";

export default function Dividas() {
  const { cliente, setLista } = useCliente();
  const f = fluxo(cliente);
  const p = patrimonio(cliente);
  const { limite } = parametros(cliente.parametros);
  const caras = cliente.dividas.filter(dividaCara);
  const acima = f.renda > 0 && f.comprometimento > limite;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi tom="ouro" rotulo="Saldo devedor total" valor={fmtBRL(p.dividas)} />
        <Kpi rotulo="Parcelas estimadas" valor={fmtBRL(f.parcelas)} sufixo="/mês" />
        <Kpi
          rotulo="Comprometimento da renda"
          valor={f.renda > 0 ? fmtPct(f.comprometimento) : "—"}
          tom={acima ? "perigo" : "neutro"}
          detalhe={`Limite saudável: ${fmtPct(limite)}`}
        />
      </div>
      {caras.length > 0 && (
        <div className="flex gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <div>
            <div className="font-semibold">Dívida cara identificada</div>
            <p className="text-muted-foreground">
              {caras.map((d) => d.descricao || d.tipo).join(", ")}: cartão ou taxa a partir de 30% a.a. Prioridade máxima no plano
              de ação.
            </p>
          </div>
        </div>
      )}
      <ListaEditor
        def={LISTAS.dividas}
        itens={cliente.dividas}
        onChange={(i) => setLista("dividas", i)}
        subtitulo="A parcela é estimada pela Tabela Price com saldo, taxa anual e prazo restante."
        extras={[
          { label: "Parcela estimada", render: (d) => (n(d.prazo) > 0 ? fmtBRL(parcelaDivida(d)) : "Informe o prazo") },
          {
            label: "Juros a pagar",
            render: (d) => (n(d.prazo) > 0 ? fmtBRL(Math.max(0, parcelaDivida(d) * n(d.prazo) - n(d.saldo))) : "—"),
          },
        ]}
      />
    </div>
  );
}
