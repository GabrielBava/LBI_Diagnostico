// 2 · V1 Institucional: só a apresentação do Grupo Life Brasil (PDF), para mostrar ao cliente.
// Para trocar a apresentação: python3 scripts/gerar-v1.py <novo.pdf> e depois npm run html.
import { ApresentacaoPdf } from "@/components/ApresentacaoPdf";

export default function Institucional() {
  return <ApresentacaoPdf />;
}
