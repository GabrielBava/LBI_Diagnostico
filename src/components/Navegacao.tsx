// Menu lateral que acompanha a rolagem (scrollspy). Clique leva à seção.
import { useEffect, useRef, useState } from "react";
import { Check, EyeOff } from "lucide-react";
import { ETAPAS, SECOES, progresso, secaoConcluida, secaoOculta } from "@/config/estrutura";
import type { Cliente } from "@/types";
import { usePreferencias } from "@/lib/preferencias";
import { BarraProgresso } from "./ui";

/** Devolve o id da seção que está no topo da leitura (a última que já passou da faixa fixa do topo). */
export function useSecaoAtiva(ids: string[]) {
  const [ativa, setAtiva] = useState(ids[0]);
  useEffect(() => {
    let quadro = 0;
    const calcular = () => {
      quadro = 0;
      let atual = ids[0];
      for (const id of ids) {
        const el = document.getElementById(`sec-${id}`);
        if (el && el.getBoundingClientRect().top <= 110) atual = id;
      }
      // No fim da página, a última seção é a ativa (mesmo que não chegue ao topo).
      const fim = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      setAtiva(fim && window.scrollY > 0 ? ids[ids.length - 1] : atual);
    };
    const aoRolar = () => {
      if (!quadro) quadro = requestAnimationFrame(calcular);
    };
    calcular();
    window.addEventListener("scroll", aoRolar, { passive: true });
    window.addEventListener("resize", aoRolar);
    return () => {
      window.removeEventListener("scroll", aoRolar);
      window.removeEventListener("resize", aoRolar);
      cancelAnimationFrame(quadro);
    };
  }, [ids.join("|")]); // eslint-disable-line react-hooks/exhaustive-deps
  return ativa;
}

export function Navegacao({ cliente, ativa, irPara }: { cliente: Cliente; ativa: string; irPara: (id: string) => void }) {
  const { apresentacao } = usePreferencias();
  const prog = progresso(cliente);
  const refAtiva = useRef<HTMLButtonElement>(null);
  const refMenu = useRef<HTMLDivElement>(null);

  // Mantém o item ativo visível dentro do menu (desktop: vertical; celular: faixa horizontal).
  // Rola só o menu, sem interferir na rolagem da página.
  useEffect(() => {
    const menu = refMenu.current;
    const el = refAtiva.current;
    if (!menu || !el) return;
    const r = el.getBoundingClientRect();
    const m = menu.getBoundingClientRect();
    if (menu.scrollWidth > menu.clientWidth + 4) menu.scrollLeft += r.left + r.width / 2 - (m.left + m.width / 2);
    else if (ativa === SECOES[0].id) menu.scrollTop = 0;
    else if (r.top < m.top + 8) menu.scrollTop += r.top - m.top - 48;
    else if (r.bottom > m.bottom - 8) menu.scrollTop += r.bottom - m.bottom + 48;
  }, [ativa]);

  return (
    <nav className="no-print min-w-0 max-w-full shrink-0 md:w-56 lg:w-64">
      <div ref={refMenu} className="sticky top-20 z-10 flex max-w-full flex-row gap-3 overflow-x-auto rounded-xl border border-border bg-card p-2 md:max-h-[calc(100vh-6rem)] md:flex-col md:overflow-y-auto md:overflow-x-hidden md:p-3">
        {!apresentacao && (
          <div className="hidden rounded-lg border border-primary/25 bg-primary/5 p-3 md:block">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">Coleta</span>
              <span className="text-xs font-bold text-primary">{prog.pct}%</span>
            </div>
            <BarraProgresso valor={prog.pct} className="mt-2" />
            <p className="mt-2 text-[11px] leading-snug text-muted-foreground">{prog.mensagem}</p>
          </div>
        )}
        {ETAPAS.map((etapa) => {
          const secoes = SECOES.filter((x) => x.etapa === etapa.id && !(apresentacao && secaoOculta(cliente, x)));
          if (!secoes.length) return null;
          return (
            <div key={etapa.id} className="flex shrink-0 flex-row gap-1 md:flex-col">
              <div className="hidden px-2 pb-0.5 pt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/80 md:block">
                {etapa.numero} · {etapa.nome}
              </div>
              {secoes.map((x) => {
                const ehAtiva = x.id === ativa;
                const ok = x.coleta && secaoConcluida(cliente, x);
                const oculta = secaoOculta(cliente, x);
                return (
                  <button
                    key={x.id}
                    ref={ehAtiva ? refAtiva : undefined}
                    type="button"
                    onClick={() => irPara(x.id)}
                    className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-left text-xs transition md:whitespace-normal ${
                      ehAtiva ? "bg-gold font-semibold text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                    }`}
                  >
                    <span
                      className={`flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1 text-[9px] font-bold ${
                        ehAtiva ? "bg-primary-foreground/25" : ok ? "bg-success/20 text-success" : "bg-muted/60"
                      }`}
                    >
                      {ok && !ehAtiva ? <Check className="h-3 w-3" strokeWidth={3} /> : x.numero}
                    </span>
                    <span className="min-w-0 flex-1">{x.titulo}</span>
                    {oculta && !apresentacao && <EyeOff className="h-3 w-3 shrink-0 opacity-60" aria-label="Oculta na apresentação" />}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
