import { CalendarClock, HeartHandshake } from "lucide-react";
import { CAMPOS_PONTO_PARTIDA } from "@/config/campos";
import { ETAPAS, SECOES, secaoOculta } from "@/config/estrutura";
import { INSTITUCIONAL } from "@/config/institucional";
import { Formulario } from "@/components/campos";
import { SubBloco } from "@/components/ui";
import { useCliente } from "@/lib/cliente-context";
import { usePreferencias } from "@/lib/preferencias";
import { s } from "@/lib/calculos";

export default function Institucional() {
  const { cliente, setCampo } = useCliente();
  const { apresentacao } = usePreferencias();
  const nome = s(cliente.cadastro.nome).split(" ")[0];
  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl bg-gold px-6 py-8 text-primary-foreground md:px-8">
        <div className="text-[10px] font-semibold uppercase tracking-[0.24em] opacity-80">{INSTITUCIONAL.marca}</div>
        <h3 className="mt-2 max-w-3xl text-2xl font-semibold leading-snug md:text-3xl">
          {nome ? `${nome}, ` : ""}
          {INSTITUCIONAL.chamada}
        </h3>
        <p className="mt-3 max-w-2xl text-sm opacity-90">{INSTITUCIONAL.texto}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {INSTITUCIONAL.pilares.map((p) => (
          <div key={p.titulo} className="rounded-xl border border-border bg-secondary/30 p-4">
            <div className="text-sm font-semibold text-primary">{p.titulo}</div>
            <p className="mt-1 text-xs text-muted-foreground">{p.texto}</p>
          </div>
        ))}
      </div>

      <SubBloco titulo="Como vamos trabalhar juntos">
        <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
          {ETAPAS.map((e) => (
            <li key={e.id} className="rounded-lg border border-border bg-card p-3">
              <span className="text-gold text-2xl font-black">{e.numero}</span>
              <div className="text-xs font-semibold">{e.nome}</div>
              <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                {SECOES.filter((x) => x.etapa === e.id && !(apresentacao && secaoOculta(cliente, x)))
                  .map((x) => x.titulo.replace("V1 · ", ""))
                  .join(" · ")}
              </p>
            </li>
          ))}
        </ol>
        <div className="mt-3 flex flex-wrap gap-2">
          {INSTITUCIONAL.entregas.map((x) => (
            <span key={x} className="flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground">
              <CalendarClock className="h-3 w-3 text-primary" /> {x}
            </span>
          ))}
        </div>
      </SubBloco>

      <SubBloco
        titulo={
          <span className="flex items-center gap-2">
            <HeartHandshake className="h-3.5 w-3.5 text-primary" /> Ponto de partida
          </span>
        }
      >
        <Formulario campos={CAMPOS_PONTO_PARTIDA} dados={cliente.cadastro} cliente={cliente} onChange={(k, v) => setCampo("cadastro", k, v)} />
      </SubBloco>
    </div>
  );
}
