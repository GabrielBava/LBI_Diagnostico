// 5 · Despesas — blocos (Casa, Mercado, Transporte...) com subcategorias.
// Cada bloco é um cartão recolhível; os grupos e itens vêm de src/config/despesas.ts.
// Subtotais e totais saem de despesas(c) para bater com os cálculos do diagnóstico.
import { useState, type ReactNode } from "react";
import { ChevronDown, Lock, Plus, Trash2 } from "lucide-react";
import { GRUPOS_DESPESA, chaveDespesa, type GrupoDespesa } from "@/config/despesas";
import { CampoMoeda } from "@/components/campos";
import { Botao, SubBloco } from "@/components/ui";
import { useCliente } from "@/lib/cliente-context";
import { custoDependente, despesas, dividas, fluxo, n, s } from "@/lib/calculos";
import { fmtBRL, fmtPct, uid } from "@/lib/format";
import type { Item } from "@/types";

type Bloco = "Fixa" | "Variável";

/** Linha "rótulo | valor" das subcategorias (cabe em 390px). */
function Linha({ rotulo, dica, children }: { rotulo: ReactNode; dica?: ReactNode; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(104px,42%)] items-center gap-3 py-1.5 sm:grid-cols-[minmax(0,1fr)_160px]">
      <div className="min-w-0">
        <div className="text-sm leading-tight [overflow-wrap:anywhere]">{rotulo}</div>
        {dica && <div className="truncate text-[11px] text-muted-foreground">{dica}</div>}
      </div>
      {children}
    </div>
  );
}

/** Valor calculado em outra seção (não se digita). */
function ValorTravado({ valor }: { valor: number }) {
  return (
    <div className="inp-wrap justify-end text-sm font-medium tabular-nums" data-readonly="true">
      <Lock className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden="true" /> {fmtBRL(valor)}
    </div>
  );
}

/** Atalho para a seção de origem de um valor automático. */
function LinkSecao({ id, children }: { id: string; children: ReactNode }) {
  const { irPara } = useCliente();
  return (
    <button type="button" onClick={() => irPara(id)} className="font-medium text-primary underline-offset-2 hover:underline">
      {children}
    </button>
  );
}

