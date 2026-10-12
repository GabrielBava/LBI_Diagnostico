// Blocos visuais básicos: cartões de seção, indicadores, selos e botões.
import type { ReactNode } from "react";
import type { Status } from "@/lib/diagnostico";

export function Cartao({
  titulo,
  acao,
  children,
  className = "",
  subtitulo,
}: {
  titulo?: ReactNode;
  subtitulo?: ReactNode;
  acao?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`print-avoid rounded-xl border border-border bg-card p-5 ${className}`}>
      {(titulo || acao) && (
        <header className="mb-4 flex items-start justify-between gap-3">
          <div>
            {titulo && <h2 className="text-sm font-semibold tracking-wide">{titulo}</h2>}
            {subtitulo && <p className="mt-0.5 text-xs text-muted-foreground">{subtitulo}</p>}
          </div>
          {acao}
        </header>
      )}
      {children}
    </section>
  );
}

type Tom = "ouro" | "alerta" | "sucesso" | "perigo" | "neutro";

const tons: Record<Tom, string> = {
  ouro: "",
  alerta: "bg-warning/10 border-warning/30",
  sucesso: "bg-success/10 border-success/30",
  perigo: "bg-destructive/10 border-destructive/30",
  neutro: "bg-card border-border",
};

export function Kpi({
  rotulo,
  valor,
  sufixo,
  detalhe,
  tom = "neutro",
}: {
  rotulo: string;
  valor: ReactNode;
  sufixo?: string;
  detalhe?: ReactNode;
  tom?: Tom;
}) {
  const ouro = tom === "ouro";
  return (
    <div
      className={`print-avoid rounded-xl border p-4 ${ouro ? "border-transparent bg-gold text-primary-foreground" : tons[tom]}`}
    >
      <div className={`text-[10px] font-semibold uppercase tracking-widest ${ouro ? "opacity-80" : "text-muted-foreground"}`}>
        {rotulo}
      </div>
      <div className="mt-1 text-xl font-semibold tabular-nums md:text-2xl">
        {valor}
        {sufixo && <span className={`ml-1 text-xs font-medium ${ouro ? "opacity-80" : "text-muted-foreground"}`}>{sufixo}</span>}
      </div>
      {detalhe && <div className={`mt-1 text-xs ${ouro ? "opacity-80" : "text-muted-foreground"}`}>{detalhe}</div>}
    </div>
  );
}

export const corStatus: Record<Status, string> = {
  ok: "text-success bg-success/10 border-success/30",
  atencao: "text-warning bg-warning/10 border-warning/30",
  critico: "text-destructive bg-destructive/10 border-destructive/30",
  "sem-dados": "text-muted-foreground bg-muted/40 border-border",
};
export const textoStatus: Record<Status, string> = {
  ok: "Saudável",
  atencao: "Atenção",
  critico: "Crítico",
  "sem-dados": "Sem dados",
};

export function Selo({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${className}`}>
      {children}
    </span>
  );
}

export function BotaoOuro({
  children,
  onClick,
  disabled,
  className = "",
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`flex items-center gap-2 rounded-md bg-gold px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition hover:brightness-105 disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

export function BotaoContorno({
  children,
  onClick,
  className = "",
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`flex items-center gap-2 rounded-md border border-primary/60 px-4 py-2 text-xs font-semibold text-primary transition hover:bg-primary/10 ${className}`}
    >
      {children}
    </button>
  );
}

export function BarraProgresso({ valor, className = "" }: { valor: number; className?: string }) {
  return (
    <div className={`h-1.5 overflow-hidden rounded-full bg-muted ${className}`}>
      <div className="h-full rounded-full bg-gold transition-all duration-500" style={{ width: `${Math.max(0, Math.min(100, valor))}%` }} />
    </div>
  );
}

/** Linha "rótulo .... valor" usada em memórias de cálculo. */
export function LinhaValor({ rotulo, valor, forte }: { rotulo: ReactNode; valor: ReactNode; forte?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-3 py-1.5 text-sm ${forte ? "font-semibold" : ""}`}>
      <span className={forte ? "" : "text-muted-foreground"}>{rotulo}</span>
      <span className="tabular-nums">{valor}</span>
    </div>
  );
}

// ---------------------------------------------------------------------
//  Padrão de botões
//  primario   -> ação principal (dourado)
//  secundario -> ação alternativa (contorno)
//  fantasma   -> ação discreta (texto)
// ---------------------------------------------------------------------
const VARIANTES = {
  primario: "bg-gold text-primary-foreground shadow-sm hover:brightness-105",
  secundario: "border border-primary/60 text-primary hover:bg-primary/10",
  fantasma: "text-muted-foreground hover:bg-muted hover:text-foreground",
};

export function Botao({
  children,
  onClick,
  variante = "secundario",
  pequeno,
  disabled,
  title,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  variante?: keyof typeof VARIANTES;
  pequeno?: boolean;
  disabled?: boolean;
  title?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-1.5 rounded-md font-semibold transition disabled:opacity-50 ${
        pequeno ? "h-8 px-3 text-[11px]" : "h-10 px-4 text-xs"
      } ${VARIANTES[variante]} ${className}`}
    >
      {children}
    </button>
  );
}

/** Botão de adicionar item: largo, tracejado, sempre no fim da lista. */
export function BotaoAdicionar({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="no-print flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border text-xs font-semibold text-muted-foreground transition hover:border-primary/60 hover:bg-primary/5 hover:text-primary"
    >
      <span className="text-base leading-none">+</span> {children}
    </button>
  );
}

/** Sub-bloco dentro de uma seção (ex.: "Imóveis", "Despesas fixas"). */
export function SubBloco({
  titulo,
  total,
  children,
  className = "",
}: {
  titulo: ReactNode;
  total?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-border bg-secondary/20 p-4 ${className}`}>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{titulo}</h3>
        {total !== undefined && <span className="text-sm font-semibold tabular-nums">{total}</span>}
      </div>
      {children}
    </div>
  );
}
