// 5.2 · Recomendações: aberta pelo botão "Gerar recomendações" (logo abaixo do 5.1).
// Começa com três blocos de indicação (nome e contato) — o título do bloco vira o nome digitado —
// e o consultor pode adicionar mais ou remover. Abaixo, os modelos de mensagem (para o cliente e
// para os amigos e familiares) e o botão "Finalizar recomendações", como na coleta.
// Sem nada preenchido, dá para fechar a 5.2 e voltar ao botão.
import { useState, type ReactNode } from "react";
import { Check, ClipboardCheck, Copy, MessageCircle, RotateCcw, Trash2, X } from "lucide-react";
import { CAMPOS_RECOMENDACAO } from "@/config/campos";
import { recomendacoesPreenchidas } from "@/config/estrutura";
import { MENSAGEM_AMIGOS, MENSAGEM_CLIENTE, preencherMensagem } from "@/config/mensagens";
import { Formulario } from "@/components/campos";
import { Botao, BotaoAdicionar, BotaoOuro, SubBloco } from "@/components/ui";
import { useCliente } from "@/lib/cliente-context";
import { s } from "@/lib/calculos";
import { fmtData, uid } from "@/lib/format";
import { usePreferencias } from "@/lib/preferencias";
import type { Valor } from "@/types";

/** Copia o texto (com alternativa para navegadores que bloqueiam a área de transferência). */
async function copiar(texto: string) {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = texto;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  }
}

/** Número para o link do WhatsApp (DDD + número; acrescenta o 55 do Brasil quando falta). */
const numeroWhatsApp = (telefone: string) => {
  const d = telefone.replace(/\D/g, "");
  if (d.length === 10 || d.length === 11) return `55${d}`;
  if ((d.length === 12 || d.length === 13) && d.startsWith("55")) return d;
  return "";
};

