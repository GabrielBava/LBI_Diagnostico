// 8 · Financiamento e crédito — os bens financiados do Patrimônio aparecem aqui
// somente leitura (edição em 7 · Patrimônio); abaixo, financiamentos avulsos,
// consórcios (com administradora) e dívidas (com categoria). Sem totais no topo.
// As parcelas daqui entram no total de despesas (não são lançadas em 5 · Despesas).
import { Car, Home, Lock, Pencil } from "lucide-react";
import { CAMPOS_CONSORCIO, CAMPOS_EMPRESTIMO, CAMPOS_FINANCIAMENTO } from "@/config/campos";
import { Rotulo } from "@/components/campos";
import { ListaItens } from "@/components/ListaEditor";
import { Botao, SubBloco } from "@/components/ui";
import { useCliente } from "@/lib/cliente-context";
import { dividas, s } from "@/lib/calculos";
import { fmtBRL } from "@/lib/format";

/** Par "rótulo / valor" dos cartões somente leitura. */
function Dado({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="min-w-0">
      <Rotulo>{rotulo}</Rotulo>
      <div className="truncate text-sm font-medium tabular-nums">{valor}</div>
    </div>
  );
}

export default function Dividas() {
  const { cliente, setLista, irPara } = useCliente();
  const dv = dividas(cliente);
  const temDoPatrimonio = dv.doPatrimonio.length > 0;
  return (
    <div className="space-y-4">
      <SubBloco titulo="Financiamentos">
        {temDoPatrimonio && (
          <div className="mb-4 space-y-3">
            <p className="flex items-center gap-1.5 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Lock className="h-3 w-3" aria-hidden="true" /> Vindos do Patrimônio
            </p>
            {dv.doPatrimonio.map((b) => {
              const Icone = b.origem === "imovel" ? Home : Car;
              return (
                <div key={b.id} className="print-avoid rounded-xl border border-dashed border-border bg-card/60 p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Icone className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 truncate text-sm font-semibold">{b.descricao}</span>
                    </span>
                    <Botao variante="fantasma" pequeno onClick={() => irPara("patrimonio")} className="no-print -mr-2">
                      <Pencil className="h-3 w-3" aria-hidden="true" /> Editar em 7 · Patrimônio
                    </Botao>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 lg:grid-cols-4">
                    <Dado rotulo="Instituição" valor={b.instituicao || "—"} />
                    <Dado rotulo="Parcela" valor={b.parcela > 0 ? `${fmtBRL(b.parcela)}/mês` : "—"} />
                    <Dado rotulo="Prazo restante" valor={b.prazo > 0 ? `${b.prazo} ${b.prazo === 1 ? "mês" : "meses"}` : "—"} />
                    <Dado
                      rotulo={b.saldoInformado ? "Saldo devedor" : "Saldo devedor (estimado)"}
                      valor={b.saldo > 0 ? `${b.saldoInformado ? "" : "≈ "}${fmtBRL(b.saldo)}` : "—"}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <ListaItens
          campos={CAMPOS_FINANCIAMENTO}
          itens={cliente.financiamentos}
          onChange={(i) => setLista("financiamentos", i)}
          textoAdicionar={temDoPatrimonio ? "Adicionar outro financiamento" : "Adicionar financiamento"}
          tituloItem={(x, i) => `Financiamento ${s(x.tipo).toLowerCase() || i + 1}`}
        />
      </SubBloco>
      <SubBloco titulo="Consórcios">
        <ListaItens
          campos={CAMPOS_CONSORCIO}
          itens={cliente.consorcios}
          onChange={(i) => setLista("consorcios", i)}
          textoAdicionar="Adicionar consórcio"
          tituloItem={(x, i) => `Consórcio ${s(x.tipo).toLowerCase() || i + 1}${s(x.administradora) ? ` · ${s(x.administradora)}` : ""}`}
        />
      </SubBloco>
      <SubBloco titulo="Dívidas e empréstimos">
        <ListaItens
          campos={CAMPOS_EMPRESTIMO}
          itens={cliente.emprestimos}
          onChange={(i) => setLista("emprestimos", i)}
          textoAdicionar="Adicionar dívida ou empréstimo"
          tituloItem={(x, i) => [s(x.categoria), s(x.instituicao)].filter(Boolean).join(" · ") || `Dívida ${i + 1}`}
        />
      </SubBloco>
    </div>
  );
}
