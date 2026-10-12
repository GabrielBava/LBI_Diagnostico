// 6 · Renda — bruta e líquida do cliente (e do cônjuge, se casado/união estável),
// outras rendas (extra ou de outra pessoa) e cartões de crédito.
// Se só uma das rendas (bruta ou líquida) for informada, a outra é estimada em renda(c).
import { AlertTriangle, Calculator } from "lucide-react";
import {
  CAMPOS_CARTAO,
  CAMPOS_OUTRA_RENDA,
  CAMPOS_RENDA_CARTAO,
  CAMPOS_RENDA_CLIENTE,
  CAMPOS_RENDA_CONJUGE,
} from "@/config/campos";
import { Formulario } from "@/components/campos";
import { ListaItens } from "@/components/ListaEditor";
import { Kpi, SubBloco } from "@/components/ui";
import { useCliente } from "@/lib/cliente-context";
import { brutaLiquida, cartoes, mensal, n, renda, s, temConjuge } from "@/lib/calculos";
import { fmtBRL, fmtPct } from "@/lib/format";

/** Acima deste uso do limite o cartão fica em alerta. */
const USO_LIMITE_ALERTA = 0.8;

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
  const k = cartoes(cliente);
  const casado = temConjuge(cliente);
  const nomeConjuge = s(cliente.cadastro.conjuge).trim();
  const temCartao = s(cliente.renda.temCartao) === "Sim";
  const usoAlto = k.usoLimite > USO_LIMITE_ALERTA;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi
          tom="ouro"
          rotulo="Renda familiar líquida"
          valor={fmtBRL(r.total)}
          sufixo="/mês"
          detalhe={casado ? "Cliente + cônjuge + outras rendas" : "Cliente + outras rendas"}
        />
        <Kpi
          rotulo="Renda bruta"
          valor={fmtBRL(r.brutaTotal)}
          sufixo="/mês"
          detalhe={casado ? "Cliente + cônjuge" : "Do cliente"}
        />
        <Kpi rotulo="Renda passiva" valor={fmtBRL(r.passiva)} sufixo="/mês" detalhe="Aluguéis, dividendos, pensões" />
      </div>

      <SubBloco titulo="Renda do cliente">
        <Formulario
          campos={CAMPOS_RENDA_CLIENTE}
          dados={cliente.renda}
          cliente={cliente}
          colunas={4}
          onChange={(key, v) => setCampo("renda", key, v)}
        />
        <Estimativa detalhe={r.cliente} />
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

      <SubBloco titulo="Outras rendas · extra ou de outra pessoa" total={r.outras > 0 ? `${fmtBRL(r.outras)}/mês` : undefined}>
        <ListaItens
          campos={CAMPOS_OUTRA_RENDA}
          itens={cliente.outrasRendas}
          onChange={(i) => setLista("outrasRendas", i)}
          textoAdicionar="Adicionar renda extra ou de outra pessoa"
          tituloItem={(x, i) => `${s(x.descricao) || `Renda ${i + 1}`}${s(x.pessoa) ? ` · ${s(x.pessoa)}` : ""}`}
          rodapeItem={(i) => (
            <>
              Equivalente mensal: <strong className="text-foreground tabular-nums">{fmtBRL(mensal(i))}</strong>
            </>
          )}
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
              rodapeItem={(x) => {
                const limite = n(x.limite);
                if (limite <= 0) return "Informe o limite para ver o uso.";
                const uso = n(x.gastoMensal) / limite;
                const alto = uso > USO_LIMITE_ALERTA;
                return (
                  <span className={`inline-flex items-center gap-1.5 ${alto ? "font-medium text-warning" : ""}`}>
                    {alto && <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden="true" />}
                    Uso do limite:{" "}
                    <strong className={`tabular-nums ${alto ? "" : "text-foreground"}`}>{fmtPct(uso)}</strong>
                    {alto && " · acima de 80%"}
                  </span>
                );
              }}
            />
            {k.quantidade > 0 && (
              <div className="grid gap-3 sm:grid-cols-3">
                <Kpi
                  rotulo="Gasto total no cartão"
                  valor={fmtBRL(k.gasto)}
                  sufixo="/mês"
                  detalhe={`${k.comMilhas} de ${k.quantidade} ${k.quantidade === 1 ? "acumula" : "acumulam"} milhas`}
                />
                <Kpi rotulo="Limite total" valor={fmtBRL(k.limite)} />
                <Kpi
                  rotulo="% do limite usado"
                  valor={k.limite > 0 ? fmtPct(k.usoLimite) : "—"}
                  tom={usoAlto ? "alerta" : "neutro"}
                  detalhe={
                    usoAlto ? (
                      <span className="inline-flex items-center gap-1 font-medium text-warning">
                        <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden="true" /> Acima de 80% do limite
                      </span>
                    ) : k.limite > 0 ? (
                      "Até 80% é saudável"
                    ) : (
                      "Informe os limites"
                    )
                  }
                />
              </div>
            )}
            <p className="text-[11px] text-muted-foreground">O gasto no cartão já está dentro das despesas; não some de novo.</p>
          </div>
        )}
      </SubBloco>
    </div>
  );
}
