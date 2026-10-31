// Especificação do planejamento em PDF (página de impressão, aberta pela 7.1).
// Esqueleto: o layout da proposta entra aqui.
import { Navigate, useParams } from "react-router-dom";
import { useClientes } from "@/lib/storage";

export default function EspecificacaoPdf() {
  const { id } = useParams();
  const cliente = useClientes().find((c) => c.id === id);
  if (!cliente) return <Navigate to="/clientes" replace />;
  return <p className="p-8 text-sm">Especificação em PDF em construção.</p>;
}
