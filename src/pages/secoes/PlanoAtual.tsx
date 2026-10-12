// 5.1 · Pré-diagnóstico: visão breve gerada com o que foi preenchido.
import { TIPOS_OBJETIVO } from "@/config/campos";
import { BarraComposicao } from "@/components/graficos";
import { Kpi, Selo, SubBloco, corStatus, textoStatus } from "@/components/ui";
import { fluxo, objetivos, patrimonio, s } from "@/lib/calculos";
import { useCliente } from "@/lib/cliente-context";
import { pilares } from "@/lib/diagnostico";
import { fmtBRL, fmtPct } from "@/lib/format";
import { iconeStatus } from "./Panorama";

export default function PlanoAtual() {
  const { cliente } = useCliente();
  const f = fluxo(cliente);
  const p = patrimonio(cliente);
  const ob = objetivos(cliente);
  const ps = pilares(cliente).filter((x) => ["reserva", "dividas", "protecao", "objetivos"].includes(x.id));
  const nome = s(cliente.cadastro.nome).split(" ")[0] || "O cliente";

  if (f.renda <= 0 && f.despesas <= 0)
    return <p className="text-sm text-muted-foreground">Preencha renda e despesas para gerar o pré-diagnóstico.</p>;

  return (
    <div className="space-y-4">
      <p className="text-lg leading-relaxed">
        {nome} ganha <strong>{fmtBRL(f.renda)}</strong> por mês, gasta <strong>{fmtBRL(f.despesas)}</strong> e{" "}
        {f.sobra >= 0 ? (
          <>
            sobram <strong className="text-gold">{fmtBRL(f.sobra)}</strong> ({fmtPct(f.taxaPoupanca)} da renda).
          </>
        ) : (
          <>
            fica <strong className="text-destructive">{fmtBRL(-f.sobra)} no vermelho</strong> todo mês.
          </>
        )}
      </p>

      <SubBloco titulo="Para onde vai a renda">
        <BarraComposicao
          partes={[
            { nome: "Fixas", valor: f.fixas, cor: "var(--serie-1)" },
            { nome: "Variáveis", valor: f.variaveis, cor: "var(--serie-2)" },
            { nome: "Sobra", valor: Math.max(0, f.sobra), cor: "rgb(var(--muted-foreground) / 0.35)" },
          ]}
        />
      </SubBloco>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi tom="ouro" rotulo="Sobra mensal" valor={fmtBRL(f.sobra)} detalhe={f.renda > 0 ? `${fmtPct(f.taxaPoupanca)} da renda` : undefined} />
        <Kpi rotulo="Patrimônio líquido" valor={fmtBRL(p.liquido)} detalhe={`Ativos ${fmtBRL(p.ativos)}`} />
        <Kpi rotulo="Parcelas" valor={fmtBRL(f.parcelas)} detalhe={f.renda > 0 ? `${fmtPct(f.comprometimento)} da renda` : undefined} />
        <Kpi
          rotulo="Objetivos"
          valor={`${fmtBRL(ob.aporteTotal)}/mês`}
          tom={c(ob.cabeNaSobra, cliente.objetivos.length)}
          detalhe={TIPOS_OBJETIVO.map((t) => `${(ob.porTipo[t.id] ?? []).length} ${t.titulo.toLowerCase()}`).join(" · ")}
        />
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {ps.map((x) => {
          const I = iconeStatus[x.status];
          return (
            <div key={x.id} className="rounded-lg border border-border p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold">{x.nome}</span>
                <Selo className={`gap-1 ${corStatus[x.status]}`}>
                  <I className="h-3 w-3" /> {textoStatus[x.status]}
                </Selo>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">{x.resumo}</p>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">Visão breve. A leitura completa, com plano de ação, está na etapa 6.</p>
    </div>
  );
}

const c = (cabe: boolean, qtd: number) => (qtd === 0 ? "neutro" : cabe ? "sucesso" : "alerta");
