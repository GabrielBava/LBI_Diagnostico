// =====================================================================
//  ETAPA 8 · ANALÍTICO DO PLANEJADOR — análise da reunião pelo Claude
//  ---------------------------------------------------------------------
//  • Monta o pedido: transcrições (Parte 1, Parte 2… na ordem) + resumo do
//    diagnóstico do cliente + instruções e formato JSON da resposta.
//  • Chama a API da Anthropic direto do navegador (fetch + streaming SSE),
//    com saída estruturada (JSON Schema) para a resposta vir no formato certo.
//  • Valida e normaliza a resposta (campos ausentes viram listas vazias).
//  Sem chave da API, o mesmo pedido pode ser copiado para o claude.ai e a
//  resposta colada de volta (lerRespostaJSON).
// =====================================================================

import type { Cliente } from "@/types";
import { progresso, secaoPorId } from "@/config/estrutura";
import { MODELOS_CLAUDE } from "@/config/defaults";
import {
  FATORES_DISC,
  analiseVazia,
  type AnaliseReuniao,
  type FatorDisc,
  type ItemAnalise,
  type PerfilComportamental,
  type Transcricao,
} from "./analitico-tipos";
import { contarPalavras } from "./arquivo-texto";
import {
  dividas,
  fluxo,
  futuro,
  idadePorNascimento,
  n,
  nOpt,
  patrimonio,
  protecao,
  reservaEmergencia,
  rotuloDependente,
  s,
  sim,
  temConjuge,
} from "./calculos";
import { fmtBRL, fmtPct, juntar, uid } from "./format";
import { perfilFinanceiro } from "./plano";

// ---------------------------------------------------------------------
//  Parâmetros da chamada
// ---------------------------------------------------------------------
const URL_API = "https://api.anthropic.com/v1/messages";
const VERSAO_API = "2026-10-21";
/** Teto de saída (o raciocínio do modelo também conta aqui); com streaming não há risco de tempo esgotado. */
const MAX_TOKENS = 64000;
/** Sem nenhum dado da API por este tempo, a análise é interrompida. */
const SILENCIO_MAX_MS = 180_000;
/** Contexto dos modelos atuais: 1 milhão de tokens (entrada + saída). */
export const LIMITE_TOKENS_ENTRADA = 850_000;
/** Acima disto a análise fica lenta e cara: o app avisa e sugere analisar por partes. */
export const AVISO_TOKENS_ENTRADA = 200_000;

export const nomeModelo = (id?: string) => MODELOS_CLAUDE.find((m) => m.id === id)?.nome ?? id ?? "";

/** Estimativa de tokens (português: ~3 caracteres por token, para não subestimar). */
export const estimarTokens = (texto: string) => Math.ceil(texto.length / 3);

