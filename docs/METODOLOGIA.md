# Metodologia do Diagnóstico LIFE

Este documento descreve **o processo com o cliente** (a jornada e o roteiro de conversa) e **as fórmulas** usadas em cada etapa.
Tudo o que está aqui corresponde a arquivos editáveis do projeto:

| O quê | Onde editar |
|---|---|
| Fases, ordem das etapas e regra de "etapa concluída" | `src/config/etapas.ts` |
| Roteiro da conversa (abertura, perguntas, atenção, transição) | `src/config/roteiro.ts` |
| Campos de cada etapa (incluir / remover / renomear) | `src/config/campos.ts` |
| Fórmulas de cálculo | `src/lib/calculos.ts` |
| Notas dos pilares e sugestões do plano de ação | `src/lib/diagnostico.ts` |

---

## 1. A jornada do cliente

O diagnóstico é uma história contada em 5 fases. A ordem foi pensada para que **o cliente fale primeiro dos sonhos e só depois dos números**: assim cada número coletado já tem um propósito.

| Fase | Pergunta que responde | Etapas | Encontro sugerido |
|---|---|---|---|
| **1 · Conexão** | Quem é o cliente e onde ele quer chegar? | Apresentação, Cadastro, Sonhos, Filhos | Reunião 1 · Descoberta (60–90 min) |
| **2 · Raio-X financeiro** | Onde o cliente está hoje? | Receitas, Despesas, Patrimônio, Dívidas | Reunião 2 · Coleta de dados |
| **3 · Proteção e futuro** | Como proteger o que existe e construir o futuro? | Seguro de Vida, Aposentadoria, Alavancagem | Reunião 2 ou 3 · Análise |
| **4 · Diagnóstico e plano** | O que os números dizem e o que vamos fazer? | Visão geral, Plano de ação | Reunião 3 · Entrega |
| **5 · Acompanhamento** | Estamos evoluindo? | Histórico | Revisões mensais ou trimestrais |

### Documentos a pedir

O sistema mostra a lista no roteiro, na etapa anterior à fase em que os documentos são necessários.

- **Antes do Raio-X:** contracheques/pró-labore (3 meses), extratos bancários (3 meses), faturas de cartão (3 meses), última declaração de IR, extratos de investimentos e previdência, contratos de financiamentos e empréstimos.
- **Antes de Proteção e futuro:** apólices de seguro de vida (individual e da empresa), extrato do INSS (CNIS).

### O roteiro de cada etapa (storytelling da coleta)

No topo de cada etapa aparece o painel **Roteiro da conversa** com:

1. **Objetivo:** por que a etapa existe.
2. **Frase de abertura:** como introduzir o assunto.
3. **Perguntas-chave:** um checklist que você marca conforme pergunta. O progresso fica salvo por cliente.
4. **Pontos de atenção:** boas práticas e armadilhas comuns.
5. **Transição:** no rodapé, a frase-ponte que conecta com a próxima etapa.

Além disso:

- **Anotações da conversa:** campo livre em cada etapa para registrar frases do cliente, emoções e objeções.
- **"Por que é importante?"** em cada sonho e a **motivação** registrada na Apresentação reaparecem na Visão geral e na capa do PDF, em "Nas palavras do cliente". É o fio da história: o diagnóstico começa e termina com o que o cliente disse.
- **Modo apresentação** (botão no topo): oculta o roteiro, as anotações e os controles do consultor para compartilhar a tela com o cliente.
- **Não se aplica:** etapas opcionais (Filhos, Patrimônio, Dívidas, Seguro, Alavancagem) podem ser marcadas como não aplicáveis e contam como concluídas no progresso.

---

## 2. Parâmetros

Ficam no Cadastro de cada cliente (os valores padrão estão em `src/config/campos.ts`).

| Parâmetro | Padrão | Uso |
|---|---|---|
| Inflação geral | 5% a.a. | Educação (retorno nominal) |
| Inflação educacional | 8% a.a. | Correção do custo da faculdade |
| Retorno real esperado | 4% a.a. | Sonhos e educação |
| Meta de reserva | 6 meses | Reserva de emergência |
| Limite de parcelas | 30% da renda | Dívidas e alavancagem |

Taxas anuais viram mensais por equivalência composta: `i_mensal = (1 + i_anual)^(1/12) − 1`.

---

## 3. Fórmulas por etapa

### Receitas e despesas (fluxo de caixa)

- Itens com frequência **Anual** (13º, PLR, IPVA, IPTU...) são divididos por 12.
- `Renda = Σ receitas mensais` · `Renda passiva = Σ receitas do tipo Passiva`
- `Parcelas = Σ parcela estimada de cada dívida`
- `Sobra = Renda − Despesas − Parcelas` · `Taxa de poupança = Sobra ÷ Renda`
- **Regra de processo:** parcelas de empréstimos e financiamentos vão em **Dívidas**, nunca em Despesas, para não contar duas vezes.

### Patrimônio

- **Financeiro** = Reserva/Caixa + Renda fixa + Renda variável + Previdência.
- **Reserva disponível** = itens financeiros com liquidez *Diária* ou *Até 30 dias*.
- **Para aposentadoria** = Renda fixa + Renda variável + Previdência.
- `Patrimônio líquido = Patrimônio total − Saldo das dívidas`.

### Reserva de emergência

- `Custo mensal = Despesas + Parcelas`
- `Meta = Custo mensal × meses da meta` · `Meses cobertos = Reserva disponível ÷ Custo mensal`

### Dívidas

