import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Copy, Download, FlaskConical, Plus, Search, Trash2, Upload } from "lucide-react";
import { progresso } from "@/config/estrutura";
import { BarraProgresso, BotaoContorno, BotaoOuro } from "@/components/ui";
import { s } from "@/lib/calculos";
import { notaGeral, pilares } from "@/lib/diagnostico";
import { clienteExemplo } from "@/lib/exemplo";
import { fmtData } from "@/lib/format";
import {
  baixarArquivo,
  duplicarCliente,
  excluirCliente,
  exportarJSON,
  importarJSON,
  novoCliente,
  salvarCliente,
  useClientes,
} from "@/lib/storage";

export default function Clientes() {
  const clientes = useClientes();
  const navigate = useNavigate();
  const [busca, setBusca] = useState("");
  const arquivo = useRef<HTMLInputElement>(null);

  const filtrados = clientes
    .filter((c) => s(c.cadastro.nome).toLowerCase().includes(busca.toLowerCase()))
    .sort((a, b) => b.atualizadoEm.localeCompare(a.atualizadoEm));

  const criar = () => {
    const nome = prompt("Nome do cliente:");
    if (nome === null) return;
    const c = salvarCliente(novoCliente(nome.trim()));
    navigate(`/clientes/${c.id}`);
  };

  const importar = async (f: File) => {
    try {
      const qtd = importarJSON(await f.text());
      alert(`${qtd} cliente(s) importado(s).`);
    } catch {
      alert("Arquivo inválido. Use um backup exportado por este sistema.");
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1">
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">Diagnóstico LIFE</div>
          <h1 className="text-xl font-semibold">Clientes</h1>
        </div>
        <BotaoContorno onClick={() => baixarArquivo(`backup-diagnostico-life-${new Date().toISOString().slice(0, 10)}.json`, exportarJSON())} title="Baixar todos os clientes em um arquivo">
          <Download className="h-3.5 w-3.5" /> Exportar backup
        </BotaoContorno>
        <BotaoContorno onClick={() => arquivo.current?.click()} title="Importar clientes de um arquivo de backup">
          <Upload className="h-3.5 w-3.5" /> Importar
        </BotaoContorno>
        <input
          ref={arquivo}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) importar(f);
            e.target.value = "";
          }}
        />
        <BotaoOuro onClick={criar}>
          <Plus className="h-3.5 w-3.5" /> Novo cliente
        </BotaoOuro>
      </div>

      <div className="inp-wrap max-w-md">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input placeholder="Buscar cliente…" value={busca} onChange={(e) => setBusca(e.target.value)} />
      </div>

      {clientes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <h2 className="text-base font-semibold">Nenhum cliente ainda</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Crie o primeiro diagnóstico ou carregue um cliente de exemplo para conhecer a jornada completa.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <BotaoOuro onClick={criar}>
              <Plus className="h-3.5 w-3.5" /> Novo cliente
            </BotaoOuro>
            <BotaoContorno onClick={() => salvarCliente(clienteExemplo())}>
              <FlaskConical className="h-3.5 w-3.5" /> Carregar exemplo
            </BotaoContorno>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtrados.map((c) => {
            const prog = progresso(c);
            const nota = notaGeral(pilares(c));
            return (
              <div key={c.id} className="group rounded-xl border border-border bg-card p-4 transition hover:border-primary/50">
                <Link to={`/clientes/${c.id}`} className="block">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{s(c.cadastro.nome) || "Sem nome"}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {[s(c.cadastro.perfil), s(c.cadastro.ocupacao)].filter(Boolean).join(" · ") || "—"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold tabular-nums text-primary">{c.coletaFinalizada ? nota : "—"}</div>
                      <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Nota LIFE</div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Progresso {prog.pct}%</span>
                    <span>
                      {c.coletaFinalizada ? "Coleta finalizada" : prog.proxima ? `Próxima: ${prog.proxima.titulo}` : "Pronto para finalizar"}
                    </span>
                  </div>
                  <BarraProgresso valor={prog.pct} className="mt-1" />
                </Link>
                <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Atualizado em {fmtData(c.atualizadoEm)}</span>
                  <div className="flex gap-1 opacity-70 group-hover:opacity-100">
                    <button type="button" title="Duplicar" onClick={() => duplicarCliente(c.id)} className="rounded p-1 hover:bg-muted hover:text-foreground">
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Exportar cliente"
                      onClick={() => baixarArquivo(`${s(c.cadastro.nome) || "cliente"}.json`, exportarJSON([c.id]))}
                      className="rounded p-1 hover:bg-muted hover:text-foreground"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Excluir"
                      onClick={() => confirm(`Excluir ${s(c.cadastro.nome) || "este cliente"}? Esta ação não pode ser desfeita.`) && excluirCliente(c.id)}
                      className="rounded p-1 hover:bg-muted hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <p className="text-[11px] text-muted-foreground">
        Os dados ficam salvos neste navegador. Use “Exportar backup” regularmente para não perder informações.
      </p>
    </div>
  );
}
