// Precificação do planejamento em PDF (página de impressão A4 retrato, aberta pela 7.1).
// Identidade do Grupo Life Brasil (azul-marinho e dourado). Mostra a base de cálculo, o valor
// do plano e só a condição de pagamento marcada na 7.1; sem condição marcada, mostra as duas
// (com aviso só na tela). A receita líquida e as taxas da maquininha não aparecem aqui (são internas).
import { useEffect, type ReactNode } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, Printer, TriangleAlert } from "lucide-react";
import { BotaoOuro } from "@/components/ui";
import { DESCONTO_PIX, TEXTOS_PDF, VALIDADE_DIAS, VALOR_MINIMO } from "@/config/especificacao";
import { s } from "@/lib/calculos";
import { especificacao, fmtPercentual, validadeAte, type Especificacao } from "@/lib/especificacao";
import { fmtBRL, fmtData } from "@/lib/format";
import { lerConfig, useClientes } from "@/lib/storage";

// Página A4 sem margem do navegador; as cores do cabeçalho saem na impressão.
const CSS_IMPRESSAO = `
@page { size: A4; margin: 0; }
@media print {
  .folha-especificacao, .folha-especificacao * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .folha-especificacao { width: 210mm; max-width: none; min-height: 296.5mm; margin: 0; box-shadow: none; }
}`;

/** Marca do Grupo Life Brasil em texto ("Life" em destaque). */
function Marca() {
  return (
    <div className="text-[19px] leading-none tracking-tight text-white">
      {TEXTOS_PDF.marca.split(" ").map((p, i) => (
        <span key={i} className={p === "Life" ? "font-bold" : "font-light"}>
          {i > 0 && " "}
          {p}
        </span>
      ))}
    </div>
  );
}

function Bloco({ titulo, children, className = "" }: { titulo: string; children: ReactNode; className?: string }) {
  return (
    <section className={`break-inside-avoid ${className}`}>
      <h2 className="mb-2 border-b border-[#C7A340] pb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#141C3B]">{titulo}</h2>
      {children}
    </section>
  );
}

