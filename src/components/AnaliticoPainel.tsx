// Painel "Analisar com IA" do 8 · Analítico: chama a API do Claude e mostra o
// andamento; sem chave (ou sem internet), oferece copiar o prompt para o claude.ai
// e colar a resposta de volta. O estado da análise é compartilhado entre 8.1 e 8.4.
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  AlertTriangle,
  Check,
  ClipboardPaste,
  Copy,
  Download,
  KeyRound,
  Loader2,
  Lock,
  RefreshCw,
  Settings,
  Sparkles,
  WifiOff,
  X,
} from "lucide-react";
import { MODELOS_CLAUDE } from "@/config/defaults";
import {
  AVISO_TOKENS_ENTRADA,
  ErroAnalise,
  LIMITE_TOKENS_ENTRADA,
  aplicarAnalise,
  analisarComClaude,
  foiEditada,
  lerRespostaJSON,
  montarPedido,
  nomeModelo,
  normalizarAnalise,
  promptParaCopiar,
  type Progresso,
  type TipoErro,
} from "@/lib/analitico";
import type { AnaliseReuniao } from "@/lib/analitico-tipos";
import { s } from "@/lib/calculos";
import { useCliente } from "@/lib/cliente-context";
import { fmtData, plural } from "@/lib/format";
import { baixarArquivo, lerConfig } from "@/lib/storage";
import type { Cliente } from "@/types";
import { Botao } from "./ui";

type Modo = "substituir" | "juntar";

// ---------------------------------------------------------------------
//  Estado da análise em andamento (um por vez, ligado ao cliente)
// ---------------------------------------------------------------------
interface EstadoTarefa {
  clienteId: string;
  situacao: "analisando" | "erro" | "ok";
  inicio: number;
  progresso?: Progresso;
  erro?: { tipo: TipoErro; titulo: string; detalhe: string };
  mensagem?: string;
  controle?: AbortController;
}
let estado: EstadoTarefa | null = null;
const ouvintes = new Set<() => void>();
const definir = (e: EstadoTarefa | null) => {
  estado = e;
  ouvintes.forEach((f) => f());
};
function useTarefa(clienteId: string) {
  const e = useSyncExternalStore(
    (f) => {
      ouvintes.add(f);
      return () => {
        ouvintes.delete(f);
      };
    },
    () => estado,
  );
  return e?.clienteId === clienteId ? e : null;
}

/** Configuração do Claude (relê quando o consultor salva as Configurações). */
export function useConfigClaude() {
  const [cfg, setCfg] = useState(lerConfig);
  useEffect(() => {
    const reler = () => setCfg(lerConfig());
    window.addEventListener("life:config", reler);
    window.addEventListener("storage", reler);
    return () => {
      window.removeEventListener("life:config", reler);
      window.removeEventListener("storage", reler);
    };
  }, []);
  return { chave: cfg.claudeChave?.trim() ?? "", modelo: cfg.claudeModelo || MODELOS_CLAUDE[0].id };
}

