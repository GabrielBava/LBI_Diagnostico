// Gráficos do Diagnóstico em PDF: barras simples com rótulo de valor,
// rosca com legenda e linhas de projeção (HTML/SVG, legíveis na impressão).
import { COR } from "./base";
import { fmtCompacto } from "@/lib/format";

/** "R$ 1,3M" / "R$ 617k" / "-R$ 91k". */
export const fmtCurto = (v: number) => (v < 0 ? `-R$ ${fmtCompacto(-v)}` : `R$ ${fmtCompacto(v)}`);

export interface ItemLegenda {
  nome: string;
  cor: string;
  /** Linha tracejada (gráfico de linhas). */
  traco?: boolean;
}

export function Legenda({ itens }: { itens: ItemLegenda[] }) {
  return (
    <div className="rel-legenda">
      {itens.map((i) => (
        <span key={i.nome}>
          <i className={i.traco ? "traco" : undefined} style={i.traco ? { color: i.cor } : { background: i.cor }} />
          {i.nome}
        </span>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------
//  Barras
// ---------------------------------------------------------------------
export interface Barra {
  /** null = "Não informado". */
  valor: number | null;
  cor: string;
  /** Texto acima da barra (padrão: valor curto em reais). */
  rotulo?: string;
}

export interface GrupoBarras {
  nome: string;
  barras: Barra[];
}

/**
 * Barras verticais com o valor em cima. Zero, negativo e "Não informado"
 * aparecem como um traço na base (como no modelo).
 */
export function GraficoBarras({
  grupos,
  altura,
  formatar = fmtCurto,
  grande,
}: {
  grupos: GrupoBarras[];
  /** Altura máxima das barras, em pt. */
  altura: number;
  formatar?: (v: number) => string;
  /** Rótulos maiores (gráficos de uma barra por grupo). */
  grande?: boolean;
}) {
  const maximo = Math.max(1, ...grupos.flatMap((g) => g.barras.map((b) => b.valor ?? 0)));
  const porGrupo = Math.max(1, ...grupos.map((g) => g.barras.length));
  const largura = `${Math.min(60, 80 / porGrupo)}%`;
  return (
    <div className={`rel-barras ${grande ? "rel-barras-grande" : ""}`}>
      <div className="rel-barras-area" style={{ height: `${altura + 16}pt` }}>
        {grupos.map((g, gi) => (
          <div key={`${g.nome}-${gi}`} className="rel-barras-grupo">
            {g.barras.map((b, bi) => {
              const v = b.valor;
              const traco = v === null || v <= 0;
              const h = traco ? 2 : Math.max(2, (v / maximo) * altura);
              const texto = b.rotulo ?? (v === null ? "Não informado" : formatar(v));
              return (
                <div key={bi} className="rel-barra" style={{ width: largura }}>
                  <span className={`rel-barra-valor ${v !== null && v < 0 ? "negativo" : ""}`}>{texto}</span>
                  <div className="rel-barra-coluna" style={{ height: `${h}pt`, background: v !== null && v < 0 ? COR.vermelho : b.cor }} />
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="rel-barras-rotulos">
        {grupos.map((g, gi) => (
          <div key={`${g.nome}-${gi}`}>{g.nome}</div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
//  Rosca (composição) com legenda à direita
// ---------------------------------------------------------------------
export interface FatiaRosca {
  nome: string;
  valor: number;
  cor: string;
}

export function GraficoRosca({ fatias, centro, legendaCentro, formatarItem }: { fatias: FatiaRosca[]; centro: string; legendaCentro: string; formatarItem: (f: FatiaRosca, pct: number) => string }) {
  const total = fatias.reduce((t, f) => t + Math.max(0, f.valor), 0);
  const r = 37.5;
  const circ = 2 * Math.PI * r;
  let acumulado = 0;
  return (
    <div className="rel-rosca">
      <svg width="96pt" height="96pt" viewBox="0 0 100 100" role="img" aria-label={`${centro} ${legendaCentro}`}>
        <circle cx="50" cy="50" r={r} fill="none" stroke="#ebe8de" strokeWidth="21" />
        {total > 0 &&
          fatias.map((f) => {
            const parte = Math.max(0, f.valor) / total;
            const tam = parte * circ;
            const el = (
              <circle
                key={f.nome}
                cx="50"
                cy="50"
                r={r}
                fill="none"
                stroke={f.cor}
                strokeWidth="21"
                strokeDasharray={`${tam} ${circ - tam}`}
                strokeDashoffset={-acumulado}
                transform="rotate(-90 50 50)"
              />
            );
            acumulado += tam;
            return el;
          })}
        <text x="50" y="50" textAnchor="middle" fontSize="11" fontWeight="700" fill={COR.azul}>
          {centro}
        </text>
        <text x="50" y="60" textAnchor="middle" fontSize="6" fill={COR.cinza}>
          {legendaCentro}
        </text>
      </svg>
      <div className="rel-rosca-legenda">
        {fatias.map((f) => (
          <div key={f.nome} className="rel-rosca-item">
            <i style={{ background: f.cor }} />
            <b>{f.nome}</b>
            <span>{formatarItem(f, total > 0 ? Math.max(0, f.valor) / total : 0)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
//  Linhas (patrimônio projetado)
// ---------------------------------------------------------------------
export interface SerieLinha {
  nome: string;
  cor: string;
  pontos: number[];
}

export function GraficoLinhas({ series, rotulosX, altura = 140 }: { series: SerieLinha[]; rotulosX: string[]; altura?: number }) {
  // Coordenadas em pt (o SVG ocupa a largura do painel).
  const L = 700;
  const esq = 52;
  const dir = 12;
  const topo = 8;
  const base = altura - 18;
  const maximo = Math.max(1, ...series.flatMap((s) => s.pontos));
  const n = Math.max(2, rotulosX.length);
  const x = (i: number) => esq + ((L - esq - dir) * i) / (n - 1);
  const y = (v: number) => base - ((base - topo) * Math.max(0, v)) / maximo;
  const marcasY = [0, 0.25, 0.5, 0.75, 1].map((p) => maximo * p);
  // Até 5 anos no eixo, sempre com o primeiro e o último.
  const passo = Math.max(1, Math.ceil((n - 1) / 4));
  const marcasX = rotulosX.map((_, i) => i).filter((i) => i % passo === 0 || i === n - 1);
  if (marcasX.length > 1 && marcasX[marcasX.length - 1] - marcasX[marcasX.length - 2] < passo / 2) marcasX.splice(marcasX.length - 2, 1);
  return (
    <svg className="rel-linhas" viewBox={`0 0 ${L} ${altura}`} style={{ width: "100%", height: "auto" }}>
      {marcasY.map((v) => (
        <g key={v}>
          <line x1={esq} x2={L - dir} y1={y(v)} y2={y(v)} stroke="#dcdad0" strokeWidth="0.6" />
          <text x={esq - 6} y={y(v) + 2.5} textAnchor="end" fontSize="7" fill={COR.cinza}>
            {fmtCurto(v)}
          </text>
        </g>
      ))}
      {marcasX.map((i) => (
        <text key={i} x={x(i)} y={altura - 4} textAnchor="middle" fontSize="7" fill={COR.cinza}>
          {rotulosX[i]}
        </text>
      ))}
      {series.map((s) => (
        <polyline
          key={s.nome}
          fill="none"
          stroke={s.cor}
          strokeWidth="1.6"
          strokeDasharray="5 3"
          points={s.pontos.map((v, i) => `${x(i)},${y(v)}`).join(" ")}
        />
      ))}
    </svg>
  );
}
