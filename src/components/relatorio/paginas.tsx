// =====================================================================
//  Folhas do Diagnóstico em PDF, na ordem do modelo LIFE (44 páginas no
//  exemplo do Alberto): capa, sumário e 10 capítulos, cada um com a
//  página de abertura e as páginas de conteúdo. A lista é montada antes
//  de renderizar, para o rodapé saber o total ("N / total").
// =====================================================================

import type { ReactNode } from "react";
import { RELATORIO, preencher, type CapituloRelatorio } from "@/config/relatorio";
import { fmtBRL, fmtNum, fmtPct, plural } from "@/lib/format";
import {
  BlocoDecisorio,
  COR,
  Caixa,
  Cartoes,
  Painel,
  SERIES,
  Sumario,
  Tabela,
  Vazio,
  cabecalhoCapitulo,
  rotuloCapitulo,
  type CelulaTabela,
  type ColunaTabela,
  type DadosCartao,
} from "./base";
import { GraficoBarras, GraficoLinhas, GraficoRosca, Legenda, fmtCurto, type GrupoBarras } from "./graficos";
import { NAO_INFORMADO, pct1, type DadosRelatorio } from "./dados";
import { textoStatus } from "@/components/ui";
import type { Status } from "@/lib/diagnostico";
import { ALTURA_CABECALHO, ESPACO, LARGURA_UTIL, alturaLinha, emGrupos, linhasTexto, paginar } from "./paginar";

export type PaginaRelatorio =
  | { chave: string; tipo: "capa" }
  | { chave: string; tipo: "abertura"; capitulo: CapituloRelatorio; frase: string }
  | {
      chave: string;
      tipo: "conteudo";
      cabecalho: { esquerda: string; direita: string };
      titulo?: string;
      continuacao?: boolean;
      subtitulo?: string;
      junto?: boolean;
      corpo: ReactNode;
    };

const T = RELATORIO;
const cap = (numero: string) => T.capitulos.find((c) => c.numero === numero)!;
const corPrioridade = (p: string) => (p === "Alta" ? "vermelho forte" : p === "Média" ? "laranja forte" : "azul forte");
const NIVEL: Record<string, { texto: string; classe: string }> = {
  Alta: { texto: "CRÍTICO", classe: "rel-nivel-critico" },
  Média: { texto: "ALERTA", classe: "rel-nivel-alerta" },
  Baixa: { texto: "ATENÇÃO", classe: "rel-nivel-atencao" },
};
/** Cor e classe de cada estado dos pilares da Estrela LIFE. */
const COR_STATUS: Record<Status, string> = { ok: COR.verde, atencao: COR.laranja, critico: COR.vermelho, "sem-dados": COR.cinza };
const CLASSE_STATUS: Record<Status, string> = { ok: "verde", atencao: "laranja", critico: "vermelho", "sem-dados": "" };
/** Percentual da meta com uma casa quando fica abaixo de 10% (0,5% e não "1%"). */
const pctMeta = (v: number) => (v < 0.1 ? fmtPct(v, 1) : fmtPct(v));
/** Espaço de um bloco decisório (título + cartões + respiro). */
const ALTURA_BLOCO = 150;
/** Bloco compacto: cresce com o texto mais longo dos três cartões (cartão ≈ 205 pt, fonte 9,5 pt em negrito). */
const alturaBlocoCompacto = (b: { objetivo: string; realidade: string; ajuste: string }) =>
  38 + Math.max(78, 26 + 13 * Math.max(...[b.objetivo, b.realidade, b.ajuste].map((t) => linhasTexto(t, 205, 10.3))));

