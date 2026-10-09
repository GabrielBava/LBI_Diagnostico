import { CAMPOS_CADASTRO, CAMPOS_PARAMETROS } from "@/config/campos";
import { Formulario, Rotulo } from "@/components/campos";
import { Cartao } from "@/components/ui";
import { useCliente } from "@/lib/cliente-context";
import { idadePorNascimento, s } from "@/lib/calculos";

export default function Cadastro() {
  const { cliente, setCampo } = useCliente();
  const idade = idadePorNascimento(s(cliente.cadastro.nascimento));

  return (
    <div className="space-y-6">
      <Cartao titulo="Dados do cliente" acao={idade !== undefined ? <span className="text-xs text-muted-foreground">{idade} anos</span> : undefined}>
        <Formulario campos={CAMPOS_CADASTRO} dados={cliente.cadastro} onChange={(k, v) => setCampo("cadastro", k, v)} />
        <label className="mt-3 block">
          <Rotulo>Observações</Rotulo>
          <textarea
            rows={3}
            className="inp mt-1"
            value={s(cliente.cadastro.observacoes)}
            onChange={(e) => setCampo("cadastro", "observacoes", e.target.value)}
          />
        </label>
      </Cartao>
      <Cartao titulo="Parâmetros macro" subtitulo="Usados em todas as projeções deste cliente.">
        <Formulario campos={CAMPOS_PARAMETROS} dados={cliente.parametros} onChange={(k, v) => setCampo("parametros", k, v)} />
      </Cartao>
    </div>
  );
}