// ---------------------------------------------------------------------
//  Resumo do diagnóstico (contexto para a IA achar lacunas na coleta)
// ---------------------------------------------------------------------
export function resumoDiagnostico(c: Cliente): string {
  const linhas: string[] = [];
  const add = (rotulo: string, valor?: string | false) => {
    if (valor) linhas.push(`- ${rotulo}: ${valor}`);
  };
  const cad = c.cadastro;
  try {
    const idade = idadePorNascimento(s(cad.nascimento));
    add("Nome", s(cad.nome) || "não informado");
    add("Idade", idade !== undefined ? `${idade} anos` : "não informada");
    add("Estado civil", [s(cad.estadoCivil), temConjuge(c) && s(cad.conjuge) ? `cônjuge: ${s(cad.conjuge)}` : ""].filter(Boolean).join(" · ") || "não informado");
    add("Ocupação", [s(cad.ocupacao), s(cad.regimeTrabalho)].filter(Boolean).join(" · ") || "não informada");
    add(
      "Filhos e dependentes",
      c.dependentes.length
        ? c.dependentes
            .map((d) => {
              const i = nOpt(d.idade);
              const detalhes = [s(d.nome) ? s(d.categoria) : "", i !== undefined ? `${i} anos` : "", s(d.escola) ? `escola ${s(d.escola).toLowerCase()}` : ""];
              return `${rotuloDependente(c.dependentes, d)}${detalhes.some(Boolean) ? ` (${detalhes.filter(Boolean).join(", ")})` : ""}`;
            })
            .join("; ")
        : "nenhum registrado",
    );
    add("O que motivou a busca pelo planejamento", s(cad.motivacao));
    add("Satisfação com a vida financeira (0 a 10)", s(cad.satisfacao));

    const f = fluxo(c);
    if (f.renda > 0) {
      add("Renda familiar líquida mensal", fmtBRL(f.renda));
      add("Despesas mensais", `${fmtBRL(f.despesas)} (parcelas de dívidas e consórcios: ${fmtBRL(f.parcelas)}, ${fmtPct(f.comprometimento)} da renda)`);
      add("Sobra mensal", `${fmtBRL(f.sobra)} (${fmtPct(f.taxaPoupanca)} da renda)`);
      const pf = perfilFinanceiro(c);
      add("Perfil financeiro (calculado)", `${pf.nome} — ${pf.descricao}`);
    } else add("Renda", "não informada na coleta");
    const poupa = nOpt(cad.poupancaMensal);
    if (poupa !== undefined) add("Quanto diz que consegue poupar por mês", fmtBRL(poupa));

    add(
      "Objetivos",
      c.objetivos.length
        ? c.objetivos
            .map((o) => {
              const partes = [s(o.tipo), n(o.valorFuturo) > 0 ? fmtBRL(n(o.valorFuturo)) : "", n(o.prazoMeses) > 0 ? `em ${n(o.prazoMeses)} meses` : "", s(o.prioridade) ? `prioridade ${s(o.prioridade).toLowerCase()}` : ""];
              return `${s(o.titulo) || "Objetivo sem título"} (${partes.filter(Boolean).join(", ")})${s(o.motivo) ? ` — "${s(o.motivo)}"` : ""}`;
            })
            .join("; ")
        : "nenhum registrado",
    );

    const dv = dividas(c);
    const listaDividas = [
      ...c.emprestimos.map((e) => `${s(e.categoria) || "Empréstimo"}${n(e.parcela) > 0 ? ` (parcela ${fmtBRL(n(e.parcela))})` : ""}`),
      ...dv.doPatrimonio.map((b) => `Financiamento de ${b.descricao}${b.parcela > 0 ? ` (parcela ${fmtBRL(b.parcela)})` : ""}`),
      ...c.financiamentos.map((b) => `Financiamento ${s(b.tipo).toLowerCase() || ""}${n(b.parcela) > 0 ? ` (parcela ${fmtBRL(n(b.parcela))})` : ""}`.trim()),
      ...c.consorcios.map((b) => `Consórcio ${s(b.tipo).toLowerCase()}${n(b.parcela) > 0 ? ` (parcela ${fmtBRL(n(b.parcela))})` : ""}`.trim()),
    ];
    add("Dívidas e parcelas", listaDividas.length ? `${listaDividas.join("; ")}. Saldo devedor estimado: ${fmtBRL(dv.passivos)}` : "nenhuma registrada");

    const p = patrimonio(c);
    add("Patrimônio", `ativos ${fmtBRL(p.ativos)}, dívidas ${fmtBRL(p.passivos)}, líquido ${fmtBRL(p.liquido)}`);
    const re = reservaEmergencia(c);
    add("Reserva de emergência", `${fmtBRL(re.atual)} (${re.meses.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} meses de despesas; meta de ${re.mesesMeta} meses)`);

    const pr = protecao(c);
    add(
      "Proteção",
      `${sim(c.protecao.temSeguroVida) ? `seguro de vida de ${fmtBRL(pr.atual)}` : "sem seguro de vida individual"}; necessidade calculada ${fmtBRL(pr.necessario)}; falta ${fmtBRL(pr.gap)}` +
        `${s(c.protecao.temInvalidez) ? `; invalidez/DIT: ${s(c.protecao.temInvalidez).toLowerCase()}` : ""}` +
        `${sim(c.protecao.temPrevidencia) ? `; previdência ${s(c.protecao.tipoPrevidencia)} de ${fmtBRL(p.previdencia)}` : "; sem previdência privada"}`,
    );

    const fu = futuro(c);
    add(
      "Aposentadoria",
      `deseja parar aos ${fu.idadeAposentadoria} anos com renda de ${fmtBRL(fu.rendaDesejada)}/mês; no ritmo atual chega a ${fmtPct(Math.min(fu.independencia, 9.99))} da meta`,
    );
    const inv = c.investimentos;
    add(
      "Investimentos",
      sim(inv.temInvestimento)
        ? `${fmtBRL(n(inv.valor))}; perfil ${s(inv.perfil).toLowerCase() || "não definido"}; conhecimento ${s(inv.conhecimento).toLowerCase() || "não informado"}${s(inv.temAssessor) ? `; tem assessor: ${s(inv.temAssessor).toLowerCase()}` : ""}`
        : `não investe${s(inv.perfil) ? ` (perfil ${s(inv.perfil).toLowerCase()})` : ""}`,
    );
    add("Empresa", sim(c.corporativo.possuiEmpresa) ? s(c.corporativo.ramo) || "possui empresa" : "não possui");
  } catch {
    linhas.push("- (parte do resumo não pôde ser calculada)");
  }
  const pendentes = progresso(c).pendentes.map((x) => `${x.numero} ${x.titulo}`);
  if (pendentes.length) add("Seções da coleta não concluídas", juntar(pendentes));
  const notas = Object.entries(c.notas ?? {})
    .filter(([, v]) => typeof v === "string" && v.trim())
    .map(([k, v]) => `  - ${secaoPorId(k)?.titulo ?? k}: ${v.trim().replace(/\s+/g, " ")}`);
  if (notas.length) linhas.push("- Anotações do planejador durante a coleta:", ...notas);
  return linhas.join("\n");
}

