# Metodologia do Diagnóstico LIFE (versão 7)

Este documento descreve **o processo com o cliente** e **as fórmulas** de cada seção.
Tudo corresponde a arquivos editáveis:

| O quê | Onde editar |
|---|---|
| Etapas, seções, ordem e regra de "seção concluída" | `src/config/estrutura.ts` |
| Campos de cada seção (incluir / remover / renomear) | `src/config/campos.ts` |
| Blocos e subcategorias de despesas (e a parte de cada bloco no 50-30-20) | `src/config/despesas.ts` |
| Tabelas de INSS/IR para estimar bruta ↔ líquida | `src/config/tributos.ts` |
| Roteiro da conversa e frases de abertura das etapas | `src/config/roteiro.ts` |
| Textos do V1 · Institucional (Grupo Life Brasil) | `src/config/institucional.ts` |
| Fórmulas de cálculo | `src/lib/calculos.ts` |
| Pilares, pontos fortes/de atuação, matriz de oportunidades e sugestões | `src/lib/diagnostico.ts` |

---

## 1. Como a página funciona

- **Rolagem contínua:** todas as seções ficam em uma única página. Ao rolar, você passa de uma categoria para a próxima e o menu lateral acompanha. Clicar no menu leva à seção.
- **Versão consultor × versão apresentação:** o botão no topo alterna entre as duas.
  - A versão apresentação oculta o roteiro, as anotações, os parâmetros financeiros, as sugestões internas e as seções marcadas como ocultas.
  - Cada seção tem o botão **"Na apresentação / Oculta na apresentação"** para decidir o que o cliente vê. A **Matriz de oportunidades** começa oculta.
  - O PDF segue a versão apresentação: seção oculta não entra.
- **Roteiro:** o botão "Roteiro" de cada seção abre a gaveta com o objetivo, a frase de abertura, as perguntas (checklist), os pontos de atenção e as anotações da conversa.
- **Divisor de etapa:** antes de cada etapa aparecem só o número, o nome e o subtítulo da etapa.
- **Parâmetros financeiros:** botão de engrenagem ("Parâmetros") no topo do cliente, só na versão consultor. Abre um pop-up com inflação geral, inflação educacional, meta de reserva (meses), limite de parcela (% da renda) e retorno real.
- **Telas de coleta sem totais:** os blocos não mostram somas no topo; os números aparecem no pré-diagnóstico (5.1) e no diagnóstico (etapa 6).
- **Campos de valor:** formato de moeda com centavos (R$ 30.000,00); o milhar aparece enquanto se digita.
- **Finalizar coleta:** depois da seção 13 (Investimentos) fica o botão **Finalizar coleta** (também há um atalho no menu). As etapas 5 (pré-diagnóstico) e 6 (diagnóstico completo) e o PDF só aparecem depois do clique; ao clicar, a página rola até o 5.1. Se faltar alguma seção, o sistema avisa e pede confirmação. Na versão consultor, "Reabrir coleta" volta a ocultar as etapas 5 e 6.

## 2. Estrutura

| Etapa | Seções |
|---|---|
| **1 · Conexão** | 1 Cadastro · 2 V1 Institucional · 3 Objetivos · 4 Sucessão |
| **2 · Raio-X financeiro** | 5 Despesas · 6 Renda · 7 Patrimônio · 8 Financiamento e crédito · 9 Projetos · 10 Corporativo |
| **3 · Proteção e futuro** | 11 Proteção · 12 Futuro (aposentadoria) |
| **4 · Investimentos** | 13 Investimentos |
| **5 · Pré-diagnóstico** | 5.1 Plano atual: fluxo atual e modelo 50-30-20 (liberado por "Finalizar coleta") |
| **6 · Diagnóstico completo** | 6.1 Panorama · 6.2 Plano atual · 6.3 Pontos fortes · 6.4 Pontos de atuação · 6.5 Futuro · 6.6 Matriz de oportunidades · 6.7 Plano de ação |
| **7 · Jornada** | 7.1 Jornada do cliente · 7.2 Cronograma de implementação |

O progresso de **coleta** (menu lateral) considera as seções 1 e 3 a 13. Seções opcionais podem ser marcadas como **"Não se aplica"**.

### Regras de preenchimento dinâmico