export default function Despesas() {
  const { cliente, atualizar, setLista } = useCliente();
  const d = despesas(cliente);
  const f = fluxo(cliente);
  const dv = dividas(cliente);

  const valorGrupo = (id: string) => d.porCategoria.find((x) => x.id === id)?.valor ?? 0;
  const extrasDo = (id: string) => cliente.despesasExtras.filter((e) => s(e.grupo) === id);
  /** O grupo está sendo preenchido por outra seção? */
  const ehAutomatico = (g: GrupoDespesa) => g.automatico === "dependentes" || (g.automatico === "dividas" && dv.parcelas > 0);

  // Abertos por padrão: grupos que já têm valor (ou itens extras).
  const [abertos, setAbertos] = useState<Set<string>>(
    () => new Set(GRUPOS_DESPESA.filter((g) => valorGrupo(g.id) > 0 || extrasDo(g.id).length > 0).map((g) => g.id)),
  );
  const [novoId, setNovoId] = useState<string | null>(null);
  const todosAbertos = abertos.size >= GRUPOS_DESPESA.length;

  const alternar = (id: string) =>
    setAbertos((atual) => {
      const prox = new Set(atual);
      if (prox.has(id)) prox.delete(id);
      else prox.add(id);
      return prox;
    });
  const alternarTodos = () => setAbertos(todosAbertos ? new Set() : new Set(GRUPOS_DESPESA.map((g) => g.id)));

  const definir = (chave: string, v: number | undefined) =>
    atualizar((c) => ({ ...c, despesas: { ...c.despesas, [chave]: v } }));
  const editarExtra = (id: string, campos: Partial<Item>) =>
    atualizar((c) => ({
      ...c,
      despesasExtras: c.despesasExtras.map((e) => (e.id === id ? ({ ...e, ...campos } as Item) : e)),
    }));
  const removerExtra = (id: string) => setLista("despesasExtras", cliente.despesasExtras.filter((e) => e.id !== id));
  const adicionarExtra = (grupo: string) => {
    const id = uid();
    setLista("despesasExtras", [...cliente.despesasExtras, { id, grupo, descricao: "", valor: undefined }]);
    setNovoId(id);
  };

  const pctRenda = (v: number) => (f.renda > 0 ? `${fmtPct(v / f.renda)} da renda` : null);

  // ------------------------------------------------------------------
  //  Conteúdo de cada grupo
  // ------------------------------------------------------------------
  const conteudoDividas = (g: GrupoDespesa) => {
    if (dv.parcelas <= 0) return conteudoManual(g);
    const linhas = [
      { rotulo: "Financiamentos", valor: dv.parcelasFin },
      { rotulo: "Consórcios", valor: dv.parcelasCons },
      { rotulo: "Empréstimos", valor: dv.parcelasEmp },
    ].filter((x) => x.valor > 0);
    return (
      <>
        <div className="divide-y divide-border/60">
          {linhas.map((x) => (
            <Linha key={x.rotulo} rotulo={x.rotulo}>
              <ValorTravado valor={x.valor} />
            </Linha>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Calculado em <LinkSecao id="dividas">8 · Financiamentos e dívidas</LinkSecao> e{" "}
          <LinkSecao id="patrimonio">7 · Patrimônio</LinkSecao>
        </p>
      </>
    );
  };

  const conteudoDependentes = () => {
    if (cliente.dependentes.length === 0)
      return (
        <p className="py-2 text-xs text-muted-foreground">
          Nenhum dependente em <LinkSecao id="sucessao">4 · Sucessão</LinkSecao>
        </p>
      );
    return (
      <>
        <div className="divide-y divide-border/60">
          {cliente.dependentes.map((dep, i) => (
            <Linha
              key={dep.id}
              rotulo={
                s(dep.nome) ||
                // Mesmo nome dos cartões de Sucessão: "Filho(a) 1", "Pai / Mãe 2"...
                `${s(dep.categoria) || "Dependente"} ${
                  cliente.dependentes.slice(0, i + 1).filter((x) => s(x.categoria) === s(dep.categoria)).length
                }`
              }
              dica={s(dep.nome) ? s(dep.categoria) : undefined}
            >
              <ValorTravado valor={custoDependente(dep)} />
            </Linha>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Calculado em <LinkSecao id="sucessao">4 · Sucessão</LinkSecao>
        </p>
      </>
    );
  };

  const conteudoManual = (g: GrupoDespesa) => {
    const extras = g.automatico ? [] : extrasDo(g.id);
    return (
      <>
        {(g.itens.length > 0 || extras.length > 0) && (
          <div className="divide-y divide-border/60">
            {g.itens.map((it) => {
              const chave = chaveDespesa(g.id, it.id);
              return (
                <Linha key={chave} rotulo={it.label} dica={it.dica}>
                  <CampoMoeda valor={cliente.despesas[chave]} onChange={(v) => definir(chave, v)} ariaLabel={`${g.label}: ${it.label}`} />
                </Linha>
              );
            })}
            {extras.map((e) => (
              <div key={e.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 py-1.5 sm:grid-cols-[minmax(0,1fr)_160px_auto]">
                <input
                  className="inp col-span-2 min-w-0 sm:col-span-1"
                  value={s(e.descricao)}
                  placeholder="Descrição"
                  aria-label={`Descrição do item extra em ${g.label}`}
                  autoFocus={e.id === novoId}
                  onBlur={() => setNovoId(null)}
                  onChange={(ev) => editarExtra(e.id, { descricao: ev.target.value })}
                />
                <CampoMoeda
                  valor={e.valor}
                  onChange={(v) => editarExtra(e.id, { valor: v })}
                  ariaLabel={`${g.label}: ${s(e.descricao) || "item extra"}`}
                />
                <button
                  type="button"
                  aria-label={`Remover ${s(e.descricao) || "item extra"} de ${g.label}`}
                  title="Remover item"
                  onClick={() => removerExtra(e.id)}
                  className="no-print rounded-md p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        )}
        {!g.automatico && (
          <Botao variante="fantasma" pequeno onClick={() => adicionarExtra(g.id)} className="no-print -ml-2 mt-1">
            <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Adicionar item em {g.label}
          </Botao>
        )}
      </>
    );
  };

  /** Texto do cabeçalho: "3 de 8 preenchidos" ou "automático". */
  const resumoGrupo = (g: GrupoDespesa) => {
    if (ehAutomatico(g)) return "automático";
    const extras = g.automatico ? [] : extrasDo(g.id);
    const total = g.itens.length + extras.length;
    if (total === 0) return "Nenhum item";
    const preenchidos =
      g.itens.filter((it) => n(cliente.despesas[chaveDespesa(g.id, it.id)]) > 0).length + extras.filter((e) => n(e.valor) > 0).length;
    return `${preenchidos} de ${total} ${total === 1 ? "preenchido" : "preenchidos"}`;
  };

  // ------------------------------------------------------------------
  //  Cartão recolhível de um grupo
  // ------------------------------------------------------------------
  const cartaoGrupo = (g: GrupoDespesa) => {
    const aberto = abertos.has(g.id);
    const valor = valorGrupo(g.id);
    const Icone = g.icone;
    const idConteudo = `despesa-grupo-${g.id}`;
    return (
      <div key={g.id} className="print-avoid min-w-0 rounded-lg border border-border bg-card">
        <button
          type="button"
          aria-expanded={aberto}
          aria-controls={idConteudo}
          onClick={() => alternar(g.id)}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-muted/40"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Icone className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold leading-tight [overflow-wrap:anywhere]">{g.label}</span>
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              {ehAutomatico(g) && <Lock className="h-2.5 w-2.5" aria-hidden="true" />}
              {resumoGrupo(g)}
            </span>
          </span>
          <span className={`shrink-0 text-sm tabular-nums ${valor > 0 ? "font-semibold" : "text-muted-foreground"}`}>
            {fmtBRL(valor)}
          </span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${aberto ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>
        {aberto && (
          <div id={idConteudo} className="border-t border-border px-3 pb-3 pt-1">
            {g.automatico === "dividas"
              ? conteudoDividas(g)
              : g.automatico === "dependentes"
                ? conteudoDependentes()
                : conteudoManual(g)}
          </div>
        )}
      </div>
    );
  };

  const parte = (bloco: Bloco) => {
    const total = bloco === "Fixa" ? d.fixas : d.variaveis;
    const pct = pctRenda(total);
    return (
      <SubBloco
        titulo={bloco === "Fixa" ? "Despesas fixas" : "Despesas variáveis"}
        total={
          <span>
            {fmtBRL(total)}
            {pct && <span className="ml-1 text-xs font-normal text-muted-foreground">({pct})</span>}
          </span>
        }
      >
        <div className="grid items-start gap-3 lg:grid-cols-2">{GRUPOS_DESPESA.filter((g) => g.bloco === bloco).map(cartaoGrupo)}</div>
      </SubBloco>
    );
  };

  const pctTotal = pctRenda(d.total);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">Valores mensais. Gastos anuais: divida por 12.</p>
        <Botao variante="fantasma" pequeno onClick={alternarTodos} className="no-print">
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${todosAbertos ? "rotate-180" : ""}`} aria-hidden="true" />
          {todosAbertos ? "Fechar todos" : "Abrir todos"}
        </Botao>
      </div>
      {parte("Fixa")}
      {parte("Variável")}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-secondary/30 px-4 py-3">
        <span className="text-sm text-muted-foreground">Total de despesas mensais</span>
        <span className="text-lg font-semibold tabular-nums">
          {fmtBRL(d.total)}
          {pctTotal && <span className="ml-2 text-xs font-normal text-muted-foreground">{pctTotal}</span>}
        </span>
      </div>
    </div>
  );
}
