import { useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { corEixo, corGrade, estiloTooltip } from "@/components/graficos";
import { Rotulo } from "@/components/campos";
import { BotaoOuro, Cartao } from "@/components/ui";
import { useCliente } from "@/lib/cliente-context";
import { ROTULOS_INDICADORES, indicadores } from "@/lib/diagnostico";
import { fmtBRL, fmtCompacto, fmtData, fmtNum, uid } from "@/lib/format";

const formatar = (k: string, v: number) => {
  const t = ROTULOS_INDICADORES[k]?.tipo;
  return t === "moeda" ? fmtBRL(v) : t === "pct" ? `${fmtNum(v)}%` : fmtNum(v);
};

export default function Historico() {
  const { cliente, atualizar } = useCliente();
  const [titulo, setTitulo] = useState("");
  const [resumo, setResumo] = useState("");
  const atual = indicadores(cliente);
  const historico = [...cliente.historico].sort((a, b) => a.data.localeCompare(b.data));
  const chaves = Object.keys(ROTULOS_INDICADORES);

  const registrar = () => {
    atualizar((c) => ({
      ...c,
      historico: [
        ...c.historico,
        {
          id: uid(),
          data: new Date().toISOString(),
          titulo: titulo || `Revisão ${c.historico.length + 1}`,
          resumo,
          indicadores: indicadores(c),
        },
      ],
    }));
    setTitulo("");
    setResumo("");
  };

  const remover = (id: string) => {
    if (confirm("Remover esta fotografia do histórico?")) atualizar((c) => ({ ...c, historico: c.historico.filter((h) => h.id !== id) }));
  };

  return (
    <div className="space-y-5">
      <Cartao titulo="Registrar fotografia do diagnóstico" subtitulo="Grava os indicadores de hoje para comparar nas próximas reuniões." className="no-print">
        <div className="grid gap-3 md:grid-cols-3">
          <label className="block">
            <Rotulo>Título</Rotulo>
            <input className="inp mt-1" placeholder={`Revisão ${cliente.historico.length + 1}`} value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          </label>
          <label className="block md:col-span-2">
            <Rotulo>Resumo da reunião</Rotulo>
            <input className="inp mt-1" placeholder="Conquistas, mudanças de vida, decisões" value={resumo} onChange={(e) => setResumo(e.target.value)} />
          </label>
        </div>
        <div className="mt-3 flex justify-end">
          <BotaoOuro onClick={registrar}>
            <Camera className="h-3.5 w-3.5" /> Registrar fotografia
          </BotaoOuro>
        </div>
      </Cartao>

      {historico.length >= 2 && (
        <Cartao titulo="Evolução do patrimônio líquido">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={historico.map((h) => ({ data: fmtData(h.data), valor: h.indicadores.patrimonioLiquido ?? 0 }))}
                margin={{ top: 8, right: 16, bottom: 0, left: 0 }}
              >
                <CartesianGrid vertical={false} stroke={corGrade} strokeDasharray="3 3" />
                <XAxis dataKey="data" tickLine={false} axisLine={{ stroke: corGrade }} tick={{ fill: corEixo, fontSize: 11 }} />
                <YAxis tickFormatter={fmtCompacto} tickLine={false} axisLine={false} tick={{ fill: corEixo, fontSize: 11 }} width={48} />
                <Tooltip {...estiloTooltip} cursor={{ stroke: corEixo, strokeDasharray: "3 3" }} formatter={(v: number) => [fmtBRL(v), "Patrimônio líquido"]} />
                <Line type="monotone" dataKey="valor" stroke="var(--serie-1)" strokeWidth={2} dot={{ r: 4, fill: "var(--serie-1)" }} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Cartao>
      )}

      <Cartao titulo="Linha do tempo" subtitulo="A última coluna mostra a situação atual (ainda não registrada).">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                <th className="py-2 pr-4 font-medium">Indicador</th>
                {historico.map((h) => (
                  <th key={h.id} className="py-2 pr-4 text-right font-medium">
                    <div className="flex items-center justify-end gap-1">
                      <span>
                        {h.titulo}
                        <br />
                        <span className="normal-case tracking-normal">{fmtData(h.data)}</span>
                      </span>
                      <button type="button" aria-label="Remover" onClick={() => remover(h.id)} className="no-print p-1 hover:text-destructive">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </th>
                ))}
                <th className="py-2 text-right font-medium text-primary">Hoje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {chaves.map((k) => (
                <tr key={k}>
                  <td className="py-2 pr-4 text-muted-foreground">{ROTULOS_INDICADORES[k].label}</td>
                  {historico.map((h) => (
                    <td key={h.id} className="py-2 pr-4 text-right tabular-nums">
                      {h.indicadores[k] !== undefined ? formatar(k, h.indicadores[k]) : "—"}
                    </td>
                  ))}
                  <td className="py-2 text-right font-semibold tabular-nums">{formatar(k, atual[k])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {historico.some((h) => h.resumo) && (
          <div className="mt-4 space-y-2 border-t border-border pt-3">
            {historico
              .filter((h) => h.resumo)
              .map((h) => (
                <p key={h.id} className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {fmtData(h.data)} · {h.titulo}:
                  </span>{" "}
                  {h.resumo}
                </p>
              ))}
          </div>
        )}
      </Cartao>
    </div>
  );
}