- **Estado civil:** "Nome do cônjuge" e "Renda do cônjuge" só aparecem para Casado(a) ou União estável.
- **Tem filhos?** Com "Sim", aparece o contador de filhos. A quantidade **cria os cartões automaticamente em Sucessão**. Diminuir remove só cartões ainda vazios. Com "Não", nada aparece.
- **Satisfação financeira e impacto dos objetivos:** escala de 0 a 10 com um botão por nota.
- **Objetivos:** categoria escolhida por ícones. Na coleta não aparecem totais, aportes nem "cabe na sobra"; o aporte de cada objetivo aparece só na versão consultor. Cada cartão tem um botão à direita que oculta os campos e deixa só o resumo (valor, prazo e prioridade).
- **Sucessão:** nada aparece sem filhos ou dependentes. Para adicionar, escolhe-se primeiro a categoria. Filhos, enteados e netos têm idade e escolaridade; Pai/Mãe e "Outro dependente" mostram auxílio e outros custos. Mensalidades, auxílios e custos entram sozinhos nas despesas fixas (bloco Dependentes). Sem totalizadores no topo.
- **Despesas:** blocos (Casa, Mercado, Transporte…) com subcategorias (Aluguel, Condomínio, Luz…). Cada bloco aceita itens extras. Transporte: combustível, estacionamento/garagem, aplicativos (Uber e 99) e transporte público; manutenção e IPVA vêm dos veículos (Patrimônio). A anuidade dos cartões (Renda) entra em "Outras despesas fixas". As parcelas não são digitadas aqui: vêm da seção 8 e aparecem só no total.
- **Renda:** bruta e líquida do cliente; do cônjuge só para casado(a) ou união estável. Se só uma for informada, a outra é estimada. Modelo da declaração do IR (simplificada, completa ou não declara). Rendas extras ou de outra pessoa ficam em lista própria. Cartões: qual, limite, gasto mensal, milhas e anuidade (valor por ano).
- **Patrimônio:** imóveis e móveis com situação **Quitado / Financiado** e flag de seguro. Bem financiado abre instituição, parcela, prazo e saldo (opcional) e vira financiamento automaticamente na seção 8. Veículos: manutenção e IPVA por ano; "pensa em ampliação/troca" abre o modelo de desejo. **Futuras aquisições:** com "Sim", lista de segmento (imóvel/veículo), categoria, tipo, valor desejado e estratégia (à vista, financiamento, consórcio).
- **Financiamento e crédito (8):** financiamentos (inclusive os do patrimônio), consórcios (parcela, prazo, carta) e dívidas com categoria (cartão, cheque especial, carnê, renegociação, empréstimo pessoal, consignado…). A soma das parcelas entra no total de despesas.
- **Proteção:** reserva de emergência (valor e meses na visão do cliente), seguros, saúde e previdência (PGBL, VGBL ou os dois).
- **Futuro (12):** idade de aposentadoria, investimento mensal, renda desejada, outras fontes e estilo de vida (cartões). **Mudanças de vida programadas:** com "Sim", lista com a mudança, o impacto (aumenta/reduz despesas, aumenta/reduz renda ou gasto único), daqui a quantos meses e o valor.
- **Investimentos:** conhecimento, perfil, temas já estudados (múltipla escolha); valor (sem a reserva), assessor e instituição só aparecem com "Tem investimentos? Sim".

---

## 3. Fórmulas

Taxas anuais viram mensais por equivalência composta: `i = (1 + anual)^(1/12) − 1`.
Retorno nominal = `(1 + inflação) × (1 + retorno real) − 1`.

### Renda
- Para cada pessoa: se só a **bruta** for informada, a **líquida** é estimada (bruta − INSS − IRRF); se só a líquida, a bruta é estimada pelo inverso. Tabelas de referência em `src/config/tributos.ts`: INSS empregado 2026 (teto R$ 8.475,55), IRRF mensal (maio/2025) com desconto simplificado de R$ 607,20 e o redutor de 2026 (isenção até R$ 5.000, redução parcial até R$ 7.350). É uma estimativa para assalariado; pró-labore e autônomo diferem.
- `Renda familiar (líquida) = líquida do cliente + renda extra + líquida do cônjuge + outras rendas` (frequência Anual ÷ 12).
- **Renda passiva** = outras fontes do tipo Aluguel, Dividendos/Juros e Pensão/Aposentadoria.
- Renda marcada como do cônjuge só entra no total quando o estado civil é casado(a) ou união estável.
### Despesas
- Cada subcategoria guarda um valor mensal; o bloco soma subcategorias e itens extras.
- `Despesas = fixas + variáveis`. As fixas incluem Dependentes (de Sucessão), as parcelas da seção 8, manutenção e IPVA dos veículos (÷ 12) e a anuidade dos cartões (÷ 12).
- O gasto informado nos cartões **não** é somado de novo: ele já está distribuído nas despesas.
- `Sobra = Renda − Despesas` · `Taxa de poupança = Sobra ÷ Renda`.
- `Comprometimento = Parcelas ÷ Renda` (alerta acima do limite dos parâmetros, padrão 30%). As parcelas são as da seção 8 (com os bens financiados do Patrimônio).

