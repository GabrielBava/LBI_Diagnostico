// Registro das telas de cada etapa. Ao criar uma etapa nova em
// src/config/etapas.ts, adicione aqui o componente correspondente.
import type { ComponentType } from "react";
import type { EtapaId } from "@/config/etapas";
import Apresentacao from "./Apresentacao";
import Cadastro from "./Cadastro";
import Sonhos from "./Sonhos";
import Filhos from "./Filhos";
import Receitas from "./Receitas";
import Despesas from "./Despesas";
import Patrimonio from "./Patrimonio";
import Dividas from "./Dividas";
import SeguroVida from "./SeguroVida";
import Aposentadoria from "./Aposentadoria";
import Alavancagem from "./Alavancagem";
import VisaoGeral from "./VisaoGeral";
import PlanoAcao from "./PlanoAcao";
import Historico from "./Historico";

export const TELAS: Record<EtapaId, ComponentType> = {
  apresentacao: Apresentacao,
  cadastro: Cadastro,
  sonhos: Sonhos,
  filhos: Filhos,
  receitas: Receitas,
  despesas: Despesas,
  patrimonio: Patrimonio,
  dividas: Dividas,
  seguro: SeguroVida,
  aposentadoria: Aposentadoria,
  alavancagem: Alavancagem,
  "visao-geral": VisaoGeral,
  plano: PlanoAcao,
  historico: Historico,
};
