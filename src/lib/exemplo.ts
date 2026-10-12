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
      nascimento: `${ano - 34}-03-15`,
      ocupacao: "Engenheiro",
      regimeTrabalho: "CLT",
      perfil: "Cliente Private",
      estadoCivil: "Casado(a)",
      conjuge: "Ana Exemplo",
      temFilhos: "Sim",
      qtdFilhos: 2,
      cep: "90000-000",
      numero: "100",
      motivacao: "Quero dar segurança para a minha família e parar de sentir que o dinheiro some todo mês.",
      satisfacao: 5,
    },
    objetivos: [
      { id: i(), tipo: "Essencial", titulo: "Reserva de emergência", categoria: "Família", valorFuturo: 90000, prazoMeses: 18, prioridade: "Alta", probAtual: 40, probPlano: 90, impacto: 9, motivo: "Dormir tranquilo" },
      { id: i(), tipo: "Desejo", titulo: "Trocar de carro", categoria: "Veículo", valorFuturo: 180000, prazoMeses: 36, prioridade: "Média", probAtual: 30, probPlano: 75, impacto: 6, motivo: "Mais conforto para a família" },
      { id: i(), tipo: "Sonho", titulo: "Casa na praia", categoria: "Casa", valorFuturo: 900000, prazoMeses: 120, prioridade: "Média", probAtual: 10, probPlano: 60, impacto: 10, motivo: "Ter os verões em família" },
    ],
    dependentes: [
      { id: i(), categoria: "Filho(a)", nome: "Lucas", nivelEscola: "Fundamental I", escola: "Particular", mensalidade: 2800, auxilio: 0 },
      { id: i(), categoria: "Filho(a)", nome: "Júlia", nivelEscola: "Educação infantil", escola: "Particular", mensalidade: 2200, auxilio: 0 },
    ],
    despesas: {
      casa: 3500,
      alimentacao: 1500,
      transporte: 900,
      saude: 1200,
      cuidados: 300,
      impostos: 450,
      servicosFinanceiros: 80,
      profissionais: 1200,
      mercado: 2200,
      seguros: 250,
      educacao: 0,
      restaurantes: 1400,
      lazer: 800,
      roupas: 600,
      assinaturas: 180,
      compras: 700,
      esportes: 350,
      viagens: 1200,
      outros: 300,
    },
    renda: { renda: 22000, rendaConjuge: 9000 },
    outrasRendas: [{ id: i(), descricao: "PLR", tipo: "Bônus / PLR", valor: 24000, frequencia: "Anual" }],
    imoveis: [{ id: i(), categoria: "Moradia", tipo: "Apartamento", valor: 950000, quitado: false }],
    moveis: [
      { id: i(), tipo: "Carro", nome: "SUV 2022", valor: 160000, quitado: true, temSeguro: true, pensaAmpliacao: true },
      { id: i(), tipo: "Moto", nome: "Moto 2019", valor: 25000, quitado: true, temSeguro: false },
    ],
    financiamentos: [{ id: i(), tipo: "Imobiliário", parcela: 4200, prazo: 240, saldo: 520000 }],
    emprestimos: [{ id: i(), instituicao: "Banco X", parcela: 1100, prazo: 18 }],
    corporativo: { possuiEmpresa: "Não" },
    protecao: {
      temSeguroVida: "Sim",
      capitalAtual: 300000,
      premioAtual: 120,
      seguroEmpresa: 250000,
      temInvalidez: "Não",
      temSaude: "Sim",
      temPrevidencia: "Não",
      anosProtecao: 5,
      custoInventario: 15,
    },
    investimentos: { conhecimento: "Intermediário", perfil: "Moderado", temInvestimento: "Sim", valor: 120000, liquidez: 35000, temAssessor: "Não", instituicao: "Banco" },
    futuro: { idadeAposentadoria: 60, rendaDesejada: 25000 },
  });
}
