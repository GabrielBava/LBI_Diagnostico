# Metodologia do Diagnóstico LIFE (versão 11)

Este documento descreve **o processo com o cliente** e **as fórmulas** de cada seção.
Tudo corresponde a arquivos editáveis:

| O quê | Onde editar |
|---|---|
| Etapas, seções, ordem e regra de "seção concluída" | `src/config/estrutura.ts` |
| Campos de cada seção (incluir / remover / renomear) | `src/config/campos.ts` |
| Blocos e subcategorias de despesas (e a parte de cada bloco no 50-30-20) | `src/config/despesas.ts` |
| Tabelas de INSS/IR (CLT) e Simples Nacional/pró-labore (PJ) para estimar bruta ↔ líquida | `src/config/tributos.ts` |
| Roteiro da conversa e frases de abertura das etapas | `src/config/roteiro.ts` |
| Modelos de mensagem da 5.2 (cliente e amigos/familiares) | `src/config/mensagens.ts` |
| Especificação (percentual, desconto Pix, taxas do cartão, validade, itens inclusos, textos do PDF) | `src/config/especificacao.ts` (contas em `src/lib/especificacao.ts`) |
| Estrela LIFE (pilares, sub-pilares e regras) | `src/lib/estrela.ts` |
| Analítico do Planejador (prompt, chamada ao Claude, validação; leitura de .txt/.vtt/.srt/.docx) | `src/lib/analitico.ts` · `src/lib/arquivo-texto.ts` |
| Diagnóstico em PDF ("Plano de Vida Financeira"): textos fixos / números e páginas | `src/config/relatorio.ts` / `src/components/relatorio/` |
| Apresentação do V1 · Institucional (páginas do PDF) | `src/assets/v1/` — gerar com `python3 scripts/gerar-v1.py <arquivo.pdf>` |
| Fórmulas de cálculo | `src/lib/calculos.ts` |
| Pilares e sugestões do plano de ação | `src/lib/diagnostico.ts` |
| Cartões do plano atual, potencial e otimização, perfil financeiro e bússola | `src/lib/plano.ts` |
| Matriz de oportunidades (6 áreas, potencial e peso de cada produto) | `src/lib/oportunidades.ts` |

---

## 1. Como a página funciona

- **Rolagem contínua:** todas as seções ficam em uma única página. Ao rolar, você passa de uma categoria para a próxima e o menu lateral acompanha. Clicar no menu leva à seção.
- **Versão consultor × versão apresentação:** o botão no topo alterna entre as duas. O diagnóstico **sempre abre na versão apresentação**.
  - A versão apresentação vai **até a etapa 5** (pré-diagnóstico: 5.1 Plano atual e 5.2 Recomendações). As etapas **6 (diagnóstico completo), 7 (especificação) e 8 (analítico do planejador) só aparecem na versão consultor**.
  - A versão apresentação oculta o roteiro, as anotações, os parâmetros financeiros, as sugestões internas e as seções marcadas como ocultas.
  - Cada seção tem o botão **"Na apresentação / Oculta na apresentação"** para decidir o que o cliente vê. A **Matriz de oportunidades** começa oculta.
  - O PDF do diagnóstico segue o modelo "Plano de Vida Financeira" (ver seção do PDF).
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
| **2 · Raio-X financeiro** | 5 Despesas · 6 Renda · 7 Patrimônio · 8 Financiamento, consórcio e FGTS · 9 Projetos · 10 Corporativo |
| **3 · Proteção e futuro** | 11 Proteção · 12 Futuro (aposentadoria) |
| **4 · Investimentos** | 13 Investimentos |
| **5 · Pré-diagnóstico** | 5.1 Plano atual: renda total, despesas atuais e modelo 50-30-20 (liberado por "Finalizar coleta") · 5.2 Recomendações: indicações do cliente (liberada por "Gerar recomendações") |
| **6 · Diagnóstico completo** | 6.1 Panorama geral · 6.2 Plano atual · 6.3 Plano potencial · 6.4 Plano otimização · 6.5 Futuro (simulação) · 6.6 Matriz de oportunidades · 6.7 Bússola financeira · 6.8 Plano de ação |
| **7 · Especificação** (só versão consultor) | 7.1 Especificação do planejamento: valor do plano e condições de pagamento, com PDF |
| **8 · Analítico do Planejador** (só versão consultor) | 8.1 Transcrições da reunião · 8.2 Dores, preocupações e gatilhos · 8.3 Notas do Planejador · 8.4 Analítico IA |

