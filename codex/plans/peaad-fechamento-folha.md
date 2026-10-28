# Fechamento mensal da folha do PEAAD

Branch: `feature/peaad-melhorias-fluxo`. Não aplicar migrations ou seeds na base corrente.

## Regras

- Competência por edital/mês. Sem registro, aberta; prévia disponível, CSV somente após fechamento explícito.
- Fechamento manual do mês atual ou passado no horário de Brasília. Um único fechamento, irreversível, sem complementares, importação, reabertura ou autorização para ultrapassar o bloqueio.
- Preservar CSV exato, itens, totais e período em snapshot criptografado. Download e consulta da competência fechada não recalculam os cadastros atuais.
- Bloquear convocação/ativação quando o período alcançar mês fechado, inclusive exceções. Inscrição permanece disponível.
- Bloquear criação/exclusão de faltas e ocorrências no mês fechado. Bloquear prorrogação apenas pelo período acrescentado e encerramentos apenas pelo intervalo financeiro alterado. Meses abertos continuam operáveis; expiração automática prevista permanece.
- Criar `ft:fechar_folha_pagamento` no catálogo/seed idempotente e painel existente, sem concessão automática. Fechar exige também `gerar_relatorio_edital`; consultas/downloads usam esta última.

## Implementação

- Migration `20261028140000-ft-fechamento-mensal.ts`: unicidade por edital/mês, responsável, data, versão e snapshot criptografado. Rollback recusa excluir folhas existentes.
- Seed `20261028141000-ft-fechamento-permission.ts`: catálogo sem alterar concessões.
- Sob `/frente-de-trabalho/relatorio/edital/:id`: GET `/fechamento?mes=AAAA-MM` e POST `/fechamento` com `{ mes, versao }`. Prévia existente informa estado, período efetivo e possibilidade de fechar.
- Download exige mês civil completo e folha fechada; não permite recortes nem intervalos entre meses. Cálculo da prévia/fechamento limitado pela vigência nos meses de borda.
- Compartilhar trava do edital entre fechamento e movimentações; conferir versão dentro da transação. Repetição da mesma confirmação retorna a mesma folha. Auditoria e fechamento na mesma transação, sem dados bancários nos logs.
- PrimeReact: estado, responsável/data, conferência, confirmação irreversível inclusive para folha vazia e download preservado. Sem atualização por foco ou consultas periódicas.
- Atualizar OpenAPI, tipos e READMEs. Preservar nove colunas, cálculos, PDFs e relatórios de presença/faltas.

## Progresso e validação

Persistência, seed, serviço financeiro, bloqueios, pré-validações, interface, READMEs, OpenAPI e tipos gerados concluídos.

### Evidências — 2026-10-28

- Backend: `npm run check`, `npm test` (497 aprovados) e `npm run build` aprovados. Não há script de lint separado no backend; verificação estática via TypeScript.
- Frontend: `npm run lint`, `npm run typecheck`, `npm test` (157 aprovados em 40 arquivos), `npm run build` e `npm run bundle:check` aprovados.
- Navegador: `peaad-payment-csv.spec.js`, cinco cenários aprovados em desktop 1280 px e mobile 390 px, incluindo fechamento, confirmação, permissões, conflito de versão e download com bytes preservados. Confirmação mobile conferida visualmente. Evidências em `.tmp/peaad-close-browser-verified` e `.tmp/peaad-close-browser.log`, fora do versionamento.
- SQL: `scripts/test-ft-workflow.ts` inclui `scripts/test-ft-payroll.ts`. Migrations e seeds executadas somente em schema descartável inicialmente vazio. Up/down/up da migration financeira sem registros aprovado; rollback com folhas recusado. Seed repetida sem duplicação e sem alterar concessões; nova ação negada aos perfis existentes (todos com allowed=0 no fixture).
- Concorrência: duas confirmações simultâneas retornam a mesma folha; disputa entre fechamento e ativação permite apenas uma alteração coerente. Unicidade SQL, conflito de prévia e rollback em falha de auditoria comprovados.
- Reemissão após alteração de nome/CPF/banco é idêntica; snapshot criptografado; folha vazia, bloqueios retroativos e continuidade dos meses abertos comprovados. Logs SQL em `.tmp/peaad-close-db/test.log`.
- Nenhuma migration ou seed aplicada à base corrente.

Banco descartável exclusivo em `127.0.0.1:33321`, schema `close_20261028_ft_test`, com usuário restrito ao schema. Base corrente intocada.

## Limites

Fechamento registra a folha emitida, não confirmação bancária. Meses antigos não são fechados automaticamente; o sistema não identifica arquivos anteriormente utilizados fora dele.


### Conferência antes da publicação

Backend: 497 testes, check e build aprovados novamente. Frontend: 157 testes, lint, tipos, build e orçamento aprovados novamente. Playwright: cinco cenários aprovados novamente em desktop/mobile; evidências em .tmp/peaad-prepublish-browser e logs peaad-prepublish-*. Nenhuma mudança funcional após essas verificações.

Publicação organizada em commits por persistência/permissões, comportamento transacional com testes/contrato e documentação; interface com testes e tipos acompanha o PR do frontend. Destinos: develop no backend e development no frontend.
