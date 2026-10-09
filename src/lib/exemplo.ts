// Cliente de exemplo para demonstração e treinamento da equipe.
import type { Cliente } from "@/types";
import { uid } from "./format";
import { normalizar } from "./storage";

export function clienteExemplo(): Cliente {
  const agora = new Date().toISOString();
  const ano = new Date().getFullYear();
  const i = () => uid();
  return normalizar({
    id: uid(),
    criadoEm: agora,
    atualizadoEm: agora,
    cadastro: {
      nome: "Cliente Exemplo",
      email: "cliente@exemplo.com",
      telefone: "(51) 90000-0000",
      nascimento: `${ano - 28}-03-15`,
      ocupacao: "Engenheiro",
      estadoCivil: "Solteiro(a)",
      perfil: "Cliente Private",
      regimeTrabalho: "CLT",
      cidade: "Porto Alegre / RS",
      origem: "Indicação",
      motivacao: "Quero parar de viver no limite e comprar meu apartamento sem me enrolar em dívidas.",
      satisfacao: 5,
      sucesso12meses: "Ter a reserva completa, o empréstimo quitado e um plano claro para o apartamento.",
      observacoes: "Cliente de demonstração.",
    },
    sonhos: [
      { id: i(), descricao: "Apartamento próprio", categoria: "Imóvel", valor: 500000, prazo: 6, acumulado: 20000, prioridade: "Alta", motivo: "Ter o meu canto e parar de pagar aluguel" },
      { id: i(), descricao: "Viagem para a Europa", categoria: "Viagem", valor: 30000, prazo: 2, acumulado: 0, prioridade: "Média", motivo: "Celebrar os 30 anos" },
    ],
    receitas: [
      { id: i(), fonte: "Salário líquido", valor: 14000, frequencia: "Mensal", tipo: "Ativa (trabalho)", titular: "Cliente" },
      { id: i(), fonte: "13º + férias + PLR", valor: 30000, frequencia: "Anual", tipo: "Ativa (trabalho)", titular: "Cliente" },
    ],
    despesas: [
      { id: i(), categoria: "Aluguel Apartamento Poa", valor: 4000, tipo: "Fixa", frequencia: "Mensal" },
      { id: i(), categoria: "Combustíveis", valor: 300, tipo: "Variável", frequencia: "Mensal" },
      { id: i(), categoria: "Capacitação G4", valor: 200, tipo: "Educação", frequencia: "Mensal" },
      { id: i(), categoria: "Academia", valor: 200, tipo: "Saúde", frequencia: "Mensal" },
      { id: i(), categoria: "Alimentação e mercado", valor: 1800, tipo: "Variável", frequencia: "Mensal" },
      { id: i(), categoria: "Restaurantes e lazer", valor: 1500, tipo: "Luxo", frequencia: "Mensal" },
      { id: i(), categoria: "IPVA + seguro do carro", valor: 4800, tipo: "Fixa", frequencia: "Anual" },
    ],
    patrimonio: [
      { id: i(), descricao: "Conta remunerada", valor: 15000, tipo: "Reserva / Caixa", liquidez: "Diária", instituicao: "Banco", rentabilidade: 10 },
      { id: i(), descricao: "CDB / Tesouro", valor: 45000, tipo: "Renda fixa", liquidez: "Acima de 30 dias", instituicao: "Corretora", rentabilidade: 11 },
      { id: i(), descricao: "Carro", valor: 70000, tipo: "Veículo", liquidez: "Sem liquidez" },
    ],
    dividas: [{ id: i(), descricao: "Empréstimo pessoal", saldo: 36000, taxa: 28, prazo: 24, tipo: "Crédito" }],
    seguro: { capitalAtual: 0, capitalEmpresa: 150000, anosProtecao: 3, temInvalidez: "Não", temSaude: "Sim" },
    aposentadoria: { idadeAlvo: 55, aporteAtual: 1500, retornoReal: 4 },
    alavancagem: {
      bemDesejado: "Apartamento",
      valorBem: 500000,
      prazoAnos: 3,
      taxaFinanciamento: 14,
      taxaConsorcio: 20,
      fundoReserva: 1,
      retornoInvestido: 0,
      valorizacaoBem: 5,
    },
    naoAplica: { filhos: true },
  });
}