A antiga etapa **Jornada** (jornada do cliente e cronograma) saiu na versão 11; os encontros já registrados ficam guardados nos dados, sem uso.

O progresso de **coleta** (menu lateral) considera as seções 1 e 3 a 13. Seções opcionais podem ser marcadas como **"Não se aplica"**.

### Regras de preenchimento dinâmico

- **Estado civil:** "Nome do cônjuge" e "Renda do cônjuge" só aparecem para Casado(a) ou União estável.
- **Tem filhos?** Com "Sim", aparece o contador de filhos. A quantidade **cria os cartões automaticamente em Sucessão**. Diminuir remove só cartões ainda vazios. Com "Não", nada aparece.
- **Cadastro:** sexo (Homem / Mulher), usado no perfil. O antigo campo "Perfil" (ex.: "Cliente Private") saiu.
- **V1 Institucional:** só a apresentação em PDF (páginas como imagens), com setas, miniaturas, teclado, tela cheia ("Apresentar") e os links do PDF clicáveis. Sem textos nem campos.
- **Ponto de partida (3 · Objetivos):** motivação, satisfação com a organização do dinheiro (0 a 10) e **quanto consegue poupar todos os meses** (régua de R$ 0 a R$ 5.000, de 100 em 100; o teto fica em `POUPANCA_MENSAL_MAX`), guardados no cadastro. A motivação e a satisfação aparecem em "Nas palavras do cliente" (6.1) e no PDF; o quanto consegue poupar entra no resumo do 5.1, no futuro (6.5) e no plano.
- **Satisfação financeira e impacto dos objetivos:** escala de 0 a 10 com um botão por nota.
- **Objetivos:** primeiro as categorias (ícones); arrasta-se a categoria para **Essencial, Desejo ou Sonho** e então abrem os campos do objetivo. As probabilidades (atual e com o plano) saíram. Na coleta não aparecem totais, aportes nem "cabe na sobra"; o aporte de cada objetivo aparece só na versão consultor. Cada cartão tem um botão à direita que oculta os campos e deixa só o resumo (valor, prazo e prioridade).
- **Sucessão:** nada aparece sem filhos ou dependentes. Para adicionar, escolhe-se primeiro a categoria. Filhos, enteados e netos têm idade e escolaridade; Pai/Mãe e "Outro dependente" mostram auxílio e outros custos. Mensalidades, auxílios e custos entram sozinhos nas despesas fixas (bloco Dependentes). Sem totalizadores no topo.
- **Despesas:** ao lado de cada bloco há uma dica em palavras simples — **fixas** "se repetem todo mês, quase sempre no mesmo valor" (casa, mercado, transporte, saúde, escola, seguros e parcelas); **variáveis** "mudam de um mês para o outro, conforme o quanto e quantas vezes você usa" (restaurantes, lazer, roupas, assinaturas, esportes e viagens). Blocos (Casa, Mercado, Transporte…) com subcategorias (Aluguel, Condomínio, Luz…). Cada bloco aceita itens extras. Transporte: combustível, estacionamento/garagem, aplicativos (Uber e 99) e transporte público; manutenção e IPVA vêm dos veículos (Patrimônio). A anuidade dos cartões (Renda) entra em "Outras despesas fixas". As parcelas não são digitadas aqui: vêm da seção 8 e aparecem só no total.
- **Renda:** bruta e líquida mensal do cliente, lado a lado (meio a meio); no canto superior direito do cartão, **CLT | PJ** (o mesmo para o cônjuge), que define as deduções da estimativa; com **CLT**, abrem **vale-refeição/alimentação (opcional)** e **vale-transporte (opcional)**, que entram na renda total; renda extra; **13º salário e bônus anual** (valores líquidos do ano); do cônjuge só para casado(a) ou união estável. Se só uma for informada, a outra é estimada. Modelo da declaração do IR (simplificada, completa ou não declara). Rendas extras ou de outra pessoa ficam em lista própria ("Outras rendas · PLR, aluguel ou de outra pessoa"); o bônus anual não se repete ali (o antigo tipo "Bônus / PLR" virou "PLR"). Cartões: com "Tem cartão de crédito? Sim", abre ao lado **Quantos cartões?** (1, 2, 3, 4…), que cria um cartão para cada (qual, limite, gasto mensal, milhas e anuidade por ano). Diminuir remove só cartões vazios (com dados, pede confirmação).
- **Patrimônio:** imóveis e móveis com situação **Quitado / Financiado** e flag de seguro. Bem financiado abre instituição, parcela, prazo e saldo (opcional) e vira financiamento automaticamente na seção 8. Veículos: manutenção e IPVA por ano; "pensa em ampliação/troca" abre, lado a lado, o **modelo de desejo** e o **valor de compra** (entra na oferta de consórcio para a troca). **Futuras aquisições:** com "Sim", lista de segmento (imóvel/veículo), categoria, tipo, valor desejado e estratégia (à vista, financiamento, consórcio).
- **Financiamento, consórcio e FGTS (8):** financiamentos (inclusive os do patrimônio), consórcios (parcela, prazo, carta) e dívidas com categoria (cartão, cheque especial, carnê, renegociação, empréstimo pessoal, consignado…). A soma das parcelas entra no total de despesas. **FGTS:** "Tem saldo de FGTS?" com "Sim" abre o saldo e "Contribui há mais de 2 anos?". O saldo entra nos ativos do balanço; com mais de 2 anos, a oferta de portabilidade/amortização cita o uso do FGTS na casa própria.
- **Proteção:** reserva de emergência (valor e meses na visão do cliente), seguros, invalidez/DIT, **é fumante?** (substituiu o antigo "plano de saúde"; entra nas ofertas de seguro como "Cotação para fumante") e previdência (PGBL, VGBL ou os dois).
- **Futuro (12):** só idade de aposentadoria, renda desejada, outras fontes de renda no mês e estilo da aposentadoria (cartões). O investimento mensal e a poupança mínima/máxima saíram (o quanto consegue poupar está no ponto de partida; na migração, o valor antigo vai para lá). **Mudanças de vida programadas:** com "Sim", lista com a mudança, o impacto (aumenta/reduz despesas, aumenta/reduz renda ou gasto único), daqui a quantos meses e o valor.
- **Investimentos:** nível de conhecimento e perfil de investidor lado a lado na mesma linha; temas já estudados (múltipla escolha) na linha inteira; valor (sem a reserva), assessor e instituição só aparecem com "Tem investimentos? Sim".

