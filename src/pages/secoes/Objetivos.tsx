import { CAMPOS_OBJETIVO, TIPOS_OBJETIVO } from "@/config/campos";
import { ListaItens } from "@/components/ListaEditor";
import { Kpi, SubBloco } from "@/components/ui";
import { useCliente } from "@/lib/cliente-context";
import { fluxo, n, objetivos, s } from "@/lib/calculos";
import { fmtBRL } from "@/lib/format";

const COR_TIPO: Record<string, string> = {
  Essencial: "bg-accent",
  Desejo: "bg-primary",
  Sonho: "bg-gold",
};

export default function Objetivos() {
  const { cliente, setLista } = useCliente();
  const ob = objetivos(cliente);
  const f = fluxo(cliente);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi tom="ouro" rotulo="Objetivos" valor={cliente.objetivos.length} detalhe={`Valor total ${fmtBRL(ob.valorTotal)}`} />
        <Kpi rotulo="Aporte mensal necessário" valor={fmtBRL(ob.aporteTotal)} sufixo="/mês" />
        <Kpi
          rotulo="Cabe na sobra atual?"
          valor={f.renda > 0 ? (ob.cabeNaSobra ? "Sim" : "Não") : "—"}
          tom={f.renda > 0 ? (ob.cabeNaSobra ? "sucesso" : "alerta") : "neutro"}
          detalhe={f.renda > 0 ? `Sobra de ${fmtBRL(f.sobra)}/mês` : "Preencha despesas e renda"}
        />
      </div>

      {TIPOS_OBJETIVO.map((t) => {
        const doTipo = ob.porTipo[t.id] ?? [];
        return (
          <SubBloco
            key={t.id}
            titulo={
              <span className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${COR_TIPO[t.id]}`} />
                <span className="text-foreground">{t.titulo}</span>
                <span className="font-normal normal-case tracking-normal">· {t.descricao}</span>
              </span>
            }
            total={doTipo.length ? fmtBRL(doTipo.reduce((x, o) => x + n(o.valorFuturo), 0)) : undefined}
          >
            <ListaItens
              campos={CAMPOS_OBJETIVO}
              itens={doTipo}
              onChange={(novos) => setLista("objetivos", [...cliente.objetivos.filter((o) => s(o.tipo) !== t.id), ...novos])}
              novo={() => ({ tipo: t.id })}
              textoAdicionar={`Adicionar objetivo ${t.titulo.toLowerCase()}`}
              tituloItem={(o) => (
                <span className="text-sm font-semibold text-foreground">
                  {s(o.titulo) || "Novo objetivo"}
                  {s(o.categoria) && <span className="ml-2 text-xs font-normal text-muted-foreground">{s(o.categoria)}</span>}
                </span>
              )}
              sugestoes={(o) => ({ probAtual: f.renda > 0 ? ob.sugestao[o.id] : undefined })}
              rodapeItem={(o) => (
                <>
                  Aporte necessário: <strong className="text-foreground">{fmtBRL(ob.aportes[o.id] ?? 0)}/mês</strong>
                  {n(o.prazoMeses) > 0 && ` por ${n(o.prazoMeses)} meses`}
                  {f.renda > 0 && ` · a sobra atual cobre ${ob.sugestao[o.id] ?? 0}% deste aporte`}
                </>
              )}
            />
          </SubBloco>
        );
      })}
    </div>
  );
}
