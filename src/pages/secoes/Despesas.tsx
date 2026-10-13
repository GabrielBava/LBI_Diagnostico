// 5 · Despesas — blocos (Casa, Mercado, Transporte...) com subcategorias.
// Cada bloco é um cartão recolhível; os grupos e itens vêm de src/config/despesas.ts.
// Subtotais e totais saem de despesas(c) para bater com os cálculos do diagnóstico.
// As parcelas (8 · Financiamento e crédito) não são lançadas aqui; entram no total do diagnóstico.
// Sem totais na tela de coleta: os valores aparecem no pré-diagnóstico.
import { useState, type ReactNode } from "react";
import { ChevronDown, Lock, Plus, Trash2 } from "lucide-react";
import { GRUPOS_DESPESA, chaveDespesa, type GrupoDespesa } from "@/config/despesas";
import { CampoMoeda } from "@/components/campos";
import { Botao, SubBloco } from "@/components/ui";
import { useCliente } from "@/lib/cliente-context";
import { custoDependente, despesas, n, rotuloDependente, s, type LinhaAutomatica } from "@/lib/calculos";
import { moedaCampo, uid } from "@/lib/format";
import type { Item } from "@/types";

type Bloco = "Fixa" | "Variável";

/** Linha "rótulo | valor" das subcategorias (cabe em 390px). */
function Linha({ rotulo, dica, children }: { rotulo: ReactNode; dica?: ReactNode; children: ReactNode }) {
  return (
    // O valor encolhe em blocos estreitos (2 colunas em lg) para o rótulo não partir palavras.
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(104px,42%)] items-center gap-3 py-1.5 sm:grid-cols-[minmax(0,1fr)_min(160px,42%)]">
      <div className="min-w-0">
        <div className="hyphens-auto break-words text-sm leading-tight">{rotulo}</div>
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
      <Lock className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden="true" /> R$ {moedaCampo(valor)}
    </div>
  );
}

/** Blocos que aparecem na tela (as parcelas são lançadas em 8 · Financiamento e crédito). */
const GRUPOS_NA_TELA = GRUPOS_DESPESA.filter((g) => !g.foraDaTela);

/** Nome da seção de origem das linhas automáticas. */
const NOME_SECAO: Record<string, string> = { patrimonio: "7 · Patrimônio", renda: "6 · Renda" };

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

  const valorGrupo = (id: string) => d.porCategoria.find((x) => x.id === id)?.valor ?? 0;
  const extrasDo = (id: string) => cliente.despesasExtras.filter((e) => s(e.grupo) === id);
  const autoDo = (id: string): LinhaAutomatica[] => d.linhasAutomaticas[id] ?? [];
  /** O grupo inteiro é preenchido por outra seção? */
  const ehAutomatico = (g: GrupoDespesa) => g.automatico === "dependentes";

  // Abertos por padrão: grupos que já têm valor (ou itens extras).
  const [abertos, setAbertos] = useState<Set<string>>(
    () => new Set(GRUPOS_NA_TELA.filter((g) => valorGrupo(g.id) > 0 || extrasDo(g.id).length > 0).map((g) => g.id)),
  );
  const [novoId, setNovoId] = useState<string | null>(null);
  const todosAbertos = abertos.size >= GRUPOS_NA_TELA.length;

  const alternar = (id: string) =>
    setAbertos((atual) => {
      const prox = new Set(atual);
      if (prox.has(id)) prox.delete(id);
      else prox.add(id);
      return prox;
    });
  const alternarTodos = () => setAbertos(todosAbertos ? new Set() : new Set(GRUPOS_NA_TELA.map((g) => g.id)));

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


  // ------------------------------------------------------------------
  //  Conteúdo de cada grupo
  // ------------------------------------------------------------------
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
          {cliente.dependentes.map((dep) => (
            <Linha
              key={dep.id}
              // Mesmo nome dos cartões de Sucessão: "Filho(a) 1", "Pai / Mãe 2"...
              rotulo={rotuloDependente(cliente.dependentes, dep)}
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
    const auto = autoDo(g.id);
    return (
      <>
        {(g.itens.length > 0 || extras.length > 0 || auto.length > 0) && (
          <div className="divide-y divide-border/60">
            {g.itens.map((it) => {
              const chave = chaveDespesa(g.id, it.id);
              return (
                <Linha key={chave} rotulo={it.label} dica={it.dica}>
                  <CampoMoeda valor={cliente.despesas[chave]} onChange={(v) => definir(chave, v)} ariaLabel={`${g.label}: ${it.label}`} />
                </Linha>
              );
            })}
            {auto.map((x) => (
              <Linha
                key={x.id}
                rotulo={x.label}
                dica={
                  <>
                    Informado em <LinkSecao id={x.secao}>{NOME_SECAO[x.secao] ?? x.secao}</LinkSecao>
                  </>
                }
              >
                <ValorTravado valor={x.valor} />
              </Linha>
            ))}
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
    if (ehAutomatico(g)) return "Automático";
    const extras = g.automatico ? [] : extrasDo(g.id);
    const auto = autoDo(g.id);
    const total = g.itens.length + extras.length + auto.length;
    if (total === 0) return "Nenhum item";
    const preenchidos =
      g.itens.filter((it) => n(cliente.despesas[chaveDespesa(g.id, it.id)]) > 0).length +
      extras.filter((e) => n(e.valor) > 0).length +
      auto.length;
    return `${preenchidos} de ${total} ${total === 1 ? "preenchido" : "preenchidos"}`;
  };

  // ------------------------------------------------------------------
  //  Cartão recolhível de um grupo
  // ------------------------------------------------------------------
  const cartaoGrupo = (g: GrupoDespesa) => {
    const aberto = abertos.has(g.id);
    const Icone = g.icone;
    const idConteudo = `despesa-grupo-${g.id}`;
    return (
      <div key={g.id} className="print-avoid min-w-0 rounded-lg border border-border bg-card">
        <button
          type="button"
          aria-expanded={aberto}
          aria-controls={idConteudo}
          onClick={() => alternar(g.id)}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-2.5 text-left transition hover:bg-muted/40 sm:gap-3 sm:px-3"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary sm:h-8 sm:w-8">
            <Icone className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block hyphens-auto break-words text-sm font-semibold leading-tight">{g.label}</span>
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              {ehAutomatico(g) && <Lock className="h-2.5 w-2.5" aria-hidden="true" />}
              {resumoGrupo(g)}
            </span>
          </span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${aberto ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>
        {aberto && (
          <div id={idConteudo} className="border-t border-border px-3 pb-3 pt-1">
            {g.automatico === "dependentes" ? conteudoDependentes() : conteudoManual(g)}
          </div>
        )}
      </div>
    );
  };

  const parte = (bloco: Bloco) => (
    <SubBloco titulo={bloco === "Fixa" ? "Despesas fixas" : "Despesas variáveis"}>
      <div className="grid items-start gap-3 lg:grid-cols-2">{GRUPOS_NA_TELA.filter((g) => g.bloco === bloco).map(cartaoGrupo)}</div>
    </SubBloco>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">Valores mensais.</p>
        <Botao variante="fantasma" pequeno onClick={alternarTodos} className="no-print">
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${todosAbertos ? "rotate-180" : ""}`} aria-hidden="true" />
          {todosAbertos ? "Fechar todos" : "Abrir todos"}
        </Botao>
      </div>
      {parte("Fixa")}
      {parte("Variável")}
    </div>
  );
}
