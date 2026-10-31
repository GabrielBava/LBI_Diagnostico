import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Moon, Settings, Sun, X } from "lucide-react";
import { APP, MODELOS_CLAUDE } from "@/config/defaults";
import { usePreferencias } from "@/lib/preferencias";
import { lerConfig, salvarConfig } from "@/lib/storage";

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
  const { tema, alternarTema } = usePreferencias();
  const [config, setConfig] = useState(lerConfig());
  const [painel, setPainel] = useState<"config" | null>(null);
  const [verChave, setVerChave] = useState(false);
  const abrirConfig = () => {
    setConfig(lerConfig());
    setVerChave(false);
    setPainel("config");
  };
  // O 8 · Analítico abre as Configurações direto no campo da chave da API.
  useEffect(() => {
    const abrir = () => {
      abrirConfig();
      window.setTimeout(() => document.getElementById("config-claude-chave")?.focus(), 50);
    };
    window.addEventListener("life:abrir-configuracoes", abrir);
    return () => window.removeEventListener("life:abrir-configuracoes", abrir);
  }, []);
  const modeloConhecido = MODELOS_CLAUDE.some((m) => m.id === config.claudeModelo);
  const chaveEstranha = !!config.claudeChave.trim() && !config.claudeChave.trim().startsWith("sk-ant-");

  return (
    <header className="no-print sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/85 px-4 backdrop-blur md:px-8">
      <Logo />
      <span
        title={`Versão da plataforma — ${APP.versao} · gerada em ${new Date(__GERADO_EM__).toLocaleString("pt-BR")}`}
        className="hidden rounded-full border border-border bg-card/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground md:inline-block"
      >
        {APP.versao}
      </span>
      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <button type="button" aria-label={tema === "dark" ? "Ativar fundo claro" : "Ativar fundo escuro"} className={botaoIcone} onClick={alternarTema}>
          {tema === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <button type="button" aria-label="Configurações" className={botaoIcone} onClick={() => (painel === "config" ? setPainel(null) : abrirConfig())}>
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
          <div className="max-h-[calc(100vh-7rem)] w-full max-w-md overflow-y-auto rounded-xl border border-border bg-popover p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
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
                salvarConfig({ ...config, claudeChave: config.claudeChave.trim(), claudeModelo: config.claudeModelo.trim() || MODELOS_CLAUDE[0].id });
                window.dispatchEvent(new Event("life:config"));
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
              <label className="block">
                <span className="block text-[10px] uppercase tracking-widest text-muted-foreground">E-mail do consultor</span>
                <input type="email" className="inp mt-1" value={config.email} onChange={(e) => setConfig({ ...config, email: e.target.value })} />
              </label>
              <fieldset className="space-y-3 rounded-lg border border-border p-3">
                <legend className="px-1 text-[10px] font-semibold uppercase tracking-widest text-primary">Análise por IA · 8 Analítico</legend>
                <label className="block">
                  <span className="block text-[10px] uppercase tracking-widest text-muted-foreground">Chave da API do Claude</span>
                  <span className="mt-1 flex items-center gap-1">
                    <input
                      id="config-claude-chave"
                      className="inp font-mono text-xs"
                      type={verChave ? "text" : "password"}
                      autoComplete="off"
                      spellCheck={false}
                      placeholder="sk-ant-…"
                      value={config.claudeChave}
                      onChange={(e) => setConfig({ ...config, claudeChave: e.target.value })}
                    />
                    <button
                      type="button"
                      aria-label={verChave ? "Ocultar a chave" : "Mostrar a chave"}
                      title={verChave ? "Ocultar a chave" : "Mostrar a chave"}
                      onClick={() => setVerChave(!verChave)}
                      className={`${botaoIcone} h-10 w-10 shrink-0`}
                    >
                      {verChave ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </span>
                </label>
                {chaveEstranha && <p className="text-[11px] text-warning">A chave da API da Anthropic costuma começar com sk-ant-. Confira se copiou certo.</p>}
                <p className="text-[11px] text-muted-foreground">
                  Fica guardada só neste navegador, neste computador (não vai nos backups de clientes). Quem usar este computador pode usá-la. Crie a chave em
                  console.anthropic.com → API Keys.
                  {config.claudeChave && (
                    <>
                      {" "}
                      <button type="button" onClick={() => setConfig({ ...config, claudeChave: "" })} className="font-semibold text-destructive underline-offset-2 hover:underline">
                        Apagar a chave
                      </button>
                    </>
                  )}
                </p>
                <label className="block">
                  <span className="block text-[10px] uppercase tracking-widest text-muted-foreground">Modelo</span>
                  <select
                    className="inp mt-1"
                    value={modeloConhecido ? config.claudeModelo : "outro"}
                    onChange={(e) => setConfig({ ...config, claudeModelo: e.target.value === "outro" ? "" : e.target.value })}
                  >
                    {MODELOS_CLAUDE.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nome} — {m.detalhe}
                      </option>
                    ))}
                    <option value="outro">Outro (digitar o nome do modelo)</option>
                  </select>
                </label>
                {!modeloConhecido && (
                  <input
                    aria-label="Nome do modelo"
                    className="inp font-mono text-xs"
                    placeholder="ex.: claude-opus-5-5"
                    value={config.claudeModelo}
                    onChange={(e) => setConfig({ ...config, claudeModelo: e.target.value })}
                  />
                )}
              </fieldset>
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
