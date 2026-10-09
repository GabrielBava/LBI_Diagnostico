import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CAMPOS_APOSENTADORIA } from "@/config/campos";
import { Formulario } from "@/components/campos";
import { corEixo, corGrade, estiloTooltip } from "@/components/graficos";
import { Cartao, Kpi } from "@/components/ui";
import { useCliente } from "@/lib/cliente-context";
import { aposentadoria } from "@/lib/calculos";
import { fmtBRL, fmtCompacto, fmtPct } from "@/lib/format";

export default function Aposentadoria() {
  const { cliente, setCampo } = useCliente();
  const ap = aposentadoria(cliente);
  const mult = Math.round(ap.multiplicador);

  return (
    <div className="space-y-5">
      <section className="grid gap-3 md:grid-cols-4">
        <Kpi tom="ouro" rotulo={`Patrimônio alvo (${mult}x)`} valor={fmtBRL(ap.alvo)} detalhe={`Renda de ${fmtBRL(ap.rendaAlvo)}/mês`} />
        <Kpi tom="alerta" rotulo="Gap atual" valor={fmtBRL(ap.gap)} detalhe={`Já acumulado: ${fmtBRL(ap.atual)}`} />
        <Kpi tom="alerta" rotulo="Progresso" valor={fmtPct(ap.progresso)} />
        <Kpi
          tom="alerta"
          rotulo="Aporte necessário"
          valor={fmtBRL(ap.aporte)}
          sufixo="/mês"
          detalhe={ap.anos > 0 ? `Por ${ap.anos} anos` : "Defina a idade alvo"}
        />
      </section>

      <Cartao titulo="Parâmetros">
        <Formulario
          campos={CAMPOS_APOSENTADORIA}
          dados={cliente.aposentadoria}
          onChange={(k, v) => setCampo("aposentadoria", k, v)}
          automaticos={{
            idadeAtual: ap.idadeAuto,
            despesasAnuais: ap.despesasAnuaisAuto || undefined,
            rendaPassivaAlvo: ap.despesasAnuais ? ap.despesasAnuais / 12 : undefined,
            patrimonioDestinado: ap.patrimonioAuto || undefined,
          }}
        />
      </Cartao>

      <Cartao titulo="Projeção patrimonial" subtitulo="Valores reais (R$ de hoje), já descontada a inflação.">
        {ap.anos > 0 && ap.alvo > 0 && (
          <p className="mb-4 rounded-lg bg-secondary/40 p-3 text-sm">
            Mantendo o aporte atual de <strong>{fmtBRL(ap.aporteAtual)}/mês</strong>, aos {ap.idadeAlvo} anos o patrimônio será de{" "}
            <strong>{fmtBRL(ap.projetadoAtual)}</strong>, gerando cerca de <strong>{fmtBRL(ap.rendaProjetada)}/mês</strong> (
            {fmtPct(ap.rendaAlvo > 0 ? ap.rendaProjetada / ap.rendaAlvo : 0)} da renda desejada).
          </p>
        )}
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={ap.serie} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="gAtual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--serie-2)" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="var(--serie-2)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gNec" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--serie-1)" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="var(--serie-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke={corGrade} strokeDasharray="3 3" />
              <XAxis dataKey="ano" tickLine={false} axisLine={{ stroke: corGrade }} tick={{ fill: corEixo, fontSize: 11 }} minTickGap={16} />
              <YAxis tickFormatter={fmtCompacto} tickLine={false} axisLine={false} tick={{ fill: corEixo, fontSize: 11 }} width={48} />
              <Tooltip
                {...estiloTooltip}
                cursor={{ stroke: corEixo, strokeDasharray: "3 3" }}
                labelFormatter={(ano, p) => `${ano} · ${p?.[0]?.payload?.idade ?? ""} anos`}
                formatter={(v: number, nome: string) => [fmtBRL(v), nome]}
              />
              <Legend wrapperStyle={{ fontSize: 11, color: corEixo }} />
              <Area type="monotone" dataKey="atual" name="Atual" stroke="var(--serie-2)" strokeWidth={2} fill="url(#gAtual)" dot={false} isAnimationActive={false} />
              <Area
                type="monotone"
                dataKey="necessaria"
                name="Trajetória técnica necessária"
                stroke="var(--serie-1)"
                strokeWidth={2}
                fill="url(#gNec)"
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Cartao>
    </div>
  );
}