---

## 3. Fórmulas

Taxas anuais viram mensais por equivalência composta: `i = (1 + anual)^(1/12) − 1`.
Retorno nominal = `(1 + inflação) × (1 + retorno real) − 1`.

### Renda
- Para cada pessoa: se só a **bruta** for informada, a **líquida** é estimada; se só a líquida, a bruta é estimada pelo inverso. Mesmas regras da calculadora CLT x PJ da Contabilizei (`src/config/tributos.ts`):
  - **CLT:** bruta − INSS − IRRF. INSS empregado 2026 (teto R$ 8.475,55), IRRF mensal com a dedução mais vantajosa (INSS ou desconto simplificado de R$ 607,20) e o redutor de 2026 (isenção até R$ 5.000, redução parcial até R$ 7.350). Ex.: R$ 9.000 de bruta → R$ 2.282,64 de descontos → R$ 6.717,36 de líquida.
  - **PJ:** bruta − Simples Nacional (Anexo III, faturamento anual = bruta × 12, sem Fator R: 6% até R$ 180 mil/ano, depois a alíquota efetiva da faixa) − INSS de 11% sobre o pró-labore de um salário mínimo (R$ 1.621,00 → R$ 178,31). Ex.: R$ 9.000 → R$ 718,31 de descontos → R$ 8.281,69.
