import { useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Eye, EyeOff, Moon, Settings, Sun, X } from "lucide-react";
import { APP } from "@/config/defaults";
import { usePreferencias } from "@/lib/preferencias";
import { lerConfig, salvarConfig, useClientes } from "@/lib/storage";
import { fmtData } from "@/lib/format";
import { s } from "@/lib/calculos";

export function Logo() {
  return (
    <Link to="/clientes" className="flex items-center gap-3">
      <span className="flex items-center rounded-md border border-primary/30 bg-background px-2 py-1">
        <span className="text-gold text-lg font-black tracking-[0.12em]">LIFE</span>
      </span>
      <div className="hidden border-l border-border pl-3 leading-tight sm:block">
        <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">{APP.nome}</div>
        <div className="text-xs font-medium text-muted-foreground">{APP.slogan}</div>
      </div>
    </Link>
  );
}

const botaoIcone =
  "relative flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground";

export function Header() {
  const { tema, alternarTema, apresentacao, alternarApresentacao } = usePreferencias();
  const [config, setConfig] = useState(lerConfig());
  const [painel, setPainel] = useState<"notificacoes" | "config" | null>(null);
  const clientes = useClientes();

  // Notificações: ações do plano pendentes com prazo vencido ou nos próximos 7 dias.
  const hoje = new Date().toISOString().slice(0, 10);
  const limite = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
  const alertas = clientes.flatMap((c) =>
    c.plano
      .filter((a) => s(a.status) !== "Concluída" && s(a.prazo) && s(a.prazo) <= limite)
      .map((a) => ({ cliente: c, acao: a, vencida: s(a.prazo) < hoje })),
  );

  return (
    <header className="no-print sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/85 px-4 backdrop-blur md:px-8">
      <Logo />
      <span
        title={`Versão da plataforma — ${APP.versao}`}
        className="hidden rounded-full border border-border bg-card/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground md:inline-block"
      >
        {APP.versao}
      </span>
      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <button
          type="button"
          onClick={alternarApresentacao}
          title={apresentacao ? "Sair do modo apresentação" : "Modo apresentação: oculta roteiro e anotações"}
          className={`flex h-8 items-center gap-1.5 rounded-md px-2 text-xs transition ${
            apresentacao ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          {apresentacao ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          <span className="hidden lg:inline">{apresentacao ? "Modo apresentação" : "Modo consultor"}</span>
        </button>
        <div className="relative">
          <button type="button" aria-label="Notificações" className={botaoIcone} onClick={() => setPainel(painel === "notificacoes" ? null : "notificacoes")}>
            <Bell className="h-4 w-4" />
            {alertas.length > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary" />}
          </button>
          {painel === "notificacoes" && (
            <div className="absolute right-0 top-10 w-80 rounded-xl border border-border bg-popover p-3 shadow-xl">
              <div className="mb-2 text-xs font-semibold">Ações com prazo próximo</div>
              {alertas.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma ação vencida ou para os próximos 7 dias.</p>}
              <ul className="max-h-72 space-y-1 overflow-auto">
                {alertas.map(({ cliente, acao, vencida }) => (
                  <li key={acao.id}>
                    <Link
                      to={`/clientes/${cliente.id}?etapa=plano`}
                      onClick={() => setPainel(null)}
                      className="block rounded-md px-2 py-1.5 text-xs hover:bg-muted"
                    >
                      <div className="font-medium">{s(acao.acao) || "Ação sem título"}</div>
                      <div className={vencida ? "text-destructive" : "text-muted-foreground"}>
                        {s(cliente.cadastro.nome)} · {vencida ? "venceu" : "vence"} em {fmtData(s(acao.prazo))}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <button type="button" aria-label={tema === "dark" ? "Ativar fundo claro" : "Ativar fundo escuro"} className={botaoIcone} onClick={alternarTema}>
          {tema === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <button type="button" aria-label="Configurações" className={botaoIcone} onClick={() => setPainel(painel === "config" ? null : "config")}>
          <Settings className="h-4 w-4" />
        </button>
        <div className="ml-1 flex items-center gap-2 rounded-full border border-border bg-card/60 py-1 pl-1 pr-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gold text-[11px] font-semibold text-primary-foreground">
            {(config.consultor || "?").charAt(0).toUpperCase()}
          </div>
          <div className="hidden leading-tight md:block">
            <div className="text-xs font-semibold">{config.consultor || "Consultor"}</div>
            <div className="text-[10px] text-muted-foreground">{config.empresa}</div>
          </div>
        </div>
      </div>

      {painel === "config" && (
        <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/50 p-4 pt-24" onClick={() => setPainel(null)}>
          <div className="w-full max-w-md rounded-xl border border-border bg-popover p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Configurações</h2>
              <button type="button" aria-label="Fechar" onClick={() => setPainel(null)} className={botaoIcone}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                salvarConfig(config);
                setPainel(null);
              }}
            >
              <label className="block">
                <span className="block text-[10px] uppercase tracking-widest text-muted-foreground">Nome do consultor</span>
                <input className="inp mt-1" value={config.consultor} onChange={(e) => setConfig({ ...config, consultor: e.target.value })} />
              </label>
              <label className="block">
                <span className="block text-[10px] uppercase tracking-widest text-muted-foreground">Empresa</span>
                <input className="inp mt-1" value={config.empresa} onChange={(e) => setConfig({ ...config, empresa: e.target.value })} />
              </label>
              <p className="text-[11px] text-muted-foreground">
                Os parâmetros de cálculo (inflação, retorno, metas) ficam no Cadastro de cada cliente. Os valores padrão estão em
                src/config/campos.ts.
              </p>
              <div className="flex justify-end">
                <button type="submit" className="rounded-md bg-gold px-4 py-2 text-xs font-semibold text-primary-foreground">
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
