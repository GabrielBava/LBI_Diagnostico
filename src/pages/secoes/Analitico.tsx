// Etapa 8 · Analítico do Planejador (só na versão consultor).
// 8.1 transcrições da reunião (Parte 1, Parte 2…) e análise por IA (Claude);
// 8.2 dores, preocupações e gatilhos; 8.3 notas do planejador; 8.4 perfil DISC.
// Tudo é editável à mão e fica salvo em cliente.analitico.
import { useMemo, useRef, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Ban,
  ChevronDown,
  ClipboardPaste,
  CloudRain,
  FileQuestion,
  FileText,
  HeartCrack,
  Info,
  Lightbulb,
  MessageCircleQuestion,
  MessageSquareQuote,
  ShieldQuestion,
  ThumbsUp,
  Trash2,
  TrendingUp,
  Upload,
  Zap,
} from "lucide-react";
import { ListaAnalise, ListaTextos } from "@/components/AnaliticoListas";
import { OrigemAnalise, PainelAnalise } from "@/components/AnaliticoPainel";
import { Botao, Selo } from "@/components/ui";
import { normalizarAnalise, temConteudo } from "@/lib/analitico";
import { FATORES_DISC, type AnaliseReuniao, type FatorDisc, type PerfilComportamental, type Transcricao } from "@/lib/analitico-tipos";
import { ACEITE_TRANSCRICAO, contarPalavras, lerArquivoTranscricao } from "@/lib/arquivo-texto";
import { useCliente } from "@/lib/cliente-context";
import { fmtData, uid } from "@/lib/format";

// ---------------------------------------------------------------------
//  Acesso aos dados da etapa
// ---------------------------------------------------------------------
function useAnalitico() {
  const { cliente, atualizar, irPara } = useCliente();
  const bruta = cliente.analitico.analise;
  const analise = useMemo(() => normalizarAnalise(bruta), [bruta]);
  /** Edição à mão: marca a data para perguntar antes de reanalisar. */
  const editar = (f: (a: AnaliseReuniao) => AnaliseReuniao, marcar = true) =>
    atualizar((c) => {
      const atual = normalizarAnalise(c.analitico.analise);
      const nova = f(atual);
      return {
        ...c,
        analitico: {
          ...c.analitico,
          analise: { ...nova, origem: nova.origem ?? "manual", ...(marcar ? { editadaEm: new Date().toISOString() } : {}) },
        },
      };
    });
  const setTranscricoes = (f: (t: Transcricao[]) => Transcricao[]) =>
    atualizar((c) => ({ ...c, analitico: { ...c.analitico, transcricoes: renumerar(f(c.analitico.transcricoes)) } }));
  return { cliente, analise, editar, setTranscricoes, irPara };
}

/** Títulos padrão ("Parte N") acompanham a posição; títulos editados ficam. */
const renumerar = (lista: Transcricao[]) => lista.map((t, i) => (/^Parte \d+$/.test(t.titulo.trim()) ? { ...t, titulo: `Parte ${i + 1}` } : t));

function SemAnalise({ irPara }: { irPara: (id: string) => void }) {
  return (
    <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
      <Info className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      Ainda sem análise. Anexe a transcrição em
      <button type="button" onClick={() => irPara("transcricoes")} className="font-semibold text-primary underline-offset-2 hover:underline">
        8.1
      </button>
      e clique em "Analisar com IA", ou escreva os itens à mão.
    </p>
  );
}