- `Renda total (líquida) = líquida do cliente + renda extra + (13º + bônus anual) ÷ 12 + benefícios do CLT (VR/VA + VT, cliente e cônjuge) + líquida do cônjuge + outras rendas` (frequência Anual ÷ 12).
- `Renda bruta total = bruta do cliente + bruta do cônjuge` (estimada quando só a líquida foi informada) — base da especificação (etapa 7).
- **Renda passiva** = outras fontes do tipo Aluguel, Dividendos/Juros e Pensão/Aposentadoria.
- Renda marcada como do cônjuge só entra no total quando o estado civil é casado(a) ou união estável.
### Despesas
- Cada subcategoria guarda um valor mensal; o bloco soma subcategorias e itens extras.
- `Despesas = fixas + variáveis`. As fixas incluem Dependentes (de Sucessão), as parcelas da seção 8, manutenção e IPVA dos veículos (÷ 12) e a anuidade dos cartões (÷ 12).
- O gasto informado nos cartões **não** é somado de novo: ele já está distribuído nas despesas.
- `Sobra = Renda − Despesas` · `Taxa de poupança = Sobra ÷ Renda`.
- **Aportes em projetos** = soma do "aporte mensal" dos projetos (9) · `Sobra livre = Sobra − Aportes em projetos`. Sem o "quanto consegue poupar" (ponto de partida), o futuro usa a sobra livre.
- `Comprometimento = Parcelas ÷ Renda` (alerta acima do limite dos parâmetros, padrão 30%). As parcelas são as da seção 8 (com os bens financiados do Patrimônio).

### 5.1 · Plano atual (pré-diagnóstico)
- **Renda total (cliente e dependentes):** líquida do cliente, renda extra, 13º e bônus (média mensal), líquida do cônjuge e outras rendas por pessoa (cliente, cônjuge, outra pessoa).
- **Despesas atuais:** despesas fixas (sem parcelas), despesas variáveis, financiamentos e consórcios (parcelas, inclusive bens financiados), dívidas (parcelas) e aportes em projetos; total de saídas e **sobra livre** (ou déficit).
- **Modelo 50-30-20 (renda líquida)** e o **resumo da análise**:
  - **Essencial (50)** — até 50% da renda: casa, alimentação, mercado, transporte, saúde, seguros, educação, dependentes, outras fixas e parcelas.
  - **Estilo e Desejos (30)** — até 30%: cuidados pessoais, profissionais, restaurantes, lazer, roupas, assinaturas, esportes, viagens e outros.
  - **Projeto e Investimentos (20)** — pelo menos 20%: renda − despesas = aportes em projetos + sobra livre.
- Aportes declarados acima da sobra: o topo, as despesas atuais, o gráfico e a lista de categorias mostram o mesmo déficit (despesas + aportes − renda), com o alerta em amarelo; no 6.2 aparece o cartão "Aportes em projetos acima da sobra".
- Com o "quanto consegue poupar" do ponto de partida, o resumo compara esse valor com o ideal de 20% ("abaixo dos R$ X do modelo" ou "já cobre").
- A renda total mostra a linha **Benefícios do CLT (VR/VA e VT)** quando houver.
- A parte de cada bloco fica no campo `modelo` de `src/config/despesas.ts`; os nomes, em `MODELO_50_30_20`.

