# Metodologia do Diagnóstico LIFE (versão 8)

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
| Pilares e sugestões do plano de ação | `src/lib/diagnostico.ts` |
| Cartões do plano atual, potencial e otimização, perfil financeiro e bússola | `src/lib/plano.ts` |
| Matriz de oportunidades (6 áreas, potencial e peso de cada produto) | `src/lib/oportunidades.ts` |

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
| **6 · Diagnóstico completo** | 6.1 Panorama geral · 6.2 Plano atual · 6.3 Plano potencial · 6.4 Plano otimização · 6.5 Futuro (simulação) · 6.6 Matriz de oportunidades · 6.7 Bússola financeira · 6.8 Plano de ação |
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

### Proteção — o que contratar (6.3 · Plano potencial)
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

**Simulação (6.5):** quatro réguas deslizantes — investimento mensal, rentabilidade real, idade de aposentadoria e renda desejada — refazem a conta na hora. A simulação fica salva no cliente (não altera os dados da coleta); "Voltar aos dados da coleta" desfaz. Com a simulação ativa, o gráfico mostra as duas trajetórias (simulação × dados da coleta).

**Patrimônio ao longo da vida:** até os 95 anos. Antes da aposentadoria o patrimônio recebe o aporte mensal; depois, paga todo mês a renda que falta (renda desejada − outras rendas). Se o saldo zerar, o sistema mostra a idade em que o patrimônio acaba.

**Plano de independência (1, 5 e 10 anos):** para cada marco, a mesma trajetória do gráfico mostra o patrimônio, o % da meta, a renda passiva (4% ao ano do patrimônio ÷ 12 + outras rendas), o total aportado (patrimônio de hoje + aportes), os rendimentos (patrimônio + retiradas − aportado) e, se a aposentadoria cair antes do marco, o total retirado.

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

### Panorama geral (6.1)
- **Perfil:** nome, idade, estado civil, ocupação e regime, filhos e dependentes (com idade), objetivos por tipo, declaração do IR, perfil de investidor, aposentadoria desejada e empresa.
- **Perfil financeiro:** renda, despesas, sobra, patrimônio líquido, parcelas sobre a renda e meses de reserva, com o **momento financeiro**:

| Momento | Regra (na ordem) |
|---|---|
| Em déficit | sobra negativa |
| Endividado | parcelas acima do limite ou dívidas caras com parcelas ≥ 5% da renda |
| Construtor de patrimônio | poupa ≥ 20% e já investe (a reserva de emergência não conta como investimento) |
| Poupador | poupa ≥ 20% |
| Equilibrado | poupa ≥ 10% |
| Consumidor | poupa menos de 10% |

- Também traz a nota LIFE e os pilares, o fluxo de caixa (renda × despesas), as maiores categorias e o balanço patrimonial.

### Plano atual (6.2), Plano potencial (6.3) e Plano otimização (6.4)
Cada plano é uma lista de cartões com três colunas:

| Plano | Colunas | Origem dos cartões automáticos |
|---|---|---|
| 6.2 Plano atual | Diagnóstico · Motivo · Risco da inação | `planoAtual()`: déficit ou poupança < 20%, necessidades > 50%, desejos > 30%, anuidade, dívidas caras, parcelas acima do limite, família descoberta, renda sem invalidez/DIT, sem plano de saúde, bens sem seguro, reserva incompleta, sem investimentos, PGBL no simplificado, independência abaixo da meta, objetivos maiores que a sobra ou com chance < 50%, mudanças de vida que apertam o orçamento e custo do inventário. Ordem: gravidade Alta → Média → Baixa. |
| 6.3 Plano potencial | Oportunidade identificada · Como podemos atuar juntos · Objetivo desejado | As oportunidades da matriz (6.6), na ordem de potencial. Mostra 6 e "Ver mais". Abaixo, o cálculo de **Proteção · o que contratar**. |
| 6.4 Plano otimização | Descrição · Motivo da escolha · Como melhorar | `planoOtimizacao()`: boa poupança, orçamento no 50-30-20, milhas, sem dívidas ou parcelas sob controle, imóveis quitados, patrimônio sólido, seguro de vida, invalidez, saúde, bens segurados, reserva completa, investimentos, previdência (PGBL com declaração completa), independência no caminho e mudanças que aliviam o orçamento. |

Na versão consultor, cada cartão tem:
- **Lápis:** personaliza o texto (o cartão automático vira um cartão editável com título, área, gravidade/prioridade e as três colunas; a seta circular volta ao texto automático).
- **Olho:** oculta o cartão na apresentação e no PDF.
- **Adicionar:** cria um cartão próprio do consultor.
- No Plano potencial, **"Levar ao plano"** cria a ação no plano de ação.

O 6.2 também mostra a probabilidade de cada objetivo, atual × com plano.

### Matriz de oportunidades (6.6) — ecossistema
Radar com **6 pontas: Proteção, Futuro, Patrimonial, Investimentos, Sucessão e Fiscal/Tributário**, e a lista das oportunidades **em ordem de potencial**, cada uma com o que oferecer, por quê e o objetivo para o cliente.

