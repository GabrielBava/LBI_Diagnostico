// Estrela LIFE (6.1 · Panorama geral): radar dos 8 pilares ou dos 20 sub-pilares, em SVG.
// Anéis tracejados a cada 20%; com os sub-pilares, um arco tracejado agrupa os eixos de
// cada pilar. Os eixos dividem o círculo em 20 fatias iguais (pilar de 10 pontos = 2 fatias,
// de 15 = 3), então os pilares ficam no mesmo lugar com o interruptor ligado ou desligado.
// Cores dos tokens (tema escuro e claro); rótulos encolhem ou viram números em telas estreitas.
import { useEffect, useId, useReducer, useRef, useState } from "react";
import type { Estrela as DadosEstrela, PilarEstrela } from "@/lib/estrela";

const SERIE = "var(--serie-1)";
const TEXTO = "rgb(var(--foreground))";
const MUDO = "rgb(var(--muted-foreground))";
// Grade em cinza translúcido: aparece no fundo escuro e no claro.
const GRADE = "rgb(var(--muted-foreground) / 0.32)";
const DESTAQUE = "rgb(var(--primary))";
const FUNDO = "rgb(var(--card))";
const ANEIS = [20, 40, 60, 80, 100];
const PAD = 4;
/** |cos| abaixo disso: rótulo centralizado no eixo (topo e base). */
const LIMIAR_MEIO = 0.05;
/** |sen| acima disso: rótulo do pilar inteiro acima (topo) ou abaixo (base) da ponta do eixo. */
const LIMIAR_VERTICAL = 0.5;
/** Sub-pilares com |sen| acima disso (perto do topo e da base): nome e nota numa linha só. */
const LIMIAR_LINHA_UNICA = 0.6;
const ESPACO_VALOR = 4;

function useLargura<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [largura, setLargura] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setLargura(e.contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, largura] as const;
}

// Largura dos textos medida no canvas com a fonte da página (sem canvas: estimativa por caractere).
let contexto: CanvasRenderingContext2D | null | undefined;
let familia = "Inter, ui-sans-serif, system-ui, sans-serif";
function larguraTexto(t: string, fonte: number, peso: number, espacamento = 0) {
  if (contexto === undefined && typeof document !== "undefined") {
    contexto = document.createElement("canvas").getContext("2d");
    familia = getComputedStyle(document.body).fontFamily || familia;
  }
  const extra = t.length * espacamento * fonte;
  if (!contexto) return t.length * fonte * (peso >= 600 ? 0.6 : 0.55) + extra;
  contexto.font = `${peso} ${fonte}px ${familia}`;
  return contexto.measureText(t).width + extra;
}

interface Eixo {
  chave: string;
  pilar: PilarEstrela;
  /** Radianos; 0 = direita, sentido horário (y do SVG cresce para baixo). */
  angulo: number;
  pct: number;
  linhas: string[];
  valor: string;
  /** Nome e valor na mesma linha. */
  emLinha: boolean;
  semDados: boolean;
  titulo: string;
  detalhe: string;
}

interface Fontes {
  nome: number;
  valor: number;
  peso: number;
}

const alturaLinha = (fonte: number) => Math.round(fonte * 1.25);
const alturaRotulo = (e: Eixo, f: Fontes) =>
  e.emLinha ? alturaLinha(f.nome) : e.linhas.length * alturaLinha(f.nome) + (e.valor ? alturaLinha(f.valor) : 0);
const larguraRotulo = (e: Eixo, f: Fontes) => {
  const nomes = e.linhas.map((l) => larguraTexto(l, f.nome, f.peso));
  const valor = e.valor ? larguraTexto(e.valor, f.valor, 600) : 0;
  return e.emLinha ? Math.max(...nomes) + ESPACO_VALOR + valor : Math.max(...nomes, valor);
};
/** Faixa vertical do rótulo em relação à ponta do eixo. */
const faixaVertical = (sen: number, h: number, centrado: boolean): [number, number] =>
  centrado ? [-h / 2, h / 2] : sen < -LIMIAR_VERTICAL ? [-h, 0] : sen > LIMIAR_VERTICAL ? [0, h] : [-h / 2, h / 2];