- Parcela estimada pela **Tabela Price**: `PMT = Saldo × i ÷ (1 − (1 + i)^−n)`, com `i` = taxa mensal equivalente e `n` = prazo em meses.
- `Juros a pagar = PMT × n − Saldo`.
- **Dívida cara:** tipo Cartão ou taxa ≥ 30% a.a. Entra como prioridade Alta no plano.
- `Comprometimento = Parcelas ÷ Renda` (alerta acima do limite).

### Sonhos

Valores em R$ de hoje, com retorno real:
`Aporte mensal = (Valor − Acumulado × (1+i)^n) × i ÷ ((1+i)^n − 1)`, com `i` = retorno real mensal e `n` = prazo em meses.

### Filhos (educação)

- `Custo hoje = Mensalidade da faculdade × 12 × duração`
- `Custo futuro = Custo hoje × (1 + inflação educacional)^anos até o ingresso`
- `Aporte mensal` para acumular o custo futuro, rendendo `(1 + inflação) × (1 + retorno real) − 1` ao ano.
- `Valor presente` (usado no seguro) = custo futuro descontado pela mesma taxa.

### Seguro de vida

```
Manutenção  = max(0, Despesas − Renda passiva) × 12 × anos de proteção
Dívidas     = saldo total (se "Quitar dívidas" = Sim)
Educação    = valor presente da educação dos filhos (se incluído)
Inventário  = Patrimônio total × % de inventário
Necessidade = soma dos quatro itens
Capital necessário = max(0, Necessidade − Patrimônio financeiro)
Gap = max(0, Capital necessário − Capital atual)
```
O seguro pela empresa só entra no capital atual se "Considerar seguro da empresa" = Sim, porque termina com o vínculo.

### Aposentadoria (independência financeira)

Valores reais (R$ de hoje):
```
Renda desejada  = Renda passiva alvo (ou Despesas anuais ÷ 12)
Patrimônio alvo = (Renda desejada − Renda passiva atual) × 12 ÷ taxa de retirada   (4% → 25×)
Gap             = Patrimônio alvo − Patrimônio já destinado
Aporte necessário = PMT que leva o patrimônio atual ao alvo até a idade alvo
```
Campos em branco usam valores automáticos: idade pela data de nascimento, despesas anuais = Despesas × 12, patrimônio destinado = renda fixa + variável + previdência.
O gráfico compara a **trajetória atual** (aporte atual) com a **trajetória técnica necessária**.

### Alavancagem (financiamento × consórcio × poupar)

```
Financiamento: parcela pela Tabela Price; total = parcela × meses
Consórcio:     total = Valor × (1 + taxa de administração + fundo de reserva); parcela = total ÷ meses
Economia vs financiamento = total do financiamento − total do consórcio
```
**Comparativo de patrimônio:** as três estratégias usam o **mesmo orçamento mensal** (a maior parcela). A diferença entre o orçamento e a parcela de cada estratégia fica investida ao "retorno investido". O bem valoriza pela "valorização do bem".
- *Poupar e comprar à vista:* investe o orçamento todo e compra no fim do prazo (se o saldo alcançar).
- *Financiamento:* usa o bem imediatamente.
- *Consórcio + investido:* usa o bem na contemplação (sorteio ou lance).

**Parcela saudável:** a parcela do consórcio precisa caber em `Renda × limite − parcelas atuais`.

> **Diferença em relação à versão anterior:** na versão original o custo do financiamento era calculado como `Valor × (1 + taxa)^anos`, juros compostos sobre o valor total sem amortização. Isso superestima o custo: R$ 740 mil para R$ 500 mil a 14% em 3 anos, contra R$ 608 mil pela Tabela Price. Esta versão usa a Tabela Price. Se preferir a fórmula antiga, altere `alavancagem()` em `src/lib/calculos.ts`.

---

## 4. Pilares e nota LIFE

Cada pilar recebe uma nota de 0 a 100. Status: **Saudável** ≥ 75, **Atenção** ≥ 45, **Crítico** abaixo disso.

| Pilar | Régua |
|---|---|
| Fluxo de caixa | Taxa de poupança ÷ 20% (sobra negativa = crítico) |
| Reserva de emergência | Meses cobertos ÷ meta |
| Dívidas | 100 − (comprometimento ÷ limite) × 60; com dívida cara a nota fica em no máximo 40 e o status é crítico |
| Proteção | Capital atual ÷ capital necessário |
| Independência financeira | Aporte atual ÷ aporte necessário |
| Sonhos | (Sobra − aporte de aposentadoria) ÷ aporte necessário para os sonhos |

**Nota LIFE** = média dos pilares com dados preenchidos.

## 5. Plano de ação

As sugestões são geradas na ordem recomendada:

1. Fluxo negativo ou poupança baixa
2. Dívidas caras e comprometimento acima do limite
3. Reserva de emergência
4. Proteção (seguro de vida, invalidez/DIT)
5. Aposentadoria
6. Educação dos filhos
7. Sonhos (por prioridade)
8. Alavancagem

O consultor escolhe com o cliente o que entra no plano. Cada ação recebe pilar, prioridade, prazo sugerido (30/90/180 dias), responsável e status. As ações com prazo vencido ou nos próximos 7 dias aparecem no sino de notificações.

## 6. Acompanhamento

Em cada revisão, use **Registrar fotografia** na etapa Histórico. O sistema grava os indicadores do dia (nota LIFE, renda, despesas, sobra, patrimônio, dívidas, patrimônio líquido, reserva, independência e cobertura do seguro) e monta a linha do tempo de evolução.
