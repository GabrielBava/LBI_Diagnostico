// Diagnóstico em PDF no padrão do modelo LIFE (A4 paisagem): capa, sumário
// e 10 capítulos. As folhas são montadas antes de renderizar (rodapé
// "N / total") e o consultor imprime com o navegador (Salvar como PDF).
import { useEffect, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Printer } from "lucide-react";
import { APP } from "@/config/defaults";
import { RELATORIO } from "@/config/relatorio";
import { BotaoOuro } from "@/components/ui";
import { FolhaAbertura, FolhaCapa, FolhaConteudo, type InfoRodape } from "@/components/relatorio/base";
import { dadosRelatorio } from "@/components/relatorio/dados";
import { montarPaginas } from "@/components/relatorio/paginas";
import estilos from "@/components/relatorio/relatorio.css?inline";
import { fmtData } from "@/lib/format";
import { lerConfig, useClientes } from "@/lib/storage";

export default function Relatorio() {
  const { id } = useParams();
  const navigate = useNavigate();
  const cliente = useClientes().find((c) => c.id === id);
  useEffect(() => {
    if (!cliente) navigate("/clientes", { replace: true });
  }, [cliente, navigate]);

  const pronto = !!cliente?.coletaFinalizada;
  const dados = useMemo(() => (cliente && pronto ? dadosRelatorio(cliente) : null), [cliente, pronto]);
  const paginas = useMemo(() => (dados ? montarPaginas(dados) : []), [dados]);

  // Título da aba = nome sugerido do arquivo ao salvar em PDF.
  useEffect(() => {
    if (!dados) return;
    const anterior = document.title;
    document.title = `Diagnóstico LIFE - ${dados.nome}`;
    return () => {
      document.title = anterior;
    };
  }, [dados]);

  if (!cliente) return null;
  // O diagnóstico só existe depois de "Finalizar coleta".
  if (!pronto || !dados)
    return (
      <div className="mx-auto max-w-lg px-6 py-16 text-center">
        <p className="text-sm text-muted-foreground">Finalize a coleta para gerar o diagnóstico em PDF.</p>
        <Link to={`/clientes/${cliente.id}?secao=finalizar-coleta`} className="mt-4 inline-flex items-center gap-1 text-xs text-primary hover:underline">
          <ArrowLeft className="h-3 w-3" /> Voltar ao diagnóstico
        </Link>
      </div>
    );

  const cfg = lerConfig();
  const plataforma = `${RELATORIO.plataforma} ${APP.versao} · ${fmtData(__GERADO_EM__)}`;
  const info: InfoRodape = { cliente: dados.nome, plataforma };
  const total = paginas.length;

  return (
    <div className="light min-h-screen bg-background text-foreground">
      {/* O CSS das folhas (inclui o @page A4 paisagem) só existe enquanto o relatório está aberto. */}
      <style>{estilos}</style>
      <div className="no-print sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-card px-4 py-3 md:px-8">
        <Link to={`/clientes/${cliente.id}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-3 w-3" /> Voltar ao diagnóstico
        </Link>
        <span className="flex-1 text-xs text-muted-foreground">
          {total} páginas · A4 paisagem. Na janela de impressão, escolha “Salvar como PDF” e deixe os gráficos de fundo ligados.
        </span>
        <BotaoOuro onClick={() => window.print()}>
          <Printer className="h-3.5 w-3.5" /> Imprimir / Salvar PDF
        </BotaoOuro>
      </div>

      <div className="rel rel-visor">
        {paginas.map((p, i) => {
          const numero = i + 1;
          if (p.tipo === "capa")
            return (
              <FolhaCapa
                key={p.chave}
                cliente={dados.nome}
                emitido={fmtData(new Date().toISOString())}
                email={RELATORIO.capa.emailConsultor}
                plataforma={plataforma}
                assinatura={[cfg.empresa, cfg.consultor].filter(Boolean).join(" · ")}
              />
            );
          if (p.tipo === "abertura") return <FolhaAbertura key={p.chave} capitulo={p.capitulo} frase={p.frase} info={info} numero={numero} total={total} />;
          return (
            <FolhaConteudo
              key={p.chave}
              cabecalho={p.cabecalho}
              titulo={p.titulo}
              continuacao={p.continuacao}
              subtitulo={p.subtitulo}
              junto={p.junto}
              info={info}
              numero={numero}
              total={total}
            >
              {p.corpo}
            </FolhaConteudo>
          );
        })}
      </div>
    </div>
  );
}
