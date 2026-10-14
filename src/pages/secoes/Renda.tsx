// 6 · Renda — bruta e líquida do cliente (e do cônjuge, se casado/união estável),
// declaração do IR, outras rendas (extra ou de outra pessoa) e cartões de crédito.
// Se só uma das rendas (bruta ou líquida) for informada, a outra é estimada em renda(c).
import { Calculator } from "lucide-react";
import {
  CAMPOS_CARTAO,
  CAMPOS_OUTRA_RENDA,
  CAMPOS_RENDA_CARTAO,
  CAMPOS_RENDA_CLIENTE,
  CAMPOS_RENDA_CONJUGE,
  CAMPOS_RENDA_ANUAL,
  CAMPOS_RENDA_EXTRA,
  CAMPOS_RENDA_IR,
} from "@/config/campos";
import { Formulario } from "@/components/campos";
import { ListaItens } from "@/components/ListaEditor";
import { SubBloco } from "@/components/ui";
import { useCliente } from "@/lib/cliente-context";
import { brutaLiquida, mensal, n, renda, s, temConjuge } from "@/lib/calculos";
import { fmtBRL } from "@/lib/format";

/** Linha "≈ Líquida/Bruta estimada" abaixo do formulário de uma pessoa. */
function Estimativa({ detalhe }: { detalhe: ReturnType<typeof brutaLiquida> }) {
  return (
    <div className="mt-3 space-y-1 text-xs text-muted-foreground">
      {detalhe.estimada && (
        <p className="flex items-start gap-1.5">
          <Calculator className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
          <span className="min-w-0">
            ≈ {detalhe.estimada === "liquida" ? "Líquida" : "Bruta"} estimada:{" "}
            <strong className="text-foreground tabular-nums">
              {fmtBRL(detalhe.estimada === "liquida" ? detalhe.liquida : detalhe.bruta)}
            </strong>{" "}
            (tabelas de INSS e IR, assalariado)
          </span>
        </p>
      )}
      <p className="no-print">Preencha a que souber; a outra é estimada.</p>
    </div>
  );
}

export default function Renda() {
  const { cliente, setCampo, setLista } = useCliente();
  const r = renda(cliente);
  const casado = temConjuge(cliente);
  const nomeConjuge = s(cliente.cadastro.conjuge).trim();
  const temCartao = s(cliente.renda.temCartao) === "Sim";

  return (
    <div className="space-y-4">
      <SubBloco titulo="Renda do cliente">
        <Formulario
          campos={CAMPOS_RENDA_CLIENTE}
          dados={cliente.renda}
          cliente={cliente}
          colunas={4}
          onChange={(key, v) => setCampo("renda", key, v)}
        />
        <Estimativa detalhe={r.cliente} />
        <div className="mt-4">
          <Formulario
            campos={[...CAMPOS_RENDA_EXTRA, ...CAMPOS_RENDA_ANUAL]}
            dados={cliente.renda}
            cliente={cliente}
            colunas={4}
            onChange={(key, v) => setCampo("renda", key, v)}
          />
        </div>
      </SubBloco>

      {casado && (
        <SubBloco titulo={nomeConjuge ? `Renda do cônjuge · ${nomeConjuge}` : "Renda do cônjuge"}>
          <Formulario
            campos={CAMPOS_RENDA_CONJUGE}
            dados={cliente.renda}
            cliente={cliente}
            colunas={4}
            onChange={(key, v) => setCampo("renda", key, v)}
          />
          <Estimativa detalhe={r.conjugeDetalhe} />
        </SubBloco>
      )}

      <SubBloco titulo="Imposto de renda">
        <Formulario campos={CAMPOS_RENDA_IR} dados={cliente.renda} cliente={cliente} colunas={4} onChange={(key, v) => setCampo("renda", key, v)} />
      </SubBloco>

      <SubBloco titulo="Outras rendas · bônus, PLR, aluguel ou de outra pessoa">
        <ListaItens
          campos={CAMPOS_OUTRA_RENDA}
          itens={cliente.outrasRendas}
          onChange={(i) => setLista("outrasRendas", i)}
          textoAdicionar="Adicionar outra renda"
          tituloItem={(x, i) => `${s(x.descricao) || `Renda ${i + 1}`}${s(x.pessoa) ? ` · ${s(x.pessoa)}` : ""}`}
          rodapeItem={(i) =>
            s(i.pessoa) === "Cônjuge" && !temConjuge(cliente) ? (
              <span className="text-warning">
                Renda do cônjuge, mas o cadastro não tem cônjuge: não entra no total. Troque “De quem” ou o estado civil.
              </span>
            ) : (
              <>
                Equivalente mensal: <strong className="text-foreground tabular-nums">{fmtBRL(mensal(i))}</strong>
              </>
            )
          }
        />
      </SubBloco>

      <SubBloco titulo="Cartões de crédito">
        <Formulario
          campos={CAMPOS_RENDA_CARTAO}
          dados={cliente.renda}
          cliente={cliente}
          colunas={4}
          onChange={(key, v) => setCampo("renda", key, v)}
        />
        {temCartao && (
          <div className="mt-4 space-y-4">
            <ListaItens
              campos={CAMPOS_CARTAO}
              itens={cliente.cartoes}
              onChange={(i) => setLista("cartoes", i)}
              textoAdicionar="Adicionar cartão"
              tituloItem={(x, i) => s(x.cartao) || `Cartão ${i + 1}`}
              // Só aparece quando há anuidade informada (ela entra nas despesas).
              rodapeItem={(x) =>
                x.pagaAnuidade === true && n(x.valorAnuidade) > 0 ? (
                  <>
                    Anuidade de <strong className="text-foreground tabular-nums">{fmtBRL(n(x.valorAnuidade))}/ano</strong> ≈{" "}
                    <strong className="text-foreground tabular-nums">{fmtBRL(n(x.valorAnuidade) / 12)}/mês</strong> em Despesas · Outras Despesas Fixas
                  </>
                ) : null
              }
            />
            <p className="text-[11px] text-muted-foreground">O gasto no cartão já está dentro das despesas; não some de novo.</p>
          </div>
        )}
      </SubBloco>
    </div>
  );
}
