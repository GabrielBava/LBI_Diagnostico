// 6 · Renda — bruta e líquida do cliente (e do cônjuge, se casado/união estável), com o
// regime CLT ou PJ no canto do cartão, benefícios do CLT (VR/VA e VT), declaração do IR,
// outras rendas (extra ou de outra pessoa) e cartões de crédito (quantidade abre os cartões).
// Se só uma das rendas (bruta ou líquida) for informada, a outra é estimada em renda(c).
import { Calculator } from "lucide-react";
import {
  CAMPOS_BENEFICIOS_CLIENTE,
  CAMPOS_BENEFICIOS_CONJUGE,
  CAMPOS_CARTAO,
  CAMPOS_OUTRA_RENDA,
  CAMPOS_RENDA_CARTAO,
  CAMPOS_RENDA_CLIENTE,
  CAMPOS_RENDA_CONJUGE,
  CAMPOS_RENDA_ANUAL,
  CAMPOS_RENDA_EXTRA,
  CAMPOS_RENDA_IR,
  REGIMES_RENDA,
} from "@/config/campos";
import { Formulario } from "@/components/campos";
import { ListaItens } from "@/components/ListaEditor";
import { SubBloco } from "@/components/ui";
import { useCliente } from "@/lib/cliente-context";
import { brutaLiquida, mensal, n, regimeRenda, renda, s, temConjuge } from "@/lib/calculos";
import { fmtBRL, uid } from "@/lib/format";
import type { Cliente, Item, Valor } from "@/types";