### 5.2 · Recomendações (indicações do cliente)
- Logo depois do 5.1 fica o botão **Gerar recomendações** (com atalho no menu, na etapa 5). Ele só aparece depois de "Finalizar coleta" e some depois do clique.
- Ao clicar, a etapa **5.2 · Recomendações** entra no diagnóstico e no menu, com **três blocos** de indicação e a página rola até ela. Cada bloco tem **Nome** e **Contato** (WhatsApp, telefone ou e-mail, texto livre).
- O título de cada bloco acompanha o **nome** digitado ("Recomendação 1" vira "Ana Souza").
- **Adicionar recomendação** cria mais blocos; a lixeira remove um bloco. O topo conta as recomendações preenchidas (nome ou contato).
- Na versão consultor, o **roteiro** da 5.2 já abre junto (perguntas para pedir indicações).
- **Modelos de mensagem** (lado a lado, editáveis em `src/config/mensagens.ts`): à esquerda, a mensagem **para o cliente** (agradecimento pela reunião e pedido de indicação, com o primeiro nome do cliente); à direita, a mensagem **para amigos e familiares**, que o cliente encaminha (com "[Nome]" ou o primeiro nome de uma indicação escolhida em "Personalizar para"). Cada uma tem **Copiar** e **WhatsApp** (a do cliente abre a conversa com o telefone do cadastro).
- **Finalizar recomendações** (como "Finalizar coleta") encerra a etapa; na versão consultor, a página segue para o diagnóstico completo. "Reabrir recomendações" desfaz.
- Enquanto nada estiver preenchido, a versão consultor mostra **Fechar recomendações**: a 5.2 sai do diagnóstico e o botão volta.
- As recomendações ficam salvas com o cliente (`recomendacoes`; datas em `recomendacoesAbertas` e `recomendacoesFinalizadas`), entram no backup JSON e não vão para o PDF do diagnóstico. "Reabrir coleta" esconde a 5.2 junto com as etapas 5 e 6, sem apagar nada.