// ---------------------------------------------------------------------
//  Instruções e formato da resposta
// ---------------------------------------------------------------------
export const INSTRUCOES = `Você é um analista comercial e comportamental que apoia planejadores financeiros do Grupo Life Brasil.
O planejador fez a primeira reunião com o cliente (V1: conexão e coleta de dados) e vai voltar para a V2: a apresentação do diagnóstico e do plano financeiro, onde quer converter o cliente (fechar o planejamento e as soluções recomendadas).
Sua tarefa: ler a transcrição da reunião (pode vir em partes, na ordem) e o resumo do diagnóstico, e preparar o planejador para a V2.

Regras:
- Escreva em português do Brasil, com frases curtas e simples (até 25 palavras por item).
- Use só o que está na transcrição e no resumo do diagnóstico. Não invente fatos, valores, nomes nem falas.
- Evidência: quando der, copie em "evidencia" um trecho curto e literal da fala do CLIENTE (até 30 palavras, sem aspas). Sem trecho que sustente o item, deixe "evidencia" vazio.
- Marque "fraca": true quando o item for uma inferência com pouca base (fala indireta, ambígua ou de outra pessoa). Item sem evidência direta normalmente é fraco.
- Diferencie quem fala. Se a transcrição não identificar os falantes, deduza pelo contexto (o planejador pergunta; o cliente conta a própria vida) e avise em "observacoes". O cônjuge também é cliente: indique quando a fala for dele ou dela.
- O perfil DISC é uma sugestão baseada só no jeito de falar e agir observado na reunião, não um diagnóstico psicológico. Use "confianca" baixa quando houver poucas falas do cliente.
- Não repita dados sensíveis (CPF, números de conta, senhas, endereço).
- Se a transcrição for curta, ruim ou não parecer uma reunião com cliente, devolva listas curtas ou vazias e explique em "observacoes". Lista vazia é melhor que item inventado.
- Ordene cada lista do mais importante para o menos importante: de 3 a 8 itens quando houver base, nunca mais de 12.

O que cada campo significa:
- dores: problemas e incômodos que o cliente vive hoje com dinheiro, família, trabalho ou patrimônio (o que dói agora).
- preocupacoes: medos e inquietações sobre o futuro (o que pode dar errado).
- gatilhos: o que move o cliente a agir — motivações, valores, pessoas e desejos que, tocados na V2, ajudam a converter (ex.: segurança dos filhos, liberdade, reconhecimento, não repetir a história dos pais).
- notas.objecoes: objeções prováveis na V2 (preço, tempo, confiança, "vou pensar", cônjuge…) e, no próprio texto, como contornar em poucas palavras.
- notas.gaps: informações que faltaram ou ficaram confusas na coleta. Compare a transcrição com o resumo do diagnóstico (campos vazios, valores que não batem, assuntos citados e não aprofundados) e diga o que perguntar.
- notas.perguntasV2: perguntas para a V2 escritas para gerar um "sim" e reforçar um compromisso (ex.: "Faz sentido para você proteger o padrão de vida da Ana e das crianças?"). Use as palavras do cliente.
- notas.riscos: riscos comerciais — o que pode fazer o cliente não fechar ou desistir depois (decisor ausente, desconfiança, aperto no caixa, prioridade em outra coisa).
- notas.oportunidades: oportunidades comerciais ligadas ao que o cliente disse (seguro de vida, previdência, consórcio, investimentos, sucessão, planejamento tributário, crédito…) e o porquê.
- perfil: perfil comportamental DISC sugerido.
  - D (Dominância): direto, rápido, focado em resultado e controle.
  - I (Influência): comunicativo, entusiasmado, focado em pessoas e reconhecimento.
  - S (Estabilidade): calmo, paciente, leal, focado em segurança e harmonia.
  - C (Conformidade): analítico, cauteloso, focado em dados, regras e precisão.
  - intensidade: de 0 a 100 para cada fator (não precisa somar 100). predominante e secundario (secundario pode ser null).
  - classificacao: rótulo curto, de 2 a 4 palavras (ex.: "Analítico cauteloso"). resumo: 2 ou 3 frases sobre como o cliente se comporta.
  - comoFala, comoDecide (como decide e age), prefere, evita (o que não faz ou não gosta), comoAbordarNaV2 (ritmo, linguagem, provas, o que mostrar primeiro) e frasesQueConectam (frases prontas para o planejador usar na V2, no estilo do cliente).
  - evidencias: trechos literais da fala do cliente que sustentam o perfil.
- observacoes: limitações da análise (transcrição curta, falantes sem nome, partes faltando…). Vazio se não houver.`;

const MODELO_JSON = `{
  "dores": [{ "texto": "frase curta", "evidencia": "trecho literal da fala do cliente ou vazio", "fraca": false }],
  "preocupacoes": [{ "texto": "…", "evidencia": "…", "fraca": false }],
  "gatilhos": [{ "texto": "…", "evidencia": "…", "fraca": false }],
  "notas": {
    "objecoes": [{ "texto": "…", "evidencia": "…", "fraca": false }],
    "gaps": [{ "texto": "…", "evidencia": "…", "fraca": false }],
    "perguntasV2": [{ "texto": "…", "evidencia": "…", "fraca": false }],
    "riscos": [{ "texto": "…", "evidencia": "…", "fraca": false }],
    "oportunidades": [{ "texto": "…", "evidencia": "…", "fraca": false }]
  },
  "perfil": {
    "predominante": "D, I, S ou C",
    "secundario": "D, I, S, C ou null",
    "intensidade": { "D": 0, "I": 0, "S": 0, "C": 0 },
    "confianca": "alta, media ou baixa",
    "classificacao": "…",
    "resumo": "…",
    "comoFala": ["…"],
    "comoDecide": ["…"],
    "prefere": ["…"],
    "evita": ["…"],
    "comoAbordarNaV2": ["…"],
    "frasesQueConectam": ["…"],
    "evidencias": ["…"]
  },
  "observacoes": "…"
}`;

// JSON Schema da saída estruturada (todos os objetos fechados e com todos os campos obrigatórios).
const ITEM_SCHEMA = {
  type: "object",
  properties: { texto: { type: "string" }, evidencia: { type: "string" }, fraca: { type: "boolean" } },
  required: ["texto", "evidencia", "fraca"],
  additionalProperties: false,
};
const LISTA_ITENS = { type: "array", items: ITEM_SCHEMA };
const LISTA_TEXTOS = { type: "array", items: { type: "string" } };
const FATOR_SCHEMA = { type: "string", enum: FATORES_DISC };
const objeto = (properties: Record<string, unknown>) => ({ type: "object", properties, required: Object.keys(properties), additionalProperties: false });

