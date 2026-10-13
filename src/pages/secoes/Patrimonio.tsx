// 7 · Patrimônio — imóveis, móveis e futuras aquisições. Bem financiado abre
// Instituição, Parcela, Prazo e Saldo (config) e entra sozinho em 8 · Financiamento e crédito.
// Manutenção e IPVA dos veículos entram em Despesas · Transporte.
import type { ReactNode } from "react";
import { Car, CheckCircle2, Landmark } from "lucide-react";
import { CAMPOS_AQUISICAO, CAMPOS_IMOVEL, CAMPOS_MOVEL, CAMPOS_PATRIMONIO_GERAL, padroes } from "@/config/campos";
import { Formulario } from "@/components/campos";
import { ListaItens } from "@/components/ListaEditor";
import { SubBloco } from "@/components/ui";
import { useCliente } from "@/lib/cliente-context";
import { bemQuitado, dividas, n, patrimonio, s, sim } from "@/lib/calculos";
import { fmtBRL, uid } from "@/lib/format";
import type { Item } from "@/types";

export default function Patrimonio() {
  const { cliente, atualizar, setLista, irPara } = useCliente();
  const p = patrimonio(cliente);
  const fin = dividas(cliente).doPatrimonio;
  const pretende = sim(cliente.patrimonioGeral.pretendeAdquirir);

  /** Ao trocar Imóvel ↔ Veículo, limpa categoria e tipo que não valem para o novo segmento. */
  const ajustarSegmento = (x: Item): Item => {
    const antes = cliente.aquisicoes.find((y) => y.id === x.id);
    if (!antes || s(antes.segmento) === s(x.segmento)) return x;
    const campo = (key: string) => CAMPOS_AQUISICAO.find((c) => c.key === key);
    const valido = (key: string) => (campo(key)?.opcoesSe?.(x, cliente) ?? []).includes(s(x[key]));
    return { ...x, categoria: valido("categoria") ? x.categoria : undefined, tipo: valido("tipo") ? x.tipo : undefined };
  };

  /** Resumo do financiamento do bem (ou "Quitado"). */
  const financiamento = (x: Item): ReactNode => {
    if (bemQuitado(x))
      return (
        <span className="inline-flex items-center gap-1.5">
          <CheckCircle2 className="h-3 w-3 shrink-0 text-success" aria-hidden="true" /> Quitado
        </span>
      );
    const f = fin.find((y) => y.id === x.id);
    if (!f) return "Financiado: informe a parcela e o prazo para calcular o financiamento.";
    const partes = [
      f.parcela > 0 ? `${fmtBRL(f.parcela)}/mês` : null,
      f.prazo > 0 ? `${f.prazo} ${f.prazo === 1 ? "mês" : "meses"}` : null,
      f.saldo > 0 ? (f.saldoInformado ? `saldo ${fmtBRL(f.saldo)}` : `saldo ≈ ${fmtBRL(f.saldo)} (estimado)`) : null,
    ].filter(Boolean);
    return (
      <div className="space-y-0.5">
        <p className="flex items-start gap-1.5">
          <Landmark className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
          <span className="min-w-0">
            Financiamento: <strong className="text-foreground tabular-nums">{partes.join(" · ") || "—"}</strong>
          </span>
        </p>
        <p>
          Entra em{" "}
          <button type="button" onClick={() => irPara("dividas")} className="font-medium text-primary underline-offset-2 hover:underline">
            8 · Financiamento e crédito
          </button>
        </p>
      </div>
    );
  };

  /** Rodapé do imóvel: só quando algum imóvel está financiado (senão, todos diriam "Quitado"). */
  const algumFinanciado = (itens: Item[]) => itens.some((x) => !bemQuitado(x));

  /** Rodapé do veículo: financiamento e custo mensal de manutenção + IPVA. */
  const rodapeMovel = (x: Item): ReactNode => {
    const custoAnual = n(x.manutencaoAnual) + n(x.ipvaAnual);
    const fin = algumFinanciado(cliente.moveis) ? financiamento(x) : null;
    if (!fin && custoAnual <= 0) return null;
    return (
      <div className="space-y-1">
        {fin}
        {custoAnual > 0 && (
          <p className="flex items-start gap-1.5">
            <Car className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
            <span className="min-w-0">
              Manutenção e IPVA: <strong className="text-foreground tabular-nums">{fmtBRL(custoAnual)}/ano</strong> ≈{" "}
              <strong className="text-foreground tabular-nums">{fmtBRL(custoAnual / 12)}/mês</strong> em Despesas · Transporte
            </span>
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <SubBloco titulo="Imóveis" total={fmtBRL(p.imoveis)}>
        <ListaItens
          campos={CAMPOS_IMOVEL}
          itens={cliente.imoveis}
          onChange={(i) => setLista("imoveis", i)}
          textoAdicionar="Adicionar imóvel"
          tituloItem={(x, i) => `${s(x.tipo) || "Imóvel"} ${i + 1}${s(x.categoria) ? ` · ${s(x.categoria)}` : ""}`}
          rodapeItem={algumFinanciado(cliente.imoveis) ? financiamento : undefined}
        />
      </SubBloco>
      <SubBloco titulo="Móveis · veículos e embarcações" total={fmtBRL(p.moveis)}>
        <ListaItens
          campos={CAMPOS_MOVEL}
          itens={cliente.moveis}
          onChange={(i) => setLista("moveis", i)}
          textoAdicionar="Adicionar bem móvel"
          tituloItem={(x, i) => s(x.nome) || `${s(x.tipo) || "Bem"} ${i + 1}`}
          rodapeItem={rodapeMovel}
        />
      </SubBloco>
      <SubBloco titulo="Futuras aquisições">
        <Formulario
          campos={CAMPOS_PATRIMONIO_GERAL}
          dados={cliente.patrimonioGeral}
          cliente={cliente}
          colunas={4}
          // "Sim" com a lista vazia já abre a primeira aquisição (os campos aparecem no clique).
          onChange={(k, v) =>
            atualizar((c) => ({
              ...c,
              patrimonioGeral: { ...c.patrimonioGeral, [k]: v },
              aquisicoes:
                k === "pretendeAdquirir" && v === "Sim" && c.aquisicoes.length === 0
                  ? [{ id: uid(), ...padroes(CAMPOS_AQUISICAO) }]
                  : c.aquisicoes,
            }))
          }
        />
        {pretende && (
          <div className="mt-4">
            <ListaItens
              campos={CAMPOS_AQUISICAO}
              itens={cliente.aquisicoes}
              onChange={(i) => setLista("aquisicoes", i.map(ajustarSegmento))}
              textoAdicionar="Adicionar aquisição"
              vazio="Qual imóvel ou veículo o cliente pretende comprar?"
              tituloItem={(x, i) =>
                [s(x.segmento) || "Aquisição", s(x.categoria), s(x.tipo)].filter(Boolean).join(" · ") || `Aquisição ${i + 1}`
              }
              rodapeItem={(x) =>
                n(x.valorDesejado) > 0 && s(x.estrategia) ? (
                  <>
                    <strong className="text-foreground tabular-nums">{fmtBRL(n(x.valorDesejado))}</strong> ·{" "}
                    {s(x.estrategia) === "À vista" ? "compra à vista" : `via ${s(x.estrategia).toLowerCase()}`}
                  </>
                ) : null
              }
            />
          </div>
        )}
      </SubBloco>
    </div>
  );
}
