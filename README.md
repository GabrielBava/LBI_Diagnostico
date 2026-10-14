# Diagnóstico LIFE · Financial Operating System™

Diagnóstico financeiro do Grupo Life Brasil, organizado como um processo com o cliente:

- **Rolagem contínua:** todas as etapas em uma página. Ao rolar, você passa de categoria em categoria e o menu lateral acompanha.
- **7 etapas:** Conexão → Raio-X financeiro → Proteção e futuro → Investimentos → Pré-diagnóstico → Diagnóstico completo → Jornada.
- **Versão consultor × versão apresentação:** roteiro, anotações, parâmetros e seções internas (como a Matriz de oportunidades) ficam ocultos para o cliente. Cada seção tem um botão para mostrar/ocultar na apresentação.
- **Campos dinâmicos:** cônjuge (e a renda dele) só para casados, quantidade de filhos cria os cartões em Sucessão, bens financiados viram financiamentos, parcelas, dependentes, manutenção/IPVA dos veículos e anuidade dos cartões entram sozinhos nas despesas, renda bruta ↔ líquida estimada, futuras aquisições com estratégia (à vista, financiamento, consórcio).
- **Despesas em blocos** (Casa, Mercado, Transporte…) com subcategorias (Aluguel, Condomínio, Luz, Água, Internet…).
- **Finalizar coleta:** o pré-diagnóstico (fluxo atual × modelo 50-30-20) e o diagnóstico completo só aparecem depois do botão.
- **Parâmetros financeiros** (inflação geral e educacional, meta de reserva, limite de parcela, retorno real) no botão de engrenagem do topo do cliente.
- **Padrões de campo:** opções em botões (chips), escala 0–10 com um botão por nota, categorias por ícones, múltipla escolha, Sim/Não, interruptores para flags, contador.
- **Roteiro da conversa** por seção: frase de abertura, perguntas (checklist), pontos de atenção e anotações.
- **Diagnóstico completo:** panorama geral (perfil e perfil financeiro, nota LIFE, pilares, renda × despesas, balanço), plano atual (diagnóstico · motivo · risco da inação), plano potencial (oportunidade · como atuar juntos · objetivo desejado, com a proteção "o que contratar"), plano otimização (descrição · motivo da escolha · como melhorar), futuro com simulador (réguas de aporte, rentabilidade, idade e renda) e plano de independência de 1, 5 e 10 anos, matriz de oportunidades em radar de 6 pontas (foco em seguros e consórcios), bússola financeira (organização, patrimonial, liberdade financeira e gestão de ativos), plano de ação e cronograma.
- **PDF** do diagnóstico (segue a versão apresentação), backup e importação.

A metodologia completa (processo + fórmulas) está em **[docs/METODOLOGIA.md](docs/METODOLOGIA.md)**.

## Usar sem instalar nada (arquivo HTML único)

O arquivo **[`html/Diagnostico-LIFE.html`](html/Diagnostico-LIFE.html)** contém o app inteiro. Baixe e abra com dois cliques no Chrome, Edge ou Safari.

- O selo de versão no cabeçalho (passe o mouse sobre ele) mostra quando o arquivo foi gerado.
- Os dados ficam salvos no navegador. Ao abrir uma versão nova pelo mesmo navegador, os clientes continuam lá. Use **Exportar backup** antes de trocar de versão.
- Clientes criados na versão anterior são convertidos para a nova estrutura na primeira abertura. Os dados antigos ficam guardados sem alteração.
- Para gerar o arquivo de novo depois de alterar o código: `npm run html`.

### Como pedir alterações

Para cada mudança, diga **em qual seção**, **o que entra ou sai** e **como deve se comportar**. Por exemplo:

> "Em Renda, incluir *Previsão de reajuste* (percentual), com a dica *Quando é o próximo dissídio?*"
> "No roteiro de Despesas, trocar a frase de abertura por …"
> "Em Móveis, mostrar 'Seguradora' só quando 'Tem seguro' estiver ligado."

Prints com marcações também ajudam.

## Como rodar

Requer Node.js 18+.

```bash
npm install
npm run dev       # abre em http://localhost:5173
npm run build     # gera a versão de produção em dist/
npm run html      # gera html/Diagnostico-LIFE.html
```