// ---------------------------------------------------------------------
//  8.1 · Transcrições da reunião
// ---------------------------------------------------------------------
export function Transcricoes() {
  const { cliente, setTranscricoes } = useAnalitico();
  const lista = cliente.analitico.transcricoes;
  const entrada = useRef<HTMLInputElement>(null);
  const [lendo, setLendo] = useState(false);
  const [erros, setErros] = useState<string[]>([]);
  const [colando, setColando] = useState(false);
  const [textoColado, setTextoColado] = useState("");
  const [arrastando, setArrastando] = useState(false);

  const adicionar = (novas: Omit<Transcricao, "id" | "titulo" | "anexadaEm">[]) =>
    setTranscricoes((atual) => [
      ...atual,
      ...novas.map((t, i) => ({ id: uid(), titulo: `Parte ${atual.length + i + 1}`, anexadaEm: new Date().toISOString(), incluir: true, ...t })),
    ]);

  const lerArquivos = async (arquivos: File[]) => {
    if (!arquivos.length) return;
    setLendo(true);
    const lidas: { texto: string; arquivo: string }[] = [];
    const falhas: string[] = [];
    // Em ordem, para "Parte 1, Parte 2…" seguirem a ordem dos arquivos escolhidos.
    for (const arquivo of [...arquivos].sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { numeric: true }))) {
      try {
        lidas.push({ texto: await lerArquivoTranscricao(arquivo), arquivo: arquivo.name });
      } catch (e) {
        falhas.push(`${arquivo.name}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
    if (lidas.length) adicionar(lidas);
    setErros(falhas);
    setLendo(false);
  };

  const confirmarColado = () => {
    const texto = textoColado.trim();
    if (!texto) return;
    adicionar([{ texto }]);
    setTextoColado("");
    setColando(false);
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setArrastando(true);
        }}
        onDragLeave={() => setArrastando(false)}
        onDrop={(e) => {
          e.preventDefault();
          setArrastando(false);
          void lerArquivos(Array.from(e.dataTransfer.files));
        }}
        className={`no-print rounded-xl border border-dashed p-4 transition ${arrastando ? "border-primary bg-primary/10" : "border-border"}`}
      >
        <div className="flex flex-wrap items-center gap-3">
          <Botao onClick={() => entrada.current?.click()} disabled={lendo}>
            <Upload className="h-4 w-4" /> {lendo ? "Lendo…" : "Anexar arquivo"}
          </Botao>
          <Botao variante="fantasma" onClick={() => setColando(!colando)}>
            <ClipboardPaste className="h-4 w-4" /> Colar texto
          </Botao>
          <p className="min-w-0 flex-1 basis-56 text-xs text-muted-foreground">
            .txt, .md, .vtt, .srt ou .docx (Teams, Zoom, Meet, Word). Pode arrastar os arquivos para cá. Cada transcrição vira uma parte.
          </p>
          <input
            ref={entrada}
            type="file"
            multiple
            accept={ACEITE_TRANSCRICAO}
            className="hidden"
            aria-label="Arquivos de transcrição"
            onChange={(e) => {
              void lerArquivos(Array.from(e.target.files ?? []));
              e.target.value = "";
            }}
          />
        </div>
        {colando && (
          <div className="aparecer mt-3 space-y-2">
            <textarea
              autoFocus
              rows={8}
              className="inp"
              placeholder="Cole aqui a transcrição da reunião (de preferência com o nome de quem fala em cada linha)."
              value={textoColado}
              onChange={(e) => setTextoColado(e.target.value)}
            />
            <div className="flex flex-wrap items-center justify-end gap-2">
              {textoColado.trim() && <span className="mr-auto text-xs text-muted-foreground">{contarPalavras(textoColado).toLocaleString("pt-BR")} palavras</span>}
              <Botao pequeno variante="fantasma" onClick={() => setColando(false)}>
                Cancelar
              </Botao>
              <Botao pequeno variante="primario" onClick={confirmarColado} disabled={!textoColado.trim()}>
                Adicionar como Parte {lista.length + 1}
              </Botao>
            </div>
          </div>
        )}
        {erros.length > 0 && (
          <ul role="alert" className="mt-3 space-y-1 text-xs text-destructive">
            {erros.map((e) => (
              <li key={e} className="flex items-start gap-1.5">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" /> {e}
              </li>
            ))}
          </ul>
        )}
      </div>

      {lista.length === 0 ? (
        <p className="px-1 text-xs text-muted-foreground">Nenhuma transcrição ainda. Se a reunião teve mais de um arquivo, anexe todos: eles viram Parte 1, Parte 2…</p>
      ) : (
        <ul className="space-y-3">
          {lista.map((t, i) => (
            <CartaoTranscricao
              key={t.id}
              t={t}
              primeira={i === 0}
              ultima={i === lista.length - 1}
              alterar={(mud) => setTranscricoes((l) => l.map((x) => (x.id === t.id ? { ...x, ...mud } : x)))}
              mover={(dir) =>
                setTranscricoes((l) => {
                  const k = l.findIndex((x) => x.id === t.id);
                  const j = k + dir;
                  if (k < 0 || j < 0 || j >= l.length) return l;
                  const copia = [...l];
                  [copia[k], copia[j]] = [copia[j], copia[k]];
                  return copia;
                })
              }
              remover={() => {
                if (window.confirm(`Remover "${t.titulo}"? O texto desta parte será apagado.`)) setTranscricoes((l) => l.filter((x) => x.id !== t.id));
              }}
            />
          ))}
        </ul>
      )}

      <PainelAnalise />
    </div>
  );
}

function CartaoTranscricao({
  t,
  primeira,
  ultima,
  alterar,
  mover,
  remover,
}: {
  t: Transcricao;
  primeira: boolean;
  ultima: boolean;
  alterar: (mud: Partial<Transcricao>) => void;
  mover: (dir: -1 | 1) => void;
  remover: () => void;
}) {
  const [aberto, setAberto] = useState(false);
  const palavras = useMemo(() => contarPalavras(t.texto), [t.texto]);
  const incluir = t.incluir !== false;
  const botao = "rounded-md p-1.5 text-muted-foreground transition hover:bg-muted/60 hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent";
  return (
    <li className={`aparecer rounded-xl border border-border bg-card p-4 ${incluir ? "" : "opacity-70"}`}>
      <div className="flex flex-wrap items-center gap-2">
        <FileText className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <input
          aria-label="Título da parte"
          className="min-w-0 flex-1 basis-40 rounded-md border border-transparent bg-transparent px-1.5 py-1 text-sm font-semibold outline-none transition hover:border-border focus:border-primary"
          value={t.titulo}
          onChange={(e) => alterar({ titulo: e.target.value })}
          onBlur={(e) => !e.target.value.trim() && alterar({ titulo: "Parte" })}
        />
        <div className="no-print flex shrink-0 items-center gap-0.5">
          <label className="mr-1 flex cursor-pointer items-center gap-1.5 rounded-md px-1.5 py-1 text-[11px] text-muted-foreground hover:bg-muted/60" title="Desmarque para deixar esta parte fora da próxima análise">
            <input type="checkbox" checked={incluir} onChange={(e) => alterar({ incluir: e.target.checked })} />
            Incluir na análise
          </label>
          <button type="button" aria-label="Mover para cima" title="Mover para cima" disabled={primeira} onClick={() => mover(-1)} className={botao}>
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
          <button type="button" aria-label="Mover para baixo" title="Mover para baixo" disabled={ultima} onClick={() => mover(1)} className={botao}>
            <ArrowDown className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label="Remover"
            title="Remover"
            onClick={remover}
            className="rounded-md p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <p className="mt-1 pl-6 text-[11px] text-muted-foreground">
        {[t.arquivo || "Texto colado", `${palavras.toLocaleString("pt-BR")} palavras`, `anexada em ${fmtData(t.anexadaEm)}`].join(" · ")}
      </p>
      <button
        type="button"
        aria-expanded={aberto}
        onClick={() => setAberto(!aberto)}
        className="mt-2 flex w-full items-start gap-2 rounded-lg bg-secondary/40 px-3 py-2 text-left text-xs text-muted-foreground transition hover:bg-secondary/70"
      >
        <ChevronDown className={`mt-0.5 h-3.5 w-3.5 shrink-0 transition-transform ${aberto ? "rotate-180" : ""}`} aria-hidden="true" />
        {aberto ? <span>Ocultar o texto</span> : <span className="line-clamp-2 whitespace-pre-line [overflow-wrap:anywhere]">{t.texto.slice(0, 400)}</span>}
      </button>
      {aberto && (
        <label className="mt-2 block">
          <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Texto (pode corrigir nomes e erros da transcrição)</span>
          <textarea rows={12} className="inp text-xs leading-relaxed" value={t.texto} onChange={(e) => alterar({ texto: e.target.value })} />
        </label>
      )}
    </li>
  );
}

// ---------------------------------------------------------------------
//  8.2 · Dores, preocupações e gatilhos
// ---------------------------------------------------------------------
const icone = (I: typeof Zap) => <I className="h-3.5 w-3.5 text-primary" aria-hidden="true" />;

export function DoresGatilhos() {
  const { analise, editar, irPara } = useAnalitico();
  return (
    <div className="space-y-4">
      {!temConteudo(analise) && <SemAnalise irPara={irPara} />}
      <div className="grid gap-4 lg:grid-cols-3">
        <ListaAnalise
          titulo="Dores"
          descricao="O que incomoda o cliente hoje."
          icone={icone(HeartCrack)}
          itens={analise.dores}
          onChange={(dores) => editar((a) => ({ ...a, dores }))}
        />
        <ListaAnalise
          titulo="Preocupações"
          descricao="Medos e inquietações sobre o futuro."
          icone={icone(CloudRain)}
          itens={analise.preocupacoes}
          onChange={(preocupacoes) => editar((a) => ({ ...a, preocupacoes }))}
        />
        <ListaAnalise
          titulo="Gatilhos de conversão"
          descricao="O que faz o cliente agir: toque nisso na V2."
          icone={icone(Zap)}
          itens={analise.gatilhos}
          onChange={(gatilhos) => editar((a) => ({ ...a, gatilhos }))}
        />
      </div>
      <OrigemAnalise analise={analise} />
    </div>
  );
}

// ---------------------------------------------------------------------
//  8.3 · Notas do Planejador
// ---------------------------------------------------------------------
export function NotasPlanejador() {
  const { analise, editar, irPara } = useAnalitico();
  const notas = analise.notas;
  const setNota = <K extends keyof typeof notas>(k: K, v: (typeof notas)[K]) => editar((a) => ({ ...a, notas: { ...a.notas, [k]: v } }));
  return (
    <div className="space-y-4">
      {!temConteudo(analise) && <SemAnalise irPara={irPara} />}
      <div className="grid gap-4 md:grid-cols-2">
        <ListaAnalise
          titulo="Objeções prováveis"
          descricao="O que o cliente pode dizer na V2 e como contornar."
          icone={icone(ShieldQuestion)}
          itens={notas.objecoes}
          onChange={(v) => setNota("objecoes", v)}
        />
        <ListaAnalise
          titulo="GAPs de informação"
          descricao="O que faltou ou ficou confuso na coleta: perguntar antes ou na V2."
          icone={icone(FileQuestion)}
          itens={notas.gaps}
          onChange={(v) => setNota("gaps", v)}
        />
        <ListaAnalise
          titulo="Perguntas para a V2"
          descricao='Perguntas que levam a um "sim" e viram afirmação do cliente.'
          icone={icone(MessageCircleQuestion)}
          itens={notas.perguntasV2}
          onChange={(v) => setNota("perguntasV2", v)}
          numerada
        />
        <ListaAnalise
          titulo="Riscos comerciais"
          descricao="O que pode fazer o cliente não fechar."
          icone={icone(AlertTriangle)}
          itens={notas.riscos}
          onChange={(v) => setNota("riscos", v)}
        />
        <ListaAnalise
          titulo="Oportunidades comerciais"
          descricao="Soluções ligadas ao que o cliente disse."
          icone={icone(TrendingUp)}
          itens={notas.oportunidades}
          onChange={(v) => setNota("oportunidades", v)}
          className="md:col-span-2"
        />
      </div>
      <label className="block">
        <span className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          <Lightbulb className="h-3.5 w-3.5" aria-hidden="true" /> Anotações livres do planejador
        </span>
        <textarea
          rows={4}
          className="inp"
          placeholder="Combinados, impressões, próximos passos… (a IA nunca apaga este campo)"
          value={notas.livre ?? ""}
          onChange={(e) => {
            const livre = e.target.value;
            editar((a) => ({ ...a, notas: { ...a.notas, livre } }), false);
          }}
        />
      </label>
      <OrigemAnalise analise={analise} />
    </div>
  );
}

// ---------------------------------------------------------------------
//  8.4 · Analítico IA (perfil DISC)
// ---------------------------------------------------------------------
const FATORES: Record<FatorDisc, { nome: string; explicacao: string; naV2: string; cor: string; barra: string }> = {
  D: {
    nome: "Dominância",
    explicacao: "Direto e rápido. Quer resultado, controle e objetividade.",
    naV2: "Vá direto ao ponto, mostre resultados e dê opções para ele decidir.",
    cor: "text-destructive border-destructive/40 bg-destructive/10",
    barra: "bg-destructive",
  },
  I: {
    nome: "Influência",
    explicacao: "Comunicativo e entusiasmado. Valoriza pessoas, histórias e reconhecimento.",
    naV2: "Conte histórias, mostre o sonho realizado e deixe espaço para ele falar.",
    cor: "text-warning border-warning/40 bg-warning/10",
    barra: "bg-warning",
  },
  S: {
    nome: "Estabilidade",
    explicacao: "Calmo e leal. Busca segurança, previsibilidade e harmonia na família.",
    naV2: "Vá no ritmo dele, passe segurança, evite pressão e envolva a família.",
    cor: "text-success border-success/40 bg-success/10",
    barra: "bg-success",
  },
  C: {
    nome: "Conformidade",
    explicacao: "Analítico e cauteloso. Quer dados, detalhes e certeza de que está certo.",
    naV2: "Mostre números, premissas e fontes; dê tempo e material para analisar.",
    cor: "text-accent border-accent/40 bg-accent/10",
    barra: "bg-accent",
  },
};

const TEXTO_CONFIANCA = { alta: "Confiança alta", media: "Confiança média", baixa: "Confiança baixa" };
const COR_CONFIANCA = {
  alta: "border-success/30 bg-success/10 text-success",
  media: "border-warning/30 bg-warning/10 text-warning",
  baixa: "border-destructive/30 bg-destructive/10 text-destructive",
};

export function AnaliticoIA() {
  const { analise, editar } = useAnalitico();
  const p = analise.perfil;
  const setPerfil = (mud: Partial<PerfilComportamental>) => editar((a) => ({ ...a, perfil: { ...a.perfil, ...mud } }));
  const temPerfil = !!p.predominante || !!p.classificacao || !!p.resumo;

  return (
    <div className="space-y-4">
      <PainelAnalise compacto />
      <CartaoPerfil perfil={p} setPerfil={setPerfil} temPerfil={temPerfil} />

      <div className="grid gap-4 md:grid-cols-2">
        <ListaTextos titulo="Como fala" icone={icone(MessageSquareQuote)} itens={p.comoFala ?? []} onChange={(comoFala) => setPerfil({ comoFala })} />
        <ListaTextos titulo="Como decide e age" icone={icone(Zap)} itens={p.comoDecide ?? []} onChange={(comoDecide) => setPerfil({ comoDecide })} />
        <ListaTextos titulo="Prefere" icone={icone(ThumbsUp)} itens={p.prefere ?? []} onChange={(prefere) => setPerfil({ prefere })} />
        <ListaTextos titulo="Evita / não faz" icone={icone(Ban)} itens={p.evita ?? []} onChange={(evita) => setPerfil({ evita })} />
        <ListaTextos
          titulo="Como abordar na V2"
          descricao="Ritmo, linguagem, provas e o que mostrar primeiro."
          icone={icone(TrendingUp)}
          itens={p.comoAbordarNaV2 ?? []}
          onChange={(comoAbordarNaV2) => setPerfil({ comoAbordarNaV2 })}
          numerada
        />
        <ListaTextos
          titulo="Frases que conectam"
          descricao="Para falar a mesma língua do cliente."
          icone={icone(MessageCircleQuestion)}
          itens={p.frasesQueConectam ?? []}
          onChange={(frasesQueConectam) => setPerfil({ frasesQueConectam })}
          estiloFrase
        />
        <ListaTextos
          titulo="Falas do cliente que sustentam o perfil"
          icone={icone(MessageSquareQuote)}
          itens={p.evidencias ?? []}
          onChange={(evidencias) => setPerfil({ evidencias })}
          estiloFrase
          placeholder="Trecho literal do que o cliente disse"
          className="md:col-span-2"
        />
      </div>

      {analise.observacoes && (
        <p className="flex items-start gap-2 rounded-lg border border-border bg-secondary/30 px-3 py-2 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>
            <strong className="text-foreground">Observações da IA:</strong> {analise.observacoes}
          </span>
        </p>
      )}
      <p className="text-[11px] text-muted-foreground">
        O perfil é uma sugestão a partir do jeito de falar do cliente na reunião, não um diagnóstico. Use como ponto de partida e confirme na conversa.
      </p>
    </div>
  );
}

function CartaoPerfil({
  perfil: p,
  setPerfil,
  temPerfil,
}: {
  perfil: PerfilComportamental;
  setPerfil: (mud: Partial<PerfilComportamental>) => void;
  temPerfil: boolean;
}) {
  const fator = p.predominante;
  const info = fator ? FATORES[fator] : undefined;
  const ajustado = !!fator && !!p.predominanteIA && fator !== p.predominanteIA;
  const intensidade = p.intensidade ?? {};
  const temIntensidade = FATORES_DISC.some((f) => intensidade[f] !== undefined);

  return (
    <div className="rounded-xl border border-border bg-card p-4 md:p-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-3">
          <div className="flex items-start gap-4">
            <div
              className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border text-3xl font-black ${info ? info.cor : "border-dashed border-border text-muted-foreground"}`}
              aria-hidden="true"
            >
              {fator ?? "?"}
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Perfil predominante</div>
              <div className="text-lg font-semibold leading-tight">{info ? `${info.nome} (${fator})` : "A definir"}</div>
              {p.classificacao && <div className="text-sm font-medium text-primary">{p.classificacao}</div>}
              <div className="mt-1 flex flex-wrap gap-1.5">
                {p.secundario && <Selo className={FATORES[p.secundario].cor}>Secundário: {FATORES[p.secundario].nome}</Selo>}
                {p.confianca && <Selo className={COR_CONFIANCA[p.confianca]}>{TEXTO_CONFIANCA[p.confianca]}</Selo>}
                {ajustado && <Selo className="border-primary/40 bg-primary/10 text-primary">Ajustado à mão</Selo>}
              </div>
            </div>
          </div>
          {info && <p className="text-sm text-muted-foreground">{info.explicacao}</p>}
          {p.resumo ? (
            <p className="text-sm leading-relaxed">{p.resumo}</p>
          ) : (
            !temPerfil && <p className="text-xs text-muted-foreground">Analise a reunião com IA (8.1) ou escolha o fator predominante abaixo.</p>
          )}
          {info && (
            <p className="rounded-lg bg-secondary/40 px-3 py-2 text-xs">
              <strong>Na V2:</strong> {info.naV2}
            </p>
          )}

          <div>
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Ajustar o fator predominante</div>
            <div className="flex flex-wrap items-center gap-1.5">
              {FATORES_DISC.map((f) => (
                <button
                  key={f}
                  type="button"
                  aria-pressed={fator === f}
                  title={`${FATORES[f].nome}: ${FATORES[f].explicacao}`}
                  onClick={() => setPerfil({ predominante: f, secundario: p.secundario === f ? undefined : p.secundario })}
                  className={`h-9 min-w-[2.75rem] rounded-md border px-2.5 text-xs font-semibold transition ${
                    fator === f ? FATORES[f].cor : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f} <span className="hidden font-medium sm:inline">· {FATORES[f].nome}</span>
                </button>
              ))}
            </div>
            {ajustado && p.predominanteIA && (
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                A IA sugeriu {FATORES[p.predominanteIA].nome} ({p.predominanteIA}).{" "}
                <button type="button" onClick={() => setPerfil({ predominante: p.predominanteIA })} className="font-semibold text-primary underline-offset-2 hover:underline">
                  Voltar à sugestão
                </button>
              </p>
            )}
          </div>
        </div>

        <div className="min-w-0 space-y-4">
          {temIntensidade && (
            <div>
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Intensidade de cada fator</div>
              <ul className="space-y-2.5">
                {FATORES_DISC.map((f) => {
                  const v = Math.max(0, Math.min(100, intensidade[f] ?? 0));
                  return (
                    <li key={f} className="flex items-center gap-3 text-xs">
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-[11px] font-bold ${FATORES[f].cor}`}>{f}</span>
                      <span className="w-24 shrink-0 text-muted-foreground">{FATORES[f].nome}</span>
                      <span
                        className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-muted"
                        role="meter"
                        aria-valuenow={v}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={FATORES[f].nome}
                      >
                        <span className={`block h-full rounded-full ${FATORES[f].barra}`} style={{ width: `${v}%` }} />
                      </span>
                      <span className="w-8 shrink-0 text-right font-semibold tabular-nums">{v}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          <Legenda>
            {FATORES_DISC.map((f) => (
              <li key={f} className="flex gap-2">
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border text-[10px] font-bold ${FATORES[f].cor}`}>{f}</span>
                <span>
                  <strong className="text-foreground">{FATORES[f].nome}:</strong> {FATORES[f].explicacao}
                </span>
              </li>
            ))}
          </Legenda>
        </div>
      </div>
    </div>
  );
}

function Legenda({ children }: { children: ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">O que é cada fator (DISC)</div>
      <ul className="space-y-1.5 text-xs text-muted-foreground">{children}</ul>
    </div>
  );
}
