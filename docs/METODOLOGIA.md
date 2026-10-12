# Metodologia do Diagnóstico LIFE (versão 5)

Este documento descreve **o processo com o cliente** e **as fórmulas** de cada seção.
Tudo corresponde a arquivos editáveis:

| O quê | Onde editar |
|---|---|
| Etapas, seções, ordem e regra de "seção concluída" | `src/config/estrutura.ts` |
| Campos de cada seção (incluir / remover / renomear) | `src/config/campos.ts` |
| Blocos e subcategorias de despesas | `src/config/despesas.ts` |
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
- **Divisor de etapa:** antes de cada etapa aparece a frase de abertura da conversa e, quando houver, os documentos a pedir.

## 2. Estrutura

| Etapa | Seções |
|---|---|
| **1 · Conexão** | 1 Cadastro · 2 V1 Institucional · 3 Objetivos · 4 Sucessão |
| **2 · Raio-X financeiro** | 5 Despesas · 6 Renda · 7 Patrimônio · 8 Financiamentos e dívidas · 9 Projetos · 10 Corporativo |
| **3 · Proteção e futuro** | 11 Proteção · 12 Futuro (aposentadoria) |
| **4 · Investimentos** | 13 Investimentos |
| **5 · Pré-diagnóstico** | 5.1 Plano atual (visão breve) |
| **6 · Diagnóstico completo** | 6.1 Panorama · 6.2 Plano atual · 6.3 Pontos fortes · 6.4 Pontos de atuação · 6.5 Futuro · 6.6 Matriz de oportunidades · 6.7 Plano de ação |
| **7 · Jornada** | 7.1 Jornada do cliente · 7.2 Cronograma de implementação |

O progresso de **coleta** (menu lateral) considera as seções 1 e 3 a 13. Seções opcionais podem ser marcadas como **"Não se aplica"**.

### Regras de preenchimento dinâmico

- **Estado civil:** "Nome do cônjuge" e "Renda do cônjuge" só aparecem para Casado(a) ou União estável.
- **Tem filhos?** Com "Sim", aparece o contador de filhos. A quantidade **cria os cartões automaticamente em Sucessão**. Diminuir remove só cartões ainda vazios. Com "Não", nada aparece.
- **CEP:** ao completar os 8 dígitos, o endereço é buscado automaticamente (ViaCEP, precisa de internet) e exibido abaixo do campo.
- **Satisfação financeira e impacto dos objetivos:** escala de 0 a 10 com um botão por nota.
- **Objetivos:** categoria escolhida por ícones. Na coleta não aparecem totais, aportes nem "cabe na sobra"; o aporte de cada objetivo aparece só na versão consultor.
- **Sucessão:** nada aparece sem filhos ou dependentes. Para adicionar, escolhe-se primeiro a categoria. Pai/Mãe e "Outro dependente" não têm escolaridade; mostram auxílio e outros custos. Mensalidades, auxílios e custos entram sozinhos nas despesas fixas (bloco Dependentes).
- **Despesas:** blocos (Casa, Mercado, Transporte…) com subcategorias (Aluguel, Condomínio, Luz…). Cada bloco aceita itens extras.
- **Renda:** bruta e líquida do cliente; do cônjuge só para casado(a) ou união estável. Se só uma for informada, a outra é estimada. Rendas extras ou de outra pessoa ficam em lista própria. Cartões: qual, limite, gasto mensal e se acumula milhas.
- **Patrimônio:** imóveis e móveis com flag de seguro. Bem não quitado abre instituição, parcela, prazo e saldo (opcional) e vira financiamento automaticamente na seção 8.
- **Financiamentos e dívidas:** a soma das parcelas (financiamentos, inclusive os do patrimônio, consórcios e empréstimos) preenche sozinha o bloco "Financiamento / Dívidas" das despesas. Sem parcelas lançadas, vale o valor digitado.
- **Proteção:** reserva de emergência (valor e meses na visão do cliente), seguros, saúde e previdência.
- **Futuro (12):** idade de aposentadoria, estilo de vida, renda desejada e outras rendas.
- **Investimentos:** temas já estudados (múltipla escolha); valor (sem a reserva), assessor e instituição só aparecem com "Tem investimentos? Sim".

---

## 3. Fórmulas

Taxas anuais viram mensais por equivalência composta: `i = (1 + anual)^(1/12) − 1`.
Retorno nominal = `(1 + inflação) × (1 + retorno real) − 1`.

