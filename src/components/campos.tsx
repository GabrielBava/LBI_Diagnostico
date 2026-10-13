// Componentes de entrada reutilizáveis. Todos recebem/retornam `Valor`.
// Padrões: campos com 40px de altura, opções curtas em "chips",
// sim/não como seletor segmentado, flags como interruptor (switch),
// percentuais e notas com régua deslizante.
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Check, Minus, Plus, type LucideIcon } from "lucide-react";
import type { CampoDef } from "@/config/campos";
import type { Cliente, Secao, Valor } from "@/types";
import { mascaraMoeda, moedaCampo, numeroDaMascara, textoParaNumero } from "@/lib/format";
import { usePreferencias } from "@/lib/preferencias";

export function Rotulo({ children }: { children: React.ReactNode }) {
  return <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{children}</span>;
}

/** Campo numérico com máscara brasileira (R$ 4.000 / 1.234,56). */
export function CampoMoeda({
  valor,
  onChange,
  placeholder = "0,00",
  ariaLabel,
  automatico,
  disabled,
}: {
  valor: Valor;
  onChange: (v: number | undefined) => void;
  placeholder?: string;
  ariaLabel?: string;
  /** Valor calculado exibido como placeholder quando o campo está em branco. */
  automatico?: number;
  disabled?: boolean;
}) {
  const numero = typeof valor === "number" ? valor : textoParaNumero(String(valor ?? ""));
  const [texto, setTexto] = useState(moedaCampo(numero));
  const [editando, setEditando] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  // O usuário digitou um ponto: aí o texto fica como está e o ponto vale como milhar
  // ("30.000") ou decimal ("1234.56"), conforme os dígitos depois dele.
  const pontoDigitado = useRef(false);
  // Posição do cursor a restaurar depois de remascarar (em nº de dígitos/vírgula à esquerda).
  const cursor = useRef<number | null>(null);
  useEffect(() => {
    if (!editando) setTexto(moedaCampo(numero));
  }, [numero, editando]);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || cursor.current === null) return;
    let pos = 0;
    for (let vistos = 0; pos < texto.length && vistos < cursor.current; pos++) if (/[\d,]/.test(texto[pos])) vistos++;
    el.setSelectionRange(pos, pos);
    cursor.current = null;
  }, [texto]);

  /** Aplica a máscara, grava o número e guarda onde o cursor deve ficar. */
  const aplicar = (bruto: string, posCursor: number) => {
    const mascarado = mascaraMoeda(bruto);
    cursor.current = bruto.slice(0, posCursor).replace(/[^\d,]/g, "").length;
    setTexto(mascarado);
    onChange(numeroDaMascara(mascarado));
  };

  return (
    <div className="inp-wrap" data-readonly={disabled ? "true" : undefined}>
      <span className="shrink-0 select-none text-xs font-medium text-muted-foreground">R$</span>
      <input
        ref={ref}
        inputMode="decimal"
        aria-label={ariaLabel}
        disabled={disabled}
        placeholder={automatico !== undefined ? `${moedaCampo(Math.round(automatico))} (auto)` : placeholder}
        className="placeholder:text-muted-foreground/50"
        value={texto}
        onFocus={() => {
          setEditando(true);
          pontoDigitado.current = false;
          // Sem centavos, o ",00" sai durante a edição: digitar no fim continua o número.
          if (numero !== undefined && Number.isInteger(numero)) setTexto(mascaraMoeda(String(numero)));
        }}
        onPaste={(e) => {
          // Colado de planilha/banco: aceita "1234.56", "1,234.56", "R$ 1.234,56".
          const colado = textoParaNumero(e.clipboardData.getData("text"));
          if (colado === undefined) return;
          e.preventDefault();
          const v = Math.round(colado * 100) / 100;
          setTexto(Number.isInteger(v) ? mascaraMoeda(String(v)) : moedaCampo(v));
          onChange(v);
        }}
        onChange={(e) => {
          const el = e.target;
          let bruto = el.value;
          if ((e.nativeEvent as InputEvent).data === "." && !pontoDigitado.current) {
            // Primeiro ponto digitado: tira os pontos de milhar automáticos para ler o número cru.
            const pos = el.selectionStart ?? bruto.length;
            bruto = `${bruto.slice(0, pos - 1).replace(/\./g, "")}.${bruto.slice(pos).replace(/\./g, "")}`;
            pontoDigitado.current = true;
          }
          if (pontoDigitado.current) {
            const limpo = bruto.replace(/[^\d,.]/g, "");
            const v = textoParaNumero(limpo);
            setTexto(limpo);
            onChange(v === undefined ? undefined : Math.round(v * 100) / 100);
            return;
          }
          aplicar(bruto, el.selectionStart ?? bruto.length);
        }}
        onBlur={() => {
          setEditando(false);
          const v = pontoDigitado.current ? textoParaNumero(texto) : numeroDaMascara(texto);
          pontoDigitado.current = false;
          setTexto(moedaCampo(v === undefined ? undefined : Math.round(v * 100) / 100));
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
  min,
  max,
}: {
  valor: Valor;
  onChange: (v: number | undefined) => void;
  sufixo?: string;
  placeholder?: string;
  ariaLabel?: string;
  min?: number;
  max?: number;
}) {
  const v = valor === undefined || valor === null || valor === "" ? "" : String(valor);
  return (
    <div className="inp-wrap">
      <input
        type="number"
        step="any"
        min={min}
        max={max}
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

/** Opções curtas como botões; clicar de novo na opção marcada limpa a escolha (exceto se `obrigatorio`). */
export function Chips({
  opcoes,
  valor,
  onChange,
  ariaLabel,
  obrigatorio = false,
}: {
  opcoes: string[];
  valor: Valor;
  onChange: (v: string | undefined) => void;
  ariaLabel?: string;
  obrigatorio?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="flex flex-wrap gap-1.5">
      {opcoes.map((o) => {
        const ativo = valor === o;
        return (
          <button
            key={o}
            type="button"
            role="radio"
            aria-checked={ativo}
            onClick={() => (ativo ? !obrigatorio && onChange(undefined) : onChange(o))}
            className={`h-9 rounded-full border px-3.5 text-xs font-medium transition ${
              ativo
                ? "border-transparent bg-gold text-primary-foreground shadow-sm"
                : "border-border bg-input text-muted-foreground hover:border-primary/50 hover:text-foreground"
            }`}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

/** Interruptor liga/desliga com o rótulo ao lado (para flags como "Quitado"). */
export function Interruptor({ label, valor, onChange }: { label: string; valor: Valor; onChange: (v: boolean) => void }) {
  const ligado = valor === true || valor === "Sim";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligado}
      onClick={() => onChange(!ligado)}
      className={`flex h-10 w-full items-center justify-between gap-2 rounded-md border px-2.5 text-left text-[13px] transition ${
        ligado ? "border-primary/50 bg-primary/10" : "border-border bg-input"
      }`}
    >
      <span className={`min-w-0 leading-tight ${ligado ? "font-medium" : "text-muted-foreground"}`}>{label}</span>
      {/* Desligado: trilho com borda para aparecer também no tema claro. */}
      <span
        className={`relative h-5 w-9 shrink-0 rounded-full border transition ${
          ligado ? "border-transparent bg-gold" : "border-muted-foreground/45 bg-muted"
        }`}
      >
        <span
          className={`absolute top-px h-4 w-4 rounded-full bg-white shadow ring-1 ring-black/10 transition-all ${ligado ? "left-[17px]" : "left-px"}`}
        />
      </span>
    </button>
  );
}

/** Régua deslizante com valor em destaque (percentuais e notas). */
export function Regua({
  valor,
  onChange,
  min = 0,
  max = 100,
  passo = 1,
  sufixo = "",
  ariaLabel,
  sugestao,
}: {
  valor: Valor;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  passo?: number;
  sufixo?: string;
  ariaLabel?: string;
  sugestao?: number;
}) {
  const definido = valor !== undefined && valor !== null && valor !== "";
  const v = definido ? Number(valor) : min;
  const pct = ((v - min) / (max - min)) * 100;
  return (
    <div className="flex h-10 items-center gap-3">
      <input
        type="range"
        min={min}
        max={max}
        step={passo}
        value={v}
        aria-label={ariaLabel}
        onChange={(e) => onChange(Number(e.target.value))}
        className="regua w-full"
        style={{ ["--pct" as string]: `${definido ? pct : 0}%` }}
      />
      <span className={`w-12 shrink-0 text-right text-sm font-semibold tabular-nums ${definido ? "" : "text-muted-foreground/50"}`}>
        {definido ? `${v}${sufixo}` : "—"}
      </span>
      {sugestao !== undefined && (
        <button
          type="button"
          title="Usar a sugestão calculada pelo sistema"
          onClick={() => onChange(sugestao)}
          className="no-print shrink-0 rounded-full border border-dashed border-primary/50 px-2 py-0.5 text-[10px] text-primary hover:bg-primary/10"
        >
          sug. {sugestao}
          {sufixo}
        </button>
      )}
    </div>
  );
}

/** Escala de 0 a 10 com um botão por nota: um clique escolhe direto. */
export function Escala({
  valor,
  onChange,
  min = 0,
  max = 10,
  rotulos,
  ariaLabel,
}: {
  valor: Valor;
  onChange: (v: number | undefined) => void;
  min?: number;
  max?: number;
  rotulos?: [string, string];
  ariaLabel?: string;
}) {
  const atual = valor === undefined || valor === null || valor === "" ? undefined : Number(valor);
  const notas = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  return (
    <div>
      <div role="radiogroup" aria-label={ariaLabel} className="grid grid-cols-6 gap-1.5 sm:max-w-[520px] sm:grid-cols-11">
        {notas.map((nota) => {
          const ativo = atual === nota;
          return (
            <button
              key={nota}
              type="button"
              role="radio"
              aria-checked={ativo}
              aria-label={String(nota)}
              onClick={() => onChange(ativo ? undefined : nota)}
              className={`h-10 min-w-0 rounded-md border text-sm font-semibold tabular-nums transition ${
                ativo
                  ? "border-transparent bg-gold text-primary-foreground shadow-sm"
                  : "border-border bg-input text-muted-foreground hover:border-primary/50 hover:text-foreground"
              }`}
            >
              {nota}
            </button>
          );
        })}
      </div>
      {rotulos && (
        // No celular os botões ocupam duas linhas: as pontas levam o número para não parecerem desalinhadas.
        <div className="mt-1 flex justify-between gap-3 text-[10px] uppercase tracking-wider text-muted-foreground sm:max-w-[520px]">
          <span>
            <span className="sm:hidden">{min} = </span>
            {rotulos[0]}
          </span>
          <span className="text-right">
            <span className="sm:hidden">{max} = </span>
            {rotulos[1]}
          </span>
        </div>
      )}
    </div>
  );
}

/** Opções com ícone (ex.: categorias de objetivo). */
export function Icones({
  opcoes,
  icones,
  valor,
  onChange,
  ariaLabel,
}: {
  opcoes: string[];
  icones: Record<string, LucideIcon>;
  valor: Valor;
  onChange: (v: string | undefined) => void;
  ariaLabel?: string;
}) {
  return (
    // Telas bem estreitas (< 400px): 2 colunas com ícone ao lado do nome, para não partir palavras.
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="grid grid-cols-2 gap-2 min-[400px]:grid-cols-3 sm:grid-cols-5 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-10"
    >
      {opcoes.map((o) => {
        const ativo = valor === o;
        const Icone = icones[o];
        return (
          <button
            key={o}
            type="button"
            role="radio"
            aria-checked={ativo}
            onClick={() => onChange(ativo ? undefined : o)}
            className={`flex h-11 items-center gap-1.5 rounded-lg border px-2 text-[11px] font-medium transition min-[400px]:h-[68px] min-[400px]:flex-col min-[400px]:justify-center min-[400px]:gap-1.5 min-[400px]:px-1 ${
              ativo
                ? "border-transparent bg-gold text-primary-foreground shadow-sm"
                : "border-border bg-input text-muted-foreground hover:border-primary/50 hover:text-foreground"
            }`}
          >
            {Icone && <Icone className="h-4 w-4 shrink-0 min-[400px]:h-5 min-[400px]:w-5" />}
            <span className="w-full min-w-0 hyphens-auto break-words text-left leading-tight min-[400px]:text-center">{o}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Várias opções marcáveis ao mesmo tempo (grava uma lista). */
export function MultiChips({
  opcoes,
  valor,
  onChange,
  ariaLabel,
}: {
  opcoes: string[];
  valor: Valor;
  onChange: (v: string[]) => void;
  ariaLabel?: string;
}) {
  const marcados = Array.isArray(valor) ? valor : [];
  const alternar = (o: string) => {
    // "Nenhum" é exclusivo: marcá-lo limpa os demais e vice-versa.
    if (o === "Nenhum") return onChange(marcados.includes(o) ? [] : [o]);
    const sem = marcados.filter((x) => x !== "Nenhum");
    onChange(sem.includes(o) ? sem.filter((x) => x !== o) : [...sem, o]);
  };
  return (
    <div role="group" aria-label={ariaLabel} className="flex flex-wrap gap-1.5">
      {opcoes.map((o) => {
        const ativo = marcados.includes(o);
        return (
          <button
            key={o}
            type="button"
            role="checkbox"
            aria-checked={ativo}
            onClick={() => alternar(o)}
            className={`flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs font-medium transition ${
              ativo
                ? "border-primary/60 bg-primary/15 text-foreground"
                : "border-border bg-input text-muted-foreground hover:border-primary/50 hover:text-foreground"
            }`}
          >
            <span className={`flex h-3.5 w-3.5 items-center justify-center rounded-sm border ${ativo ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/50"}`}>
              {ativo && <Check className="h-2.5 w-2.5" strokeWidth={4} />}
            </span>
            {o}
          </button>
        );
      })}
    </div>
  );
}

export function Contador({
  valor,
  onChange,
  min = 0,
  max = 99,
}: {
  valor: Valor;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  const v = Number(valor ?? min) || min;
  const botao = "flex h-10 w-10 items-center justify-center rounded-md border border-border bg-input text-muted-foreground hover:border-primary/50 hover:text-foreground disabled:opacity-40";
  return (
    <div className="flex items-center gap-2">
      <button type="button" aria-label="Diminuir" className={botao} disabled={v <= min} onClick={() => onChange(Math.max(min, v - 1))}>
        <Minus className="h-4 w-4" />
      </button>
      <span className="w-10 text-center text-lg font-semibold tabular-nums">{v}</span>
      <button type="button" aria-label="Aumentar" className={botao} disabled={v >= max} onClick={() => onChange(Math.min(max, v + 1))}>
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

/** Renderiza o controle certo de acordo com o tipo do campo. */
export function Controle({
  campo,
  valor,
  onChange,
  automatico,
  sugestao,
}: {
  campo: CampoDef;
  valor: Valor;
  onChange: (v: Valor) => void;
  automatico?: number;
  sugestao?: number;
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
          min={campo.min}
          max={campo.max}
          ariaLabel={campo.label}
          placeholder={automatico !== undefined ? `${automatico} (auto)` : campo.placeholder}
        />
      );
    case "chips":
      return <Chips opcoes={campo.opcoes ?? []} valor={valor} onChange={onChange} ariaLabel={campo.label} obrigatorio={campo.obrigatorio} />;
    case "simnao":
      return <Chips opcoes={["Sim", "Não"]} valor={valor} onChange={onChange} ariaLabel={campo.label} />;
    case "multichips":
      return <MultiChips opcoes={campo.opcoes ?? []} valor={valor} onChange={onChange} ariaLabel={campo.label} />;
    case "icones":
      return <Icones opcoes={campo.opcoes ?? []} icones={campo.icones ?? {}} valor={valor} onChange={onChange} ariaLabel={campo.label} />;
    case "escala":
      return <Escala valor={valor} onChange={onChange} min={campo.min} max={campo.max} rotulos={campo.rotulosEscala} ariaLabel={campo.label} />;
    case "switch":
      return <Interruptor label={campo.label} valor={valor} onChange={onChange} />;
    case "slider":
      return (
        <Regua
          valor={valor}
          onChange={onChange}
          min={campo.min}
          max={campo.max}
          passo={campo.passo}
          sufixo={campo.sufixo}
          ariaLabel={campo.label}
          sugestao={sugestao}
        />
      );
    case "contador":
      return <Contador valor={valor} onChange={onChange} min={campo.min} max={campo.max} />;
    case "select": {
      const opcoes = campo.opcoes ?? [];
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

/** Largura dos campos por nº de colunas da grade (4 colunas só a partir de xl: com o menu lateral, lg é estreito). */
const SPAN: Record<number, Record<number, string>> = {
  2: { 1: "", 2: "sm:col-span-2" },
  3: { 1: "", 2: "sm:col-span-2", 3: "sm:col-span-2 lg:col-span-3" },
  4: { 1: "", 2: "sm:col-span-2", 3: "sm:col-span-2 xl:col-span-3", 4: "sm:col-span-2 xl:col-span-4" },
};

/**
 * Formulário gerado a partir de uma lista de CampoDef (src/config/campos.ts).
 * Respeita `mostrarSe` (campos condicionais) e `somenteConsultor`.
 */
export function Formulario({
  campos,
  dados,
  onChange,
  cliente,
  colunas = 4,
  automaticos = {},
  sugestoes = {},
}: {
  campos: CampoDef[];
  dados: Secao;
  onChange: (key: string, v: Valor) => void;
  cliente: Cliente;
  colunas?: 2 | 3 | 4;
  automaticos?: Record<string, number | undefined>;
  sugestoes?: Record<string, number | undefined>;
}) {
  const { apresentacao } = usePreferencias();
  const grid = colunas === 2 ? "sm:grid-cols-2" : colunas === 3 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2 xl:grid-cols-4";
  const visiveis = campos.filter((c) => (!c.mostrarSe || c.mostrarSe(dados, cliente)) && !(apresentacao && c.somenteConsultor));
  return (
    <div className={`grid grid-cols-1 gap-x-4 gap-y-4 ${grid}`}>
      {visiveis.map((original) => {
        const c = original.opcoesSe ? { ...original, opcoes: original.opcoesSe(dados, cliente) } : original;
        const inicio = c.novaLinha ? "sm:col-start-1" : c.meioLinha ? (colunas === 4 ? "sm:col-start-1 xl:col-start-3" : "sm:col-start-1") : "";
        const span = `${SPAN[colunas][Math.min(c.largura ?? 1, colunas)]} ${inicio}`;
        if (c.tipo === "switch")
          return (
            <div key={c.key} className={`aparecer ${span}`}>
              {/* Espaço do rótulo: alinha o interruptor com a caixa dos campos vizinhos. */}
              <span aria-hidden="true" className="mb-1.5 hidden text-[11px] sm:block">
                &nbsp;
              </span>
              <Controle campo={c} valor={dados[c.key]} onChange={(v) => onChange(c.key, v)} />
            </div>
          );
        return (
          <div key={c.key} className={`aparecer ${span}`}>
            <Rotulo>{c.label}</Rotulo>
            <Controle
              campo={c}
              valor={dados[c.key]}
              onChange={(v) => onChange(c.key, v)}
              automatico={automaticos[c.key]}
              sugestao={sugestoes[c.key]}
            />
            {c.ajuda && <span className="mt-1 block text-[11px] leading-snug text-muted-foreground/80">{c.ajuda}</span>}
          </div>
        );
      })}
    </div>
  );
}