### Modelo 50-30-20 (5.1 · pré-diagnóstico)
- **Necessidades** (meta: até 50% da renda líquida): casa, alimentação, mercado, transporte, saúde, seguros, educação, dependentes, outras fixas e parcelas.
- **Desejos** (meta: até 30%): cuidados pessoais, profissionais (diarista, personal…), restaurantes, lazer, roupas, assinaturas, esportes, viagens e outros.
- **Poupança e investimentos** (meta: pelo menos 20%): a sobra (renda − despesas).
- A parte de cada bloco fica no campo `modelo` de `src/config/despesas.ts`.
- O 5.1 mostra em cima as colunas **Renda · Despesas atuais · Modelo 50-30-20**; embaixo, à esquerda, a análise de cada parte (hoje × ideal) e, à direita, o fluxo atual por categoria (entradas, necessidades, desejos e sobra).

### Balanço patrimonial
- **Ativos** = imóveis + móveis + reserva + investimentos + previdência + participação em empresa.
- **Ativos** também incluem a reserva de emergência (Proteção).
- **Passivos** = saldo dos financiamentos (seção 8 + bens não quitados do Patrimônio) + empréstimos. Saldo não informado é estimado pelo **valor presente** das parcelas restantes a uma taxa de referência (imóvel 10% a.a., veículo 18%, outros 20%, empréstimo 35% — `TAXAS_REFERENCIA` em `calculos.ts`).
- Consórcio não é passivo: é compromisso mensal (entra nas parcelas).
- `Patrimônio líquido = Ativos − Passivos`.

### Reserva de emergência
- Reserva = valor informado em Proteção ("Tem reserva de emergência?"). O cliente também diz para quantos meses acha que ela dura; o sistema compara com o cálculo.
- `Meta = Despesas × meses da meta` · `Meses cobertos = Reserva ÷ Despesas`.

### Objetivos
- `Aporte mensal = valor futuro × i ÷ ((1 + i)^meses − 1)`, com `i` = retorno nominal mensal.
- Objetivo sem prazo não tem aporte calculado e não soma no total (o pilar pede o prazo).
- **Probabilidade sugerida** ("sug." ao lado da régua): a sobra mensal é distribuída entre os objetivos na ordem Essencial → Desejo → Sonho e, dentro de cada grupo, por prioridade. A sugestão é a parte do aporte que a sobra cobre, limitada a 95%. O consultor decide o valor final.

### Proteção — o que contratar (6.2 · Plano atual)
```
Educacional        = Σ filhos/enteados/netos: mensalidade × 12 por ano de escola restante, subindo pela inflação educacional acima da geral
                     + faculdade (mensalidade de referência × 12 × duração; quem já está na graduação: mensalidade atual × metade da duração)
Padrão de vida (N) = (custo de vida − mensalidades de escola e graduação) × 12 × N anos   — N = 1, 5 ou 15 (escolhido nos cartões)
Sucessão           = patrimônio quitado × (ITCMD % + honorários e custas %)
Quitação           = passivos (opcional; financiamento imobiliário costuma ter seguro MIP)
Necessidade        = educacional + padrão de vida (N) + sucessão (+ quitação)
Capital necessário = max(0, necessidade − reserva − investimentos − previdência)
A contratar        = max(0, capital necessário − seguro de vida individual atual)
```
- Inflação educacional: o ano t (contado de hoje) custa `anual × ((1 + inflação educacional) ÷ (1 + inflação geral))^t`, em valores de hoje. Com as duas iguais, vale `anual × anos`.
- Anos de escola restantes até o fim do ensino médio: educação infantil 13, fundamental I 9, fundamental II 5, ensino médio 2.
- Patrimônio quitado = imóveis e móveis quitados + reserva + investimentos + participação em empresa (previdência não entra em inventário).
- Premissas padrão (versão consultor): ITCMD 4%, honorários e custas 6%, faculdade R$ 3.000/mês por 5 anos.
- O seguro de vida pela empresa não entra (termina com o vínculo).
- Mensalidade de pós-graduação continua no padrão de vida (não há componente educacional para ela).
- Se os recursos já cobrem a necessidade (capital necessário = 0), o pilar Proteção fica 100.