/** Raio que cabe na largura com os rótulos e a altura que o desenho precisa. */
function geometria(W: number, eixos: Eixo[], f: Fontes, afastamento: number, raioMax: number, folgaArco: number, centrado: boolean) {
  let R = raioMax;
  eixos.forEach((e) => {
    const cos = Math.cos(e.angulo);
    if (Math.abs(cos) <= LIMIAR_MEIO) return;
    R = Math.min(R, (W / 2 - PAD - larguraRotulo(e, f)) / Math.abs(cos) - afastamento);
  });
  R = Math.max(36, Math.floor(R));
  let topo = R + folgaArco;
  let base = R + folgaArco;
  eixos.forEach((e) => {
    const sen = Math.sin(e.angulo);
    const y = (R + afastamento) * sen;
    const [d0, d1] = faixaVertical(sen, alturaRotulo(e, f), centrado);
    topo = Math.max(topo, -(y + d0));
    base = Math.max(base, y + d1);
  });
  return { R, cx: W / 2, cy: Math.ceil(topo + PAD), H: Math.ceil(topo + base + 2 * PAD) };
}

export function Estrela({
  dados,
  subPilares,
  selecionado,
  onSelecionar,
}: {
  dados: DadosEstrela;
  subPilares: boolean;
  selecionado?: string;
  onSelecionar?: (pilar: string) => void;
}) {
  const [ref, W] = useLargura<HTMLDivElement>();
  const [foco, setFoco] = useState<string>();
  // Quando a fonte da página termina de carregar, mede os rótulos de novo.
  const [, remedir] = useReducer((x: number) => x + 1, 0);
  useEffect(() => {
    let vivo = true;
    document.fonts?.ready.then(() => vivo && remedir());
    return () => {
      vivo = false;
    };
  }, []);
  const idBase = useId().replace(/:/g, "");
  const ps = dados.pilares;
  const fatias = ps.reduce((t, p) => t + p.subs.length, 0) || 1;
  const fatia = (2 * Math.PI) / fatias;
  // O primeiro pilar fica centrado no topo.
  const inicio = -Math.PI / 2 - (ps[0]?.subs.length ?? 0) * (fatia / 2);
  const grupos: { pilar: PilarEstrela; a0: number; a1: number; centro: number; primeiro: number }[] = [];
  ps.reduce((acc, p) => {
    const a0 = inicio + acc * fatia;
    const a1 = a0 + p.subs.length * fatia;
    grupos.push({ pilar: p, a0, a1, centro: (a0 + a1) / 2, primeiro: acc });
    return acc + p.subs.length;
  }, 0);

  const montar = (compacto: boolean): Eixo[] =>
    subPilares
      ? grupos.flatMap((g) =>
          g.pilar.subs.map((x, k) => {
            const angulo = g.a0 + (k + 0.5) * fatia;
            return {
              chave: `${g.pilar.id}.${x.id}`,
              pilar: g.pilar,
              angulo,
              pct: x.pct,
              linhas: [compacto ? String(g.primeiro + k + 1) : x.curto],
              valor: compacto ? "" : x.semDados ? "—" : `${x.nota}/5`,
              emLinha: !compacto && Math.abs(Math.sin(angulo)) > LIMIAR_LINHA_UNICA,
              semDados: !!x.semDados,
              titulo: `${x.nome} · ${g.pilar.curto}`,
              detalhe: x.semDados ? `Sem dados. ${x.pesou}` : `${x.nota} de 5 pontos. ${x.pesou}`,
            };
          }),
        )
      : grupos.map((g) => ({
          chave: g.pilar.id,
          pilar: g.pilar,
          angulo: g.centro,
          pct: g.pilar.pct,
          linhas: compacto ? [g.pilar.curto] : g.pilar.linhas,
          valor: g.pilar.status === "sem-dados" ? "—" : `${g.pilar.pct}%`,
          emLinha: false,
          semDados: g.pilar.status === "sem-dados",
          titulo: g.pilar.nome,
          detalhe: `${g.pilar.nota} de ${g.pilar.maximo} pontos (${g.pilar.pct}%). ${g.pilar.descricao}`,
        }));

  // Tamanhos: completo primeiro; se o raio ficar pequeno, rótulos curtos (pilares) ou números com legenda (sub-pilares).
  const fonteArco = 9;
  const raioMax = subPilares ? 168 : 172;
  const folgaArco = subPilares ? 22 : 0;
  let eixos = montar(false);
  let fontes: Fontes = subPilares ? { nome: 10.5, valor: 10, peso: 500 } : { nome: 12, valor: 11, peso: 700 };
  let afastamento = subPilares ? 28 : 12;
  let g = geometria(W, eixos, fontes, afastamento, raioMax, folgaArco, subPilares);
  const compacto = W > 0 && g.R < (subPilares ? 112 : 96);
  if (compacto) {
    eixos = montar(true);
    fontes = { nome: 10.5, valor: 10, peso: 700 };
    afastamento = subPilares ? 24 : 8;
    g = geometria(W, eixos, fontes, afastamento, raioMax, folgaArco, subPilares);
  }
  const { R, cx, cy, H } = g;
  const raioArco = R + 8;
  const ponto = (a: number, r: number) => [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const;
  const pontoDado = (e: Eixo) => ponto(e.angulo, (R * Math.max(0, Math.min(100, e.pct))) / 100);
  const poligono = eixos.map((e) => pontoDado(e).join(",")).join(" ");
  const eixoFoco = eixos.find((e) => e.chave === foco);

  const resumo =
    `Estrela LIFE: ${dados.temDados ? `${dados.total} de ${dados.maximo} pontos` : "sem dados"}. ` +
    ps
      .map(
        (p) =>
          `${p.nome}: ${p.status === "sem-dados" ? "sem dados" : `${p.nota} de ${p.maximo}`}` +
          (subPilares ? ` (${p.subs.map((x) => `${x.nome} ${x.semDados ? "sem dados" : `${x.nota} de 5`}`).join(", ")})` : ""),
      )
      .join("; ") +
    ".";

  return (
    <div ref={ref} className="relative w-full">
      {W > 0 && (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={resumo} className="block select-none" onMouseLeave={() => setFoco(undefined)}>
          {/* Anéis tracejados (20% a 100%) */}
          {ANEIS.map((a) => (
            <circle key={a} cx={cx} cy={cy} r={(R * a) / 100} fill="none" stroke={GRADE} strokeWidth={1} strokeDasharray="3 4" />
          ))}
          {/* Eixos */}
          {eixos.map((e) => {
            const [x, y] = ponto(e.angulo, R);
            const ativo = selecionado === e.pilar.id;
            return <line key={e.chave} x1={cx} y1={cy} x2={x} y2={y} stroke={ativo ? DESTAQUE : GRADE} strokeWidth={ativo ? 1.5 : 1} />;
          })}
          {/* Arcos que agrupam os sub-pilares de cada pilar, com o nome curto do pilar */}
          {subPilares &&
            grupos.map((gr) => {
              const folga = Math.min(0.04, fatia * 0.12);
              const a0 = gr.a0 + folga;
              const a1 = gr.a1 - folga;
              const [x0, y0] = ponto(a0, raioArco);
              const [x1, y1] = ponto(a1, raioArco);
              const ativo = selecionado === gr.pilar.id;
              // Na metade de baixo o texto corre ao contrário para não ficar de cabeça para baixo.
              const embaixo = Math.sin(gr.centro) > 0.2;
              const rt = embaixo ? raioArco + 3 + fonteArco * 0.72 : raioArco + 3;
              const [tx0, ty0] = ponto(embaixo ? a1 : a0, rt);
              const [tx1, ty1] = ponto(embaixo ? a0 : a1, rt);
              const nome = gr.pilar.curto.toUpperCase();
              const cabe = larguraTexto(nome, fonteArco, 700, 0.08) <= rt * (a1 - a0) * 0.96;
              const id = `${idBase}-arco-${gr.pilar.id}`;
              return (
                <g key={gr.pilar.id}>
                  <path
                    d={`M ${x0} ${y0} A ${raioArco} ${raioArco} 0 0 1 ${x1} ${y1}`}
                    fill="none"
                    stroke={ativo ? DESTAQUE : MUDO}
                    strokeOpacity={ativo ? 1 : 0.7}
                    strokeWidth={1.25}
                    strokeDasharray="2 3"
                  />
                  {cabe && (
                    <>
                      <path id={id} d={`M ${tx0} ${ty0} A ${rt} ${rt} 0 0 ${embaixo ? 0 : 1} ${tx1} ${ty1}`} fill="none" stroke="none" />
                      <text fontSize={fonteArco} fontWeight={700} letterSpacing="0.08em" fill={ativo ? DESTAQUE : MUDO}>
                        <textPath href={`#${id}`} startOffset="50%" textAnchor="middle">
                          {nome}
                        </textPath>
                      </text>
                    </>
                  )}
                </g>
              );
            })}
          {/* Área conquistada */}
          <polygon points={poligono} fill={SERIE} fillOpacity={0.26} stroke={SERIE} strokeWidth={2} strokeLinejoin="round" />
          {/* Pontos e rótulos (passar o mouse mostra o detalhe; clicar abre o pilar no resumo) */}
          {eixos.map((e) => {
            const [px, py] = pontoDado(e);
            const [ax, ay] = ponto(e.angulo, R + afastamento);
            const cos = Math.cos(e.angulo);
            const sen = Math.sin(e.angulo);
            const ancora = cos > LIMIAR_MEIO ? "start" : cos < -LIMIAR_MEIO ? "end" : "middle";
            const lhNome = alturaLinha(fontes.nome);
            const lhValor = alturaLinha(fontes.valor);
            const topo = ay + faixaVertical(sen, alturaRotulo(e, fontes), subPilares)[0];
            const ativo = selecionado === e.pilar.id || foco === e.chave;
            const eventos = {
              onMouseEnter: () => setFoco(e.chave),
              onClick: () => onSelecionar?.(e.pilar.id),
            };
            const valor = (props: { x?: number; y?: number; dx?: number }) => (
              <tspan {...props} fontSize={fontes.valor} fontWeight={600} fill={MUDO}>
                {e.valor}
              </tspan>
            );
            return (
              <g key={e.chave} className={onSelecionar ? "cursor-pointer" : ""}>
                {!e.semDados && <circle cx={px} cy={py} r={ativo ? 5.5 : 4} fill={ativo ? DESTAQUE : SERIE} stroke={FUNDO} strokeWidth={2} />}
                {/* Alvo maior que o ponto, para o mouse */}
                <circle cx={px} cy={py} r={14} fill="transparent" {...eventos} />
                <text {...eventos} textAnchor={ancora} fontSize={fontes.nome} fontWeight={ativo ? 700 : fontes.peso} fill={ativo ? DESTAQUE : TEXTO}>
                  {e.emLinha ? (
                    <>
                      <tspan x={ax} y={topo + lhNome * 0.75}>
                        {e.linhas[0]}
                      </tspan>
                      {e.valor && valor({ dx: ESPACO_VALOR })}
                    </>
                  ) : (
                    <>
                      {e.linhas.map((l, i) => (
                        <tspan key={i} x={ax} y={topo + i * lhNome + lhNome * 0.75}>
                          {l}
                        </tspan>
                      ))}
                      {e.valor && valor({ x: ax, y: topo + e.linhas.length * lhNome + lhValor * 0.75 })}
                    </>
                  )}
                </text>
              </g>
            );
          })}
          {!dados.temDados && (
            <g>
              <rect x={cx - 38} y={cy - 11} width={76} height={22} rx={11} fill={FUNDO} stroke={GRADE} />
              <text x={cx} y={cy + 4} textAnchor="middle" fontSize={12} fill={MUDO}>
                Sem dados
              </text>
            </g>
          )}
        </svg>
      )}
      {/* Detalhe do eixo sob o mouse */}
      {eixoFoco && W > 0 && <Detalhe eixo={eixoFoco} x={pontoDado(eixoFoco)[0]} y={pontoDado(eixoFoco)[1]} W={W} />}
      {/* Telas estreitas com sub-pilares: números no gráfico e esta legenda */}
      {compacto && subPilares && (
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-[11px] leading-snug">
          {grupos.map((gr) => (
            <div key={gr.pilar.id} className="min-w-0">
              <div className="font-semibold uppercase tracking-wider text-muted-foreground">{gr.pilar.curto}</div>
              {gr.pilar.subs.map((x, k) => (
                <div key={x.id} className="flex gap-1">
                  <span className="w-4 shrink-0 text-right font-semibold tabular-nums">{gr.primeiro + k + 1}</span>
                  <span className="min-w-0 flex-1 truncate">{x.curto}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">{x.semDados ? "—" : `${x.nota}/5`}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Caixa com o nome, a nota e o que pesou, perto do ponto. */
function Detalhe({ eixo, x, y, W }: { eixo: Eixo; x: number; y: number; W: number }) {
  const largura = Math.min(240, W - 8);
  const left = Math.max(4, Math.min(W - largura - 4, x - largura / 2));
  return (
    <div
      className="pointer-events-none absolute z-10 rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-lg"
      style={{ left, top: y + 14, width: largura }}
      aria-hidden
    >
      <div className="font-semibold text-foreground">{eixo.titulo}</div>
      <p className="mt-0.5 text-muted-foreground">{eixo.detalhe}</p>
    </div>
  );
}