**Potencial (0 a 100)** = peso do produto + ajuste pela relevância para o cliente. Pesos (em `PESO_PRODUTO`, com foco em receita):

| Produto | Peso |
|---|---|
| Seguro | 82 |
| Consórcio | 78 |
| Previdência | 66 |
| Investimento | 56 |
| Planejamento | 50 |
| Crédito | 46 |

Exemplos de ajuste: seguro de vida sobe com o tamanho do gap em anos de renda; consórcio no lugar de um financiamento planejado sobe 12; invalidez/DIT sobe para empresário e autônomo.

**Nota do radar por área** = 80% da maior oportunidade da área + 4 pontos por oportunidade extra (máximo 100).

Oportunidades por área:
- **Proteção (seguros):** vida (gap), invalidez/doenças graves/DIT (não se aplica a aposentados), vida do cônjuge, saúde, auto/náutico, residencial, empresarial, seguro de sócio, vida em grupo (empresa com funcionários), saúde PME, RC profissional (autônomo/liberal) e viagem anual.
- **Patrimonial (consórcios):** consórcio para futuras aquisições (no lugar do financiamento), para objetivos de casa e veículo, para a troca de bens (modelo de desejo), para a próxima troca de veículo financiado, para bens da empresa, de serviços (reformas e gastos únicos ≥ R$ 15 mil) e imobiliário para construir patrimônio (sobra ≥ R$ 3 mil); portabilidade/amortização de financiamento.
- **Sucessão:** seguro de vida para o inventário (só quando os recursos financeiros já cobrem a necessidade e não há seguro de vida; com capital a contratar, o inventário já está dentro do seguro de vida), holding/planejamento sucessório e VGBL como instrumento sucessório (reserva + investimentos ≥ R$ 200 mil, já que a previdência não entra no inventário).
- **Fiscal/Tributário:** PGBL para quem declara no completo e já tem previdência (sem previdência, a oportunidade de previdência privada do Futuro já oferece o PGBL; o limite de 12% é sobre a renda bruta tributável do cliente), rever PGBL no simplificado, comparar simplificada × completa (só para quem declara no simplificado), revisão tributária da empresa e investimentos isentos (LCI/LCA com FGC; CRI/CRA sem FGC).
- **Investimentos:** começar a investir, reserva de emergência, assessoria, diversificação, investimento para compra à vista, suitability, patrimônio financeiro e cartão com benefícios.
- **Futuro:** previdência privada, plano de independência (exige a data de nascimento) e fundo de educação (dependentes com a faculdade pela frente).

O topo da seção resume o **foco em receita**: quantidade de oportunidades de seguros e consórcios, capital de vida sugerido e valor em cartas. Tocar em uma área do radar (ou da lista) filtra as oportunidades. Cada oportunidade vai ao plano de ação com um clique.

### Bússola financeira (6.7)
Quatro direções, cada uma com nota de 0 a 100 (média ponderada dos indicadores com dados), status, indicadores e ações:

| Direção | Pergunta | Indicadores (peso) |
|---|---|---|
| N · Organização | O dinheiro do mês está sob controle? | taxa de poupança ÷ 20% (35) · excesso sobre 50-30-20 (20) · parcelas sobre a renda (25) · dívidas caras (20) |
| L · Patrimonial | O patrimônio e a família estão protegidos? | cobertura do seguro de vida (35) · bens com seguro (20) · plano de saúde (15) · dívidas sobre os bens (15) · inventário coberto (15) |
| S · Liberdade financeira | O futuro está garantido? | % da meta de independência (55) · aporte atual ÷ necessário (25) · objetivos cabem na sobra (20) |
| O · Gestão de ativos | Os investimentos estão bem cuidados? | reserva em meses (35) · investe (20) · assessoria e perfil (15) · temas conhecidos (15) · previdência × declaração do IR (15) |

- **Saúde financeira** = média das direções com dados.
- **Norte** = a direção que mais precisa de atenção: primeiro a de status mais grave (Crítico antes de Atenção) e, entre elas, a de menor nota. A agulha aponta para ela e o painel "Seu norte agora" traz as três primeiras ações.
- As ações da bússola usam os mesmos códigos das sugestões e oportunidades equivalentes: levar uma delas ao plano marca as outras como "No plano".
- Cada ação vai ao plano de ação com um clique (versão consultor).

### Plano de ação (6.8) e cronograma (7.2)
- Cada ação tem área, prioridade (Alta, Média, Baixa), prazo (Curto, Médio, Longo) e status.
- Áreas: Fluxo de caixa, Dívidas, Proteção, Futuro, Patrimonial, Investimentos, Sucessão, Fiscal/Tributário e Objetivos (a antiga área "Seguros" virou "Proteção").
- O cronograma distribui as ações em **Curto (até 3 meses), Médio (3 a 12) e Longo (acima de 12)**, a partir da data do encontro de fechamento (ou de hoje).

### Jornada (7.1)
Encontros padrão: Conexão → Raio-X → Diagnóstico completo → Fechamento → Acompanhamento trimestral. Cada um tem data e status (Pendente, Agendada, Realizada). Encontros atrasados ou nos próximos 7 dias aparecem no sino do cabeçalho.