### Renda
- Para cada pessoa: se só a **bruta** for informada, a **líquida** é estimada (bruta − INSS − IRRF); se só a líquida, a bruta é estimada pelo inverso. Tabelas de referência em `src/config/tributos.ts`: INSS empregado 2026 (teto R$ 8.475,55), IRRF mensal (maio/2025) com desconto simplificado de R$ 607,20 e o redutor de 2026 (isenção até R$ 5.000, redução parcial até R$ 7.350). É uma estimativa para assalariado; pró-labore e autônomo diferem.
- `Renda familiar (líquida) = líquida do cliente + líquida do cônjuge + outras rendas` (frequência Anual ÷ 12).
- **Renda passiva** = outras fontes do tipo Aluguel, Dividendos/Juros e Pensão/Aposentadoria.
- Renda marcada como do cônjuge só entra no total quando o estado civil é casado(a) ou união estável.
### Despesas
- Cada subcategoria guarda um valor mensal; o bloco soma subcategorias e itens extras.
- `Despesas = fixas + variáveis`. As fixas incluem o bloco Dependentes (de Sucessão) e o bloco Financiamento / Dívidas (parcelas).
- O gasto informado nos cartões **não** é somado de novo: ele já está distribuído nas despesas.
- `Sobra = Renda − Despesas` · `Taxa de poupança = Sobra ÷ Renda`.
- `Comprometimento = Parcelas ÷ Renda` (alerta acima do limite dos parâmetros, padrão 30%). As parcelas são as da seção 8 (com os bens não quitados do Patrimônio) ou, se não houver nenhuma cadastrada, o valor digitado em Despesas > Financiamento / Dívidas.

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
Educacional        = Σ filhos/enteados/netos: mensalidade × 12 × anos de escola restantes
                     + faculdade (mensalidade de referência × 12 × duração; quem já está na graduação: mensalidade atual × metade da duração)
Padrão de vida (N) = (custo de vida − mensalidades de escola e graduação) × 12 × N anos   — N = 1, 5 ou 15 (escolhido nos cartões)
Sucessão           = patrimônio quitado × (ITCMD % + honorários e custas %)
Quitação           = passivos (opcional; financiamento imobiliário costuma ter seguro MIP)
Necessidade        = educacional + padrão de vida (N) + sucessão (+ quitação)
Capital necessário = max(0, necessidade − reserva − investimentos − previdência)
A contratar        = max(0, capital necessário − seguro de vida individual atual)
```
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
Projeção = investimentos + previdência hoje (sem a reserva), investindo a sobra atual todo mês, a retorno real
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
Gerados automaticamente a partir das regras em `pontos()`, como poupança ≥ 20%, reserva completa, imóveis quitados, empréstimos ativos e veículos sem seguro. O consultor pode acrescentar pontos manuais. A seção 6.4 mostra a probabilidade de cada objetivo, atual × com plano.

### Matriz de oportunidades (6.6) — ecossistema
Quatro quadrantes, detectados a partir dos dados:
- **Seguros:** vida (gap), invalidez/DIT, saúde, auto/náutico sem seguro, residencial, empresarial, seguro de sócio.
- **Patrimonial:** consórcio para objetivos de Casa e Veículo, troca/ampliação de bens, portabilidade de financiamento, planejamento sucessório/holding (2+ imóveis ou patrimônio ≥ R$ 2 mi).
- **Investimentos:** começar a investir, completar a reserva, assessoria, suitability, aumentar o patrimônio financeiro.
- **Futuro:** previdência privada, plano de independência, fundo de educação dos filhos.

Cada oportunidade vai ao plano de ação com um clique (botão "Levar ao plano").

### Plano de ação (6.7) e cronograma (7.2)
- Cada ação tem área, prioridade (Alta, Média, Baixa), prazo (Curto, Médio, Longo) e status.
- O cronograma distribui as ações em **Curto (até 3 meses), Médio (3 a 12) e Longo (acima de 12)**, a partir da data do encontro de fechamento (ou de hoje).

### Jornada (7.1)
Encontros padrão: Conexão → Raio-X → Diagnóstico completo → Fechamento → Acompanhamento trimestral. Cada um tem data e status (Pendente, Agendada, Realizada). Encontros atrasados ou nos próximos 7 dias aparecem no sino do cabeçalho.