function Linha({ rotulo, valor, forte }: { rotulo: ReactNode; valor: ReactNode; forte?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-3 py-1 ${forte ? "font-semibold text-[#141C3B]" : ""}`}>
      <dt className={`min-w-0 ${forte ? "" : "text-[#5d6274]"}`}>{rotulo}</dt>
      <dd className="shrink-0 text-right tabular-nums">{valor}</dd>
    </div>
  );
}

/** Caixa de uma condição de pagamento (Pix/boleto ou cartão). */
function CaixaCondicao({ e, condicao }: { e: Especificacao; condicao: "pix" | "cartao" }) {
  const pix = condicao === "pix";
  const avistaCartao = e.cartao.parcelas === 1;
  return (
    <div className="break-inside-avoid rounded-lg border border-[#e3dfd3] border-l-4 border-l-[#C7A340] bg-[#faf8f3] px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#141C3B]">
          {pix ? "Pix ou boleto · à vista" : avistaCartao ? "Cartão de crédito · à vista" : "Cartão de crédito · parcelado"}
        </span>
        {pix && e.pix.economia > 0 && (
          <span className="rounded-full bg-[#141C3B] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#E3C77A]">
            {fmtPercentual(DESCONTO_PIX)} de desconto
          </span>
        )}
      </div>
      <div className="mt-1.5 text-[26px] font-bold leading-tight tabular-nums text-[#141C3B]">
        {pix ? fmtBRL(e.pix.total, true) : avistaCartao ? fmtBRL(e.cartao.total, true) : `${e.cartao.parcelas}× de ${fmtBRL(e.cartao.parcela, true)}`}
      </div>
      <p className="mt-1 text-[11px] leading-snug text-[#5d6274] tabular-nums">
        {pix
          ? e.pix.economia > 0
            ? `Valor do plano de ${fmtBRL(e.valor, true)} com ${fmtPercentual(DESCONTO_PIX)} de desconto no Pix ou boleto (economia de ${fmtBRL(e.pix.economia, true)}).`
            : "Pagamento à vista no Pix ou boleto."
          : avistaCartao
            ? "Pagamento único no cartão de crédito."
            : `Total no cartão: ${fmtBRL(e.cartao.total, true)}.`}
      </p>
    </div>
  );
}

export default function PrecificacaoPdf() {
  const { id } = useParams();
  const cliente = useClientes().find((c) => c.id === id);
  const nome = cliente ? s(cliente.cadastro.nome) || "Cliente" : "";

  // Título da aba = nome sugerido para o arquivo ao salvar em PDF.
  useEffect(() => {
    if (!nome) return;
    const anterior = document.title;
    document.title = `Precificação - ${nome}`;
    return () => {
      document.title = anterior;
    };
  }, [nome]);

  if (!cliente) return <Navigate to="/clientes" replace />;

  const e = especificacao(cliente);
  const cfg = lerConfig();
  const hoje = new Date();
  const emissao = fmtData(hoje.toISOString());
  const validade = fmtData(validadeAte(hoje).toISOString());
  const condicoes: ("pix" | "cartao")[] = e.condicao ? [e.condicao] : ["pix", "cartao"];
  const conjuge = e.pessoas.find((p) => p.papel === "Cônjuge");
  const rotuloPessoa = (p: Especificacao["pessoas"][number]) => `Renda bruta mensal · ${p.nome || p.papel}`;

  return (
    <div className="light min-h-screen bg-[#e7e4dc] text-foreground">
      <style>{CSS_IMPRESSAO}</style>
      <div className="no-print sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b border-border bg-card px-4 py-3 md:px-8">
        <Link
          to={`/clientes/${cliente.id}?secao=especificacao`}
          className="flex items-center gap-1 rounded text-xs text-muted-foreground hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        >
          <ArrowLeft className="h-3 w-3" aria-hidden="true" /> Voltar ao diagnóstico
        </Link>
        <span className="hidden flex-1 text-xs text-muted-foreground sm:block">Na janela de impressão, escolha “Salvar como PDF”.</span>
        <BotaoOuro
          onClick={() => window.print()}
          className="ml-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:ml-0"
        >
          <Printer className="h-3.5 w-3.5" aria-hidden="true" /> Imprimir / Salvar em PDF
        </BotaoOuro>
      </div>

      {/* Avisos para o consultor (só na tela) */}
      {(!e.condicao || e.valor <= 0) && (
        <div className="no-print mx-auto mt-4 flex max-w-[210mm] gap-2 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-xs text-warning" role="status">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            {e.valor <= 0
              ? "Sem valor do plano: informe a renda bruta na 7.1 · Precificação."
              : "Nenhuma condição de pagamento marcada: o PDF mostra as duas opções. Marque a escolhida pelo cliente na 7.1 · Precificação."}
          </p>
        </div>
      )}

      <div className="px-3 py-6 print:p-0">
        <article className="folha-especificacao mx-auto flex w-full max-w-[210mm] flex-col bg-white text-[11.5px] text-[#272c3d] shadow-xl print:shadow-none">
          {/* Cabeçalho azul-marinho */}
          <header className="bg-[#141C3B] text-white">
            <div className="h-1.5 bg-[#C7A340]" />
            <div className="px-6 pb-4 pt-4 sm:px-[14mm]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <Marca />
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/70">Emitida em {emissao}</span>
              </div>
              <div className="mt-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#C7A340]">
                {TEXTOS_PDF.marca} · {TEXTOS_PDF.submarca}
              </div>
              <div className="mt-2 h-0.5 w-10 bg-[#C7A340]" />
              <h1 className="mt-2 text-[24px] font-semibold leading-tight sm:text-[26px]">{TEXTOS_PDF.titulo}</h1>
              <p className="mt-1 text-sm text-white/75">{TEXTOS_PDF.subtitulo}</p>
            </div>
          </header>

          <div className="flex-1 space-y-3 px-6 py-4 sm:px-[14mm]">
            {/* Dados da proposta */}
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 border-b border-[#e3dfd3] pb-3 sm:grid-cols-[1.6fr_1fr_1fr_1fr]">
              {[
                ["Cliente", conjuge?.nome ? `${nome} e ${conjuge.nome}` : nome],
                ["Data de emissão", emissao],
                ["Consultor", cfg.consultor || "—"],
                ["Válida até", validade],
              ].map(([r, v]) => (
                <div key={r} className="min-w-0">
                  <dt className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#8a6a1f]">{r}</dt>
                  <dd className="mt-0.5 break-words font-semibold text-[#141C3B]">{v}</dd>
                </div>
              ))}
            </dl>

            <p className="leading-snug text-[#3a3f52]">{TEXTOS_PDF.introducao}</p>

            <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              <Bloco titulo="Base de cálculo">
                <dl className="divide-y divide-[#eeebe3]">
                  {e.valorManual ? null : e.simulada ? (
                    <Linha rotulo="Renda bruta anual considerada" valor={fmtBRL(e.base)} />
                  ) : (
                    <>
                      {e.pessoas.map((p) => (
                        <Linha key={p.papel} rotulo={rotuloPessoa(p)} valor={fmtBRL(p.bruta)} />
                      ))}
                      {e.pessoas.length > 1 && <Linha rotulo="Renda bruta mensal da família" valor={fmtBRL(e.rendaMensal)} />}
                      <Linha rotulo="Renda bruta anual (× 12 meses)" valor={fmtBRL(e.base)} />
                    </>
                  )}
                  {e.valorManual ? (
                    <Linha rotulo="Valor definido pelo planejador" valor={fmtBRL(e.bruto, true)} />
                  ) : (
                    <Linha rotulo="Percentual do planejamento" valor={fmtPercentual(e.percentual)} />
                  )}
                  {e.desconto > 0 && (
                    <>
                      <Linha rotulo="Valor de referência" valor={fmtBRL(e.bruto, true)} />
                      <Linha
                        rotulo={`Desconto concedido${e.tipoDesconto === "%" ? ` (${fmtPercentual(Math.min(100, e.descontoInformado))})` : ""}`}
                        valor={`− ${fmtBRL(e.desconto, true)}`}
                      />
                    </>
                  )}
                </dl>
                <div className="mt-2 rounded-lg bg-[#141C3B] px-4 py-3 text-white">
                  <div className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#C7A340]">Valor do plano</div>
                  <div className="mt-0.5 text-[22px] font-bold tabular-nums">{fmtBRL(e.valor, true)}</div>
                </div>
                <p className="mt-2 text-[10px] leading-snug text-[#6b7080]">
                  {e.valorManual ? "" : TEXTOS_PDF.base}
                  {!e.valorManual && e.estimada && ` ${TEXTOS_PDF.estimada}`}
                  {e.noMinimo && ` Valor mínimo do plano: ${fmtBRL(VALOR_MINIMO)}.`}
                </p>
              </Bloco>

              <div className="space-y-3">
                <Bloco titulo={condicoes.length > 1 ? "Condições de pagamento" : "Condição de pagamento"}>
                  <div className="space-y-2">
                    {condicoes.map((x) => (
                      <CaixaCondicao key={x} e={e} condicao={x} />
                    ))}
                  </div>
                </Bloco>
                <Bloco titulo="Validade">
                  <p className="leading-snug">
                    Proposta válida por {VALIDADE_DIAS} dias, até <strong className="text-[#141C3B]">{validade}</strong>.
                  </p>
                </Bloco>
                {e.observacoes && (
                  <Bloco titulo="Observações">
                    <p className="whitespace-pre-line break-words leading-snug">{e.observacoes}</p>
                  </Bloco>
                )}
              </div>
            </div>

            {/* Aceite */}
            <section className="break-inside-avoid pt-1">
              <p className="text-[#3a3f52]">{TEXTOS_PDF.aceite}</p>
              <div className="mt-7 grid gap-10 sm:grid-cols-2">
                {[
                  [nome, "Cliente"],
                  [cfg.consultor || "Consultor", `Consultor · ${cfg.empresa || TEXTOS_PDF.submarca}`],
                ].map(([quem, papel]) => (
                  <div key={papel} className="min-w-0">
                    <div className="border-t border-[#141C3B]" />
                    <div className="mt-1.5 break-words font-semibold text-[#141C3B]">{quem}</div>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-[#6b7080]">{papel}</div>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-[#6b7080]">Local e data: ____________________________________________</p>
            </section>
          </div>

          <footer className="flex flex-wrap items-center justify-between gap-2 border-t-2 border-[#C7A340] px-6 py-3 text-[9px] uppercase tracking-[0.16em] text-[#6b7080] sm:px-[14mm]">
            <span>
              {TEXTOS_PDF.marca} · {TEXTOS_PDF.submarca}
            </span>
            <span>Precificação emitida em {emissao}</span>
          </footer>
        </article>
      </div>
    </div>
  );
}