/** CLT | PJ no canto superior direito do cartão de renda: define as deduções da estimativa bruta ↔ líquida. */
function SeletorRegime({ valor, onChange, rotulo }: { valor: Valor; onChange: (v: string) => void; rotulo: string }) {
  const atual = regimeRenda(valor);
  return (
    <span role="radiogroup" aria-label={rotulo} className="inline-flex rounded-full border border-border bg-input p-0.5">
      {REGIMES_RENDA.map((r) => (
        <button
          key={r}
          type="button"
          role="radio"
          aria-checked={atual === r}
          onClick={() => onChange(r)}
          className={`h-7 rounded-full px-3 text-[11px] font-semibold tracking-wide transition ${
            atual === r ? "bg-gold text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {r}
        </button>
      ))}
    </span>
  );
}

const cartaoVazio = (x: Item) => !s(x.cartao) && !n(x.limite) && !n(x.gastoMensal) && x.milhas !== true && x.pagaAnuidade !== true;

/** Ajusta os cartões à quantidade informada (como os filhos no cadastro): sobra só remove os vazios, do último para o primeiro. */
function sincronizarCartoes(cartoes: Item[], qtd: number, inclusivePreenchidos = false): Item[] {
  if (cartoes.length < qtd) return [...cartoes, ...Array.from({ length: qtd - cartoes.length }, () => ({ id: uid() }))];
  if (cartoes.length > qtd) {
    const ordem = [...cartoes.filter(cartaoVazio).reverse(), ...(inclusivePreenchidos ? cartoes.filter((x) => !cartaoVazio(x)).reverse() : [])];
    const remover = new Set(ordem.slice(0, cartoes.length - qtd).map((x) => x.id));
    return cartoes.filter((x) => !remover.has(x.id));
  }
  return cartoes;
}

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
            {detalhe.regime === "PJ"
              ? "(PJ: Simples Nacional, Anexo III, e INSS de 11% sobre o pró-labore de um salário mínimo)"
              : "(CLT: tabelas de INSS e IR de 2026)"}
          </span>
        </p>
      )}
      <p className="no-print">Preencha a que souber; a outra é estimada.</p>
    </div>
  );
}

export default function Renda() {
  const { cliente, setCampo, setLista, atualizar } = useCliente();
  const r = renda(cliente);
  const casado = temConjuge(cliente);
  const nomeConjuge = s(cliente.cadastro.conjuge).trim();
  const temCartao = s(cliente.renda.temCartao) === "Sim";
  const cltCliente = regimeRenda(cliente.renda.regimeCliente) === "CLT";
  const cltConjuge = regimeRenda(cliente.renda.regimeConjuge) === "CLT";

  // "Tem cartão?" e "Quantos cartões?" abrem/fecham os cartões; reduzir abaixo dos preenchidos pede confirmação.
  const alterarCartao = (key: string, v: Valor) => {
    const alvo = key === "temCartao" ? (v === "Sim" ? Math.max(1, Number(cliente.renda.qtdCartoes) || cliente.cartoes.length || 1) : 0) : key === "qtdCartoes" ? Number(v) || 0 : null;
    let removerPreenchidos = false;
    if (alvo !== null && alvo < cliente.cartoes.length) {
      const preenchidos = cliente.cartoes.filter((x) => !cartaoVazio(x)).length;
      if (preenchidos > alvo) {
        // Desmarcar "Tem cartão?" só esconde os cartões; reduzir a quantidade apaga os últimos (com confirmação).
        if (key === "temCartao") return setCampo("renda", key, v);
        if (!window.confirm(`Há ${preenchidos} cartão(ões) preenchido(s). Reduzir para ${alvo} vai apagar o(s) último(s). Continuar?`)) return;
        removerPreenchidos = true;
      }
    }
    atualizar((c): Cliente => {
      const dados = { ...c.renda, [key]: v };
      let cartoes = c.cartoes;
      if (key === "temCartao" && v === "Sim") {
        dados.qtdCartoes = Number(dados.qtdCartoes) || Math.max(1, c.cartoes.length);
        cartoes = sincronizarCartoes(cartoes, Number(dados.qtdCartoes), removerPreenchidos);
      }
      if (key === "temCartao" && v !== "Sim") cartoes = c.cartoes.filter((x) => !cartaoVazio(x));
      if (key === "qtdCartoes") cartoes = sincronizarCartoes(cartoes, Number(v) || 0, removerPreenchidos);
      return { ...c, renda: dados, cartoes };
    });
  };

  return (
    <div className="space-y-4">
      <SubBloco
        titulo="Renda do cliente"
        total={<SeletorRegime rotulo="Regime da renda do cliente" valor={cliente.renda.regimeCliente} onChange={(v) => setCampo("renda", "regimeCliente", v)} />}
      >
        <Formulario
          campos={CAMPOS_RENDA_CLIENTE}
          dados={cliente.renda}
          cliente={cliente}
          colunas={2}
          onChange={(key, v) => setCampo("renda", key, v)}
        />
        <Estimativa detalhe={r.cliente} />
        {cltCliente && (
          <div className="mt-4">
            <Formulario campos={CAMPOS_BENEFICIOS_CLIENTE} dados={cliente.renda} cliente={cliente} colunas={2} onChange={(key, v) => setCampo("renda", key, v)} />
          </div>
        )}
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
        <SubBloco
          titulo={nomeConjuge ? `Renda do cônjuge · ${nomeConjuge}` : "Renda do cônjuge"}
          total={<SeletorRegime rotulo="Regime da renda do cônjuge" valor={cliente.renda.regimeConjuge} onChange={(v) => setCampo("renda", "regimeConjuge", v)} />}
        >
          <Formulario
            campos={CAMPOS_RENDA_CONJUGE}
            dados={cliente.renda}
            cliente={cliente}
            colunas={2}
            onChange={(key, v) => setCampo("renda", key, v)}
          />
          <Estimativa detalhe={r.conjugeDetalhe} />
          {cltConjuge && (
            <div className="mt-4">
              <Formulario campos={CAMPOS_BENEFICIOS_CONJUGE} dados={cliente.renda} cliente={cliente} colunas={2} onChange={(key, v) => setCampo("renda", key, v)} />
            </div>
          )}
        </SubBloco>
      )}

      <SubBloco titulo="Imposto de renda">
        <Formulario campos={CAMPOS_RENDA_IR} dados={cliente.renda} cliente={cliente} colunas={4} onChange={(key, v) => setCampo("renda", key, v)} />
      </SubBloco>

      <SubBloco titulo="Outras rendas · PLR, aluguel ou de outra pessoa">
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
        <Formulario campos={CAMPOS_RENDA_CARTAO} dados={cliente.renda} cliente={cliente} colunas={4} onChange={alterarCartao} />
        {temCartao && (
          <div className="mt-4 space-y-4">
            <ListaItens
              campos={CAMPOS_CARTAO}
              itens={cliente.cartoes}
              // Adicionar/remover aqui também atualiza a quantidade lá em cima.
              onChange={(i) => atualizar((c) => ({ ...c, cartoes: i, renda: { ...c.renda, qtdCartoes: i.length || undefined, temCartao: i.length ? "Sim" : c.renda.temCartao } }))}
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
