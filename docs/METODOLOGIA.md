# Metodologia do Diagnóstico LIFE (versão 4)

Este documento descreve **o processo com o cliente** e **as fórmulas** de cada seção.
Tudo corresponde a arquivos editáveis:

| O quê | Onde editar |
|---|---|
| Etapas, seções, ordem e regra de "seção concluída" | `src/config/estrutura.ts` |
| Campos de cada seção (incluir / remover / renomear) | `src/config/campos.ts` |
| Roteiro da conversa e frases de abertura das etapas | `src/config/roteiro.ts` |
| Textos do V1 · Institucional (Grupo Life Brasil) | `src/config/institucional.ts` |
| Fórmulas de cálculo | `src/lib/calculos.ts` |
| Pilares, pontos fortes/de atuação, matriz de oportunidades e sugestões | `src/lib/diagnostico.ts` |

---

## 1. Como a página funciona

- **Rolagem contínua:** todas as seções ficam em uma única página. Ao rolar, você passa de uma categoria para a próxima e o menu lateral acompanha. Clicar no menu leva à seção.
- **Pré-diagnóstico ao vivo:** a faixa fixa no topo (renda, despesas, sobra, patrimônio líquido e aporte dos objetivos) se atualiza a cada campo preenchido.
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
| **3 · Proteção e futuro** | 11 Proteção |
| **4 · Investimentos** | 12 Investimentos |
| **5 · Pré-diagnóstico** | 5.1 Plano atual (visão breve) |
| **6 · Diagnóstico completo** | 6.1 Panorama · 6.2 Plano atual · 6.3 Pontos fortes · 6.4 Pontos de atuação · 6.5 Futuro · 6.6 Matriz de oportunidades · 6.7 Plano de ação |
| **7 · Jornada** | 7.1 Jornada do cliente · 7.2 Cronograma de implementação |

O progresso de **coleta** (menu lateral) considera as seções 1, 3 a 12. Seções opcionais podem ser marcadas como **"Não se aplica"**.

### Regras de preenchimento dinâmico

- **Estado civil:** "Nome do cônjuge" e "Renda do cônjuge" só aparecem para Casado(a) ou União estável.
- **Tem filhos?** Com "Sim", aparece o contador de filhos. A quantidade **cria os cartões automaticamente em Sucessão**. Diminuir remove só cartões ainda vazios. Com "Não", nada aparece.
- **CEP:** ao completar os 8 dígitos, o endereço é buscado automaticamente (ViaCEP, precisa de internet) e exibido abaixo do campo.
- **Sucessão:** mensalidades e auxílios entram sozinhos nas despesas fixas como "Dependentes (Sucessão)".
- **Financiamentos e dívidas:** a soma das parcelas (financiamentos + consórcios + empréstimos) preenche sozinha a categoria "Financiamento / Dívidas" das despesas. Sem parcelas lançadas na seção 8, vale o valor digitado.
- **Investimentos:** valor, liquidez diária, assessor e instituição só aparecem com "Tem investimentos? Sim".
- **Proteção:** capital e prêmio só aparecem com seguro de vida; o saldo, só com previdência.

---

## 3. Fórmulas

Taxas anuais viram mensais por equivalência composta: `i = (1 + anual)^(1/12) − 1`.
Retorno nominal = `(1 + inflação) × (1 + retorno real) − 1`.

### Renda e despesas
- `Renda = renda + renda do cônjuge + outras fontes` (frequência Anual ÷ 12).
- **Renda passiva** = outras fontes do tipo Aluguel, Dividendos/Juros e Pensão/Aposentadoria.
- `Despesas = fixas + variáveis`. As fixas incluem os dependentes e as parcelas.
- `Sobra = Renda − Despesas` · `Taxa de poupança = Sobra ÷ Renda`.
- `Comprometimento = Parcelas ÷ Renda` (alerta acima do limite dos parâmetros, padrão 30%).

### Balanço patrimonial
- **Ativos** = imóveis + móveis + investimentos + previdência + participação em empresa.
- **Passivos** = saldo dos financiamentos + empréstimos. Empréstimos não informam saldo, então ele é estimado por `parcela × prazo restante`, um teto que inclui juros.
- Consórcio não é passivo: é compromisso mensal (entra nas parcelas).
- `Patrimônio líquido = Ativos − Passivos`.

### Reserva de emergência
- Reserva = "quanto com liquidez diária" (Investimentos).
- `Meta = Despesas × meses da meta` · `Meses cobertos = Reserva ÷ Despesas`.

### Objetivos
- `Aporte mensal = valor futuro × i ÷ ((1 + i)^meses − 1)`, com `i` = retorno nominal mensal.
- **Probabilidade sugerida** ("sug." ao lado da régua): a sobra mensal é distribuída entre os objetivos na ordem Essencial → Desejo → Sonho e, dentro de cada grupo, por prioridade. A sugestão é a parte do aporte que a sobra cobre, limitada a 95%. O consultor decide o valor final.

### Proteção (capital de seguro de vida)
```
Manutenção = max(0, custo de vida − renda passiva − renda do cônjuge) × 12 × anos de proteção
Quitação   = passivos
Inventário = ativos × % de inventário
Capital necessário = max(0, manutenção + quitação + inventário − investimentos − previdência)
Gap = max(0, capital necessário − capital atual)
```
Custo de vida = despesas sem as parcelas, que já entram em quitação. O seguro da empresa não entra no capital atual.

### Futuro (independência financeira)
```
Renda desejada  = informada (ou custo de vida)
Outras rendas   = informada (ou renda passiva)
Patrimônio necessário = (renda desejada − outras rendas) × 12 ÷ 4%    (25×)
Projeção = investimentos + previdência hoje, investindo a sobra atual todo mês, a retorno real
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

**Nota LIFE** = média dos pilares com dados.

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
