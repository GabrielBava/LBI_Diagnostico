// Registro das telas de cada seção. Ao criar uma seção nova em
// src/config/estrutura.ts, adicione aqui o componente correspondente.
import type { ComponentType } from "react";
import Cadastro from "./Cadastro";
import Institucional from "./Institucional";
import Objetivos from "./Objetivos";
import Sucessao from "./Sucessao";
import Despesas from "./Despesas";
import Renda from "./Renda";
import Patrimonio from "./Patrimonio";
import Dividas from "./Dividas";
import Projetos from "./Projetos";
import Corporativo from "./Corporativo";
import Protecao from "./Protecao";
import Investimentos from "./Investimentos";
import PlanoAtual from "./PlanoAtual";
import Panorama from "./Panorama";
import PlanoAtualCompleto from "./PlanoAtualCompleto";
import { PontosFortes, PontosNegativos } from "./Pontos";
import Futuro from "./Futuro";
import Oportunidades from "./Oportunidades";
import PlanoAcao from "./PlanoAcao";
import { Cronograma, JornadaCliente } from "./Jornada";

export const TELAS: Record<string, ComponentType> = {
  cadastro: Cadastro,
  institucional: Institucional,
  objetivos: Objetivos,
  sucessao: Sucessao,
  despesas: Despesas,
  renda: Renda,
  patrimonio: Patrimonio,
  dividas: Dividas,
  projetos: Projetos,
  corporativo: Corporativo,
  protecao: Protecao,
  investimentos: Investimentos,
  "plano-atual": PlanoAtual,
  panorama: Panorama,
  "plano-atual-completo": PlanoAtualCompleto,
  "pontos-fortes": PontosFortes,
  "pontos-negativos": PontosNegativos,
  futuro: Futuro,
  oportunidades: Oportunidades,
  "plano-acao": PlanoAcao,
  "jornada-cliente": JornadaCliente,
  cronograma: Cronograma,
};
