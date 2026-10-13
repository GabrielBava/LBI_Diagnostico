// 13 · Investimentos: conhecimento, perfil, temas já estudados e onde investe.
import { CAMPOS_INVESTIMENTOS } from "@/config/campos";
import { Formulario } from "@/components/campos";
import { useCliente } from "@/lib/cliente-context";

export default function Investimentos() {
  const { cliente, setCampo } = useCliente();
  return (
    <div className="space-y-4">
      <Formulario campos={CAMPOS_INVESTIMENTOS} dados={cliente.investimentos} cliente={cliente} onChange={(k, v) => setCampo("investimentos", k, v)} />
    </div>
  );
}
