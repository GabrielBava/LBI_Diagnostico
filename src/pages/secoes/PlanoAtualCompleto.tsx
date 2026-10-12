// 6.2 · Plano atual: categorias, fluxo e balanço patrimonial.
import { BarrasHorizontais, Cascata } from "@/components/graficos";
import { SubBloco } from "@/components/ui";
import { useCliente } from "@/lib/cliente-context";
import { despesas, fluxo, patrimonio } from "@/lib/calculos";
import { fmtBRL } from "@/lib/format";

export default function PlanoAtualCompleto() {
  const { cliente } = useCliente();
  const d = despesas(cliente);
  const f = fluxo(cliente);
  const p = patrimonio(cliente);
  const maior = Math.max(p.ativos, p.passivos, 1);
  // As 8 maiores categorias; o restante é somado em "Demais categorias".
  const ordenadas = d.porCategoria.filter((x) => x.valor > 0).sort((a, b) => b.valor - a.valor);
  const demais = ordenadas.slice(8).reduce((t, x) => t + x.valor, 0);
  const topCategorias = [
    ...ordenadas.slice(0, 8).map((x) => ({ nome: x.label, valor: x.valor })),
    ...(demais > 0 ? [{ nome: "Demais categorias", valor: demais }] : []),
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-2">
        <SubBloco titulo="Maiores categorias de despesa">
          <BarrasHorizontais dados={topCategorias} />
        </SubBloco>
        <SubBloco titulo="Fluxo de caixa mensal">
          <Cascata
            linhas={[
              { nome: "Renda", valor: f.renda, tipo: "entrada" },
              { nome: "Despesas fixas", valor: f.fixas, tipo: "saida" },
              { nome: "Despesas variáveis", valor: f.variaveis, tipo: "saida" },
              { nome: "Sobra", valor: f.sobra, tipo: "resultado" },
            ]}
          />
          <p className="mt-3 text-xs text-muted-foreground">
            Parcelas de financiamentos, consórcios e empréstimos ({fmtBRL(f.parcelas)}) estão dentro das despesas fixas.
          </p>
        </SubBloco>
      </div>

      <SubBloco titulo="Balanço patrimonial" total={<span>Patrimônio líquido: {fmtBRL(p.liquido)}</span>}>
        <div className="grid gap-6 md:grid-cols-2">
          {[
            { titulo: "Ativos", total: p.ativos, linhas: p.linhasAtivo, cor: "bg-gold" },
            { titulo: "Passivos", total: p.passivos, linhas: p.linhasPassivo, cor: "bg-muted-foreground/50" },
          ].map((lado) => (
            <div key={lado.titulo}>
              <div className="mb-2 flex items-baseline justify-between">
                <span className="text-sm font-semibold">{lado.titulo}</span>
                <span className="text-sm font-semibold tabular-nums">{fmtBRL(lado.total)}</span>
              </div>
              <div className="mb-3 h-3 rounded-full bg-muted/50">
                <div className={`h-full rounded-full ${lado.cor}`} style={{ width: `${(lado.total / maior) * 100}%` }} />
              </div>
              <div className="divide-y divide-border/60">
                {lado.linhas
                  .filter((l) => l.valor > 0)
                  .map((l) => (
                    <div key={l.nome} className="flex justify-between py-1.5 text-sm">
                      <span className="text-muted-foreground">{l.nome}</span>
                      <span className="tabular-nums">{fmtBRL(l.valor)}</span>
                    </div>
                  ))}
                {lado.linhas.every((l) => l.valor <= 0) && <p className="py-1.5 text-xs text-muted-foreground">Nada registrado.</p>}
              </div>
            </div>
          ))}
        </div>
      </SubBloco>
    </div>
  );
}
