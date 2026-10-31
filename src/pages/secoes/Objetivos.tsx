// 3 · Objetivos: ponto de partida (motivação, satisfação e poupança) e os objetivos em Essencial, Desejo e Sonho.
// Arrasta e solta: a categoria (Casa, Viagem…) sai da faixa "Categorias" para uma das três faixas e vira um
// objetivo com os campos abertos para preencher. O cartão troca de faixa pela alça (arrastando ou clicando nela).
// Sem arrastar: clicar/tocar na categoria (ou Enter/Espaço) e depois na faixa. Mecanismo em components/ArrastaObjetivos.
// O aporte necessário de cada objetivo aparece só na versão consultor.
import { useEffect, useRef, useState, type KeyboardEvent as EventoTecla, type MouseEvent, type PointerEvent as EventoPonteiro, type ReactNode } from "react";
import { ArrowDownToLine, ChevronDown, GripVertical, HeartHandshake, Plus, Trash2 } from "lucide-react";
import { CAMPOS_OBJETIVO, CAMPOS_PONTO_PARTIDA, TIPOS_OBJETIVO, padroes } from "@/config/campos";
import { Formulario } from "@/components/campos";
import { CATEGORIAS, COR_TIPO, FaixaCategorias, Fantasma, useArrasto } from "@/components/ArrastaObjetivos";
import { BotaoAdicionar, SubBloco } from "@/components/ui";
import { useCliente } from "@/lib/cliente-context";
import { usePreferencias } from "@/lib/preferencias";
import { fluxo, n, objetivos, s } from "@/lib/calculos";
import { fmtBRL, uid } from "@/lib/format";
import type { Item, Valor } from "@/types";

/** Campos do cartão: a categoria vem do arraste e fica no ícone do cabeçalho (clique nele para trocar). */
const CAMPOS_CARTAO = CAMPOS_OBJETIVO.filter((c) => c.key !== "categoria");
const ROTULO_TITULO = CAMPOS_OBJETIVO.find((c) => c.key === "titulo")?.label ?? "";
const iconeDe = (categoria: string) => CATEGORIAS.find((c) => c.nome === categoria)?.Icone;
const tituloDe = (o: Item) => s(o.titulo) || s(o.categoria) || "Novo objetivo";
const foco = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background";

type Painel = "mover" | "categoria";
/** O que receber o foco depois de criar, mover ou trocar a categoria. */
type Foco = { id: string; alvo: "titulo" | "alca" | "painel" | "selo" };

