import { CalendarClock, FileCheck2, HeartHandshake, LineChart, ShieldCheck, Target } from "lucide-react";
import { CAMPOS_APRESENTACAO } from "@/config/campos";
import { ETAPAS, FASES } from "@/config/etapas";
import { Formulario } from "@/components/campos";
import { Cartao } from "@/components/ui";
import { useCliente } from "@/lib/cliente-context";
import { s } from "@/lib/calculos";

const ENTREGAS = [
  { icone: Target, titulo: "Clareza de objetivos", texto: "Seus sonhos traduzidos em metas com valor, prazo e aporte mensal." },
  { icone: LineChart, titulo: "Raio-X completo", texto: "Fluxo de caixa, patrimônio, dívidas e reserva em um só lugar." },
  { icone: ShieldCheck, titulo: "Proteção da família", texto: "Quanto de seguro é realmente necessário — nem mais, nem menos." },
  { icone: FileCheck2, titulo: "Plano de ação", texto: "Prioridades, responsáveis e prazos para sair do papel." },
];

export default function Apresentacao() {
  const { cliente, setCampo } = useCliente();
  const nome = s(cliente.cadastro.nome).split(" ")[0];

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="bg-gold px-6 py-8 text-primary-foreground md:px-8">
          <div className="text-[10px] font-semibold uppercase tracking-[0.24em] opacity-80">Diagnóstico LIFE</div>
          <h2 className="mt-2 text-2xl font-semibold md:text-3xl">{nome ? `${nome}, vamos desenhar o seu futuro.` : "Vamos desenhar o seu futuro."}</h2>
          <p className="mt-2 max-w-2xl text-sm opacity-90">
            Primeiro entendemos onde você quer chegar. Depois olhamos com honestidade onde você está hoje. No final, você recebe um
            diagnóstico claro e um plano de ação para chegar lá.
          </p>
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
          {ENTREGAS.map(({ icone: I, titulo, texto }) => (
            <div key={titulo} className="rounded-lg border border-border bg-secondary/30 p-4">
              <I className="h-5 w-5 text-primary" />
              <div className="mt-2 text-sm font-semibold">{titulo}</div>
              <p className="mt-1 text-xs text-muted-foreground">{texto}</p>
            </div>
          ))}
        </div>
      </section>

      <Cartao titulo="Como vamos trabalhar juntos" subtitulo="A jornada do diagnóstico em 5 fases">
        <ol className="relative space-y-4 border-l border-border pl-6">
          {FASES.map((f) => (
            <li key={f.id} className="relative">
              <span className="absolute -left-[33px] flex h-6 w-6 items-center justify-center rounded-full bg-gold text-[11px] font-bold text-primary-foreground">
                {f.numero}
              </span>
              <div className="flex flex-wrap items-baseline gap-x-3">
                <span className="text-sm font-semibold">{f.nome}</span>
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <CalendarClock className="h-3 w-3" /> {f.encontro}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{f.subtitulo}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {ETAPAS.filter((e) => e.fase === f.id).map((e) => (
                  <span key={e.id} className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                    {e.label}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ol>
      </Cartao>

      <Cartao
        titulo={
          <span className="flex items-center gap-2">
            <HeartHandshake className="h-4 w-4 text-primary" /> Ponto de partida
          </span>
        }
        subtitulo="Registre com as palavras do cliente: isso volta na apresentação do diagnóstico."
      >
        <Formulario campos={CAMPOS_APRESENTACAO} dados={cliente.cadastro} onChange={(k, v) => setCampo("cadastro", k, v)} />
      </Cartao>
    </div>
  );
}