function useOnline() {
  const [online, setOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return online;
}

/** Abre o modal de Configurações do cabeçalho (campo da chave da API). */
export const abrirConfiguracoes = () => window.dispatchEvent(new Event("life:abrir-configuracoes"));

export const fmtDuracao = (seg: number) => (seg < 60 ? `${seg} s` : `${Math.floor(seg / 60)} min ${String(seg % 60).padStart(2, "0")} s`);
const fmtTokens = (t: number) => (t >= 1000 ? `${Math.round(t / 1000).toLocaleString("pt-BR")} mil` : String(t));
const fmtHora = (iso?: string) => (iso ? new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "");

type Atualizar = (f: (c: Cliente) => Cliente) => void;

const salvarAnalise = (atualizar: Atualizar, montar: (atual: AnaliseReuniao | undefined) => AnaliseReuniao) =>
  atualizar((c) => ({
    ...c,
    analitico: { ...c.analitico, analise: montar(c.analitico.analise ? normalizarAnalise(c.analitico.analise) : undefined) },
  }));

async function executarAnalise(cliente: Cliente, atualizar: Atualizar, modo: Modo) {
  if (estado?.situacao === "analisando") return;
  const cfg = lerConfig();
  const pedido = montarPedido(cliente, cliente.analitico.transcricoes);
  const controle = new AbortController();
  const inicio = Date.now();
  const clienteId = cliente.id;
  let ultimo = 0;
  definir({ clienteId, situacao: "analisando", inicio, controle, progresso: { fase: "conectando", caracteres: 0, tentativa: 1 } });
  try {
    const r = await analisarComClaude({
      chave: cfg.claudeChave ?? "",
      modelo: cfg.claudeModelo || MODELOS_CLAUDE[0].id,
      pedido,
      sinal: controle.signal,
      // Atualiza a tela no máximo 4 vezes por segundo.
      aoProgresso: (p) => {
        const agora = Date.now();
        if (p.fase !== estado?.progresso?.fase || agora - ultimo > 250) {
          ultimo = agora;
          if (estado?.situacao === "analisando" && estado.clienteId === clienteId) definir({ ...estado, progresso: p });
        }
      },
    });
    const duracaoSeg = Math.max(1, Math.round((Date.now() - inicio) / 1000));
    salvarAnalise(atualizar, (atual) => ({
      ...aplicarAnalise(atual, r.analise, modo),
      origem: "ia",
      geradaEm: new Date().toISOString(),
      modelo: r.modelo,
      duracaoSeg,
      tokens: r.tokens,
      partes: pedido.partes,
    }));
    definir({
      clienteId,
      situacao: "ok",
      inicio,
      mensagem: `Análise concluída em ${fmtDuracao(duracaoSeg)}${r.houveFallback ? ` (respondida pelo modelo reserva ${nomeModelo(r.modelo)})` : ""}.`,
    });
  } catch (e) {
    const erro = e instanceof ErroAnalise ? e : new ErroAnalise("outro", "Erro inesperado", e instanceof Error ? e.message : String(e));
    definir({ clienteId, situacao: "erro", inicio, erro: { tipo: erro.tipo, titulo: erro.titulo, detalhe: erro.detalhe } });
  }
}

async function copiarTexto(texto: string) {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    /* sem permissão (ex.: arquivo aberto direto): tenta o modo antigo */
  }
  try {
    const area = document.createElement("textarea");
    area.value = texto;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  } catch {
    return false;
  }
}

function Cronometro({ inicio }: { inicio: number }) {
  const [agora, setAgora] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return <span className="tabular-nums">{fmtDuracao(Math.max(0, Math.floor((agora - inicio) / 1000)))}</span>;
}

/** Linha "Última análise: data · modelo · tempo". */
export function OrigemAnalise({ analise }: { analise?: AnaliseReuniao }) {
  if (!analise?.geradaEm) return null;
  const origem =
    analise.origem === "colada" ? "resposta colada do claude.ai" : analise.origem === "ia" ? nomeModelo(analise.modelo) || "Claude" : "escrita à mão";
  return (
    <p className="text-[11px] text-muted-foreground">
      Última análise: {fmtData(analise.geradaEm)} às {fmtHora(analise.geradaEm)} · {origem}
      {analise.duracaoSeg ? ` · ${fmtDuracao(analise.duracaoSeg)}` : ""}
      {analise.tokens ? ` · ${fmtTokens(analise.tokens.entrada + analise.tokens.saida)} tokens` : ""}
      {analise.partes?.length ? ` · ${juntarPartes(analise.partes)}` : ""}
      {foiEditada(analise) ? " · editada à mão depois" : ""}
    </p>
  );
}
const juntarPartes = (partes: string[]) => (partes.length <= 3 ? partes.join(", ") : `${partes.length} partes`);

