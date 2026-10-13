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
    // Exemplo já com a coleta finalizada, para mostrar o pré-diagnóstico e o diagnóstico.
    coletaFinalizada: agora,
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
      motivacao: "Quero dar segurança para a minha família e parar de sentir que o dinheiro some todo mês.",
      satisfacao: 5,
    },
    objetivos: [
      { id: i(), tipo: "Essencial", titulo: "Reserva de emergência", categoria: "Família", valorFuturo: 90000, prazoMeses: 18, prioridade: "Alta", probAtual: 40, probPlano: 90, impacto: 9, motivo: "Dormir tranquilo" },
      { id: i(), tipo: "Desejo", titulo: "Trocar de carro", categoria: "Veículo", valorFuturo: 180000, prazoMeses: 36, prioridade: "Média", probAtual: 30, probPlano: 75, impacto: 6, motivo: "Mais conforto para a família" },
      { id: i(), tipo: "Sonho", titulo: "Casa na praia", categoria: "Casa", valorFuturo: 900000, prazoMeses: 120, prioridade: "Média", probAtual: 10, probPlano: 60, impacto: 10, motivo: "Ter os verões em família" },
    ],
    dependentes: [
      { id: i(), categoria: "Filho(a)", nome: "Lucas", idade: 8, nivelEscola: "Fundamental I", escola: "Particular", mensalidade: 2800, auxilio: 0 },
      { id: i(), categoria: "Filho(a)", nome: "Júlia", idade: 4, nivelEscola: "Educação infantil", escola: "Particular", mensalidade: 2200, auxilio: 0 },
    ],
    despesas: {
      "casa.condominio": 1200,
      "casa.luz": 450,
      "casa.agua": 150,
      "casa.internet": 250,
      "casa.gas": 80,
      "casa.iptu": 350,
      "alimentacao.refeicoes": 1100,
      "alimentacao.lanches": 300,
      "mercado.supermercado": 1800,
      "mercado.hortifruti": 400,
      "transporte.combustivel": 700,
      "transporte.estacionamento": 150,
      "transporte.app": 200,
      "saude.plano": 1100,
      "saude.remedios": 150,
      "cuidados.salao": 300,
      "profissionais.diarista": 1200,
      "seguros.auto": 250,
      "restaurantes.restaurantes": 900,
      "restaurantes.delivery": 500,
      "lazer.passeios": 600,
      "roupas.roupas": 600,
      "assinaturas.streaming": 120,
      "assinaturas.apps": 60,
      "esportes.academia": 350,
      "viagens.nacionais": 700,
      "viagens.internacionais": 500,
      "outros.pets": 300,
    },
    renda: { brutaCliente: 30000, liquidaConjuge: 9000, declaracaoIR: "Completa", temCartao: "Sim" },
    outrasRendas: [{ id: i(), pessoa: "Cliente", descricao: "PLR", tipo: "Bônus / PLR", valor: 24000, frequencia: "Anual" }],
    cartoes: [
      { id: i(), cartao: "Banco X Black", limite: 40000, gastoMensal: 9000, milhas: true, programa: "Smiles", pagaAnuidade: true, valorAnuidade: 1200 },
      { id: i(), cartao: "Banco Y Gold", limite: 8000, gastoMensal: 1500, milhas: false },
    ],
    imoveis: [
      { id: i(), categoria: "Moradia", tipo: "Apartamento", valor: 950000, situacao: "Financiado", temSeguro: false, instituicao: "Caixa", parcela: 4200, prazo: 240, saldo: 520000 },
    ],
    moveis: [
      { id: i(), tipo: "Carro", nome: "SUV 2022", valor: 160000, situacao: "Quitado", temSeguro: true, manutencaoAnual: 3000, ipvaAnual: 4800, pensaAmpliacao: true, modeloDesejado: "SUV híbrido" },
      { id: i(), tipo: "Moto", nome: "Moto 2019", valor: 25000, situacao: "Quitado", temSeguro: false, manutencaoAnual: 600, ipvaAnual: 700 },
    ],
    patrimonioGeral: { pretendeAdquirir: "Sim" },
    aquisicoes: [
      { id: i(), segmento: "Imóvel", categoria: "Veraneio", tipo: "Casa", valorDesejado: 900000, estrategia: "Consórcio" },
      { id: i(), segmento: "Veículo", categoria: "Carro", tipo: "Novo", valorDesejado: 180000, estrategia: "Financiamento" },
    ],
    financiamentos: [],
    emprestimos: [{ id: i(), categoria: "Empréstimo pessoal", instituicao: "Banco X", parcela: 1100, prazo: 18 }],
    corporativo: { possuiEmpresa: "Não" },
    protecao: {
      temReserva: "Sim",
      valorReserva: 35000,
      mesesReserva: 2,
      temSeguroVida: "Sim",
      capitalAtual: 300000,
      premioAtual: 120,
      seguroEmpresa: 250000,
      temInvalidez: "Não",
      temSaude: "Sim",
      temPrevidencia: "Não",
      horizonte: 5,
    },
    investimentos: {
      conhecimento: "Intermediário",
      perfil: "Moderado",
      temas: ["Reserva de emergência", "Tesouro Direto", "CDB, LCI e LCA", "Fundos imobiliários (FIIs)"],
      temInvestimento: "Sim",
      valor: 85000,
      temAssessor: "Não",
      instituicao: "Banco",
    },
    futuro: { idadeAposentadoria: 60, estiloVida: "Mais confortável" },
  });
}