export const ESQUEMA_RESPOSTA = objeto({
  dores: LISTA_ITENS,
  preocupacoes: LISTA_ITENS,
  gatilhos: LISTA_ITENS,
  notas: objeto({ objecoes: LISTA_ITENS, gaps: LISTA_ITENS, perguntasV2: LISTA_ITENS, riscos: LISTA_ITENS, oportunidades: LISTA_ITENS }),
  perfil: objeto({
    predominante: FATOR_SCHEMA,
    secundario: { anyOf: [FATOR_SCHEMA, { type: "null" }] },
    intensidade: objeto({ D: { type: "integer" }, I: { type: "integer" }, S: { type: "integer" }, C: { type: "integer" } }),
    confianca: { type: "string", enum: ["alta", "media", "baixa"] },
    classificacao: { type: "string" },
    resumo: { type: "string" },
    comoFala: LISTA_TEXTOS,
    comoDecide: LISTA_TEXTOS,
    prefere: LISTA_TEXTOS,
    evita: LISTA_TEXTOS,
    comoAbordarNaV2: LISTA_TEXTOS,
    frasesQueConectam: LISTA_TEXTOS,
    evidencias: LISTA_TEXTOS,
  }),
  observacoes: { type: "string" },
});

// ---------------------------------------------------------------------
//  Pedido (o mesmo para a API e para copiar no claude.ai)
// ---------------------------------------------------------------------
export interface Pedido {
  sistema: string;
  usuario: string;
  partes: string[];
  palavras: number;
  tokensEstimados: number;
}

