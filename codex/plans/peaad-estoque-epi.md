# Estoque e entregas de EPI do PEAAD

Branch: `feature/peaad-estoque-epi`, criada após atualização por avanço direto de develop/backend e development/frontend. Não aplicar migrations ou seeds na base corrente.

## Regras aprovadas

- Estoque compartilhado pelo PEAAD, com página própria e módulo técnico ft.
- Item com nome e indicador EPI; variações com tamanho, custo unitário e saldo inteiro não negativo. Tamanho Único para itens sem numeração. Inativação lógica preserva saldo e histórico.
- Saldo inicial zero; entrada positiva e ajuste assinado justificado. Saldo não editável no CRUD.
- Entregar EPI: uma unidade de cada tipo ativo marcado EPI, escolhendo um tamanho por item. Operação integral, sem kit vazio/incompleto.
- Um kit não estornado por participação; reposições individuais exigem justificativa. Individuais podem incluir itens não EPI.
- Destinatários convocados ou ativos em edital aberto/vigente; ativos não vencidos.
- Histórico de entrega com itens, tamanhos, quantidades e custos preservados. Datas/autores definidos pelo servidor, sem retroatividade.
- Estorno integral justificado e com permissão própria; pode ocorrer após encerramento. Preserva original, devolve saldo e libera novo kit se elegível.
- Travas transacionais e idempotência impedem saldo negativo, duplicação de movimentos ou kits. Auditoria na mesma transação. Nenhum efeito na folha.

## API, acesso e interface

Prefixo /frente-de-trabalho/estoque: CRUD de itens/variações, entradas, ajustes, movimentações, destinatários, prévia, entregas de kit/individual, histórico/detalhe e estorno.

Novas ações ft: consultar_estoque, cadastrar_item_estoque, editar_item_estoque, excluir_item_estoque, registrar_entrada_estoque, ajustar_estoque, entregar_kit_epi, entregar_item_estoque, consultar_entregas_estoque, estornar_entrega_estoque. Seed idempotente, sem concessão automática. Destinatários também exigem consultar_vinculos.

Frontend /services/:id/ft-app/estoque: PrimeReact, busca/filtros/paginação, CRUD, entradas/ajustes, confirmação de entregas com custos/saldos e histórico. Acesso independente de consultar_edital; sem foco automático ou polling.

## Entrega e evidências

- [x] Bases atualizadas e branches criadas.
- [x] Persistência, permissões, transações e auditoria.
- [x] Interface e contratos.
- [x] Testes unitários/HTTP, navegador desktop/mobile e SQL descartável.
- [x] Tipos, lint disponível, builds e orçamento.
- [x] READMEs, OpenAPI, tipos e evidências finais.

Testar duplicação de tamanhos, dinheiro, estoque insuficiente, kit completo/único, justificativas, elegibilidade, estorno, snapshots, concorrência, idempotência, rollback, permissões e seed/migration. Nenhuma migration ou seed na base corrente.

## Evidências finais — 2026-11-03

- Backend: `npm run check`, `npm test` (**505 aprovados**) e `npm run build` aprovados. Não há lint separado no backend; validação estática pelo TypeScript.
- Frontend: `npm run lint`, `npm run typecheck`, `npm test` (**161 aprovados em 42 arquivos**), `npm run build` e `npm run bundle:check` aprovados. Build/orçamento repetidos após os ajustes da conferência e estorno.
- Navegador: `e2e/peaad-estoque.spec.js`, **3 cenários aprovados**, incluindo fluxo completo em 1280 px e 390 px e bloqueio por permissão. Validado acesso sem consultar_edital, CRUD de item/tamanho, entrada, escolha de tamanhos, kit único, individual com justificativa, preservação no foco, estorno com motivo próprio e consulta do histórico. Evidências em `.tmp/epi-browser-complete`; screenshot mobile conferido visualmente.
- SQL: harness `scripts/test-ft-workflow.ts` incorpora `scripts/test-ft-estoque.ts`. Duas execuções em schemas inicialmente vazios no MariaDB descartável de `127.0.0.1:33322`: `epi_20261103_ft_test` e `epi_verified_20261103_ft_test`; usuário restrito a esses schemas. Resultado final em `.tmp/peaad-epi-db/verified.log`.
- Migration up/down/up sem registros aprovada; rollback com dados recusado. Seed repetida sem duplicação/alteração de concessões; as dez ações novas permanecem negadas aos perfis existentes.
- SQL comprova tamanho normalizado único, filtros e CPF por hash, concorrência pelo último saldo, entrada/entrega idempotente, unicidade de kit, rollback integral/auditoria, custos históricos, estorno após encerramento, liberação de novo kit e concorrência com encerramento do edital.
- Operações têm identificador UUID e assinatura canônica por autor/tipo/dados. Trava transacional única do estoque evita inconsistência entre composição, custo e saldo; entregas/estornos também travam edital/participação antes dela. Índices e FKs preservam o histórico.
- Corrigido apenas o fixture de autenticação que ainda assinava tokens de teste com SECRET_KEY: passou a utilizar JWT_KEY, acompanhando a configuração já existente do projeto. Nenhuma alteração no fluxo de autenticação da aplicação.
- READMEs da raiz/frontend/backend, OpenAPI compartilhado e tipos gerados atualizados. Sem mudanças no serviço de PDF, sem commits/push nesta implementação e sem migrations/seeds na base corrente.

## Correção da CI em 05/11/2026

O PR #53 falhava porque o workflow não declarava JWT_KEY: 27 falhas interrompiam testes e a cobertura caía para 70,36%. Acrescentada chave JWT sintética própria da CI, sem utilizar segredos reais nem alterar a autenticação da aplicação.

Reprodução em checkout isolado desta branch, sem .env, com as variáveis sintéticas da CI e Node 22.23.4: **511 testes aprovados**, linhas/statements **94,58%**, funções **95,06%** e branches **90,51%**. Mantidos os limites de cobertura. Tipos e build aprovados; nenhuma conexão ou alteração na base corrente.
