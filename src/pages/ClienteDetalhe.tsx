// Página do cliente: todas as etapas em uma rolagem contínua.
// O menu lateral acompanha a rolagem.
import { Fragment, useEffect } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Download, Eye, EyeOff, Save } from "lucide-react";
import { ETAPAS_COLETA, SECOES, secaoLiberada, secaoOculta } from "@/config/estrutura";
import { FinalizarColeta } from "@/components/FinalizarColeta";
import { Navegacao, useSecaoAtiva } from "@/components/Navegacao";
import { DivisorEtapa, Secao } from "@/components/Secao";
import { Botao } from "@/components/ui";
import { ClienteProvider } from "@/lib/cliente-context";
import { s } from "@/lib/calculos";
import { usePreferencias } from "@/lib/preferencias";
import { useClientes } from "@/lib/storage";
import { TELAS } from "./secoes";

export function rolarPara(secaoId: string, suave = true) {
  const el = document.getElementById(`sec-${secaoId}`) ?? document.getElementById(`etapa-${secaoId}`);
  el?.scrollIntoView({ behavior: suave ? "smooth" : "auto", block: "start" });
}

export default function ClienteDetalhe() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { apresentacao, alternarApresentacao } = usePreferencias();
  const cliente = useClientes().find((c) => c.id === id);
  // Pré-diagnóstico e diagnóstico só aparecem depois de "Finalizar coleta".
  const secoes = cliente ? SECOES.filter((x) => !(apresentacao && secaoOculta(cliente, x)) && secaoLiberada(cliente, x)) : [];
  // O botão "Finalizar coleta" fica logo depois da última seção de coleta.
  const ultimaColeta = secoes.reduce((ultima, x, i) => (ETAPAS_COLETA.includes(x.etapa) ? i : ultima), -1);
  const ativa = useSecaoAtiva(secoes.map((x) => x.id));

  useEffect(() => {
    if (!cliente) navigate("/clientes", { replace: true });
  }, [cliente, navigate]);

  // Link direto para uma seção (?secao=plano-acao)
  useEffect(() => {
    const alvo = params.get("secao");
    if (alvo) setTimeout(() => rolarPara(alvo, false), 50);
  }, [params]);

  if (!cliente) return null;

  return (
    <ClienteProvider cliente={cliente} irPara={(x) => rolarPara(x)}>
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/clientes" className="no-print flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-3 w-3" /> Clientes
          </Link>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">Diagnóstico financeiro</div>
            <div className="truncate text-xl font-semibold">{s(cliente.cadastro.nome) || "Novo cliente"}</div>
          </div>
          <Botao variante={apresentacao ? "primario" : "secundario"} onClick={alternarApresentacao} title="Alterna entre a versão consultor e a versão apresentação">
            {apresentacao ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {apresentacao ? "Versão apresentação" : "Versão consultor"}
          </Botao>
          <Botao
            onClick={() => navigate(`/clientes/${cliente.id}/relatorio`)}
            disabled={!cliente.coletaFinalizada}
            title={cliente.coletaFinalizada ? "Abrir o diagnóstico para imprimir ou salvar em PDF" : "Finalize a coleta para gerar o diagnóstico"}
          >
            <Download className="h-3.5 w-3.5" /> Diagnóstico em PDF
          </Botao>
          <span
            title={`Salvo automaticamente em ${new Date(cliente.atualizadoEm).toLocaleString("pt-BR")}`}
            className="hidden h-10 items-center gap-1.5 px-1 text-[11px] text-muted-foreground sm:flex"
          >
            <Save className="h-3.5 w-3.5" /> Salvo
          </span>
        </div>

        <div className="flex flex-col gap-5 md:flex-row">
          <Navegacao cliente={cliente} ativa={ativa} irPara={(x) => rolarPara(x)} />
          <main className="min-w-0 flex-1 space-y-5 pb-[40vh]">
            {secoes.map((x, i) => {
              const Tela = TELAS[x.id];
              const novaEtapa = i === 0 || secoes[i - 1].etapa !== x.etapa;
              return (
                <Fragment key={x.id}>
                  {novaEtapa && <DivisorEtapa etapaId={x.etapa} />}
                  <Secao def={x}>{Tela ? <Tela /> : null}</Secao>
                  {i === ultimaColeta && <FinalizarColeta />}
                </Fragment>
              );
            })}
          </main>
        </div>
      </div>
    </ClienteProvider>
  );
}