// ---------------------------------------------------------------------
//  Painel
// ---------------------------------------------------------------------
export function PainelAnalise({ compacto }: { compacto?: boolean }) {
  const { cliente, atualizar, irPara } = useCliente();
  const { chave, modelo } = useConfigClaude();
  const online = useOnline();
  const tarefa = useTarefa(cliente.id);
  const transcricoes = cliente.analitico.transcricoes;
  const analise = cliente.analitico.analise ? normalizarAnalise(cliente.analitico.analise) : undefined;
  const editada = foiEditada(analise);
  const incluidas = transcricoes.filter((t) => t.incluir !== false && t.texto.trim());
  // O pedido só é montado de novo quando as transcrições mudam.
  const pedido = useMemo(() => montarPedido(cliente, transcricoes), [transcricoes]);
  const grande = pedido.tokensEstimados > AVISO_TOKENS_ENTRADA;
  const grandeDemais = pedido.tokensEstimados > LIMITE_TOKENS_ENTRADA;
  const analisando = tarefa?.situacao === "analisando";

  // Pergunta antes de substituir o que foi editado à mão.
  const [pergunta, setPergunta] = useState<((modo: Modo) => void) | null>(null);
  const [colar, setColar] = useState(false);
  const [resposta, setResposta] = useState("");
  const [erroColar, setErroColar] = useState<{ titulo: string; detalhe: string } | null>(null);
  const [copia, setCopia] = useState<"ok" | "falhou" | null>(null);

  const comConfirmacao = (acao: (modo: Modo) => void) => {
    if (editada) setPergunta(() => acao);
    else acao("substituir");
  };
  const analisar = () => comConfirmacao((modo) => void executarAnalise(cliente, atualizar, modo));
  const prompt = () => promptParaCopiar(montarPedido(cliente, cliente.analitico.transcricoes));
  const copiar = async () => setCopia((await copiarTexto(prompt())) ? "ok" : "falhou");
  const baixar = () => baixarArquivo(`prompt-analise-${s(cliente.cadastro.nome) || "cliente"}.txt`.replace(/\s+/g, "-"), prompt(), "text/plain;charset=utf-8");
  const aplicarColada = () => {
    try {
      const nova = lerRespostaJSON(resposta);
      comConfirmacao((modo) => {
        salvarAnalise(atualizar, (atual) => ({
          ...aplicarAnalise(atual, nova, modo),
          origem: "colada",
          modelo: undefined,
          geradaEm: new Date().toISOString(),
          partes: pedido.partes,
        }));
        setResposta("");
        setColar(false);
        setErroColar(null);
        definir({ clienteId: cliente.id, situacao: "ok", inicio: Date.now(), mensagem: "Resposta validada e aplicada." });
      });
    } catch (e) {
      setErroColar(e instanceof ErroAnalise ? { titulo: e.titulo, detalhe: e.detalhe } : { titulo: "Erro", detalhe: String(e) });
    }
  };

  const semTranscricao = incluidas.length === 0;
  const linhaTamanho = semTranscricao
    ? transcricoes.length
      ? "Nenhuma parte marcada para a análise."
      : "Nenhuma transcrição anexada ainda."
    : `${plural(incluidas.length, "parte", "partes")} na análise · ${pedido.palavras.toLocaleString("pt-BR")} palavras · ~${fmtTokens(pedido.tokensEstimados)} tokens`;

  return (
    <div className="no-print space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-4" aria-live="polite">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" /> Análise por IA (Claude)
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{linhaTamanho}</p>
          {analise?.geradaEm ? <OrigemAnalise analise={analise} /> : <p className="text-[11px] text-muted-foreground">Nenhuma análise ainda.</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {chave ? (
            <Botao variante="primario" onClick={analisar} disabled={analisando || semTranscricao || grandeDemais} title={`Modelo: ${nomeModelo(modelo)}`}>
              {analisando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {analise?.geradaEm ? "Analisar de novo" : "Analisar com IA"}
            </Botao>
          ) : (
            <Botao variante="primario" onClick={abrirConfiguracoes}>
              <KeyRound className="h-4 w-4" /> Configurar chave da API
            </Botao>
          )}
          {compacto && (
            <Botao variante="fantasma" pequeno onClick={() => irPara("transcricoes")}>
              Ver transcrições
            </Botao>
          )}
        </div>
      </div>

      {semTranscricao && compacto && <p className="text-xs text-muted-foreground">Anexe ou cole a transcrição da reunião em 8.1 para analisar.</p>}

      {grande && !semTranscricao && (
        <p className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${grandeDemais ? "border-destructive/30 bg-destructive/10 text-destructive" : "border-warning/30 bg-warning/10"}`}>
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {grandeDemais
            ? "Texto grande demais para uma análise só. Desmarque algumas partes em \"Incluir na análise\", analise e depois analise as outras escolhendo \"Juntar\"."
            : "Texto longo: a análise pode levar alguns minutos e custar mais. Se preferir, analise as partes separadas e escolha \"Juntar\" na segunda vez."}
        </p>
      )}

      {!chave && !compacto && (
        <div className="rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground">
          <p>
            Para analisar direto daqui, informe a <strong className="text-foreground">chave da API do Claude</strong> em{" "}
            <button type="button" onClick={abrirConfiguracoes} className="font-semibold text-primary underline-offset-2 hover:underline">
              Configurações
            </button>{" "}
            (engrenagem no topo). Sem chave, use o claude.ai: <strong className="text-foreground">Copiar prompt</strong> → cole numa conversa nova no claude.ai →
            copie a resposta → <strong className="text-foreground">Colar resposta</strong>.
          </p>
        </div>
      )}

      {!online && (
        <p className="flex items-center gap-2 text-xs text-warning">
          <WifiOff className="h-3.5 w-3.5" aria-hidden="true" /> Sem internet agora. Copie o prompt e cole a resposta quando tiver conexão.
        </p>
      )}

      {pergunta && (
        <div role="alertdialog" aria-label="Substituir a análise editada?" className="aparecer rounded-lg border border-warning/40 bg-warning/10 p-3">
          <p className="text-sm font-semibold">Você editou a análise à mão.</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            O que fazer com a nova análise? As anotações livres e o fator do perfil ajustado à mão são mantidos nos dois casos.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Botao
              pequeno
              variante="primario"
              onClick={() => {
                const acao = pergunta;
                setPergunta(null);
                acao("juntar");
              }}
            >
              Juntar (manter os meus e somar os novos)
            </Botao>
            <Botao
              pequeno
              onClick={() => {
                const acao = pergunta;
                setPergunta(null);
                acao("substituir");
              }}
            >
              Substituir tudo
            </Botao>
            <Botao pequeno variante="fantasma" onClick={() => setPergunta(null)}>
              Cancelar
            </Botao>
          </div>
        </div>
      )}

      {analisando && tarefa && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs">
          <span className="flex items-center gap-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" aria-hidden="true" />
            {tarefa.progresso?.fase === "escrevendo"
              ? `Escrevendo a análise… ${tarefa.progresso.caracteres.toLocaleString("pt-BR")} caracteres`
              : tarefa.progresso?.fase === "pensando"
                ? "O Claude está lendo a reunião e pensando…"
                : "Conectando à API do Claude…"}
            {(tarefa.progresso?.tentativa ?? 1) > 1 && <span className="text-muted-foreground">(tentativa {tarefa.progresso?.tentativa})</span>}
            <span className="text-muted-foreground">
              · <Cronometro inicio={tarefa.inicio} />
            </span>
          </span>
          <Botao variante="fantasma" pequeno onClick={() => tarefa.controle?.abort()}>
            <X className="h-3.5 w-3.5" /> Cancelar
          </Botao>
        </div>
      )}

      {tarefa?.situacao === "erro" && tarefa.erro && (
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-destructive">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" /> {tarefa.erro.titulo}
          </p>
          <p className="mt-1 text-xs">{tarefa.erro.detalhe}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {tarefa.erro.tipo !== "cancelado" && chave && (
              <Botao pequeno onClick={analisar}>
                <RefreshCw className="h-3.5 w-3.5" /> Tentar de novo
              </Botao>
            )}
            {["chave", "modelo", "permissao", "cobranca"].includes(tarefa.erro.tipo) && (
              <Botao pequeno onClick={abrirConfiguracoes}>
                <Settings className="h-3.5 w-3.5" /> Abrir Configurações
              </Botao>
            )}
            <Botao pequeno variante="fantasma" onClick={() => definir(null)}>
              Fechar
            </Botao>
          </div>
        </div>
      )}

      {tarefa?.situacao === "ok" && tarefa.mensagem && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-xs">
          <span className="flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-success" aria-hidden="true" /> {tarefa.mensagem}
            <span className="text-muted-foreground">Veja</span>
            {[
              ["dores-gatilhos", "8.2"],
              ["notas-planejador", "8.3"],
              ["analitico-ia", "8.4"],
            ].map(([id, rotulo]) => (
              <button key={id} type="button" onClick={() => irPara(id)} className="font-semibold text-primary underline-offset-2 hover:underline">
                {rotulo}
              </button>
            ))}
          </span>
          <button type="button" aria-label="Fechar aviso" onClick={() => definir(null)} className="rounded-md p-1 text-muted-foreground hover:bg-muted">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {!compacto && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Sem chave ou sem internet:</span>
            <Botao pequeno onClick={copiar} disabled={semTranscricao} title="Copia as instruções, as transcrições e o resumo do diagnóstico">
              <Copy className="h-3.5 w-3.5" /> Copiar prompt
            </Botao>
            <Botao pequeno variante="fantasma" onClick={baixar} disabled={semTranscricao} title="Baixa o prompt num arquivo .txt">
              <Download className="h-3.5 w-3.5" /> Baixar .txt
            </Botao>
            <Botao pequeno onClick={() => setColar(!colar)}>
              <ClipboardPaste className="h-3.5 w-3.5" /> Colar resposta
            </Botao>
          </div>

          {copia === "ok" && (
            <p className="flex items-center gap-2 text-xs text-success">
              <Check className="h-3.5 w-3.5" aria-hidden="true" /> Prompt copiado. Cole numa conversa nova no claude.ai e traga a resposta em "Colar resposta".
            </p>
          )}
          {copia === "falhou" && (
            <div className="space-y-1">
              <p className="text-xs text-warning">O navegador não deixou copiar. Selecione o texto abaixo (Ctrl+A) e copie, ou use "Baixar .txt".</p>
              <textarea readOnly rows={5} className="inp font-mono text-[11px]" value={prompt()} onFocus={(e) => e.target.select()} aria-label="Prompt para copiar" />
            </div>
          )}

          {colar && (
            <div className="aparecer space-y-2 rounded-lg border border-border bg-card p-3">
              <label className="block">
                <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Resposta do Claude (o bloco JSON)</span>
                <textarea
                  rows={6}
                  className="inp font-mono text-[11px]"
                  placeholder='{ "dores": [...], "preocupacoes": [...], ... }'
                  value={resposta}
                  onChange={(e) => {
                    setResposta(e.target.value);
                    setErroColar(null);
                  }}
                />
              </label>
              {erroColar && (
                <p role="alert" className="text-xs text-destructive">
                  <strong>{erroColar.titulo}.</strong> {erroColar.detalhe}
                </p>
              )}
              <div className="flex justify-end gap-2">
                <Botao pequeno variante="fantasma" onClick={() => setColar(false)}>
                  Fechar
                </Botao>
                <Botao pequeno variante="primario" onClick={aplicarColada} disabled={!resposta.trim()}>
                  <Check className="h-3.5 w-3.5" /> Validar e preencher
                </Botao>
              </div>
            </div>
          )}

          <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
            <Lock className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
            Ao analisar com IA, o texto das transcrições e um resumo do diagnóstico (sem e-mail e telefone) vão para a API da Anthropic (Claude). Evite dados
            sensíveis desnecessários, como CPF e números de conta.
          </p>
        </>
      )}
    </div>
  );
}
