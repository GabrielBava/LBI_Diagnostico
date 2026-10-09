# Diagnóstico LIFE · Financial Operating System™

Réplica do Diagnóstico LIFE (plano financeiro), reorganizada para ser fácil de evoluir. Esta versão acrescenta:

- **Processo:** jornada em 5 fases (Conexão → Raio-X → Proteção e futuro → Diagnóstico e plano → Acompanhamento), com progresso por etapa.
- **Storytelling da coleta:** em cada etapa, um roteiro com frase de abertura, perguntas-chave (checklist), pontos de atenção e frase de transição para a próxima etapa.
- **Campos configuráveis:** para incluir um campo, basta adicionar uma linha em `src/config/campos.ts`.
- **Diagnóstico automático:** nota LIFE, 6 pilares, as 3 prioridades e sugestões para o plano de ação.
- **Relatório em PDF**, histórico de revisões, modo apresentação, tema claro/escuro, backup/importação.

A metodologia completa (processo + fórmulas) está em **[docs/METODOLOGIA.md](docs/METODOLOGIA.md)**.

## Usar sem instalar nada (arquivo HTML único)

O arquivo **[`html/Diagnostico-LIFE.html`](html/Diagnostico-LIFE.html)** contém o app inteiro. Baixe e abra com dois cliques no Chrome, Edge ou Safari. Funciona sem internet, exceto a fonte Inter, que tem substituta.

- O selo de versão no cabeçalho (passe o mouse sobre ele) mostra quando o arquivo foi gerado.
- Os dados ficam salvos no navegador. Ao receber uma versão nova do HTML, abra pelo mesmo navegador e os clientes continuam lá. Por segurança, use **Exportar backup** antes de trocar de versão.
- Para gerar o arquivo de novo depois de alterar o código: `npm run html`.

### Como pedir alterações

Para cada mudança, diga **em qual etapa**, **o que entra/sai** e **como deve se comportar**. Por exemplo:

> "Em Receitas, incluir o campo *Previsão de reajuste* (percentual), com a ajuda *Quando é o próximo dissídio?*."
> "No roteiro de Despesas, trocar a frase de abertura por: ..."
> "Na Aposentadoria, considerar o INSS como renda passiva a partir dos 65 anos."

Prints de tela com marcações também ajudam.

## Como rodar

Requer Node.js 18+.

```bash
npm install
npm run dev       # abre em http://localhost:5173
npm run build     # gera a versão de produção em dist/
```

O conteúdo de `dist/` pode ser publicado em qualquer hospedagem estática (Vercel, Netlify, GitHub Pages, servidor próprio). O app usa rotas com `#`, então não precisa de configuração de servidor.

Para conhecer o fluxo completo, clique em **Carregar exemplo** na tela de clientes.

## Estrutura

```
src/
  config/
    campos.ts      ← CAMPOS de cada etapa (incluir/remover/renomear)
    etapas.ts      ← FASES e ETAPAS da jornada (ordem, regras de conclusão)
    roteiro.ts     ← ROTEIRO da conversa por etapa (storytelling)
    defaults.ts    ← nome do app, versão, consultor padrão
  lib/
    calculos.ts    ← FÓRMULAS (metodologia financeira)
    diagnostico.ts ← notas dos pilares, prioridades e sugestões do plano
    storage.ts     ← onde os dados são salvos (hoje: navegador)
    format.ts      ← formatação R$, %, datas
  components/      ← peças visuais reutilizáveis (campos, listas, roteiro, menu)
  pages/
    Clientes.tsx         ← lista de clientes
    ClienteDetalhe.tsx   ← tela do diagnóstico (menu + etapa)
    Relatorio.tsx        ← relatório para PDF
    etapas/              ← uma tela por etapa
```

## Como incluir um campo novo

**Exemplo 1: campo de formulário.** Incluir "Profissão do cônjuge" no Cadastro. Em `src/config/campos.ts`, dentro de `CAMPOS_CADASTRO`:

```ts
{ key: "profissaoConjuge", label: "Profissão do cônjuge", tipo: "texto" },
```

**Exemplo 2: coluna em uma lista.** Incluir "Vencimento" nas Dívidas. Em `LISTAS.dividas.colunas`:

```ts
{ key: "vencimento", label: "Vencimento", tipo: "data" },
```

Salve o arquivo e o campo aparece na tela, já salvo junto com o cliente. Tipos disponíveis: `texto`, `textarea`, `email`, `telefone`, `data`, `numero`, `moeda`, `percentual`, `select` (com `opcoes`) e `simnao`.

Use `ajuda` para mostrar uma dica ou pergunta abaixo do campo, e `padrao` para o valor inicial.

**Para usar o campo em um cálculo**, leia-o em `src/lib/calculos.ts` pela mesma `key`, por exemplo `n(d.vencimento)` ou `s(c.cadastro.profissaoConjuge)`.

## Como ajustar o roteiro da conversa

Edite `src/config/roteiro.ts`. Cada etapa tem `objetivo`, `abertura`, `perguntas`, `atencao` e `transicao`. O texto aparece no painel "Roteiro da conversa" e some no **Modo apresentação**.

## Como criar uma etapa nova

1. Adicione a etapa em `ETAPAS` (`src/config/etapas.ts`), escolhendo a fase, o ícone e a regra `concluida`.
2. Crie a tela em `src/pages/etapas/MinhaEtapa.tsx`. Use `useCliente()`, `Formulario` e `ListaEditor` como nas outras etapas.
3. Registre a tela em `src/pages/etapas/index.tsx`.
4. Adicione o roteiro em `src/config/roteiro.ts`.

## Dados e backup

Os dados ficam salvos **no navegador** (localStorage), com salvamento automático. Por isso:

- Use **Exportar backup** com frequência. **Importar** restaura um backup ou leva os clientes para outro computador.
- Dados de um navegador não aparecem em outro.

Para usar um banco de dados compartilhado (por exemplo Supabase, como no Lovable), reimplemente as funções de `src/lib/storage.ts` mantendo as mesmas assinaturas. O resto do app não muda.

## Tecnologia

React 18 + TypeScript + Vite + Tailwind CSS + Recharts + lucide-react. É a mesma base dos projetos Lovable, então o código pode ser editado lá ou em qualquer editor.
