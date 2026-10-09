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

/** Converte texto digitado ("4.000", "1.234,56", "1234.5") em número. */
export const textoParaNumero = (t: string): number | undefined => {
  const s = t.replace(/[^\d,.-]/g, "").trim();
  if (!s) return undefined;
  let normal = s;
  if (s.includes(",")) normal = s.replace(/\./g, "").replace(",", ".");
  else if ((s.match(/\./g) || []).length > 1 || /\.\d{3}$/.test(s)) normal = s.replace(/\./g, "");
  const n = Number(normal);
  return Number.isFinite(n) ? n : undefined;
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