function CartaoMensagem({
  titulo,
  subtitulo,
  texto,
  telefone,
  extra,
}: {
  titulo: string;
  subtitulo: string;
  texto: string;
  /** Telefone do destinatário (abre o WhatsApp direto na conversa). */
  telefone?: string;
  extra?: ReactNode;
}) {
  const [copiado, setCopiado] = useState(false);
  const numero = telefone ? numeroWhatsApp(telefone) : "";
  const link = `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
  return (
    <div className="flex min-w-0 flex-col rounded-xl border border-border bg-card p-4">
      <div className="mb-2">
        <div className="text-sm font-semibold">{titulo}</div>
        <div className="text-xs text-muted-foreground">{subtitulo}</div>
      </div>
      {extra}
      <p className="flex-1 whitespace-pre-line rounded-lg bg-secondary/40 p-3 text-sm leading-relaxed [overflow-wrap:anywhere]">{texto}</p>
      <div className="no-print mt-3 flex flex-wrap gap-2">
        <Botao
          pequeno
          onClick={async () => {
            if (await copiar(texto)) {
              setCopiado(true);
              window.setTimeout(() => setCopiado(false), 2000);
            }
          }}
        >
          {copiado ? <Check className="h-3.5 w-3.5 text-success" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
          {copiado ? "Copiado" : "Copiar"}
        </Botao>
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-xs font-medium text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
        >
          <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" /> {numero ? "Enviar no WhatsApp" : "Abrir no WhatsApp"}
        </a>
        <span aria-live="polite" className="sr-only">
          {copiado ? "Mensagem copiada" : ""}
        </span>
      </div>
    </div>
  );
}

export default function Recomendacoes() {
  const { cliente, setLista, atualizar, irPara } = useCliente();
  const { apresentacao } = usePreferencias();
  const itens = cliente.recomendacoes;
  const preenchidas = recomendacoesPreenchidas(cliente);
  const finalizadas = !!cliente.recomendacoesFinalizadas;
  const primeiroNome = s(cliente.cadastro.nome).trim().split(/\s+/)[0] ?? "";
  // Nomes das indicações para personalizar a mensagem dos amigos.
  const nomes = itens.map((i) => s(i.nome).trim()).filter(Boolean);
  const [destinatario, setDestinatario] = useState("");
  const nomeEscolhido = nomes.includes(destinatario) ? destinatario : "";

  const alterar = (id: string, key: string, v: Valor) => setLista("recomendacoes", itens.map((i) => (i.id === id ? { ...i, [key]: v } : i)));
  const remover = (id: string) => setLista("recomendacoes", itens.filter((i) => i.id !== id));
  const fechar = () => {
    atualizar((c) => ({ ...c, recomendacoesAbertas: undefined, recomendacoesFinalizadas: undefined, recomendacoes: [] }));
    window.setTimeout(() => irPara("gerar-recomendacoes"), 120);
  };
  const finalizar = () => {
    atualizar((c) => ({ ...c, recomendacoesFinalizadas: new Date().toISOString() }));
    // Na versão consultor, segue para o diagnóstico completo (etapa 6).
    if (!apresentacao) window.setTimeout(() => irPara("panorama"), 120);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="min-w-0 flex-1 basis-[260px] text-sm text-muted-foreground">
          Quem mais pode se beneficiar de um planejamento como este? Anote o nome e o melhor contato de cada indicação.
        </p>
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground" aria-live="polite">
          {preenchidas === 1 ? "1 recomendação preenchida" : `${preenchidas} recomendações preenchidas`}
        </span>
      </div>

      {itens.length === 0 ? (
        <p className="px-1 text-xs text-muted-foreground">Nenhuma recomendação. Adicione abaixo.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {itens.map((item, i) => {
            const nome = s(item.nome).trim();
            return (
              <li key={item.id} className="aparecer min-w-0 rounded-xl border border-border bg-card p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  {/* O título do bloco acompanha o nome digitado. */}
                  <span className="flex min-w-0 items-center gap-2 text-xs font-semibold text-muted-foreground">
                    <span className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 px-1 text-[11px] font-bold text-primary">
                      {i + 1}
                    </span>
                    <span className={`truncate ${nome ? "text-sm text-foreground" : ""}`}>{nome || `Recomendação ${i + 1}`}</span>
                  </span>
                  <button
                    type="button"
                    aria-label={`Remover ${nome || `a recomendação ${i + 1}`}`}
                    title="Remover"
                    onClick={() => remover(item.id)}
                    className="no-print shrink-0 rounded-md p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <Formulario campos={CAMPOS_RECOMENDACAO} dados={item} cliente={cliente} colunas={2} onChange={(k, v) => alterar(item.id, k, v)} />
              </li>
            );
          })}
        </ul>
      )}

      <BotaoAdicionar onClick={() => setLista("recomendacoes", [...itens, { id: uid() }])}>Adicionar recomendação</BotaoAdicionar>

      <SubBloco titulo="Modelos de mensagem">
        <div className="grid gap-3 lg:grid-cols-2">
          <CartaoMensagem
            titulo={MENSAGEM_CLIENTE.titulo}
            subtitulo={MENSAGEM_CLIENTE.subtitulo}
            texto={preencherMensagem(MENSAGEM_CLIENTE.texto, { cliente: primeiroNome })}
            telefone={s(cliente.cadastro.telefone)}
          />
          <CartaoMensagem
            titulo={MENSAGEM_AMIGOS.titulo}
            subtitulo={MENSAGEM_AMIGOS.subtitulo}
            texto={preencherMensagem(MENSAGEM_AMIGOS.texto, { nome: nomeEscolhido.split(/\s+/)[0] })}
            extra={
              nomes.length > 0 && (
                <div className="no-print mb-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="text-muted-foreground">Personalizar para:</span>
                  {nomes.map((nome) => (
                    <button
                      key={nome}
                      type="button"
                      aria-pressed={nomeEscolhido === nome}
                      onClick={() => setDestinatario(nomeEscolhido === nome ? "" : nome)}
                      className="rounded-full border border-primary/40 px-2 py-0.5 font-semibold text-primary hover:bg-primary/10 aria-pressed:bg-primary/15"
                    >
                      {nome}
                    </button>
                  ))}
                </div>
              )
            }
          />
        </div>
      </SubBloco>

      {finalizadas ? (
        !apresentacao && (
          <div className="no-print flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-4 py-2.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <ClipboardCheck className="h-3.5 w-3.5 text-success" aria-hidden="true" />
              Recomendações finalizadas em {fmtData(cliente.recomendacoesFinalizadas ?? "")}.
            </span>
            <Botao variante="fantasma" pequeno onClick={() => atualizar((c) => ({ ...c, recomendacoesFinalizadas: undefined }))}>
              <RotateCcw className="h-3 w-3" aria-hidden="true" /> Reabrir recomendações
            </Botao>
          </div>
        )
      ) : (
        <div className="no-print flex flex-col gap-3 rounded-xl border border-primary/40 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {preenchidas > 0
              ? `${preenchidas === 1 ? "1 recomendação registrada" : `${preenchidas} recomendações registradas`}. Finalize para encerrar esta etapa.`
              : "Sem indicações por enquanto? Dá para finalizar assim mesmo."}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {!apresentacao && preenchidas === 0 && (
              <Botao variante="fantasma" pequeno onClick={fechar} title="Tira a 5.2 do diagnóstico e volta ao botão Gerar recomendações">
                <X className="h-3 w-3" aria-hidden="true" /> Fechar recomendações
              </Botao>
            )}
            <BotaoOuro onClick={finalizar} className="justify-center px-5 py-2.5 text-sm">
              <ClipboardCheck className="h-4 w-4" aria-hidden="true" /> Finalizar recomendações
            </BotaoOuro>
          </div>
        </div>
      )}
    </div>
  );
}