### Balanço patrimonial
- **Ativos** = imóveis + móveis + reserva + investimentos + previdência + participação em empresa + FGTS (com "Tem saldo de FGTS? Sim").
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
- **Cobertura de cada objetivo** (rodapé do cartão, versão consultor): a sobra livre do mês (depois dos aportes em projetos) é distribuída entre os objetivos na ordem Essencial → Desejo → Sonho e, dentro de cada grupo, por prioridade; a cobertura é a parte do aporte que a sobra livre cobre (0 a 100%). As probabilidades (atual e com o plano) saíram na versão 11.

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
Projeção = investimentos + previdência hoje (sem a reserva), investindo todo mês o "quanto consegue poupar" do ponto de partida (ou, em branco, a sobra livre), a retorno real
Independência = projeção ÷ patrimônio necessário
Aporte necessário = aporte mensal que leva o patrimônio de hoje ao necessário até a idade de aposentadoria
```
Valores reais (R$ de hoje).

**Simulação (6.5):** quatro réguas deslizantes — investimento mensal (com o atalho "Consegue poupar: R$ X/mês" do ponto de partida), rentabilidade real, idade de aposentadoria e renda desejada — refazem a conta na hora. A simulação fica salva no cliente (não altera os dados da coleta); "Voltar aos dados da coleta" desfaz. Com a simulação ativa, o gráfico mostra as duas trajetórias (simulação × dados da coleta).

**Patrimônio ao longo da vida:** até os 95 anos. Antes da aposentadoria o patrimônio recebe o aporte mensal; depois, paga todo mês a renda que falta (renda desejada − outras rendas). Se o saldo zerar, o sistema mostra a idade em que o patrimônio acaba.

**Plano de independência (1, 5 e 10 anos):** para cada marco, a mesma trajetória do gráfico mostra o patrimônio, o % da meta, a renda passiva (4% ao ano do patrimônio ÷ 12 + outras rendas), o total aportado (patrimônio de hoje + aportes), os rendimentos (patrimônio + retiradas − aportado) e, se a aposentadoria cair antes do marco, o total retirado.

---

## 4. Diagnóstico

### Estrela LIFE e nota LIFE (6.1 Panorama)
Regras em `src/lib/estrela.ts`. São **8 pilares** e **20 sub-pilares**; cada sub-pilar vale de **0 a 5 pontos inteiros** (fração × 5, arredondada), cada pilar de 10 tem 2 sub-pilares e cada pilar de 15 tem 3, e o **total vai de 0 a 100**. Estado do pilar sobre nota ÷ máximo: **Saudável ≥ 75% · Atenção ≥ 45% · Crítico** abaixo disso; sem nenhum dado, "Sem dados" (sub-pilar sem dados vale 0).

| Pilar (máx.) | Sub-pilar | Régua |
|---|---|---|
| Organização Financeira (10) | Fluxo de caixa | taxa de poupança ÷ 20% (déficit = 0) |
| | Orçamento mensal | 1 − (excesso do essencial acima de 50% + excesso de estilo e desejos acima de 30%) ÷ 30 p.p. |
| Comportamento (10) | Estratégias complementares | 1/3 cartão a favor (milhas, gasto sem benefício abaixo de R$ 3.000/mês ou sem cartão) + 1/3 renda extra ou passiva + 1/3 tem previdência |
| | Disciplina de investimentos | 4/5 (quanto consegue poupar ÷ 20% da renda; em branco, a sobra livre) + 1/5 já tem investimentos ou previdência |
| Proteção Financeira (15) | Gestão de riscos | 70% cobertura do seguro de vida + 30% invalidez/DIT (aposentado não conta) |
| | Reserva de emergência | meses cobertos ÷ meta |
| | Proteção patrimonial | parte do valor dos imóveis e veículos com seguro |
| Objetivos Financeiros (15) | Clareza dos objetivos | 80% objetivos com valor e prazo + 20% com o "porquê" |
| | Execução | sobra livre ÷ aporte necessário dos objetivos |
| | Conclusão dos objetivos | objetivos com cobertura de 100% contam 1; parciais, metade da cobertura |
| Acúmulo de Capital (10) | Independência bancária | metade sem dívidas caras + metade 1 − (comprometimento ÷ limite) × 0,6 |
| | Diversificação de portfólio | 60% classes ÷ 4 (temas estudados de quem investe, previdência, imóvel de renda) + 40% parte financeira do patrimônio ÷ 20% |
| Planejamento da Aposentadoria (15) | Investimentos para aposentadoria | % da meta de independência (projeção ÷ patrimônio necessário) |
| | Projeção e planejamento | 70% aporte atual ÷ necessário + 30% definiu estilo de vida ou renda desejada |
| | Conhecimento tributário | 0,4 declaração do IR informada + 0,6 previdência coerente (completa + PGBL = 1; completa + VGBL = 0,5; simplificada + VGBL = 1; simplificada + PGBL = 0) |
| Expansão de Capital (10) | Aquisição de bens | 60% parte do valor dos bens já paga + 40% futuras aquisições por consórcio ou à vista |
| | Crescimento patrimonial | patrimônio líquido ÷ (idade × renda líquida anual ÷ 10) |
| Sucessão Patrimonial (15) | Conhecimento sobre sucessão | estudou "Planejamento sucessório" = 1; senão, conhecimento avançado 0,4 e intermediário 0,2 |
| | Implementação | tem seguro de vida individual, previdência com saldo e, com empresa, acordo de sócios |
| | Segurança do legado | metade (seguro individual + previdência) ÷ custo do inventário + metade cobertura do seguro de vida (com cônjuge ou dependentes) |

**Tela:** à esquerda o radar (8 pontas; com **"Exibir sub-pilares"**, 20), à direita o **Resumo do diagnóstico** — cada pilar com o que é, nota / máximo, estado e barra, **do mais crítico ao mais saudável** (sem dados no fim); clicar num pilar mostra os sub-pilares e "o que pesou" com os números do cliente.

**Nota LIFE** = total da estrela (0 a 100; sem nenhum dado, "—"). É a nota do Panorama, da lista de clientes e do PDF.

Os 6 pilares antigos (`pilares()` em `src/lib/diagnostico.ts`) continuam só como apoio interno.
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
| 6.2 Plano atual | Diagnóstico · Motivo · Risco da inação | `planoAtual()`: déficit ou poupança < 20%, aportes em projetos acima da sobra, essencial > 50%, estilo e desejos > 30%, anuidade, dívidas caras, parcelas acima do limite, família descoberta, renda sem invalidez/DIT, bens sem seguro, reserva incompleta, sem investimentos (com a sobra livre), PGBL no simplificado, independência abaixo da meta, objetivos maiores que a sobra livre, mudanças de vida que apertam o orçamento e custo do inventário. Ordem: gravidade Alta → Média → Baixa. Na tela, abas **Gravidade alta / média / baixa / Todas** (com a contagem) mostram um grupo por vez; abre na mais alta que tiver cartões. |
| 6.3 Plano potencial | Oportunidade identificada · Como podemos atuar juntos · Objetivo desejado | As oportunidades da matriz (6.6), na ordem de potencial. Mostra 6 e "Ver mais". Abaixo, o cálculo de **Proteção · o que contratar**. |
| 6.4 Plano otimização | Descrição · Motivo da escolha · Como melhorar | `planoOtimizacao()`: boa poupança, orçamento no 50-30-20, milhas, sem dívidas ou parcelas sob controle, imóveis quitados, patrimônio sólido, seguro de vida, invalidez, bens segurados, reserva completa, investimentos, previdência (PGBL com declaração completa), independência no caminho e mudanças que aliviam o orçamento. |

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
- **Proteção (seguros):** vida (gap), invalidez/doenças graves/DIT (não se aplica a aposentados; vida e DIT pedem "Cotação para fumante" quando o cliente é fumante), vida do cônjuge, auto/náutico, residencial, empresarial, seguro de sócio, vida em grupo (empresa com funcionários), saúde PME, RC profissional (autônomo/liberal) e viagem anual.
- **Patrimonial (consórcios):** consórcio para futuras aquisições (no lugar do financiamento), para objetivos de casa e veículo, para a troca de bens (modelo de desejo), para a próxima troca de veículo financiado, para bens da empresa, de serviços (reformas e gastos únicos ≥ R$ 15 mil) e imobiliário para construir patrimônio (sobra livre ≥ R$ 3 mil; parcela de até 30% da sobra livre); portabilidade/amortização de financiamento.
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
| L · Patrimonial | O patrimônio e a família estão protegidos? | cobertura do seguro de vida (35) · bens com seguro (20) · dívidas sobre os bens (15) · inventário coberto (15) |
| S · Liberdade financeira | O futuro está garantido? | % da meta de independência (55) · aporte atual ÷ necessário (25) · objetivos cabem na sobra livre (20) |
| O · Gestão de ativos | Os investimentos estão bem cuidados? | reserva em meses (35) · investe (20) · assessoria e perfil (15) · temas conhecidos (15) · previdência × declaração do IR (15) |

- **Saúde financeira** = média das direções com dados.
- **Norte** = a direção que mais precisa de atenção: primeiro a de status mais grave (Crítico antes de Atenção) e, entre elas, a de menor nota. A agulha aponta para ela e o painel "Seu norte agora" traz as três primeiras ações.
- As ações da bússola usam os mesmos códigos das sugestões e oportunidades equivalentes: levar uma delas ao plano marca as outras como "No plano".
- Cada ação vai ao plano de ação com um clique (versão consultor).

### Plano de ação (6.8)
- Cada ação tem área, prioridade (Alta, Média, Baixa), prazo (Curto: até 3 meses, Médio: 3 a 12, Longo: acima de 12) e status.
- Áreas: Fluxo de caixa, Dívidas, Proteção, Futuro, Patrimonial, Investimentos, Sucessão, Fiscal/Tributário e Objetivos (a antiga área "Seguros" virou "Proteção").
- A antiga etapa Jornada (encontros e cronograma, com o sino de avisos no cabeçalho) saiu na versão 11.

## 5. Especificação (etapa 7, só versão consultor)

- **Base anual** = renda bruta mensal do cliente + do cônjuge (estimada pela líquida quando só ela foi informada, conforme CLT ou PJ) **× 12**. O consultor pode digitar outra renda anual para simular ("Voltar ao calculado" desfaz). Renda de cônjuge sem cônjuge no cadastro não entra.
- **Valor do plano** = base × **percentual (padrão 3%, editável)** − desconto do consultor (em % ou R$, limitado ao valor; nunca negativo).
- **Pix ou boleto:** valor × (1 − **5%**).
- **Cartão de crédito:** 1x = valor + 4,53% + R$ 0,29; 2x a 12x = valor + taxa(n) + R$ 0,29 por parcela, com taxa(n) = 5,15% (2x), 5,65%, 6,35%, 6,96%, 7,57%, 8,56%, 9,18%, 9,81%, 10,44%, 11,07% e 11,71% (12x); parcela = total ÷ n (mesma tabela do slide 11 da proposta comercial).
- O consultor marca a condição escolhida (Pix/boleto ou cartão com n parcelas) e pode escrever observações. Os valores são sempre recalculados a partir da renda, do percentual e do desconto.
- **Exportar especificação em PDF** (A4 retrato): cliente e cônjuge, data, consultor, validade (7 dias), o que está incluso, base de cálculo, valor do plano e **só a condição escolhida** (sem escolha, as duas), observações e linhas de aceite. Parâmetros e textos em `src/config/especificacao.ts`.

## 6. Analítico do Planejador (etapa 8, só versão consultor)

- **8.1 Transcrições da reunião:** anexar arquivos (.txt, .md, .vtt, .srt ou .docx — Teams, Zoom, Meet, Word; dá para arrastar) ou colar o texto. Cada transcrição vira **Parte 1, Parte 2…** (título editável, reordenar, remover e "Incluir na análise"); marcações de tempo saem e quem fala fica. .doc antigo e .pdf não são lidos (salve como .docx ou cole o texto).
- **Analisar com IA:** manda as partes marcadas, na ordem, e um resumo do diagnóstico (sem e-mail e telefone) para a API do Claude (Anthropic) e preenche 8.2, 8.3 e 8.4. A chave da API e o modelo (padrão Claude Opus 5.5) ficam em **Configurações** (engrenagem), só neste navegador e fora dos backups. Sem chave ou sem internet: **Copiar prompt** (ou baixar .txt) para colar no claude.ai e **Colar resposta** para o app validar e preencher. Reanalisar depois de editar pergunta se junta ou substitui (anotações livres e o fator ajustado à mão ficam). Texto acima de ~200 mil tokens avisa; acima de 850 mil, pede para dividir.
- **8.2 Dores, preocupações e gatilhos** e **8.3 Notas do Planejador** (objeções prováveis, GAPs de informação, perguntas afirmativas para a V2, riscos, oportunidades comerciais e anotação livre): listas editáveis, com a fala do cliente como evidência e o aviso quando a evidência é fraca.
- **8.4 Analítico IA:** perfil comportamental no modelo **DISC** (D Dominância, I Influência, S Estabilidade, C Conformidade) — fator predominante e secundário, intensidade de cada fator, classificação, confiança, resumo, como fala, como decide e age, o que prefere, o que evita, como abordar na V2, frases que conectam e as falas que sustentam o perfil. É uma sugestão (não um diagnóstico); o consultor pode ajustar o fator predominante.

## 7. Diagnóstico em PDF ("Plano de Vida Financeira")

- Segue o modelo do Alberto: **A4 paisagem**, capa azul-marinho, sumário com 10 capítulos (01 Visão Executiva · 02 Sonhos e Objetivos · 03 Família e Educação · 04 Fluxo de Caixa Mensal · 05 Patrimônio e Reserva · 06 Proteção Patrimonial - Vida · 07 Independência Financeira · 08 Alavancagem Patrimonial · 09 Alertas e Plano de Ação · 10 Por que LIFE Brasil), página de abertura em cada capítulo, cabeçalho, rodapé com o aviso legal e "página N / total".
- Todos os números vêm dos cálculos do diagnóstico; sem dado, "Não informado". Textos fixos (capa, aberturas, princípios, próximo passo, aviso e glossário) em `src/config/relatorio.ts`, para editar sem mexer no código. O e-mail da capa vem de Configurações.
- Diferenças em relação ao modelo: "Probabilidade atual x Objetivo" virou **Cobertura atual x Objetivo** (parte do aporte de cada objetivo coberta pela sobra livre); entrou a página **Nota LIFE por Pilar** (estrela) no capítulo 01; as referências de proteção usam os horizontes de padrão de vida (1, 5 e 15 anos) do sistema; o capítulo 08 mostra as aquisições e os créditos informados (sem simular compra à vista × financiamento × consórcio).
- Tabelas longas (objetivos, filhos, créditos, ações) continuam na folha seguinte sem cortar linhas. O plano de ação usa as ações montadas pelo consultor (6.8) ou, sem elas, as sugestões.