export function montarPaginas(d: DadosRelatorio): PaginaRelatorio[] {
  const paginas: PaginaRelatorio[] = [{ chave: "capa", tipo: "capa" }];
  const meses = d.r.mesesMeta;

  /** Função que acrescenta páginas de conteúdo a um capítulo (cabeçalho "CAP. 0X — TÍTULO"). */
  const adicionar = (numero: string) => {
    const c = cap(numero);
    const cabecalho = { esquerda: rotuloCapitulo(c), direita: cabecalhoCapitulo(c) };
    return (chave: string, p: Omit<Extract<PaginaRelatorio, { tipo: "conteudo" }>, "chave" | "tipo" | "cabecalho">) =>
      paginas.push({ chave: `${numero}-${chave}`, tipo: "conteudo", cabecalho, ...p });
  };
  /** Página de abertura do capítulo + função para acrescentar as páginas dele. */
  const capitulo = (numero: string) => {
    const c = cap(numero);
    paginas.push({ chave: `abertura-${numero}`, tipo: "abertura", capitulo: c, frase: preencher(c.frase, { meses }) });
    return adicionar(numero);
  };

  /** Tabela que continua nas folhas seguintes (o título se repete com "continuação"). */
  const tabelaPaginada = <L,>(
    add: ReturnType<typeof adicionar>,
    chave: string,
    o: {
      titulo: string;
      subtitulo?: string;
      colunas: ColunaTabela[];
      linhas: L[];
      altura: (l: L) => number;
      celulas: (l: L) => (ReactNode | CelulaTabela)[];
      vazio?: string;
      /** Bloco depois da tabela, na última folha (com a altura reservada). */
      depois?: { altura: number; no: ReactNode };
      compacta?: boolean;
    },
  ) => {
    type Item = { linha: L } | { depois: true };
    const itens: Item[] = [...o.linhas.map((linha) => ({ linha })), ...(o.depois ? [{ depois: true as const }] : [])];
    const alturaItem = (i: Item) => ("linha" in i ? o.altura(i.linha) : o.depois!.altura);
    const primeira = (o.subtitulo ? ESPACO.comSubtitulo : ESPACO.soTitulo) - ALTURA_CABECALHO;
    const folhas = paginar(itens, alturaItem, primeira, ESPACO.soTitulo - ALTURA_CABECALHO);
    folhas.forEach((folha, i) => {
      const linhas = folha.filter((x): x is { linha: L } => "linha" in x).map((x) => x.linha);
      const temDepois = folha.some((x) => "depois" in x);
      add(`${chave}-${i}`, {
        titulo: o.titulo,
        continuacao: i > 0,
        subtitulo: i === 0 ? o.subtitulo : undefined,
        corpo: (
          <>
            {linhas.length > 0 && <Tabela colunas={o.colunas} linhas={linhas.map(o.celulas)} compacta={o.compacta} />}
            {i === 0 && !o.linhas.length && o.vazio && <Vazio>{o.vazio}</Vazio>}
            {temDepois && o.depois!.no}
          </>
        ),
      });
    });
  };

  // ------------------------------------------------------------- Sumário
  paginas.push({
    chave: "sumario",
    tipo: "conteudo",
    cabecalho: { esquerda: T.sumario.rotulo, direita: T.sumario.cabecalho },
    titulo: T.sumario.titulo,
    subtitulo: T.sumario.subtitulo,
    corpo: <Sumario />,
  });

  // ------------------------------------------------- 01 · Visão Executiva
  {
    const add = capitulo("01");
    add("visao", {
      titulo: T.visao.titulo,
      subtitulo: T.visao.subtitulo,
      corpo: (
        <>
          <Tabela
            compacta
            colunas={[
              { titulo: "Dimensão", largura: "19%", classe: "forte" },
              { titulo: "Atual", largura: "10%", classe: "dir" },
              { titulo: "Necessário", largura: "10%", classe: "dir" },
              { titulo: "Diferença", largura: "10%", classe: "dir vermelho" },
              { titulo: "Decisão a avaliar", largura: "33%" },
              { titulo: "Prioridade", largura: "8%", classe: "centro forte" },
              { titulo: "Prazo", largura: "10%", classe: "centro" },
            ]}
            linhas={d.visao.map((l) => [l.dimensao, l.atual, l.necessario, l.diferenca, l.decisao, l.prioridade, l.prazo])}
          />
          <Caixa rotulo={T.visao.decisaoRotulo}>{T.visao.decisaoTexto}</Caixa>
        </>
      ),
    });
    const indicadores: DadosCartao[] = [
      { rotulo: "Patrimônio líquido", valor: fmtBRL(d.p.liquido), nota: `Bruto ${fmtBRL(d.p.ativos)} - dívidas ${fmtBRL(d.p.passivos)}`, cor: COR.azul },
      {
        rotulo: "Superávit mensal",
        valor: d.f.renda > 0 ? fmtBRL(d.f.sobra) : NAO_INFORMADO,
        nota: d.f.renda > 0 ? `Taxa de poupança ${pct1(d.f.taxaPoupanca)}` : undefined,
        cor: d.f.sobra < 0 ? COR.vermelho : COR.verde,
      },
      {
        rotulo: "Gap seguro de vida",
        valor: d.pr.necessidade > 0 ? fmtBRL(d.pr.gap) : NAO_INFORMADO,
        nota: "Necessário - cobertura atual",
        cor: d.pr.gap > 0 ? COR.vermelho : COR.verde,
      },
      { rotulo: "Reserva emergência", valor: fmtBRL(d.r.atual), nota: `Alvo ${fmtBRL(d.r.meta)} (${meses} meses)`, cor: COR.laranja },
      {
        rotulo: "Progresso aposentadoria",
        valor: d.temFuturo ? pctMeta(d.progresso) : NAO_INFORMADO,
        nota: d.temFuturo ? `Alvo ${fmtBRL(d.fu.alvo)}` : undefined,
        cor: COR.laranja,
      },
      {
        rotulo: "Renda passiva (4%)",
        valor: fmtBRL(d.rendaHoje),
        nota: d.temFuturo ? `Alvo ${fmtBRL(d.fu.retiradaMensal)}/mês` : "Alvo não informado",
        cor: COR.verde,
      },
    ];
    add("indicadores", {
      titulo: T.indicadores.titulo,
      subtitulo: T.indicadores.subtitulo,
      corpo: (
        <>
          <Cartoes itens={indicadores} />
          <div style={{ height: "14pt" }} />
          <Caixa rotulo={T.indicadores.principioRotulo}>{T.indicadores.principioTexto}</Caixa>
        </>
      ),
    });
  }

  // ------------------------------------- 01 · Nota LIFE por pilar (Estrela LIFE)
  {
    const e = d.estrela;
    const conta = (st: Status) => e.pilares.filter((x) => x.status === st).length;
    const add = adicionar("01");
    add("estrela", {
      titulo: T.estrela.titulo,
      subtitulo: T.estrela.subtitulo,
      corpo: (
        <>
          <Cartoes
            baixo
            itens={[
              { rotulo: "Nota LIFE", valor: d.notaLife !== undefined ? `${d.notaLife} / ${e.maximo}` : NAO_INFORMADO, cor: COR.ouro },
              { rotulo: "Pilares saudáveis", valor: String(conta("ok")), cor: COR.verde },
              { rotulo: "Pilares em atenção", valor: String(conta("atencao")), cor: COR.laranja },
              { rotulo: "Pilares críticos", valor: String(conta("critico")), cor: COR.vermelho },
            ]}
          />
          <Tabela
            colunas={[
              { titulo: "Pilar", largura: "24%", classe: "forte azul" },
              { titulo: "O que é", largura: "46%" },
              { titulo: "Nota", largura: "14%" },
              { titulo: "Estado", largura: "16%", classe: "forte" },
            ]}
            linhas={e.pilares.map((x) => [
              x.nome,
              x.descricao,
              <span key="n" className="rel-nota">
                <span>
                  {x.nota} / {x.maximo}
                </span>
                <i>
                  <b style={{ width: `${x.status === "sem-dados" ? 0 : x.pct}%`, background: COR_STATUS[x.status] }} />
                </i>
              </span>,
              { texto: textoStatus[x.status], classe: CLASSE_STATUS[x.status] },
            ])}
          />
        </>
      ),
    });
  }

  // ------------------------------------------------- 02 · Sonhos e Objetivos
  {
    const add = capitulo("02");
    const T2 = T.objetivos;
    emGrupos(d.listaObjetivos, 6).forEach((grupo, i) =>
      add(`cobertura-${i}`, {
        titulo: T2.coberturaTitulo,
        continuacao: i > 0,
        subtitulo: i === 0 ? T2.coberturaSubtitulo : undefined,
        corpo: (
          <Painel titulo={T2.coberturaGrafico} sub={T2.coberturaNota}>
            {grupo.length ? (
              <>
                <Legenda
                  itens={[
                    { nome: "Cobertura atual", cor: COR.vermelho },
                    { nome: "Objetivo (100%)", cor: COR.verde },
                  ]}
                />
                <GraficoBarras
                  altura={80}
                  grupos={grupo.map((o) => ({
                    nome: o.titulo,
                    barras: [
                      { valor: o.cobertura, cor: COR.vermelho, rotulo: o.cobertura === null ? NAO_INFORMADO : `${o.cobertura}%` },
                      { valor: 100, cor: COR.verde, rotulo: "100%" },
                    ],
                  }))}
                />
              </>
            ) : (
              <Vazio>Nenhum objetivo registrado.</Vazio>
            )}
          </Painel>
        ),
      }),
    );
    emGrupos(d.listaObjetivos, 6).forEach((grupo, i) =>
      add(`valor-${i}`, {
        corpo: (
          <Painel titulo={T2.valorGrafico} sub={T2.valorGraficoSub}>
            {grupo.length ? (
              <GraficoBarras
                grande
                altura={70}
                grupos={grupo.map((o, j) => ({ nome: o.titulo, barras: [{ valor: o.valor, cor: SERIES[(i * 6 + j) % SERIES.length] }] }))}
              />
            ) : (
              <Vazio>Nenhum objetivo registrado.</Vazio>
            )}
          </Painel>
        ),
      }),
    );
    tabelaPaginada(add, "detalhe", {
      titulo: T2.detalheTitulo,
      colunas: [
        { titulo: "Objetivo", largura: "28%" },
        { titulo: "Tipo", largura: "9%" },
        { titulo: "Prazo", largura: "10%" },
        { titulo: "Valor futuro", largura: "13%", classe: "dir" },
        { titulo: "Aporte/mês", largura: "12%", classe: "dir" },
        { titulo: "Prioridade", largura: "10%" },
        { titulo: "Cobertura", largura: "10%", classe: "dir" },
        { titulo: "Impacto", largura: "8%", classe: "centro" },
      ],
      linhas: d.listaObjetivos,
      altura: (o) => alturaLinha([[o.titulo, 0.28]]),
      celulas: (o) => [
        o.titulo,
        o.tipo,
        o.prazo,
        o.valor === null ? NAO_INFORMADO : fmtBRL(o.valor),
        o.aporte > 0 ? fmtBRL(o.aporte) : "—",
        o.prioridade,
        o.cobertura === null ? NAO_INFORMADO : `${o.cobertura}%`,
        o.impacto,
      ],
      vazio: "Nenhum objetivo registrado.",
      depois: d.listaObjetivos.length
        ? {
            altura: 22,
            no: <p className="rel-tabela-legenda">Aporte/mês: quanto guardar por mês para chegar ao valor no prazo. Cobertura: parte desse aporte que a sobra livre cobre hoje.</p>,
          }
        : undefined,
    });
  }

  // ------------------------------------------------- 03 · Família e Educação
  {
    const add = capitulo("03");
    const T3 = T.educacao;
    const inflacao = `Inflação educacional aplicada: ${fmtNum(d.par.inflacaoEducacional * 100)}% a.a. (inflação geral de ${fmtNum(d.par.inflacao * 100)}% a.a.).`;
    const cartoes: DadosCartao[] = [
      { rotulo: "Custo educacional total", valor: fmtBRL(d.ed.total), nota: "Escola e faculdade, com reajuste", cor: COR.azul },
      { rotulo: "Mensalidades hoje", valor: `${fmtBRL(d.escolares.mensalidades)}/mês`, cor: COR.verde },
      { rotulo: "Filhos cadastrados", valor: String(d.filhos.length), cor: COR.azulClaro },
    ];
    emGrupos(d.filhos, 6).forEach((grupo, i) =>
      add(`custo-${i}`, {
        titulo: T3.titulo,
        continuacao: i > 0,
        subtitulo: i === 0 ? `${inflacao} O custo com reajuste é o valor, em reais de hoje, que a família precisará para escola e faculdade.` : undefined,
        corpo: (
          <>
            <Painel titulo={T3.grafico}>
              {grupo.length ? (
                <>
                  <Legenda
                    itens={[
                      { nome: "Custo hoje", cor: COR.vermelho },
                      { nome: "Custo com reajuste educacional", cor: COR.azulClaro },
                    ]}
                  />
                  <GraficoBarras
                    altura={75}
                    grupos={grupo.map((x) => ({
                      nome: x.nome,
                      barras: [
                        { valor: x.hoje, cor: COR.vermelho },
                        { valor: x.total, cor: COR.azulClaro },
                      ],
                    }))}
                  />
                </>
              ) : (
                <Vazio>Nenhum filho ou dependente em idade escolar cadastrado.</Vazio>
              )}
            </Painel>
            {i === 0 && <Cartoes itens={cartoes} baixo />}
          </>
        ),
      }),
    );
    const blocoEducacao = {
      objetivo: T3.objetivo,
      realidade: d.filhos.length ? `Custo educacional estimado de ${fmtBRL(d.ed.total)} para ${plural(d.filhos.length, "filho", "filhos")}` : "Nenhum filho em idade escolar cadastrado",
      ajuste: d.filhos.length
        ? `Proteger os estudos no capital do seguro de vida (${fmtBRL(d.pr.componentes.educacional)} na necessidade do capítulo 06)`
        : "Cadastrar os dependentes para planejar a educação",
    };
    tabelaPaginada(add, "filhos", {
      titulo: T3.detalheTitulo,
      colunas: [
        { titulo: "Filho", largura: "15%" },
        { titulo: "Idade", largura: "7%", classe: "centro" },
        { titulo: "Escolaridade", largura: "21%" },
        { titulo: "Mensalidade", largura: "11%", classe: "dir" },
        { titulo: "Anos de escola", largura: "10%", classe: "centro" },
        { titulo: "Escola", largura: "11%", classe: "dir" },
        { titulo: "Faculdade", largura: "11%", classe: "dir" },
        { titulo: "Custo total", largura: "14%", classe: "dir forte azul" },
      ],
      linhas: d.filhos,
      altura: (x) => alturaLinha([[x.escolaridade, 0.21]]),
      celulas: (x) => [x.nome, x.idade, x.escolaridade, fmtBRL(x.mensalidade), String(x.anosEscola), fmtBRL(x.escola), fmtBRL(x.faculdade), fmtBRL(x.total)],
      vazio: "Nenhum filho ou dependente em idade escolar cadastrado.",
      depois: { altura: ALTURA_BLOCO, no: <BlocoDecisorio titulo={T3.blocoTitulo} bloco={blocoEducacao} /> },
    });
  }

  // ------------------------------------------------- 04 · Fluxo de Caixa
  {
    const add = capitulo("04");
    const T4 = T.fluxo;
    const temRenda = d.f.renda > 0;
    add("fluxo", {
      titulo: T4.titulo,
      subtitulo: T4.subtitulo,
      corpo: (
        <>
          <Cartoes
            baixo
            itens={[
              { rotulo: "Receita mensal", valor: temRenda ? fmtBRL(d.f.renda) : NAO_INFORMADO, cor: COR.verde },
              { rotulo: "Despesa mensal", valor: fmtBRL(d.f.despesas), cor: COR.vermelho },
              {
                rotulo: d.f.sobra < 0 ? "Déficit / taxa" : "Superávit / taxa",
                valor: temRenda ? `${fmtBRL(d.f.sobra)} · ${pct1(d.f.taxaPoupanca)}` : NAO_INFORMADO,
                cor: d.f.sobra < 0 ? COR.vermelho : COR.verde,
              },
            ]}
          />
          <Painel titulo={T4.grafico}>
            <GraficoBarras
              grande
              altura={70}
              grupos={[
                { nome: "Receita", barras: [{ valor: temRenda ? d.f.renda : null, cor: COR.verde }] },
                { nome: "Despesa", barras: [{ valor: d.f.despesas, cor: COR.vermelho }] },
                { nome: d.f.sobra < 0 ? "Déficit" : "Superávit", barras: [{ valor: temRenda ? d.f.sobra : null, cor: COR.azulMedio }] },
              ]}
            />
          </Painel>
        </>
      ),
    });
    add("categorias", {
      corpo: (
        <>
          <Painel titulo={T4.categorias}>
            {d.categorias.length ? (
              <GraficoRosca
                fatias={d.categorias.map((x, i) => ({ nome: x.nome, valor: x.valor, cor: SERIES[i % SERIES.length] }))}
                centro={fmtCurto(d.d.total)}
                legendaCentro="/mês"
                formatarItem={(f, p) => `${pct1(p)} · ${fmtBRL(f.valor)}`}
              />
            ) : (
              <Vazio>Nenhuma despesa informada.</Vazio>
            )}
          </Painel>
          <BlocoDecisorio
            titulo={T4.blocoTitulo}
            bloco={{
              objetivo: preencher(T4.objetivo, { meta: d.blocoFluxo.objetivoMeta }),
              realidade: d.blocoFluxo.realidade,
              ajuste: d.blocoFluxo.ajuste ?? T4.ajusteAlinhado,
            }}
          />
        </>
      ),
    });
  }

  // ------------------------------------------------- 05 · Patrimônio e Reserva
  {
    const add = capitulo("05");
    const T5 = T.patrimonio;
    add("balanco", {
      titulo: T5.titulo,
      subtitulo: T5.subtitulo,
      corpo: (
        <>
          <Cartoes
            baixo
            itens={[
              { rotulo: "Patrimônio bruto", valor: fmtBRL(d.p.ativos), cor: COR.azul },
              { rotulo: "Dívidas totais", valor: fmtBRL(d.p.passivos), cor: COR.vermelho },
              { rotulo: "Patrimônio líquido", valor: fmtBRL(d.p.liquido), cor: COR.verde },
            ]}
          />
          <Painel titulo={T5.grafico} sub={T5.graficoSub}>
            {d.classes.length ? (
              <GraficoRosca
                fatias={d.classes.map((x, i) => ({ nome: x.nome, valor: x.valor, cor: SERIES[i % SERIES.length] }))}
                centro={fmtCurto(d.p.ativos)}
                legendaCentro="Bruto"
                formatarItem={(f, p) => `${pct1(p)} · ${fmtBRL(f.valor)}`}
              />
            ) : (
              <Vazio>Nenhum bem ou recurso informado.</Vazio>
            )}
          </Painel>
        </>
      ),
    });
    add("liquidez", {
      titulo: T5.liquidezTitulo,
      corpo: (
        <Painel titulo={T5.liquidezGrafico} sub={T5.liquidezSub}>
          <GraficoBarras
            grande
            altura={90}
            grupos={[
              { nome: "Liquidez Alta", barras: [{ valor: d.liquidez.alta, cor: COR.verde }] },
              { nome: "Liquidez Média", barras: [{ valor: d.liquidez.media, cor: COR.laranja }] },
              { nome: "Liquidez Baixa", barras: [{ valor: d.liquidez.baixa, cor: COR.vermelho }] },
            ]}
          />
        </Painel>
      ),
    });
    add("reserva", {
      titulo: T5.reservaTitulo,
      subtitulo: preencher(T5.reservaSubtitulo, { meses }),
      corpo: (
        <>
          <Cartoes
            baixo
            itens={[
              { rotulo: "Despesa mensal", valor: fmtBRL(d.f.despesas), cor: COR.azul },
              { rotulo: `Reserva alvo (${meses}m)`, valor: fmtBRL(d.r.meta), cor: COR.azulClaro },
              { rotulo: "Disponível hoje", valor: fmtBRL(d.r.atual), cor: COR.verde },
              { rotulo: "Gap a fechar", valor: fmtBRL(d.r.falta), cor: COR.vermelho },
            ]}
          />
          <Painel titulo={T5.reservaGrafico} sub={preencher(T5.reservaGraficoSub, { meses })}>
            <Legenda
              itens={[
                { nome: `Objetivo (${meses}m)`, cor: COR.azulClaro },
                { nome: "Realidade", cor: COR.vermelho },
              ]}
            />
            <GraficoBarras
              altura={75}
              grupos={[
                {
                  nome: "Reserva de Emergência",
                  barras: [
                    { valor: d.r.meta, cor: COR.azulClaro },
                    { valor: d.r.atual, cor: COR.vermelho },
                  ],
                },
              ]}
            />
          </Painel>
        </>
      ),
    });
    add("defensiva", {
      titulo: T5.defensivaTitulo,
      corpo: (
        <BlocoDecisorio
          titulo={T5.defensivaBloco}
          bloco={{ objetivo: preencher(T5.defensivaObjetivo, { meses }), realidade: d.blocoReserva.realidade, ajuste: d.blocoReserva.ajuste }}
        />
      ),
    });
  }

  // ------------------------------------------ 06 · PROTEÇÃO PATRIMONIAL - Vida
  {
    const add = capitulo("06");
    const T6 = T.protecao;
    const temNecessidade = d.pr.necessidade > 0;
    const v = (x: number) => (temNecessidade ? fmtBRL(x) : NAO_INFORMADO);
    const atualTxt = d.temProtecao ? fmtBRL(d.pr.atual) : NAO_INFORMADO;
    const anos = (h: number) => (h === 1 ? "1 ano" : `${h} anos`);
    const coresRef = [COR.azulClaro, COR.azul, COR.ouro];
    add("referencias", {
      titulo: T6.referenciasTitulo,
      subtitulo: T6.referenciasSubtitulo,
      corpo: (
        <>
          <Cartoes
            itens={[
              ...d.referencias.map((r, i) => ({ rotulo: `Padrão de vida ${anos(r.horizonte)}`, valor: v(r.necessario), nota: "Capital necessário", cor: coresRef[i % 3] })),
              { rotulo: `Referência adotada (${anos(d.pr.horizonte)})`, valor: v(d.pr.necessario), cor: COR.verde },
              { rotulo: "Cobertura atual", valor: atualTxt, nota: d.pr.empresa > 0 ? `Sem o seguro pela empresa (${fmtBRL(d.pr.empresa)})` : undefined, cor: COR.vermelho },
              { rotulo: "Diferença a avaliar", valor: v(d.pr.gap), cor: COR.vermelho },
            ]}
          />
          <div style={{ height: "12pt" }} />
          <Caixa ouro rotulo={T6.caixaRotulo}>
            {temNecessidade
              ? `Atual: ${atualTxt} · Necessário: ${fmtBRL(d.pr.necessario)} · Diferença: ${fmtBRL(d.pr.gap)}. ${T6.caixaDecisao}`
              : "Faltam dados de despesas, dependentes ou patrimônio para calcular a necessidade de seguro."}
          </Caixa>
        </>
      ),
    });
    add("metodos", {
      titulo: T6.metodosTitulo,
      corpo: (
        <Painel titulo={T6.metodosGrafico} sub={T6.metodosGraficoSub}>
          <GraficoBarras
            grande
            altura={95}
            grupos={[
              ...d.referencias.map((r, i) => ({ nome: `${anos(r.horizonte)} de padrão de vida`, barras: [{ valor: temNecessidade ? r.necessario : null, cor: coresRef[i % 3] }] })),
              { nome: "Referência adotada", barras: [{ valor: temNecessidade ? d.pr.necessario : null, cor: COR.verde }] },
              { nome: "Cobertura atual", barras: [{ valor: d.temProtecao ? d.pr.atual : null, cor: COR.vermelho }] },
            ]}
          />
        </Painel>
      ),
    });
    const pctTotal = (x: number) => (d.pr.necessidade > 0 ? `${Math.round((x / d.pr.necessidade) * 100)}% do total` : "");
    const comp = d.pr.componentes;
    const blocosNecessidade = [
      {
        ...T6.blocos.padraoVida,
        valor: comp.padraoVida,
        como: `${fmtBRL(d.pr.custoMensal)} de custo de vida por mês (sem parcelas e mensalidades escolares) x 12 meses x ${anos(d.pr.horizonte)}`,
      },
      {
        ...T6.blocos.sucessao,
        valor: comp.sucessao,
        como:
          d.pr.quitados > 0
            ? `ITCMD ${fmtBRL(d.pr.itcmd)} + honorários e custas ${fmtBRL(d.pr.honorarios)} sobre ${fmtBRL(d.pr.quitados)} em bens quitados, investimentos, reserva e empresa`
            : "Sem bens quitados, investimentos ou reserva informados",
      },
      {
        ...T6.blocos.educacao,
        valor: comp.educacional,
        como: d.filhos.length
          ? `${plural(d.filhos.length, "filho", "filhos")}: escola até o fim do ensino médio e faculdade, com inflação educacional de ${fmtNum(d.par.inflacaoEducacional * 100)}% a.a.`
          : "Nenhum filho em idade escolar cadastrado",
      },
      {
        ...T6.blocos.quitacao,
        valor: comp.quitacao,
        como: comp.quitacao > 0 ? `Saldo das dívidas cadastradas: ${fmtBRL(d.p.passivos)}` : `Não incluída nesta análise (premissa do consultor). Saldo das dívidas: ${fmtBRL(d.p.passivos)}`,
      },
    ];
    add("composicao", {
      titulo: T6.composicaoTitulo,
      subtitulo: T6.composicaoSubtitulo,
      junto: true,
      corpo: (
        <>
          <div className="rel-necessidades">
            {blocosNecessidade.map((b, i) => (
              <div key={b.titulo} className="rel-necessidade">
                <div>
                  <h4>
                    {String(i + 1).padStart(2, "0")}&nbsp; {b.titulo}
                  </h4>
                  <p>{b.texto}</p>
                  <p className="como">Como chegamos: {b.como}</p>
                </div>
                <div className="rel-necessidade-valor">
                  {fmtBRL(b.valor)}
                  <small>{pctTotal(b.valor)}</small>
                </div>
              </div>
            ))}
            <div className="rel-necessidade menos">
              <div>
                <h4>05&nbsp; {T6.blocos.recursos.titulo}</h4>
                <p>{T6.blocos.recursos.texto}</p>
                <p className="como">
                  Como chegamos: reserva {fmtBRL(d.p.reserva)} + investimentos {fmtBRL(d.p.investimentos)} + previdência {fmtBRL(d.p.previdencia)}
                </p>
              </div>
              <div className="rel-necessidade-valor">
                − {fmtBRL(d.pr.recursos)}
                <small>abatido do total</small>
              </div>
            </div>
          </div>
          <Caixa ouro rotulo={`TOTAL DA NECESSIDADE: ${fmtBRL(d.pr.necessidade)}`}>
            Soma de padrão de vida + inventário + educação + dívidas, menos {fmtBRL(d.pr.recursos)} de recursos = capital necessário de{" "}
            {fmtBRL(d.pr.necessario)}. Cobertura atual: {atualTxt}. Diferença a avaliar: {fmtBRL(d.pr.gap)}.
          </Caixa>
        </>
      ),
    });
    const itcmdPct = fmtNum(n100(d.pr.itcmd, d.pr.quitados));
    const honorariosPct = fmtNum(n100(d.pr.honorarios, d.pr.quitados));
    add("sucessao", {
      titulo: T6.sucessaoTitulo,
      subtitulo: T6.sucessaoSubtitulo,
      corpo: (
        <>
          <Cartoes
            itens={[
              { rotulo: d.pr.quitados > 0 ? `ITCMD (${itcmdPct}%)` : "ITCMD", valor: fmtBRL(d.pr.itcmd), cor: COR.vermelho },
              { rotulo: d.pr.quitados > 0 ? `Honorários e custas (${honorariosPct}%)` : "Honorários e custas", valor: fmtBRL(d.pr.honorarios), cor: COR.vermelho },
              { rotulo: "Base de cálculo", valor: fmtBRL(d.pr.quitados), nota: "Bens quitados, investimentos, reserva e empresa", cor: COR.azul },
              { rotulo: "Custo sucessório total", valor: fmtBRL(d.custoSucessao), cor: COR.vermelho },
              { rotulo: "Liquidez sucessória", valor: fmtBRL(d.pr.recursos), nota: "Reserva, investimentos e previdência", cor: COR.verde },
              {
                rotulo: "Capital x custo estimado",
                valor: d.faltaSucessao > 0 ? `Diferença ${fmtBRL(d.faltaSucessao)}` : d.custoSucessao > 0 ? "Coberto" : "Sem custo",
                cor: d.faltaSucessao > 0 ? COR.vermelho : COR.verde,
              },
            ]}
          />
          <div style={{ height: "12pt" }} />
          <Caixa ouro rotulo={T6.sucessaoCaixa}>
            {d.faltaSucessao > 0
              ? `Uma cobertura adicional de ${fmtBRL(d.faltaSucessao)} pode fornecer liquidez equivalente aos custos estimados de inventário (ITCMD), honorários e custas, reduzindo a venda forçada de bens.`
              : d.custoSucessao > 0
                ? `A liquidez informada (${fmtBRL(d.pr.recursos)}) cobre os custos estimados de inventário; o seguro de vida pode preservar esses recursos para a família.`
                : "Sem bens quitados informados, não há custo de inventário estimado."}
          </Caixa>
        </>
      ),
    });
    add("sucessao-grafico", {
      titulo: T6.sucessaoTitulo,
      corpo: (
        <Painel titulo={T6.sucessaoGrafico} sub={T6.sucessaoGraficoSub}>
          <Legenda
            itens={[
              { nome: "Objetivo", cor: COR.azulClaro },
              { nome: "Realidade", cor: COR.vermelho },
            ]}
          />
          <GraficoBarras
            altura={80}
            grupos={[
              {
                nome: "Cobertura de seguro de vida",
                barras: [
                  { valor: temNecessidade ? d.pr.necessario : null, cor: COR.azulClaro },
                  { valor: d.temProtecao ? d.pr.atual : null, cor: COR.vermelho },
                ],
              },
              {
                nome: "Liquidez vs custos do inventário",
                barras: [
                  { valor: d.custoSucessao, cor: COR.azulClaro },
                  { valor: d.pr.recursos, cor: COR.vermelho },
                ],
              },
            ]}
          />
        </Painel>
      ),
    });
    const principios = T6.principios.map((t, i) => ({ t: `Princípio ${i + 1} — ${t}`, i }));
    paginar(principios, (x) => 26 + 10.6 * linhasTexto(x.t, LARGURA_UTIL - 78, 8.4), ESPACO.soTitulo).forEach((grupo, k) =>
      add(`principios-${k}`, {
        titulo: T6.principiosTitulo,
        continuacao: k > 0,
        corpo: (
          <div className="rel-lista">
            {grupo.map((x) => (
              <div key={x.i} className="rel-lista-item">
                <span className="rel-lista-num">{String(x.i + 1).padStart(2, "0")}</span>
                <span className="rel-lista-texto">{x.t}</span>
              </div>
            ))}
          </div>
        ),
      }),
    );
    add("conclusao", {
      titulo: T6.conclusaoTitulo,
      corpo: (
        <>
          <Caixa ouro rotulo={T6.conclusaoRotulo}>
            {T6.conclusaoTexto}
          </Caixa>
          <BlocoDecisorio
            titulo={T6.blocoTitulo}
            bloco={{
              objetivo: T6.objetivo,
              realidade: !temNecessidade
                ? "Necessidade não calculada: faltam dados"
                : d.pr.gap > 0
                  ? `Diferença de ${fmtBRL(d.pr.gap)} entre a necessidade e a cobertura atual`
                  : "A cobertura atual atende a necessidade calculada",
              ajuste: T6.ajuste,
            }}
          />
        </>
      ),
    });
  }

  // --------------------------------------------- 07 · Independência Financeira
  {
    const add = capitulo("07");
    const T7 = T.independencia;
    const fu = d.fu;
    const semDados = "Informe a data de nascimento e a renda desejada na aposentadoria para projetar a independência.";
    const retorno = fmtPct(fu.retornoReal, 1);
    add("curva", {
      titulo: T7.curvaTitulo,
      subtitulo: d.temFuturo
        ? `Projeção até os ${fu.idadeAposentadoria} anos com o retorno real de ${retorno} a.a. ${d.simulado ? "da simulação" : "informado"}, investindo ${fmtBRL(fu.aporteAtual)}/mês${
            !d.simulado && fu.aporteInformado ? " (quanto o cliente diz que consegue poupar)" : ""
          }.`
        : semDados,
      corpo: (
        <>
          <Cartoes
            baixo
            itens={[
              { rotulo: "Idade vs alvo", valor: d.temFuturo ? `${fu.idadeAtual} vs ${fu.idadeAposentadoria}` : NAO_INFORMADO, cor: COR.azul },
              { rotulo: "Patrimônio alvo (25x)", valor: d.temFuturo ? (fu.alvo > 0 ? fmtBRL(fu.alvo) : "Atingido") : NAO_INFORMADO, cor: COR.azulClaro },
              { rotulo: "Progresso atual", valor: d.temFuturo ? pctMeta(d.progresso) : NAO_INFORMADO, cor: COR.laranja },
            ]}
          />
          <Painel titulo={T7.curvaGrafico}>
            {!d.temFuturo ? (
              <Vazio>{semDados}</Vazio>
            ) : fu.serie.length < 2 ? (
              <Vazio>
                A idade de aposentadoria ({fu.idadeAposentadoria} anos) já foi atingida: o cliente tem {fu.idadeAtual} anos.
              </Vazio>
            ) : (
              <>
                <Legenda
                  itens={[
                    { nome: "Trajetória atual", cor: COR.vermelho, traco: true },
                    { nome: "Com o aporte necessário", cor: COR.verde, traco: true },
                    { nome: "Alvo 25x", cor: COR.azulClaro, traco: true },
                  ]}
                />
                <GraficoLinhas
                  rotulosX={fu.serie.map((x) => String(x.ano))}
                  series={[
                    { nome: "Alvo 25x", cor: COR.azulClaro, pontos: fu.serie.map(() => fu.alvo) },
                    { nome: "Com o aporte necessário", cor: COR.verde, pontos: fu.serie.map((x) => x.necessaria) },
                    { nome: "Trajetória atual", cor: COR.vermelho, pontos: fu.serie.map((x) => x.atual) },
                  ]}
                />
              </>
            )}
          </Painel>
        </>
      ),
    });
    const grupos: GrupoBarras[] = [
      {
        nome: "Patrimônio",
        barras: [
          { valor: fu.alvo, cor: COR.azulClaro },
          { valor: fu.atual, cor: COR.vermelho },
        ],
      },
      {
        nome: "Aporte mensal",
        barras: [
          { valor: fu.aporte, cor: COR.azulClaro },
          { valor: fu.aporteAtual, cor: COR.vermelho },
        ],
      },
      {
        nome: "Renda passiva/mês",
        barras: [
          { valor: fu.retiradaMensal, cor: COR.azulClaro },
          { valor: d.rendaHoje, cor: COR.vermelho },
        ],
      },
    ];
    add("gaps", {
      titulo: T7.gapsTitulo,
      subtitulo: T7.gapsSubtitulo,
      corpo: (
        <>
          <Painel titulo={T7.gapsGrafico}>
            {d.temFuturo ? (
              <>
                <Legenda
                  itens={[
                    { nome: "Objetivo", cor: COR.azulClaro },
                    { nome: "Realidade", cor: COR.vermelho },
                  ]}
                />
                <GraficoBarras altura={75} grupos={grupos} />
              </>
            ) : (
              <Vazio>{semDados}</Vazio>
            )}
          </Painel>
          <BlocoDecisorio
            titulo={T7.blocoTitulo}
            bloco={
              d.temFuturo
                ? {
                    objetivo: fu.alvo > 0 ? `${fmtBRL(fu.alvo)} aos ${fu.idadeAposentadoria} anos` : `Renda de ${fmtBRL(fu.rendaDesejada)}/mês aos ${fu.idadeAposentadoria} anos`,
                    realidade: `Progresso ${pctMeta(d.progresso)} · gap ${fmtBRL(fu.faltaHoje)}`,
                    ajuste:
                      fu.alvo <= 0
                        ? "As outras rendas já cobrem a renda desejada"
                        : fu.idadeAtingida
                          ? "Rever a idade de aposentadoria ou a renda desejada"
                          : fu.aporte > fu.aporteAtual
                            ? `Aportar ${fmtBRL(fu.aporte)}/mês a ${retorno} real`
                            : `Manter o aporte de ${fmtBRL(fu.aporteAtual)}/mês: a projeção cobre a meta`,
                  }
                : { objetivo: NAO_INFORMADO, realidade: NAO_INFORMADO, ajuste: semDados }
            }
          />
        </>
      ),
    });
    const refs = T7.referencias;
    paginar(refs, (x) => 33 + 10 * linhasTexto(x.texto, LARGURA_UTIL - 30, 8), ESPACO.comSubtitulo).forEach((grupo, k) =>
      add(`referencias-${k}`, {
        titulo: T7.referenciasTitulo,
        continuacao: k > 0,
        subtitulo: k === 0 ? T7.referenciasSubtitulo : undefined,
        junto: true,
        corpo: (
          <div className="rel-lista" style={{ gap: "8pt" }}>
            {grupo.map((x) => (
              <div key={x.titulo} className="rel-lista-item rel-lista-ref">
                <b>{x.titulo}</b>
                <p>{x.texto}</p>
              </div>
            ))}
          </div>
        ),
      }),
    );
    const r72 = fu.retornoReal > 0 ? 72 / (fu.retornoReal * 100) : null;
    add("renda", {
      corpo: (
        <Cartoes
          baixo
          itens={[
            { rotulo: "Renda sustentável (4%) hoje", valor: `${fmtBRL(d.rendaHoje)}/mês`, nota: "Investimentos e previdência x 4% ÷ 12", cor: COR.verde },
            { rotulo: "Patrimônio p/ renda alvo", valor: d.temFuturo ? fmtBRL(fu.alvo) : NAO_INFORMADO, cor: COR.azulClaro },
            {
              rotulo: "Tempo para dobrar (R72)",
              valor: r72 !== null ? `${r72.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} anos` : "Não se aplica",
              nota: `Retorno real de ${retorno} a.a.`,
              cor: COR.azul,
            },
          ]}
        />
      ),
    });
  }

  // --------------------------------------------- 08 · Alavancagem Patrimonial
  {
    const add = capitulo("08");
    const T8 = T.alavancagem;
    const corEstrategia: Record<string, string> = { "À vista": COR.azulMedio, Financiamento: COR.vermelho, Consórcio: COR.verde };
    const totalAquisicoes = d.aquisicoes.reduce((t, a) => t + a.valor, 0);
    const viaFinanciamento = d.aquisicoes.filter((a) => a.estrategia === "Financiamento").reduce((t, a) => t + a.valor, 0);
    const estrategias = [...new Set(d.aquisicoes.map((a) => a.estrategia || "Não definida"))];
    const consorcios = d.compromissos.filter((x) => x.tipo === "Consórcio");
    emGrupos(d.aquisicoes, 6).forEach((grupo, i) =>
      add(`estrategias-${i}`, {
        titulo: T8.estrategiasTitulo,
        continuacao: i > 0,
        subtitulo: i === 0 ? T8.estrategiasSubtitulo : undefined,
        corpo: (
          <>
            {i === 0 && (
              <Cartoes
                itens={[
                  { rotulo: "Aquisições planejadas", valor: String(d.aquisicoes.length), nota: d.aquisicoes.length ? undefined : "Nenhuma informada", cor: COR.azul },
                  { rotulo: "Valor total", valor: fmtBRL(totalAquisicoes), cor: COR.azulClaro },
                  { rotulo: "Via financiamento", valor: fmtBRL(viaFinanciamento), cor: COR.vermelho },
                  {
                    rotulo: "Consórcios ativos",
                    valor: fmtBRL(d.dv.creditoConsorcio),
                    nota: consorcios.length ? `${plural(consorcios.length, "carta", "cartas")} · ${fmtBRL(d.dv.parcelasCons)}/mês` : undefined,
                    cor: COR.verde,
                  },
                  { rotulo: "Financiamentos", valor: fmtBRL(d.dv.saldoFin), nota: d.dv.parcelasFin > 0 ? `Parcelas de ${fmtBRL(d.dv.parcelasFin)}/mês` : undefined, cor: COR.vermelho },
                  {
                    rotulo: "Parcelas sobre a renda",
                    valor: d.f.renda > 0 ? pct1(d.f.comprometimento) : NAO_INFORMADO,
                    nota: `Limite de ${fmtPct(d.par.limite)}`,
                    cor: d.f.comprometimento > d.par.limite ? COR.vermelho : COR.verde,
                  },
                ]}
              />
            )}
            <Painel titulo={T8.estrategiasGrafico}>
              {grupo.length ? (
                <>
                  <Legenda itens={estrategias.map((e) => ({ nome: e, cor: corEstrategia[e] ?? COR.ouro }))} />
                  <GraficoBarras grande altura={80} grupos={grupo.map((a) => ({ nome: a.nome, barras: [{ valor: a.valor, cor: corEstrategia[a.estrategia] ?? COR.ouro }] }))} />
                </>
              ) : (
                <Vazio>Nenhuma aquisição planejada informada na coleta.</Vazio>
              )}
            </Painel>
          </>
        ),
      }),
    );
    const temParcelas = d.dv.parcelas > 0;
    tabelaPaginada(add, "consorcio", {
      titulo: T8.consorcioTitulo,
      subtitulo: T8.consorcioSubtitulo,
      colunas: [
        { titulo: "Tipo", largura: "13%", classe: "forte" },
        { titulo: "Descrição", largura: "37%" },
        { titulo: "Parcela", largura: "14%", classe: "dir" },
        { titulo: "Prazo restante", largura: "14%" },
        { titulo: "Crédito / saldo devedor", largura: "22%", classe: "dir" },
      ],
      linhas: d.compromissos,
      altura: (x) => alturaLinha([[x.descricao, 0.37]]),
      celulas: (x) => [x.tipo, x.descricao, x.parcela > 0 ? `${fmtBRL(x.parcela)}/mês` : "—", x.prazo, x.saldo],
      vazio: "Nenhum consórcio, financiamento ou empréstimo informado.",
      depois: temParcelas
        ? {
            altura: 190,
            no: (
              <Painel titulo={T8.consorcioGrafico}>
                <GraficoBarras
                  grande
                  altura={60}
                  grupos={[
                    { nome: "Financiamentos", barras: [{ valor: d.dv.parcelasFin, cor: COR.vermelho }] },
                    { nome: "Consórcios", barras: [{ valor: d.dv.parcelasCons, cor: COR.verde }] },
                    { nome: "Empréstimos", barras: [{ valor: d.dv.parcelasEmp, cor: COR.laranja }] },
                  ]}
                />
              </Painel>
            ),
          }
        : undefined,
    });
    const blocos = d.blocosAquisicao.length
      ? d.blocosAquisicao.map((b) => ({ ...b, ajuste: b.ajuste ?? T8.ajustePadrao }))
      : [{ objetivo: "Planejar as futuras aquisições preservando caixa", realidade: "Nenhuma aquisição planejada informada na coleta", ajuste: T8.ajustePadrao }];
    paginar(blocos, alturaBlocoCompacto, ESPACO.soTitulo).forEach((grupo, i) =>
      add(`bloco-${i}`, {
        titulo: T8.blocoPagina,
        continuacao: i > 0,
        corpo: grupo.map((b, j) => <BlocoDecisorio key={j} compacto titulo={T8.blocoTitulo} bloco={b} />),
      }),
    );
  }

  // --------------------------------------------- 09 · Alertas e Plano de Ação
  {
    const add = capitulo("09");
    const T9 = T.alertas;
    tabelaPaginada(add, "alertas", {
      titulo: T9.titulo,
      subtitulo: T9.subtitulo,
      colunas: [
        { titulo: "Nível", largura: "10%" },
        { titulo: "Alerta", largura: "30%" },
        { titulo: "Descrição", largura: "60%" },
      ],
      linhas: d.alertas,
      altura: (a) => alturaLinha([
        [a.titulo, 0.3],
        [a.descricao, 0.6],
      ]),
      celulas: (a) => [{ texto: NIVEL[a.nivel]?.texto ?? "ALERTA", classe: NIVEL[a.nivel]?.classe ?? "rel-nivel-alerta" }, a.titulo, a.descricao],
      vazio: "Nenhum alerta: os indicadores do diagnóstico estão dentro do esperado.",
    });
    tabelaPaginada(add, "plano", {
      titulo: T9.planoTitulo,
      subtitulo: d.planoAutomatico ? T9.planoSubtituloAutomatico : T9.planoSubtitulo,
      colunas: [
        { titulo: "Prioridade", largura: "10%" },
        { titulo: "Ação", largura: "56%" },
        { titulo: "Prazo", largura: "14%" },
        { titulo: "Área", largura: "20%" },
      ],
      linhas: d.plano,
      altura: (a) => alturaLinha([
        [a.acao, 0.56],
        [a.area, 0.2],
      ]),
      celulas: (a) => [{ texto: a.prioridade, classe: corPrioridade(a.prioridade) }, a.acao, a.prazo, a.area],
      vazio: "Nenhuma ação registrada.",
    });
  }

  // ------------------------------------------------- 10 · Por que LIFE Brasil
  {
    const add = capitulo("10");
    const P = T.proximoPasso;
    add("proximo", {
      titulo: P.titulo,
      corpo: (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: "12pt", marginTop: "-8pt" }}>
            {P.paragrafos.map((t) => (
              <p key={t} className="rel-paragrafo">
                {t}
              </p>
            ))}
          </div>
          <ul className="rel-marcadores">
            {P.itens.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <Caixa rotulo={P.caixaRotulo}>{P.caixaTexto}</Caixa>
        </>
      ),
    });
    add("disclaimer", {
      corpo: (
        <Caixa ouro rotulo={T.disclaimer.rotulo}>
          {T.disclaimer.texto}
        </Caixa>
      ),
    });
  }

  // ------------------------------------------------------------ Apêndice
  {
    const G = T.glossario;
    paginar(G.itens, ([t, def]) => alturaLinha([
      [t, 0.16],
      [def, 0.84],
    ]), ESPACO.soTitulo - ALTURA_CABECALHO).forEach((grupo, i) =>
      paginas.push({
        chave: `glossario-${i}`,
        tipo: "conteudo",
        cabecalho: { esquerda: G.rotulo, direita: G.cabecalho },
        titulo: G.titulo,
        continuacao: i > 0,
        corpo: (
          <Tabela
            colunas={[
              { titulo: "Termo", largura: "16%", classe: "forte azul" },
              { titulo: "Definição", largura: "84%" },
            ]}
            linhas={grupo.map(([t, def]) => [t, def])}
          />
        ),
      }),
    );
  }

  return paginas;
}

/** Percentual aplicado (valor ÷ base × 100), para os rótulos de ITCMD e honorários. */
const n100 = (valor: number, base: number) => (base > 0 ? (valor / base) * 100 : 0);
