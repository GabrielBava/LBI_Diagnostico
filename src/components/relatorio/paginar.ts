// Paginação do Diagnóstico em PDF: as alturas são estimadas em pt antes de
// renderizar, para saber quantas folhas existem (rodapé "N / total") e para
// que tabelas longas continuem na folha seguinte sem cortar linhas.

/** Espaço livre do corpo (pt), do fim do título até o rodapé. */
export const ESPACO = {
  /** Título + subtitulo de uma linha. */
  comSubtitulo: 395,
  /** Só o título. */
  soTitulo: 418,
  /** Folha de continuação sem título. */
  semTitulo: 448,
};

/** Largura útil da folha (pt): 841,89 menos as margens de 52 pt. */
export const LARGURA_UTIL = 738;

/** Quantas linhas um texto ocupa numa largura (pt), com fonte de `fonte` pt (Helvetica ≈ 0,52 em por letra). */
export const linhasTexto = (texto: string, largura: number, fonte: number) =>
  Math.max(1, Math.ceil((texto.length * fonte * 0.52) / Math.max(20, largura)));

/**
 * Altura de uma linha de tabela (fonte 8 pt): `colunas` traz, para as colunas
 * que quebram texto, o texto e a fração da largura da tabela.
 */
export const alturaLinha = (colunas: [string, number][], compacta = false) => {
  const fonte = compacta ? 7.5 : 8;
  const entrelinha = compacta ? 9.2 : 10.4;
  const respiro = compacta ? 8 : 12;
  const linhas = Math.max(1, ...colunas.map(([t, fr]) => linhasTexto(t, fr * LARGURA_UTIL - 12, fonte)));
  return respiro + entrelinha * linhas;
};

/** Cabeçalho de tabela. */
export const ALTURA_CABECALHO = 23;

/**
 * Distribui os itens em folhas, sem partir nenhum: cada item tem uma altura
 * estimada; a primeira folha pode ter menos espaço (título, cartões...).
 */
export function paginar<T>(itens: T[], altura: (t: T) => number, primeira: number, demais = primeira): T[][] {
  const folhas: T[][] = [];
  let atual: T[] = [];
  let livre = primeira;
  itens.forEach((t) => {
    const h = altura(t);
    if (atual.length && h > livre) {
      folhas.push(atual);
      atual = [];
      livre = demais;
    }
    atual.push(t);
    livre -= h;
  });
  if (atual.length || !folhas.length) folhas.push(atual);
  return folhas;
}

/** Divide em grupos de até `tamanho` (gráficos com muitas barras). */
export const emGrupos = <T,>(itens: T[], tamanho: number): T[][] => {
  if (!itens.length) return [[]];
  const out: T[][] = [];
  for (let i = 0; i < itens.length; i += tamanho) out.push(itens.slice(i, i + tamanho));
  return out;
};