const atributo = (v: string) => v.replace(/[\n\r"<>]/g, " ").trim();

export function montarPedido(c: Cliente, transcricoes: Transcricao[]): Pedido {
  const usadas = transcricoes.filter((t) => t.incluir !== false && t.texto.trim());
  const blocos = usadas.map(
    (t, i) =>
      `<parte numero="${i + 1}" titulo="${atributo(t.titulo)}"${t.arquivo ? ` arquivo="${atributo(t.arquivo)}"` : ""}>\n${t.texto.trim()}\n</parte>`,
  );
  // Documentos longos primeiro; instruções e formato no fim.
  const usuario = `<transcricoes>
${blocos.join("\n\n")}
</transcricoes>

<resumo_diagnostico>
${resumoDiagnostico(c)}
</resumo_diagnostico>

Analise a reunião acima seguindo as regras e responda apenas com o JSON no formato abaixo, sem texto antes ou depois:
${MODELO_JSON}`;
  return {
    sistema: INSTRUCOES,
    usuario,
    partes: usadas.map((t) => t.titulo),
    palavras: usadas.reduce((t, x) => t + contarPalavras(x.texto), 0),
    tokensEstimados: estimarTokens(INSTRUCOES + usuario),
  };
}

/** Texto único para colar no claude.ai (lá não há campo de instruções do sistema). */
export const promptParaCopiar = (p: Pedido) =>
  `# Instruções\n${p.sistema}\n\n# Reunião e diagnóstico\n${p.usuario}\n\nDevolva só o JSON, em um único bloco de código.`;

// ---------------------------------------------------------------------
//  Erros (mensagens para o planejador)
// ---------------------------------------------------------------------
export type TipoErro =
  | "chave"
  | "permissao"
  | "modelo"
  | "cobranca"
  | "grande"
  | "limite"
  | "sobrecarga"
  | "rede"
  | "offline"
  | "tempo"
  | "recusa"
  | "cortada"
  | "resposta"
  | "cancelado"
  | "outro";

export class ErroAnalise extends Error {
  constructor(
    public tipo: TipoErro,
    public titulo: string,
    public detalhe: string,
  ) {
    super(`${titulo}: ${detalhe}`);
  }
}

function erroHttp(status: number, tipoApi: string, mensagem: string, modelo: string, esperar?: string): ErroAnalise {
  const msg = mensagem.toLowerCase();
  if (status === 401 || tipoApi === "authentication_error")
    return new ErroAnalise(
      "chave",
      "Chave da API inválida",
      "A Anthropic recusou a chave. Confira se ela foi copiada inteira (começa com sk-ant-) e se não foi apagada no console. Configurações → Chave da API do Claude.",
    );
  if (status === 402 || tipoApi === "billing_error" || msg.includes("credit balance"))
    return new ErroAnalise("cobranca", "Sem créditos na conta da Anthropic", "Adicione créditos em console.anthropic.com (Billing) e tente de novo.");
  if (status === 403 || tipoApi === "permission_error")
    return new ErroAnalise("permissao", "Chave sem permissão", `A chave não pode usar este recurso. ${mensagem}`.trim());
  if (status === 404 || tipoApi === "not_found_error")
    return new ErroAnalise("modelo", "Modelo indisponível", `O modelo "${modelo}" não existe ou não está liberado para a sua conta. Escolha outro em Configurações.`);
  if (status === 413 || tipoApi === "request_too_large" || /prompt is too long|input is too long|too many tokens|context (window|length)/.test(msg))
    return new ErroAnalise(
      "grande",
      "Texto grande demais",
      "As transcrições passaram do limite do modelo. Desmarque algumas partes e analise em etapas (na segunda análise, escolha \"Juntar\").",
    );
  if (status === 429 || tipoApi === "rate_limit_error")
    return new ErroAnalise(
      "limite",
      "Limite de uso da API atingido",
      `A conta chegou ao limite de pedidos ou de tokens por minuto. Aguarde ${esperar ? `${esperar} s` : "um minuto"} e tente de novo.`,
    );
  if (status >= 500 || tipoApi === "overloaded_error" || tipoApi === "api_error")
    return new ErroAnalise("sobrecarga", "A API do Claude está instável", "O serviço está sobrecarregado ou fora do ar. Tente de novo em alguns minutos.");
  return new ErroAnalise("outro", "Pedido recusado pela API", mensagem || `Erro ${status}.`);
}

// ---------------------------------------------------------------------
//  Chamada à API (streaming)
// ---------------------------------------------------------------------
export interface Progresso {
  fase: "conectando" | "pensando" | "escrevendo";
  caracteres: number;
  tentativa: number;
}

export interface ResultadoAnalise {
  analise: AnaliseReuniao;
  modelo: string;
  tokens: { entrada: number; saida: number };
  /** Um modelo reserva respondeu (o principal recusou pelo filtro de segurança). */
  houveFallback: boolean;
}

/** Recusas pelo filtro de segurança passam para um modelo reserva no servidor (modelos que aceitam). */
const aceitaFallback = (modelo: string) => /^claude-(opus-5|sonnet-5-5|fable-5)/.test(modelo);

const esperarMs = (ms: number, sinal: AbortSignal) =>
  new Promise<void>((ok, falha) => {
    const t = setTimeout(ok, ms);
    sinal.addEventListener("abort", () => {
      clearTimeout(t);
      falha(new DOMException("cancelado", "AbortError"));
    });
  });

export async function analisarComClaude({
  chave,
  modelo,
  pedido,
  sinal,
  aoProgresso,
}: {
  chave: string;
  modelo: string;
  pedido: Pedido;
  sinal: AbortSignal;
  aoProgresso?: (p: Progresso) => void;
}): Promise<ResultadoAnalise> {
  if (pedido.tokensEstimados > LIMITE_TOKENS_ENTRADA) throw erroHttp(413, "request_too_large", "", modelo);
  // Ajustes automáticos quando a API recusa um recurso opcional (beta ou formato).
  let comFallback = aceitaFallback(modelo);
  let comFormato = true;
  let tentativa = 1;
  for (;;) {
    try {
      return await chamar({ chave, modelo, pedido, sinal, comFallback, comFormato, tentativa, aoProgresso });
    } catch (e) {
      if (e instanceof ErroAnalise && e.tipo === "outro" && tentativa <= 3) {
        const msg = e.detalhe.toLowerCase();
        if (comFallback && /anthropic-beta|fallback/.test(msg)) {
          comFallback = false;
          tentativa++;
          continue;
        }
        if (comFormato && /output_config|output_format|json_schema|effort|structured/.test(msg)) {
          comFormato = false;
          tentativa++;
          continue;
        }
      }
      // Instabilidade passageira: tenta de novo até 2 vezes.
      if (e instanceof ErroAnalise && e.tipo === "sobrecarga" && tentativa <= 2) {
        await esperarMs(tentativa * 3000, sinal);
        tentativa++;
        continue;
      }
      throw e;
    }
  }
}

async function chamar({
  chave,
  modelo,
  pedido,
  sinal,
  comFallback,
  comFormato,
  tentativa,
  aoProgresso,
}: {
  chave: string;
  modelo: string;
  pedido: Pedido;
  sinal: AbortSignal;
  comFallback: boolean;
  comFormato: boolean;
  tentativa: number;
  aoProgresso?: (p: Progresso) => void;
}): Promise<ResultadoAnalise> {
  const corpo: Record<string, unknown> = {
    model: modelo,
    max_tokens: MAX_TOKENS,
    stream: true,
    system: pedido.sistema,
    messages: [{ role: "user", content: pedido.usuario }],
  };
  // Raciocínio adaptativo é o padrão dos modelos atuais; o esforço "high" pede uma análise cuidadosa.
  if (comFormato) corpo.output_config = { effort: "high", format: { type: "json_schema", schema: ESQUEMA_RESPOSTA } };
  if (comFallback) corpo.fallbacks = "default";
  const cabecalhos: Record<string, string> = {
    "content-type": "application/json",
    "x-api-key": chave.trim(),
    "anthropic-version": VERSAO_API,
    // Chamada direto do navegador (sem servidor): a chave fica neste computador.
    "anthropic-dangerous-direct-browser-access": "true",
  };
  if (comFallback) cabecalhos["anthropic-beta"] = "server-side-fallback-2026-07-01";

  // Cancelamento pelo usuário ou por silêncio longo da API.
  const controle = new AbortController();
  let estourou = false;
  const cancelar = () => controle.abort();
  sinal.addEventListener("abort", cancelar);
  let relogio: ReturnType<typeof setTimeout> | undefined;
  const vigiar = () => {
    clearTimeout(relogio);
    relogio = setTimeout(() => {
      estourou = true;
      controle.abort();
    }, SILENCIO_MAX_MS);
  };

  let caracteres = 0;
  aoProgresso?.({ fase: "conectando", caracteres, tentativa });
  try {
    vigiar();
    let resposta: Response;
    try {
      resposta = await fetch(URL_API, { method: "POST", headers: cabecalhos, body: JSON.stringify(corpo), signal: controle.signal });
    } catch (e) {
      throw erroDeRede(e, sinal, estourou);
    }
    if (!resposta.ok) {
      let tipoApi = "";
      let mensagem = "";
      try {
        const json = await resposta.json();
        tipoApi = json?.error?.type ?? "";
        mensagem = json?.error?.message ?? "";
      } catch {
        /* corpo sem JSON */
      }
      throw erroHttp(resposta.status, tipoApi, mensagem, modelo, resposta.headers.get("retry-after") ?? undefined);
    }
    if (!resposta.body) throw new ErroAnalise("resposta", "Resposta vazia", "A API não devolveu conteúdo. Tente de novo.");

    // Leitura dos eventos SSE (event: … / data: {…}, separados por linha em branco).
    let texto = "";
    let modeloUsado = modelo;
    let parada: string | null = null;
    let entrada = 0;
    let saida = 0;
    let houveFallback = false;
    const tratar = (bloco: string) => {
      const dados = bloco
        .split("\n")
        .filter((l) => l.startsWith("data:"))
        .map((l) => l.slice(5).trimStart())
        .join("\n");
      if (!dados) return;
      let ev: Record<string, any>;
      try {
        ev = JSON.parse(dados);
      } catch {
        return;
      }
      switch (ev.type) {
        case "message_start":
          modeloUsado = ev.message?.model ?? modeloUsado;
          entrada = n(ev.message?.usage?.input_tokens) + n(ev.message?.usage?.cache_read_input_tokens) + n(ev.message?.usage?.cache_creation_input_tokens);
          aoProgresso?.({ fase: "pensando", caracteres, tentativa });
          break;
        case "content_block_start":
          if (ev.content_block?.type === "fallback") houveFallback = true;
          if (ev.content_block?.type === "text" && ev.content_block.text) texto += ev.content_block.text;
          break;
        case "content_block_delta":
          // Junta o texto de todos os blocos (após uma troca de modelo, a resposta continua no bloco seguinte).
          if (ev.delta?.type === "text_delta") {
            texto += ev.delta.text ?? "";
            caracteres = texto.length;
            aoProgresso?.({ fase: "escrevendo", caracteres, tentativa });
          }
          break;
        case "message_delta":
          parada = ev.delta?.stop_reason ?? parada;
          if (ev.usage?.output_tokens !== undefined) saida = n(ev.usage.output_tokens);
          if (ev.usage?.input_tokens) entrada = n(ev.usage.input_tokens) + n(ev.usage.cache_read_input_tokens) + n(ev.usage.cache_creation_input_tokens);
          break;
        case "error":
          throw erroHttp(0, ev.error?.type ?? "", ev.error?.message ?? "", modelo);
      }
    };
    const leitor = resposta.body.getReader();
    const decodificador = new TextDecoder();
    let buffer = "";
    try {
      for (;;) {
        const { done, value } = await leitor.read();
        if (done) break;
        vigiar();
        buffer = (buffer + decodificador.decode(value, { stream: true })).replace(/\r\n?/g, "\n");
        let i: number;
        while ((i = buffer.indexOf("\n\n")) >= 0) {
          tratar(buffer.slice(0, i));
          buffer = buffer.slice(i + 2);
        }
      }
      if (buffer.trim()) tratar(buffer);
    } catch (e) {
      if (e instanceof ErroAnalise) throw e;
      throw erroDeRede(e, sinal, estourou);
    }

    if (parada === "refusal")
      throw new ErroAnalise("recusa", "O Claude não fez a análise", "O filtro de segurança da Anthropic recusou o pedido. Tente de novo ou escolha outro modelo em Configurações.");
    if (parada === "max_tokens")
      throw new ErroAnalise("cortada", "Resposta incompleta", "A resposta passou do tamanho máximo. Tente de novo; se repetir, analise as partes separadas.");
    const analise = lerRespostaJSON(texto);
    return { analise, modelo: modeloUsado, tokens: { entrada, saida }, houveFallback };
  } finally {
    clearTimeout(relogio);
    sinal.removeEventListener("abort", cancelar);
  }
}

function erroDeRede(e: unknown, sinal: AbortSignal, estourou: boolean): ErroAnalise {
  if (sinal.aborted) return new ErroAnalise("cancelado", "Análise cancelada", "Nada foi alterado.");
  if (estourou) return new ErroAnalise("tempo", "A API parou de responder", "Passaram 3 minutos sem resposta. Tente de novo.");
  if (typeof navigator !== "undefined" && navigator.onLine === false)
    return new ErroAnalise("offline", "Sem internet", "Conecte-se e tente de novo, ou use \"Copiar prompt\" e cole a resposta depois.");
  return new ErroAnalise(
    "rede",
    "Não foi possível falar com a API",
    `Verifique a internet, o antivírus ou o firewall da rede (api.anthropic.com precisa estar liberado).${e instanceof Error && e.message ? ` Detalhe: ${e.message}` : ""}`,
  );
}

// ---------------------------------------------------------------------
//  Validação da resposta (API ou colada do claude.ai)
// ---------------------------------------------------------------------
/** Lê o JSON da resposta (aceita bloco ```json e texto em volta) e normaliza. */
export function lerRespostaJSON(bruto: string): AnaliseReuniao {
  const texto = bruto.trim();
  if (!texto) throw new ErroAnalise("resposta", "Resposta vazia", "Cole a resposta do Claude (o bloco JSON).");
  const cerca = texto.match(/```(?:json)?\s*([\s\S]*?)```/i);
  let candidato = cerca ? cerca[1] : texto;
  const ini = candidato.indexOf("{");
  const fim = candidato.lastIndexOf("}");
  if (ini < 0 || fim <= ini)
    throw new ErroAnalise("resposta", "Não encontrei o JSON", "A resposta deve ter um bloco que começa com { e termina com }. Peça ao Claude para devolver só o JSON.");
  candidato = candidato.slice(ini, fim + 1);
  let json: unknown;
  try {
    json = JSON.parse(candidato);
  } catch (e) {
    throw new ErroAnalise(
      "resposta",
      "JSON inválido",
      `O texto não é um JSON válido${e instanceof Error ? ` (${e.message})` : ""}. Copie a resposta inteira, sem cortar o fim.`,
    );
  }
  if (!pareceAnalise(json))
    throw new ErroAnalise("resposta", "Formato diferente do esperado", "Não encontrei os campos da análise (dores, preocupações, gatilhos, notas, perfil).");
  return normalizarAnalise(json, true);
}

const CHAVES_ANALISE = ["dores", "preocupacoes", "gatilhos", "notas", "perfil"];
const pareceAnalise = (x: unknown): x is Record<string, unknown> =>
  !!x && typeof x === "object" && !Array.isArray(x) && CHAVES_ANALISE.some((k) => k in (x as Record<string, unknown>));

const limpar = (v: unknown, max = 600) =>
  (typeof v === "string" ? v : typeof v === "number" ? String(v) : "").replace(/\s+/g, " ").trim().slice(0, max);
const semAspas = (t: string) => t.replace(/^["“”'‘’«»\s]+|["“”'‘’«»\s]+$/g, "");

/** Limites para respostas da IA (os dados guardados não são cortados). */
interface Limites {
  itens: number;
  texto: number;
}
const LIMITES_IA: Limites = { itens: 15, texto: 600 };
const SEM_LIMITES: Limites = { itens: 500, texto: 20000 };

function itens(v: unknown, lim: Limites): ItemAnalise[] {
  if (!Array.isArray(v)) return [];
  const saida: ItemAnalise[] = [];
  for (const x of v) {
    if (typeof x === "string") {
      const texto = limpar(x, lim.texto);
      if (texto) saida.push({ id: uid(), texto });
    } else if (x && typeof x === "object") {
      const o = x as Record<string, unknown>;
      const texto = limpar(o.texto ?? o.item ?? o.descricao, lim.texto);
      if (!texto) continue;
      const evidencia = semAspas(limpar(o.evidencia ?? o.trecho, lim.texto));
      saida.push({
        id: typeof o.id === "string" && o.id ? o.id : uid(),
        texto,
        ...(evidencia ? { evidencia } : {}),
        ...(o.fraca === true ? { fraca: true } : {}),
      });
    }
  }
  return saida.slice(0, lim.itens);
}

function textos(v: unknown, lim: Limites): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((x) => limpar(x && typeof x === "object" ? (x as Record<string, unknown>).texto : x, lim.texto))
    .filter(Boolean)
    .slice(0, lim.itens);
}

/** "D", "d", "Dominância", "Influência"… → fator. */
export function lerFator(v: unknown): FatorDisc | undefined {
  const t = limpar(v, 40).toUpperCase();
  if (!t) return undefined;
  if ((FATORES_DISC as string[]).includes(t[0]) && (t.length === 1 || !/[A-ZÀ-Ü]/.test(t[1]))) return t[0] as FatorDisc;
  if (t.startsWith("DOMIN")) return "D";
  if (t.startsWith("INFLU")) return "I";
  if (t.startsWith("ESTAB") || t.startsWith("STEAD")) return "S";
  if (t.startsWith("CONFOR") || t.startsWith("CONSC") || t.startsWith("COMPL")) return "C";
  return undefined;
}

function intensidade(v: unknown): PerfilComportamental["intensidade"] {
  if (!v || typeof v !== "object") return undefined;
  const o = v as Record<string, unknown>;
  const valores = FATORES_DISC.map((f) => [f, Number(o[f] ?? o[f.toLowerCase()])] as const).filter(([, x]) => Number.isFinite(x));
  if (!valores.length) return undefined;
  // Escala de 0 a 1 vira 0 a 100.
  const fracao = valores.every(([, x]) => x >= 0 && x <= 1) && valores.some(([, x]) => x > 0 && x < 1);
  return Object.fromEntries(valores.map(([f, x]) => [f, Math.round(Math.max(0, Math.min(100, fracao ? x * 100 : x)))]));
}

function perfil(v: unknown, lim: Limites): PerfilComportamental {
  if (!v || typeof v !== "object") return {};
  const o = v as Record<string, unknown>;
  const conf = limpar(o.confianca, 10)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  let predominante = lerFator(o.predominante);
  const int = intensidade(o.intensidade);
  // Sem fator predominante, usa o de maior intensidade.
  if (!predominante && int) {
    const maior = FATORES_DISC.filter((f) => int[f] !== undefined).sort((a, b) => (int[b] ?? 0) - (int[a] ?? 0))[0];
    if (maior && (int[maior] ?? 0) > 0) predominante = maior;
  }
  const secundario = lerFator(o.secundario);
  const resultado: PerfilComportamental = {
    predominante,
    predominanteIA: lerFator(o.predominanteIA) ?? predominante,
    secundario: secundario && secundario !== predominante ? secundario : undefined,
    intensidade: int,
    confianca: conf === "alta" || conf === "media" || conf === "baixa" ? conf : undefined,
    classificacao: limpar(o.classificacao, Math.min(lim.texto, 120)) || undefined,
    resumo: limpar(o.resumo, lim.texto * 3) || undefined,
    comoFala: textos(o.comoFala, lim),
    comoDecide: textos(o.comoDecide, lim),
    prefere: textos(o.prefere, lim),
    evita: textos(o.evita, lim),
    comoAbordarNaV2: textos(o.comoAbordarNaV2, lim),
    frasesQueConectam: textos(o.frasesQueConectam, lim),
    evidencias: textos(o.evidencias, lim).map(semAspas),
  };
  return resultado;
}

const textoOpcional = (v: unknown) => (typeof v === "string" && v ? v : undefined);

/**
 * Normaliza uma análise vinda da IA, colada ou guardada (aceita listas de texto
 * da versão anterior). Campos ausentes viram listas vazias. `daIA` limita o tamanho
 * das listas e dos textos (os dados guardados não são cortados).
 */
export function normalizarAnalise(x: unknown, daIA = false): AnaliseReuniao {
  const base = analiseVazia();
  const lim = daIA ? LIMITES_IA : SEM_LIMITES;
  if (!x || typeof x !== "object") return base;
  const o = x as Record<string, unknown>;
  const notas = (o.notas && typeof o.notas === "object" ? o.notas : {}) as Record<string, unknown>;
  const tokens = o.tokens as { entrada?: unknown; saida?: unknown } | undefined;
  return {
    dores: itens(o.dores, lim),
    preocupacoes: itens(o.preocupacoes, lim),
    gatilhos: itens(o.gatilhos, lim),
    notas: {
      objecoes: itens(notas.objecoes, lim),
      gaps: itens(notas.gaps, lim),
      perguntasV2: itens(notas.perguntasV2, lim),
      riscos: itens(notas.riscos, lim),
      oportunidades: itens(notas.oportunidades, lim),
      livre: typeof notas.livre === "string" ? notas.livre : "",
    },
    perfil: perfil(o.perfil, lim),
    observacoes: limpar(o.observacoes, lim.texto * 3) || undefined,
    origem: o.origem === "ia" || o.origem === "manual" || o.origem === "colada" ? o.origem : undefined,
    geradaEm: textoOpcional(o.geradaEm),
    editadaEm: textoOpcional(o.editadaEm),
    modelo: textoOpcional(o.modelo),
    duracaoSeg: typeof o.duracaoSeg === "number" ? o.duracaoSeg : undefined,
    tokens: tokens && typeof tokens.entrada === "number" && typeof tokens.saida === "number" ? { entrada: tokens.entrada, saida: tokens.saida } : undefined,
    partes: Array.isArray(o.partes) ? o.partes.filter((p): p is string => typeof p === "string") : undefined,
  };
}

// ---------------------------------------------------------------------
//  Substituir ou juntar com o que já existe
// ---------------------------------------------------------------------
const LISTAS_PERFIL = ["comoFala", "comoDecide", "prefere", "evita", "comoAbordarNaV2", "frasesQueConectam", "evidencias"] as const;

export function temConteudo(a?: AnaliseReuniao) {
  if (!a) return false;
  const listas = [a.dores, a.preocupacoes, a.gatilhos, a.notas.objecoes, a.notas.gaps, a.notas.perguntasV2, a.notas.riscos, a.notas.oportunidades];
  return listas.some((l) => l.length > 0) || !!a.perfil.predominante || !!a.perfil.classificacao || LISTAS_PERFIL.some((k) => (a.perfil[k]?.length ?? 0) > 0);
}

/** Houve edição à mão depois da última análise (pergunta antes de substituir). */
export const foiEditada = (a?: AnaliseReuniao) => !!a?.editadaEm && (!a.geradaEm || a.editadaEm > a.geradaEm) && temConteudo(a);

const chaveTexto = (t: string) =>
  t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
const unir = (atual: ItemAnalise[], novos: ItemAnalise[]) => {
  const vistos = new Set(atual.map((i) => chaveTexto(i.texto)));
  return [...atual, ...novos.filter((i) => !vistos.has(chaveTexto(i.texto)))];
};
const unirTextos = (atual: string[] = [], novos: string[] = []) => {
  const vistos = new Set(atual.map(chaveTexto));
  return [...atual, ...novos.filter((t) => !vistos.has(chaveTexto(t)))];
};

/**
 * Aplica uma análise nova. "substituir" troca tudo; "juntar" mantém os itens atuais e
 * acrescenta os novos. Nos dois casos as anotações livres e o fator ajustado à mão ficam.
 */
export function aplicarAnalise(atual: AnaliseReuniao | undefined, nova: AnaliseReuniao, modo: "substituir" | "juntar"): AnaliseReuniao {
  const livre = atual?.notas.livre ?? "";
  const ajustado = atual?.perfil.predominante && atual.perfil.predominanteIA && atual.perfil.predominante !== atual.perfil.predominanteIA;
  if (modo === "substituir" || !atual) {
    return { ...nova, editadaEm: undefined, notas: { ...nova.notas, livre } };
  }
  const perfilNovo: PerfilComportamental = { ...nova.perfil };
  for (const k of LISTAS_PERFIL) perfilNovo[k] = unirTextos(atual.perfil[k], nova.perfil[k]);
  if (ajustado) perfilNovo.predominante = atual.perfil.predominante;
  return {
    ...nova,
    dores: unir(atual.dores, nova.dores),
    preocupacoes: unir(atual.preocupacoes, nova.preocupacoes),
    gatilhos: unir(atual.gatilhos, nova.gatilhos),
    notas: {
      objecoes: unir(atual.notas.objecoes, nova.notas.objecoes),
      gaps: unir(atual.notas.gaps, nova.notas.gaps),
      perguntasV2: unir(atual.notas.perguntasV2, nova.notas.perguntasV2),
      riscos: unir(atual.notas.riscos, nova.notas.riscos),
      oportunidades: unir(atual.notas.oportunidades, nova.notas.oportunidades),
      livre,
    },
    perfil: perfilNovo,
    editadaEm: undefined,
  };
}
