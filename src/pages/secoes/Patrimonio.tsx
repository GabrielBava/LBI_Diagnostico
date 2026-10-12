// 7 · Patrimônio — imóveis e móveis. Bens não quitados abrem Instituição, Parcela,
// Prazo e Saldo (config) e entram sozinhos em 8 · Financiamentos e dívidas.
import type { ReactNode } from "react";
import { CheckCircle2, Landmark } from "lucide-react";
import { CAMPOS_IMOVEL, CAMPOS_MOVEL } from "@/config/campos";
import { ListaItens } from "@/components/ListaEditor";
import { Kpi, SubBloco } from "@/components/ui";
import { useCliente } from "@/lib/cliente-context";
import { dividas, patrimonio, s } from "@/lib/calculos";
import { fmtBRL } from "@/lib/format";
import type { Item } from "@/types";

export default function Patrimonio() {
  const { cliente, setLista, irPara } = useCliente();
  const p = patrimonio(cliente);
  const fin = dividas(cliente).doPatrimonio;
  const parcelasFin = fin.reduce((t, f) => t + f.parcela, 0);
  const semSeguro = [...cliente.imoveis, ...cliente.moveis].filter((x) => x.temSeguro !== true).length;
  const algumNaoQuitado = (itens: Item[]) => itens.some((x) => x.quitado !== true);

  /** Rodapé do cartão do bem: resumo do financiamento ou "Quitado". */
  const rodape = (x: Item): ReactNode => {
    if (x.quitado === true)
      return (
        <span className="inline-flex items-center gap-1.5">
          <CheckCircle2 className="h-3 w-3 shrink-0 text-success" aria-hidden="true" /> Quitado
        </span>
      );
    const f = fin.find((y) => y.id === x.id);
    if (!f) return "Não quitado: informe a parcela e o prazo para calcular o financiamento.";
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
          <button
            type="button"
            onClick={() => irPara("dividas")}
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            8 · Financiamentos e dívidas
          </button>
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi tom="ouro" rotulo="Imóveis + móveis" valor={fmtBRL(p.imoveis + p.moveis)} />
        <Kpi
          rotulo="Bens financiados"
          valor={fin.length}
          detalhe={fin.length > 0 ? `${fmtBRL(parcelasFin)}/mês em parcelas` : "Nenhum bem com parcela"}
        />
        <Kpi rotulo="Bens sem seguro" valor={semSeguro} detalhe="Imóveis e móveis" />
      </div>
      <SubBloco titulo="Imóveis" total={fmtBRL(p.imoveis)}>
        <ListaItens
          campos={CAMPOS_IMOVEL}
          itens={cliente.imoveis}
          onChange={(i) => setLista("imoveis", i)}
          textoAdicionar="Adicionar imóvel"
          tituloItem={(x, i) => `${s(x.tipo) || "Imóvel"} ${i + 1}${s(x.categoria) ? ` · ${s(x.categoria)}` : ""}`}
          rodapeItem={algumNaoQuitado(cliente.imoveis) ? rodape : undefined}
        />
      </SubBloco>
      <SubBloco titulo="Móveis · veículos e embarcações" total={fmtBRL(p.moveis)}>
        <ListaItens
          campos={CAMPOS_MOVEL}
          itens={cliente.moveis}
          onChange={(i) => setLista("moveis", i)}
          textoAdicionar="Adicionar bem móvel"
          tituloItem={(x, i) => s(x.nome) || `${s(x.tipo) || "Bem"} ${i + 1}`}
          rodapeItem={algumNaoQuitado(cliente.moveis) ? rodape : undefined}
        />
      </SubBloco>
    </div>
  );
}
