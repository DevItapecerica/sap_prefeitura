# Simplificação de UX/UI do estoque do PEAAD

Branch: `feature/peaad-estoque-epi`. Preservar implementação e alterações existentes. Sem novas permissões, migrations ou seeds; não aplicar as existentes à base corrente.

## Plano aprovado

- Abas principais PrimeReact Editais | Estoque, sincronizadas às URLs existentes, com título compartilhado e acesso por permissão. Estoque como destino inicial quando for a única seção permitida. Preservar estados ao alternar.
- Abas internas Itens | Entregas | Movimentações, com ações contextuais. Cadastro de item/tamanhos/entrada inicial em uma confirmação.
- Lista com tamanhos ativos/saldo total calculados no backend; busca visível, demais filtros recolhíveis. Detalhes e manutenção em painel lateral único, com cartões no celular.
- Repor estoque contextual; ajustes com Adicionar/Retirar e saldo previsto. Ações secundárias em menu. Estorno sempre com justificativa vazia.
- Nova entrega reúne kit e item avulso, destinatário por AutoComplete remoto, seções progressivas, seleção automática somente para tamanho único com saldo, cartões no celular e resumo antes da confirmação.
- Histórico pesquisável por nome/CPF com filtros SQL antes da paginação.
- POST /frente-de-trabalho/estoque/itens/cadastro-completo recebe operacao_id, nome, epi, tamanhos com tamanho/custo_unitario/quantidade_inicial. Transação única, idempotência e auditoria existentes; quantidade inicial positiva também exige registrar_entrada_estoque.
- Preservar endpoints, regras de kit único, saldos, elegibilidade, permissões e snapshots. Sem foco automático, polling ou carregamento global.

## Entrega e validação

- [x] Backend composto, resumos e busca do histórico.
- [x] Navegação e interface responsiva.
- [x] Testes backend/frontend, autorização, rollback e idempotência.
- [x] Navegador desktop/mobile, teclado, navegação e estado.
- [x] Integração em banco descartável, tipos, lint, builds e orçamento.
- [x] READMEs, OpenAPI, tipos gerados e evidências nos três planos.

## Evidências — 2026-11-03

- Backend: `npm run check`, `npm test` (**507 aprovados**) e `npm run build` aprovados.
- Frontend: `npm run lint`, `npm run typecheck`, `npm test` (**167 aprovados em 43 arquivos**), `npm run build` e `npm run bundle:check` aprovados.
- Navegador: **8 cenários aprovados** em `peaad-estoque.spec.js` e `peaad-payment-csv.spec.js`, desktop 1280 px e mobile 390 px. Cobrem abas/URLs/voltar, preservação de busca, cadastro em uma chamada, reposição, correção Adicionar/Retirar, kit/avulso, justificativa própria do estorno, permissão somente estoque, ausência de consultas por foco e regressão do pagamento.
- Capturas das abas, cadastro e entrega em `.tmp/stock-ux-browser-final`; conferência visual do mobile realizada. Logs em `.tmp/stock-ux-browser-final.log`.
- MariaDB descartável exclusivo `127.0.0.1:33323`, schema inicialmente vazio `ux_20261103_ft_test`, usuário restrito. Harness `scripts/test-ft-workflow.ts` / `scripts/test-ft-estoque.ts`: criação conjunta atômica, quantidades zero/positivas, repetição concorrente idempotente, saldo/resumos, busca SQL/CPF, tentativa de injeção e rollback da auditoria aprovados. Log em `.tmp/peaad-stock-ux-db/test.log`.
- Autorizações HTTP verificam a ação adicional de entrada apenas quando alguma quantidade inicial for positiva; cadastro com saldo zero permanece permitido.
- Estado das listas/seleções permanece no shell do PEAAD; consultas são carregadas sob demanda e mantidas por seção. O novo formulário não encadeia requisições de criação: usa uma única transação e as funções internas de cadastro/baixa existentes.
- Cadastro limitado a 1–100 tamanhos; duplicatas normalizadas e valores inválidos não deixam registros parciais. API antiga preservada; OpenAPI e tipos gerados atualizados.
- READMEs da raiz/frontend/backend atualizados. Nenhuma nova migration, seed ou permissão nesta revisão; nenhuma migration ou seed foi aplicada à base corrente.
- Mantida a branch `feature/peaad-estoque-epi` e todo o trabalho anterior. Nenhum commit ou push nesta etapa.
