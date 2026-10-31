// 13 · Investimentos: conhecimento e perfil lado a lado, temas já estudados (linha inteira) e onde investe.
import { CAMPOS_INVESTIMENTOS, CAMPOS_INVESTIMENTOS_PERFIL } from "@/config/campos";
import { Formulario } from "@/components/campos";
import { useCliente } from "@/lib/cliente-context";

export default function Investimentos() {
  const { cliente, setCampo } = useCliente();
  return (
    <div className="space-y-4">
      <Formulario campos={CAMPOS_INVESTIMENTOS_PERFIL} dados={cliente.investimentos} cliente={cliente} colunas={2} onChange={(k, v) => setCampo("investimentos", k, v)} />
      <Formulario campos={CAMPOS_INVESTIMENTOS} dados={cliente.investimentos} cliente={cliente} onChange={(k, v) => setCampo("investimentos", k, v)} />
    </div>
  );
}
