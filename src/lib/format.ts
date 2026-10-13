// Formatação e conversão de números no padrão brasileiro.

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const brlCent = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });
const num = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

export const fmtBRL = (v: number, centavos = false) => (centavos ? brlCent : brl).format(Number.isFinite(v) ? v : 0);
export const fmtNum = (v: number) => num.format(Number.isFinite(v) ? v : 0);
export const fmtPct = (v: number, casas = 0) =>
  `${(Number.isFinite(v) ? v * 100 : 0).toLocaleString("pt-BR", { maximumFractionDigits: casas, minimumFractionDigits: casas })}%`;

/** Valor compacto para eixos de gráficos: 1,2M / 350k */
export const fmtCompacto = (v: number) => {
  const a = Math.abs(v);
  if (a >= 1_000_000) return `${(v / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}M`;
  if (a >= 1_000) return `${(v / 1_000).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}k`;
  return v.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
};

/** Exibe um número em campo de moeda: 4000 -> "4.000"; 1234.5 -> "1.234,50" */
export const moedaParaTexto = (v: number | undefined | null) => {
  if (v === undefined || v === null || !Number.isFinite(v)) return "";
  const temCentavos = Math.round(v * 100) % 100 !== 0;
  return v.toLocaleString("pt-BR", {
    minimumFractionDigits: temCentavos ? 2 : 0,
    maximumFractionDigits: 2,
  });
};

/** Valor de campo de moeda: sempre com centavos (30.000,00). */
export const moedaCampo = (v: number | undefined | null) =>
  v === undefined || v === null || !Number.isFinite(v)
    ? ""
    : v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Máscara enquanto digita (padrão brasileiro: ponto = milhar, vírgula = centavos):
 * "30000,5" → "30.000,5"; os pontos digitados são ignorados (o milhar é refeito).
 */
export const mascaraMoeda = (t: string) => {
  const limpo = t.replace(/[^\d,]/g, "");
  if (!limpo) return "";
  const [inteiro, ...resto] = limpo.split(",");
  const digitos = inteiro.replace(/^0+(?=\d)/, "");
  const milhar = (digitos || "0").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return resto.length ? `${milhar},${resto.join("").slice(0, 2)}` : milhar;
};

/**
 * Converte texto colado ou importado em número: "4.000", "1.234,56", "1234.5", "1,234.56", "R$ 30.000,00".
 * Com ponto e vírgula juntos, o último dos dois é o separador decimal.
 */
export const textoParaNumero = (t: string): number | undefined => {
  const s = t.replace(/[^\d,.-]/g, "").trim();
  if (!s) return undefined;
  let normal = s;
  const virgula = s.lastIndexOf(",");
  const ponto = s.lastIndexOf(".");
  if (virgula >= 0 && ponto >= 0) normal = virgula > ponto ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  else if (virgula >= 0) normal = s.replace(/,/g, (_m, i) => (i === virgula ? "." : ""));
  else if ((s.match(/\./g) || []).length > 1 || /\.\d{3}$/.test(s)) normal = s.replace(/\./g, "");
  const n = Number(normal);
  return Number.isFinite(n) ? n : undefined;
};

/** Número do texto mascarado do campo (ponto = milhar, vírgula = centavos, no máximo 2 casas). */
export const numeroDaMascara = (t: string): number | undefined => {
  const limpo = t.replace(/[^\d,]/g, "");
  if (!limpo || limpo === ",") return undefined;
  const [inteiro, ...resto] = limpo.split(",");
  const n = Number(`${inteiro || "0"}.${resto.join("").slice(0, 2) || "0"}`);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : undefined;
};

export const fmtData = (iso?: string) => {
  if (!iso) return "—";
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("pt-BR");
};

export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

/** "1 cartão" / "2 cartões". */
export const plural = (q: number, singular: string, pluralTexto: string) => `${q} ${q === 1 ? singular : pluralTexto}`;
