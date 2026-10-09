import { useEffect } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Save, Download } from "lucide-react";
import { ETAPAS, etapaPorId, type EtapaId } from "@/config/etapas";
import { EtapasNav } from "@/components/EtapasNav";
import { CabecalhoEtapa, NotasEtapa, PainelRoteiro, RodapeEtapa } from "@/components/Jornada";
import { BotaoContorno } from "@/components/ui";
import { ClienteProvider } from "@/lib/cliente-context";
import { s } from "@/lib/calculos";
import { useClientes } from "@/lib/storage";
import { TELAS } from "./etapas";

export default function ClienteDetalhe() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const clientes = useClientes();
  const cliente = clientes.find((c) => c.id === id);
  const etapa = etapaPorId(params.get("etapa") ?? "") ?? ETAPAS[0];

  const irPara = (e: EtapaId) => {
    setParams({ etapa: e });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    if (!cliente) navigate("/clientes", { replace: true });
  }, [cliente, navigate]);
  if (!cliente) return null;

  const Tela = TELAS[etapa.id];

  return (
    <ClienteProvider cliente={cliente} irPara={irPara}>
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/clientes" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-3 w-3" /> Clientes
          </Link>
          <div className="flex-1">
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">Diagnóstico LIFE</div>
            <div className="text-xl font-semibold">{s(cliente.cadastro.nome) || "Novo cliente"}</div>
          </div>
          <BotaoContorno onClick={() => navigate(`/clientes/${cliente.id}/relatorio`)}>
            <Download className="h-3.5 w-3.5" /> Gerar diagnóstico completo (PDF)
          </BotaoContorno>
          <span
            title={`Salvo automaticamente em ${new Date(cliente.atualizadoEm).toLocaleString("pt-BR")}`}
            className="flex items-center gap-2 rounded-md bg-gold px-4 py-2 text-xs font-semibold text-primary-foreground opacity-60"
          >
            <Save className="h-3.5 w-3.5" /> Salvo
          </span>
        </div>

        <div className="flex flex-col gap-5 md:flex-row">
          <EtapasNav cliente={cliente} atual={etapa.id} onSelect={irPara} />
          <main className="min-w-0 flex-1 space-y-5">
            <CabecalhoEtapa etapa={etapa} />
            <PainelRoteiro etapa={etapa} />
            <Tela />
            <NotasEtapa etapa={etapa} />
            <RodapeEtapa etapa={etapa} />
          </main>
        </div>
      </div>
    </ClienteProvider>
  );
}
