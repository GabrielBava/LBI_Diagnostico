import { CAMPOS_CORPORATIVO } from "@/config/campos";
import { Formulario } from "@/components/campos";
import { useCliente } from "@/lib/cliente-context";

export default function Corporativo() {
  const { cliente, setCampo } = useCliente();
  return <Formulario campos={CAMPOS_CORPORATIVO} dados={cliente.corporativo} cliente={cliente} onChange={(k, v) => setCampo("corporativo", k, v)} />;
}
