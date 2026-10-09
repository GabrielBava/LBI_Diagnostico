// Componentes de entrada reutilizáveis. Todos recebem/retornam `Valor`.
import { useEffect, useState } from "react";
import type { CampoDef } from "@/config/campos";
import type { Secao, Valor } from "@/types";
import { moedaParaTexto, textoParaNumero } from "@/lib/format";

const rotulo = "block text-[10px] uppercase tracking-widest text-muted-foreground";

export function Rotulo({ children, compacto }: { children: React.ReactNode; compacto?: boolean }) {
  return <span className={compacto ? "block text-[9px] uppercase tracking-widest text-muted-foreground" : rotulo}>{children}</span>;
}

/** Campo numérico com máscara brasileira (R$ 4.000 / 1.234,56). */
export function CampoMoeda({
  valor,
  onChange,
  placeholder = "0,00",
  ariaLabel,
  automatico,
}: {
  valor: Valor;
  onChange: (v: number | undefined) => void;
  placeholder?: string;
  ariaLabel?: string;
  /** Valor calculado exibido como placeholder quando o campo está em branco. */
  automatico?: number;
}) {
  const numero = typeof valor === "number" ? valor : textoParaNumero(String(valor ?? ""));
  const [texto, setTexto] = useState(moedaParaTexto(numero));
  const [editando, setEditando] = useState(false);
  useEffect(() => {
    if (!editando) setTexto(moedaParaTexto(numero));
  }, [numero, editando]);

  return (
    <div className="inp-wrap">
      <span className="shrink-0 select-none text-xs font-medium text-muted-foreground">R$</span>
      <input
        inputMode="decimal"
        aria-label={ariaLabel}
        placeholder={automatico !== undefined ? `${moedaParaTexto(Math.round(automatico))} (auto)` : placeholder}
        className="placeholder:text-muted-foreground/50"
        value={texto}
        onFocus={() => setEditando(true)}
        onChange={(e) => {
          setTexto(e.target.value);
          onChange(textoParaNumero(e.target.value));
        }}
        onBlur={() => {
          setEditando(false);
          setTexto(moedaParaTexto(textoParaNumero(texto)));
        }}
      />
    </div>
  );
}

export function CampoNumero({
  valor,
  onChange,
  sufixo,
  placeholder,
  ariaLabel,
}: {
  valor: Valor;
  onChange: (v: number | undefined) => void;
  sufixo?: string;
  placeholder?: string;
  ariaLabel?: string;
}) {
  const v = valor === undefined || valor === null || valor === "" ? "" : String(valor);
  return (
    <div className="inp-wrap">
      <input
        type="number"
        step="any"
        aria-label={ariaLabel}
        placeholder={placeholder}
        className="placeholder:text-muted-foreground/50"
        value={v}
        onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
      />
      {sufixo && <span className="shrink-0 text-xs text-muted-foreground">{sufixo}</span>}
    </div>
  );
}

/** Renderiza o controle certo de acordo com o tipo do campo. */
export function Controle({
  campo,
  valor,
  onChange,
  automatico,
}: {
  campo: CampoDef;
  valor: Valor;
  onChange: (v: Valor) => void;
  automatico?: number;
}) {
  switch (campo.tipo) {
    case "moeda":
      return <CampoMoeda valor={valor} onChange={onChange} ariaLabel={campo.label} automatico={automatico} />;
    case "percentual":
      return <CampoNumero valor={valor} onChange={onChange} sufixo="%" ariaLabel={campo.label} />;
    case "numero":
      return (
        <CampoNumero
          valor={valor}
          onChange={onChange}
          sufixo={campo.sufixo}
          ariaLabel={campo.label}
          placeholder={automatico !== undefined ? `${automatico} (auto)` : campo.placeholder}
        />
      );
    case "select":
    case "simnao": {
      const opcoes = campo.tipo === "simnao" ? ["Sim", "Não"] : campo.opcoes ?? [];
      const atual = valor === undefined || valor === null ? "" : String(valor);
      return (
        <select className="inp" value={atual} aria-label={campo.label} onChange={(e) => onChange(e.target.value || undefined)}>
          <option value="">Selecione…</option>
          {opcoes.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
          {atual && !opcoes.includes(atual) && <option value={atual}>{atual}</option>}
        </select>
      );
    }
    case "textarea":
      return (
        <textarea
          rows={3}
          className="inp"
          aria-label={campo.label}
          placeholder={campo.placeholder}
          value={String(valor ?? "")}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    default: {
      const tipoHtml = campo.tipo === "data" ? "date" : campo.tipo === "email" ? "email" : campo.tipo === "telefone" ? "tel" : "text";
      return (
        <input
          className="inp"
          type={tipoHtml}
          aria-label={campo.label}
          placeholder={campo.placeholder}
          value={String(valor ?? "")}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    }
  }
}

/** Formulário gerado a partir de uma lista de CampoDef (src/config/campos.ts). */
export function Formulario({
  campos,
  dados,
  onChange,
  colunas = 3,
  automaticos = {},
}: {
  campos: CampoDef[];
  dados: Secao;
  onChange: (key: string, v: Valor) => void;
  colunas?: 2 | 3;
  automaticos?: Record<string, number | undefined>;
}) {
  const grid = colunas === 2 ? "md:grid-cols-2" : "md:grid-cols-3";
  const span = (l?: number) => (l === 3 ? "md:col-span-3" : l === 2 ? "md:col-span-2" : "");
  return (
    <div className={`grid gap-3 ${grid}`}>
      {campos.map((c) => (
        <label key={c.key} className={`block ${span(c.largura)}`}>
          <Rotulo>{c.label}</Rotulo>
          <div className="mt-1">
            <Controle campo={c} valor={dados[c.key]} onChange={(v) => onChange(c.key, v)} automatico={automaticos[c.key]} />
          </div>
          {c.ajuda && <span className="mt-1 block text-[11px] leading-snug text-muted-foreground/80">{c.ajuda}</span>}
        </label>
      ))}
    </div>
  );
}