export default function Objetivos() {
  const { cliente, atualizar, setCampo } = useCliente();
  const { apresentacao } = usePreferencias();
  const ob = objetivos(cliente);
  const f = fluxo(cliente);
  const raiz = useRef<HTMLDivElement>(null);
  /** Categoria escolhida por clique/teclado, esperando a faixa. */
  const [selecao, setSelecao] = useState<string | null>(null);
  const [recolhidos, setRecolhidos] = useState<Set<string>>(new Set());
  const [painel, setPainel] = useState<{ id: string; tipo: Painel } | null>(null);
  const [destaque, setDestaque] = useState<string | null>(null);
  const [focar, setFocar] = useState<Foco | null>(null);
  const [aviso, setAviso] = useState("");
  // Leitor de tela: repete o aviso mesmo quando o texto é igual ao anterior.
  const anunciar = (t: string) => setAviso((a) => (a === t ? `${t} ` : t));

  const tipoDe = (id: string) => s(cliente.objetivos.find((o) => o.id === id)?.tipo);

  const criar = (tipo: string, categoria?: string) => {
    const novo: Item = { id: uid(), ...padroes(CAMPOS_OBJETIVO), tipo, ...(categoria ? { categoria, titulo: categoria } : {}) };
    atualizar((c) => ({ ...c, objetivos: [...c.objetivos, novo] }));
    setSelecao(null);
    // Sem categoria (botão "Adicionar"): abre a escolha da categoria primeiro.
    setPainel(categoria ? null : { id: novo.id, tipo: "categoria" });
    setFocar({ id: novo.id, alvo: categoria ? "titulo" : "painel" });
    anunciar(categoria ? `Objetivo ${categoria} criado em ${tipo}. Preencha os dados.` : `Novo objetivo em ${tipo}. Escolha a categoria.`);
  };

  const mover = (id: string, tipo: string) => {
    const o = cliente.objetivos.find((x) => x.id === id);
    if (!o || s(o.tipo) === tipo) return;
    // Vai para o fim da lista: aparece por último na faixa nova.
    atualizar((c) => {
      const atual = c.objetivos.find((x) => x.id === id);
      return atual ? { ...c, objetivos: [...c.objetivos.filter((x) => x.id !== id), { ...atual, tipo }] } : c;
    });
    setPainel(null);
    setFocar({ id, alvo: "alca" });
    anunciar(`${tituloDe(o)} movido para ${tipo}.`);
  };

  const remover = (o: Item) => {
    atualizar((c) => ({ ...c, objetivos: c.objetivos.filter((x) => x.id !== o.id) }));
    anunciar(`${tituloDe(o)} removido.`);
    // O foco vai para o "Adicionar" da mesma faixa (não se perde no topo da página).
    requestAnimationFrame(() => raiz.current?.querySelector<HTMLElement>(`[data-zona="${CSS.escape(s(o.tipo))}"] [data-adicionar] button`)?.focus());
  };

  const alterar = (id: string, key: string, v: Valor) =>
    atualizar((c) => ({ ...c, objetivos: c.objetivos.map((o) => (o.id === id ? { ...o, [key]: v } : o)) }));

  const trocarCategoria = (id: string, categoria: string) => {
    atualizar((c) => ({
      ...c,
      objetivos: c.objetivos.map((o) => {
        if (o.id !== id) return o;
        // Título vazio ou igual ao nome da categoria acompanha a troca.
        const segue = !s(o.titulo) || s(o.titulo) === s(o.categoria);
        return { ...o, categoria, ...(segue ? { titulo: categoria } : {}) };
      }),
    }));
    setPainel(null);
    setFocar({ id, alvo: "selo" });
  };

  const { arrasto, iniciar, areaToque, desenharFantasma, cliqueBloqueado } = useArrasto({
    // O objetivo só vai para outra faixa; a categoria vai para qualquer uma.
    aceita: (carga, zona) => carga.tipo === "categoria" || tipoDe(carga.id) !== zona,
    aoSoltar: (carga, zona) => (carga.tipo === "categoria" ? criar(zona, carga.categoria) : mover(carga.id, zona)),
  });

  // Depois de criar/mover: rola até o cartão, realça e põe o foco no lugar certo.
  useEffect(() => {
    if (!focar) return;
    const cartao = raiz.current?.querySelector<HTMLElement>(`[data-objetivo="${CSS.escape(focar.id)}"]`);
    if (!cartao) return;
    setFocar(null);
    setDestaque(focar.id);
    const alvo =
      focar.alvo === "titulo"
        ? (cartao.querySelector<HTMLInputElement>(`input[aria-label="${CSS.escape(ROTULO_TITULO)}"]`) ?? cartao.querySelector<HTMLInputElement>('input[type="text"]'))
        : cartao.querySelector<HTMLElement>(
            focar.alvo === "alca" ? "[data-alca]" : focar.alvo === "selo" ? "[data-selo]" : "[data-painel] [aria-checked='true'], [data-painel] button",
          );
    const suave = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    (alvo ?? cartao).scrollIntoView({ behavior: suave ? "smooth" : "auto", block: "center" });
    alvo?.focus({ preventScroll: true });
    if (alvo instanceof HTMLInputElement) alvo.select();
  }, [focar, cliente.objetivos]);

  useEffect(() => {
    if (!destaque) return;
    const t = window.setTimeout(() => setDestaque(null), 1600);
    return () => window.clearTimeout(t);
  }, [destaque]);

  // Seleção por clique: Esc ou clicar fora dos objetivos cancela.
  useEffect(() => {
    if (!selecao) return;
    const tecla = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setSelecao(null);
      setAviso("Seleção cancelada.");
    };
    const fora = (e: PointerEvent) => {
      if (!raiz.current?.contains(e.target as Node)) setSelecao(null);
    };
    document.addEventListener("keydown", tecla);
    document.addEventListener("pointerdown", fora);
    return () => {
      document.removeEventListener("keydown", tecla);
      document.removeEventListener("pointerdown", fora);
    };
  }, [selecao]);

  // Com uma categoria selecionada, clicar na faixa (fora dos cartões e dos botões) coloca a categoria nela.
  const cliqueZona = (e: MouseEvent, tipo: string) => {
    if (!selecao) return;
    if ((e.target as HTMLElement).closest("[data-objetivo], button, a, input, textarea, select, label")) return;
    criar(tipo, selecao);
  };

  const resumo = (o: Item) =>
    [
      n(o.valorFuturo) > 0 ? fmtBRL(n(o.valorFuturo)) : null,
      n(o.prazoMeses) > 0 ? `${n(o.prazoMeses)} meses` : null,
      s(o.prioridade) ? `prioridade ${s(o.prioridade).toLowerCase()}` : null,
    ]
      .filter(Boolean)
      .join(" · ") || "Sem valores preenchidos";

  const rodape = (o: Item) =>
    apresentacao ? null : n(o.prazoMeses) <= 0 ? (
      "Informe o prazo para calcular o aporte necessário."
    ) : (
      <>
        Aporte necessário: <strong className="text-foreground">{fmtBRL(ob.aportes[o.id] ?? 0)}/mês</strong>
        {` por ${n(o.prazoMeses)} meses`}
        {f.renda > 0 && ` · a sobra livre cobre ${ob.sugestao[o.id] ?? 0}% deste aporte`}
      </>
    );

  const cargaArrastada = arrasto?.carga;
  const objetivoArrastado = cargaArrastada?.tipo === "objetivo" ? cliente.objetivos.find((o) => o.id === cargaArrastada.id) : undefined;

  return (
    <div ref={raiz} className="space-y-4">
      {/* Ponto de partida (antes no V1): fica no cadastro do cliente e volta no Panorama e no PDF. */}
      <SubBloco
        titulo={
          <span className="flex items-center gap-2">
            <HeartHandshake className="h-3.5 w-3.5 text-primary" /> Ponto de partida
          </span>
        }
      >
        <Formulario campos={CAMPOS_PONTO_PARTIDA} dados={cliente.cadastro} cliente={cliente} onChange={(k, v) => setCampo("cadastro", k, v)} />
      </SubBloco>

      <FaixaCategorias
        selecionada={selecao}
        arrastando={cargaArrastada?.tipo === "categoria" ? cargaArrastada.categoria : null}
        onSelecionar={(cat) => {
          setSelecao(cat);
          anunciar(cat ? `Categoria ${cat} selecionada. Escolha onde colocar: Essencial, Desejo ou Sonho.` : "Seleção cancelada.");
        }}
        onColocar={(tipo) => selecao && criar(tipo, selecao)}
        iniciar={iniciar}
        areaToque={areaToque}
        cliqueBloqueado={cliqueBloqueado}
      />

      {TIPOS_OBJETIVO.map((t) => {
        const doTipo = cliente.objetivos.filter((o) => s(o.tipo) === t.id);
        const alvoArrasto = !!cargaArrastada && (cargaArrastada.tipo === "categoria" || tipoDe(cargaArrastada.id) !== t.id);
        const sobre = arrasto?.zona === t.id;
        const barra = "no-print flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-dashed px-3 text-center text-xs font-semibold transition";
        return (
          <section
            key={t.id}
            data-zona={t.id}
            aria-labelledby={`zona-${t.id}`}
            onClick={(e) => cliqueZona(e, t.id)}
            className={`rounded-xl border border-border p-4 transition ${
              sobre
                ? "bg-primary/10 outline outline-2 outline-primary"
                : alvoArrasto || selecao
                  ? "bg-secondary/20 outline-dashed outline-2 outline-primary/50"
                  : "bg-secondary/20"
            } ${selecao ? "cursor-pointer" : ""}`}
          >
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h3 id={`zona-${t.id}`} className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className={`h-2.5 w-2.5 rounded-full ${COR_TIPO[t.id] ?? "bg-muted"}`} />
                  <span className="text-foreground">{t.titulo}</span>
                  <span className="font-normal normal-case tracking-normal">· {t.descricao}</span>
                </span>
              </h3>
            </div>
            <div className="space-y-3">
              {doTipo.length === 0 && (
                <p className="px-1 text-xs text-muted-foreground">
                  Nenhum objetivo ainda.<span className="no-print"> Arraste uma categoria até aqui.</span>
                </p>
              )}
              {doTipo.map((o) => (
                <CartaoObjetivo
                  key={o.id}
                  o={o}
                  recolhido={recolhidos.has(o.id)}
                  painel={painel?.id === o.id ? painel.tipo : null}
                  destaque={destaque === o.id}
                  arrastando={objetivoArrastado?.id === o.id}
                  resumo={resumo(o)}
                  rodape={rodape(o)}
                  onAlternarRecolhido={() =>
                    setRecolhidos((atual) => {
                      const prox = new Set(atual);
                      if (prox.has(o.id)) prox.delete(o.id);
                      else prox.add(o.id);
                      return prox;
                    })
                  }
                  onPainel={(p) => setPainel(p ? { id: o.id, tipo: p } : null)}
                  onMover={(tipo) => mover(o.id, tipo)}
                  onCategoria={(cat) => trocarCategoria(o.id, cat)}
                  onRemover={() => remover(o)}
                  onAlterar={(k, v) => alterar(o.id, k, v)}
                  onArrastar={(e) => iniciar(e, { tipo: "objetivo", id: o.id })}
                  cliqueBloqueado={cliqueBloqueado}
                />
              ))}
              {selecao ? (
                <button type="button" onClick={() => criar(t.id, selecao)} className={`${barra} border-primary/70 bg-primary/10 text-primary hover:bg-primary/15 ${foco}`}>
                  <ArrowDownToLine className="h-4 w-4 shrink-0" aria-hidden="true" /> Soltar {selecao} aqui
                </button>
              ) : alvoArrasto ? (
                <div aria-hidden="true" className={`${barra} ${sobre ? "border-primary bg-primary/15 text-primary" : "border-primary/50 text-primary/80"}`}>
                  <ArrowDownToLine className="h-4 w-4 shrink-0" />
                  {sobre ? `Solte para ${cargaArrastada?.tipo === "objetivo" ? "mover para" : "colocar em"} ${t.titulo}` : "Soltar aqui"}
                </div>
              ) : (
                <div data-adicionar>
                  <BotaoAdicionar onClick={() => criar(t.id)}>{`Adicionar objetivo ${t.titulo.toLowerCase()}`}</BotaoAdicionar>
                </div>
              )}
            </div>
          </section>
        );
      })}

      <p aria-live="polite" className="sr-only">
        {aviso}
      </p>

      {desenharFantasma(
        cargaArrastada?.tipo === "categoria" ? (
          <Fantasma Icone={iconeDe(cargaArrastada.categoria)} titulo={cargaArrastada.categoria} zona={arrasto?.zona ?? null} />
        ) : (
          <Fantasma Icone={iconeDe(s(objetivoArrastado?.categoria))} titulo={objetivoArrastado ? tituloDe(objetivoArrastado) : "Objetivo"} zona={arrasto?.zona ?? null} />
        ),
      )}
    </div>
  );
}