Para conhecer o fluxo, clique em **Carregar exemplo** na tela de clientes.

## Estrutura do código

```
src/
  config/
    estrutura.ts     ← ETAPAS e SEÇÕES (ordem, numeração, regra de conclusão, oculta na apresentação)
    campos.ts        ← CAMPOS de cada seção (incluir/remover/renomear, campos condicionais)
    despesas.ts      ← BLOCOS e SUBCATEGORIAS de despesas
    tributos.ts      ← tabelas de INSS/IR para estimar renda bruta ↔ líquida
    roteiro.ts       ← ROTEIRO da conversa e frases de abertura das etapas
    defaults.ts      ← nome do app, versão, consultor padrão
  lib/
    calculos.ts      ← FÓRMULAS (fluxo, balanço, objetivos, proteção, futuro)
    diagnostico.ts   ← pilares e sugestões do plano de ação
    plano.ts         ← cartões dos planos atual/potencial/otimização, perfil financeiro e bússola
    oportunidades.ts ← matriz de oportunidades (6 áreas, potencial, peso de cada produto)
    storage.ts       ← onde os dados são salvos (hoje: navegador)
    migracao.ts      ← conversão de clientes da versão anterior
  assets/v1/         ← páginas da apresentação do V1 (geradas por scripts/gerar-v1.py)
  components/        ← campos, listas, seção, menu, gráficos, visualizador da apresentação
  pages/
    Clientes.tsx         ← lista de clientes
    ClienteDetalhe.tsx   ← página contínua do diagnóstico
    Relatorio.tsx        ← relatório para PDF
    secoes/              ← uma tela por seção
```

## Como trocar a apresentação do V1 · Institucional

O V1 mostra as páginas do PDF da apresentação (viram imagens embutidas no HTML, com navegação, tela cheia e os links do PDF clicáveis). Para trocar o PDF:

```bash
python3 scripts/gerar-v1.py caminho/da/nova-apresentacao.pdf   # precisa de pdftoppm, Pillow e pypdf
npm run html
```

## Como incluir um campo

Em `src/config/campos.ts`, adicione uma linha na lista da seção. Exemplos:

```ts
// Campo simples no Cadastro (CAMPOS_CADASTRO)
{ key: "profissaoConjuge", label: "Profissão do cônjuge", tipo: "texto" },

// Campo que só aparece em uma condição
{ key: "seguradora", label: "Seguradora", tipo: "texto", mostrarSe: (d) => d.temSeguro === true },

// Campo só para a versão consultor
{ key: "observacaoInterna", label: "Observação interna", tipo: "textarea", somenteConsultor: true },
```

Tipos: `texto`, `textarea`, `email`, `telefone`, `cep`, `data`, `numero`, `moeda`, `percentual`, `select`, `chips`, `multichips`, `icones`, `simnao`, `switch`, `slider`, `escala` e `contador`.

Para incluir uma subcategoria de despesa, acrescente uma linha no bloco em `src/config/despesas.ts`, por exemplo `{ id: "jardinagem", label: "Jardinagem" }` no bloco Casa. Use `ajuda` para uma dica abaixo do campo, `padrao` para o valor inicial e `largura` (1 a 4) para ocupar mais colunas.

Para usar o campo em um cálculo, leia-o em `src/lib/calculos.ts` pela mesma `key`.

## Como criar uma seção

1. Adicione-a em `SECOES` (`src/config/estrutura.ts`) com etapa, número, ícone e regra `concluida`.
2. Crie a tela em `src/pages/secoes/MinhaSecao.tsx` (use `useCliente()`, `Formulario` e `ListaItens`).
3. Registre-a em `src/pages/secoes/index.tsx`.
4. Adicione o roteiro em `src/config/roteiro.ts`.

## Dados e backup

Os dados ficam salvos **no navegador** (localStorage), com salvamento automático. Use **Exportar backup** com frequência; **Importar** restaura um backup, inclusive da versão anterior. Para um banco de dados compartilhado (por exemplo Supabase), reimplemente as funções de `src/lib/storage.ts` mantendo as mesmas assinaturas.

## Tecnologia

React 18 + TypeScript + Vite + Tailwind CSS + Recharts + lucide-react (mesma base dos projetos Lovable).