### Futuro (independência financeira)
```
Renda desejada  = informada (ou custo de vida × fator do estilo de vida: mais simples 0,7 · igual a hoje 1,0 · mais confortável 1,3 · sofisticado 1,6)
Outras rendas   = informada (ou aluguéis + pensão/aposentadoria atuais; juros e dividendos ficam de fora porque o capital que os gera já está na projeção)
Patrimônio necessário = (renda desejada − outras rendas) × 12 ÷ 4%    (25×)
Projeção = investimentos + previdência hoje (sem a reserva), investindo todo mês o "investimento mensal" (ou, em branco, a sobra), a retorno real
Independência = projeção ÷ patrimônio necessário
Aporte necessário = aporte mensal que leva o patrimônio de hoje ao necessário até a idade de aposentadoria
```
Valores reais (R$ de hoje).

---

## 4. Diagnóstico

### Pilares (6.1 Panorama) e nota LIFE
Nota de 0 a 100 por pilar. Status: Saudável ≥ 75 · Atenção ≥ 45 · Crítico abaixo disso.

| Pilar | Régua |
|---|---|
| Fluxo de caixa | taxa de poupança ÷ 20% (sobra negativa = crítico) |
| Reserva de emergência | meses cobertos ÷ meta |
| Dívidas | 100 − (comprometimento ÷ limite) × 60 |
| Proteção | capital atual ÷ capital necessário |
| Independência financeira | projeção ÷ patrimônio necessário |
| Objetivos | sobra ÷ aporte necessário dos objetivos |

**Nota LIFE** = média dos pilares com dados (sem nenhum pilar com dados, aparece “—”). O pilar Dívidas pede a renda antes de dar nota.
- Idade de aposentadoria já atingida: não há aporte mensal; o diagnóstico mostra quanto falta hoje para a meta.

### Pontos fortes (6.3) e pontos de atuação (6.4)
Gerados automaticamente a partir das regras em `pontos()`, como poupança ≥ 20%, orçamento dentro ou fora do 50-30-20, reserva completa, imóveis quitados, dívidas ativas (com a categoria), anuidade de cartão, PGBL com declaração simplificada e veículos sem seguro. O consultor pode acrescentar pontos manuais. A seção 6.4 mostra a probabilidade de cada objetivo, atual × com plano.

### Matriz de oportunidades (6.6) — ecossistema
Quatro quadrantes, detectados a partir dos dados:
- **Seguros:** vida (gap), invalidez/DIT, saúde, auto/náutico sem seguro, residencial, empresarial, seguro de sócio.
- **Patrimonial:** consórcio para objetivos de Casa e Veículo e para futuras aquisições por financiamento ou consórcio, troca/ampliação de bens (com o modelo de desejo), portabilidade de financiamento, planejamento sucessório/holding (2+ imóveis ou patrimônio ≥ R$ 2 mi).
- **Investimentos:** começar a investir, completar a reserva, assessoria, suitability, aumentar o patrimônio financeiro, investimento para compra à vista.
- **Futuro:** previdência privada (PGBL para quem declara no completo; VGBL no simplificado), avaliar PGBL, plano de independência, fundo de educação dos filhos.

Cada oportunidade vai ao plano de ação com um clique (botão "Levar ao plano").

### Plano de ação (6.7) e cronograma (7.2)
- Cada ação tem área, prioridade (Alta, Média, Baixa), prazo (Curto, Médio, Longo) e status.
- O cronograma distribui as ações em **Curto (até 3 meses), Médio (3 a 12) e Longo (acima de 12)**, a partir da data do encontro de fechamento (ou de hoje).

### Jornada (7.1)
Encontros padrão: Conexão → Raio-X → Diagnóstico completo → Fechamento → Acompanhamento trimestral. Cada um tem data e status (Pendente, Agendada, Realizada). Encontros atrasados ou nos próximos 7 dias aparecem no sino do cabeçalho.