/** Cartão de um objetivo: alça para trocar de faixa, ícone da categoria (troca), resumo/recolher, remover e campos. */
function CartaoObjetivo({
  o,
  recolhido,
  painel,
  destaque,
  arrastando,
  resumo,
  rodape,
  onAlternarRecolhido,
  onPainel,
  onMover,
  onCategoria,
  onRemover,
  onAlterar,
  onArrastar,
  cliqueBloqueado,
}: {
  o: Item;
  recolhido: boolean;
  painel: Painel | null;
  destaque: boolean;
  /** Este cartão está sendo arrastado (fica apagado no lugar de origem). */
  arrastando: boolean;
  resumo: ReactNode;
  rodape: ReactNode;
  onAlternarRecolhido: () => void;
  onPainel: (p: Painel | null) => void;
  onMover: (tipo: string) => void;
  onCategoria: (categoria: string) => void;
  onRemover: () => void;
  onAlterar: (key: string, v: Valor) => void;
  onArrastar: (e: EventoPonteiro<HTMLElement>) => void;
  cliqueBloqueado: () => boolean;
}) {
  const { cliente } = useCliente();
  const categoria = s(o.categoria);
  const Icone = iconeDe(categoria);
  const titulo = tituloDe(o);
  const refAlca = useRef<HTMLButtonElement>(null);
  const refSelo = useRef<HTMLButtonElement>(null);
  const refPainel = useRef<HTMLDivElement>(null);
  const focarPainel = useRef(false);
  // Painel aberto pelo teclado: o foco entra nas opções.
  useEffect(() => {
    if (painel && focarPainel.current) refPainel.current?.querySelector<HTMLElement>("[aria-checked='true'], button")?.focus();
    focarPainel.current = false;
  }, [painel]);

  const alternar = (p: Painel, e: MouseEvent) => {
    focarPainel.current = e.detail === 0 && painel !== p;
    onPainel(painel === p ? null : p);
  };
  const fecharComEsc = (e: EventoTecla) => {
    if (e.key !== "Escape") return;
    e.stopPropagation();
    (painel === "mover" ? refAlca : refSelo).current?.focus();
    onPainel(null);
  };
  const opcao = (ativo: boolean) =>
    `inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition ${foco} ${
      ativo ? "border-transparent bg-gold text-primary-foreground shadow-sm" : "border-border bg-card text-foreground hover:border-primary/60 hover:text-primary"
    }`;

  return (
    <div
      data-objetivo={o.id}
      className={`aparecer print-avoid rounded-xl border bg-card p-4 transition ${
        arrastando ? "border-dashed border-primary/60 opacity-50" : destaque ? "border-primary/70 ring-2 ring-primary/40" : "border-border"
      }`}
    >
      <div className="flex items-center gap-2">
        <button
          ref={refAlca}
          type="button"
          data-alca
          aria-label={`Mover ${titulo} para outra faixa`}
          aria-expanded={painel === "mover"}
          aria-controls={`mover-${o.id}`}
          title="Arraste até outra faixa (ou clique para escolher)"
          onPointerDown={onArrastar}
          onContextMenu={(e) => e.preventDefault()}
          onClick={(e) => !cliqueBloqueado() && alternar("mover", e)}
          className={`no-print -ml-1.5 grid h-9 w-7 shrink-0 cursor-grab touch-none select-none place-items-center rounded-md text-muted-foreground transition hover:bg-muted/60 hover:text-foreground active:cursor-grabbing ${foco} ${
            painel === "mover" ? "bg-muted/60 text-foreground" : ""
          }`}
        >
          <GripVertical className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          ref={refSelo}
          type="button"
          data-selo
          aria-label={categoria ? `Categoria: ${categoria}. Trocar a categoria` : "Escolher a categoria"}
          aria-expanded={painel === "categoria"}
          aria-controls={`categoria-${o.id}`}
          title={categoria ? "Trocar a categoria" : "Escolher a categoria"}
          onClick={(e) => alternar("categoria", e)}
          className={`grid h-8 w-8 shrink-0 place-items-center rounded-md transition ${foco} ${
            Icone ? "bg-gold text-primary-foreground hover:brightness-105" : "border border-dashed border-primary/60 text-primary hover:bg-primary/10"
          }`}
        >
          {Icone ? <Icone className="h-4 w-4" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
        </button>
        <div className="min-w-0 flex-1">
          {/* Em tela estreita a categoria desce para baixo do título (não espreme as palavras). */}
          <span className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm font-semibold text-foreground">
            <span className="min-w-0 hyphens-auto break-words">{titulo}</span>
            {categoria && categoria !== titulo && <span className="shrink-0 text-xs font-normal text-muted-foreground">{categoria}</span>}
          </span>
          {recolhido && <div className="mt-0.5 text-xs text-muted-foreground">{resumo}</div>}
        </div>
        <div className="no-print flex shrink-0 items-center gap-1">
          <button
            type="button"
            aria-expanded={!recolhido}
            aria-label={recolhido ? "Mostrar os dados" : "Ocultar os dados"}
            title={recolhido ? "Mostrar os dados" : "Ocultar os dados"}
            onClick={onAlternarRecolhido}
            className={`rounded-md p-1.5 text-muted-foreground transition hover:bg-muted/50 hover:text-foreground ${foco}`}
          >
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${recolhido ? "" : "rotate-180"}`} />
          </button>
          <button
            type="button"
            aria-label={`Remover ${titulo}`}
            title="Remover"
            onClick={onRemover}
            className={`rounded-md p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive ${foco}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {painel === "mover" && (
        <div
          ref={refPainel}
          id={`mover-${o.id}`}
          data-painel
          role="group"
          aria-label="Mover para outra faixa"
          onKeyDown={fecharComEsc}
          className="no-print aparecer mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-secondary/40 p-2.5"
        >
          <span className="text-xs text-muted-foreground">Mover para:</span>
          {TIPOS_OBJETIVO.filter((t) => t.id !== s(o.tipo)).map((t) => (
            <button key={t.id} type="button" onClick={() => onMover(t.id)} className={opcao(false)}>
              <span className={`h-2.5 w-2.5 rounded-full ${COR_TIPO[t.id] ?? "bg-muted"}`} aria-hidden="true" />
              {t.titulo}
            </button>
          ))}
        </div>
      )}
      {painel === "categoria" && (
        <div
          ref={refPainel}
          id={`categoria-${o.id}`}
          data-painel
          role="radiogroup"
          aria-label="Categoria"
          onKeyDown={fecharComEsc}
          className="no-print aparecer mt-3 flex flex-wrap gap-1.5 rounded-lg border border-border bg-secondary/40 p-2.5"
        >
          {CATEGORIAS.map(({ nome, Icone: IconeOpcao }) => (
            <button key={nome} type="button" role="radio" aria-checked={categoria === nome} onClick={() => onCategoria(nome)} className={opcao(categoria === nome)}>
              {IconeOpcao && <IconeOpcao className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
              {nome}
            </button>
          ))}
        </div>
      )}

      {!recolhido && (
        <>
          <div className="mt-3">
            <Formulario campos={CAMPOS_CARTAO} dados={o} cliente={cliente} onChange={onAlterar} />
          </div>
          {rodape !== null && rodape !== undefined && <div className="no-print mt-3 border-t border-border pt-3 text-xs text-muted-foreground">{rodape}</div>}
        </>
      )}
    </div>
  );
}
