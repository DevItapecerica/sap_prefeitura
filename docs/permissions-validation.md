# Evidências locais — permissões por módulo/ação e role

## Estado

Implementação local em `feat/permissoes-modulo-recurso` no backend e no frontend. Sem commit da feature, tag, push, PR ou implantação nesta execução. Nenhuma alteração foi aplicada ao banco configurado pelo usuário. A revisão independente final apontou um bypass no guard das URLs de teste; foi reproduzido sem rede, corrigido com rejeição de query parameters/fragmentos e validado por 20 testes de segurança. Não foram apontados outros bloqueantes nas migrations/rollback e normalização de contrato revisados.

## Comportamento implementado

- Catálogo persistido de ações com identificação estável do módulo e FK composta para o serviço.
- Concessões por role, negação para false/ausência e consulta de role/setor atuais do usuário; sem permissões individuais ou bypass por nome de administrador.
- `ft:remover_bolsista` separado de `ft:excluir_bolsista` e de `ft:editar_vinculo`.
- Rotas de negócio com ação explícita, inclusive rota alternativa de espelho de ponto.
- Catálogo somente leitura por HTTP; edição de concessões por endpoint específico. Criação/exclusão de serviços removidas da API/UI; update de serviço não grava flags antigas.
- Frontend usa ações efetivas; painel por role informa efeito coletivo e descarta respostas atrasadas de outra role/serviço.
- Snapshot legado único e reexecutável sem ressuscitar concessões revogadas; rollback recusa mudanças não reversíveis antes de apagar dados.

## Gates executados com Node 22.23.3

| Projeto | Comando | Resultado |
|---|---|---|
| Backend | `npm run check` | exit 0 |
| Backend | `npm test` | exit 0; 435 aprovados; sem falhas/skips |
| Backend | `npm run test:coverage` | exit 0; thresholds originais preservados |
| Backend | `npm run build` | exit 0 |
| Backend | `npm run test:permissions:safety` | exit 0; 20 testes; sem falhas/skips |
| Backend | `node --import tsx --test scripts/openapi-compatibility.test.ts scripts/openapi-output.test.ts` | testes de normalização/saídas aprovados |
| Backend | `npm run openapi:generate` | exit 0; contrato canônico e cópia de workspace |
| Frontend | `npm run typecheck` | exit 0 |
| Frontend | `npm run lint` | exit 0 |
| Frontend | `npm test` | exit 0; 36 arquivos / 118 testes aprovados |
| Frontend | `npm run test:coverage` | exit 0; cobertura do conjunto configurado, não do produto inteiro |
| Frontend | `npm run contracts:generate` | exit 0; tipos SAP/PDF regenerados |
| Frontend | `npm run build` | exit 0 |
| Frontend | `npm run bundle:check` | exit 0 |
| Frontend | `npm run e2e -- e2e/permissions.spec.js` | exit 0; 3 testes integrados aprovados sem skips; repetidos após correção da corrida no modal |
| PDF | `npm test` | exit 0; 27 testes aprovados |
| PDF | `npm run test:coverage` | exit 0 |
| PDF | `npm run openapi:generate` | exit 0 |
| PDF | `npm run build` | exit 0 |

Não há comando lint backend no manifest atual. `check` é TypeScript, não lint. Os comandos de banco/E2E foram executados por wrappers locais que fornecem variáveis de ambiente sem imprimi-las; equivalem aos scripts documentados, não usam `.env` da aplicação como fallback.

## Cobertura obtida

| Projeto/escopo | Lines | Statements | Functions | Branches |
|---|---:|---:|---:|---:|
| Backend | 94,19% | 94,19% | 96,67% | 90,91% |
| Frontend — conjunto configurado | 81,99% | 81,61% | 63,12% | 64,57% |
| PDF — sem alteração funcional | 94,06% | 94,06% | 97,50% | 86,70% |

`permission-access.ts` e `permissionServices.ts`: 100% nas quatro métricas. `RolePermissionsPanel.jsx`: lines 100%, statements 94,80%, functions 89,47%, branches 94,54%. Não foram reduzidos thresholds, removidas fontes da cobertura ou introduzidos ignores para obter aprovação.

## MariaDB real descartável

Instâncias dedicadas `sap-permissions-isolated-test` (validação original) e `sap-permissions-visibilities-test` (correção focal, dados em tmpfs), schema `sap_permissions_test`, credenciais restritas e dados sintéticos. Nenhum teste foi direcionado ao container/banco da aplicação existente. Guard recusa URL ausente, banco sem sufixo, host remoto, root inclusive percent-encoded, opções de conexão na query/fragmento e falta de opt-in.

`test:permissions:db` e `test:permissions:runtime` aprovaram:

- migrations/seeds reais em instalação limpa;
- atualização de base legada sintética populada com edit=true/del=false;
- reexecução sem duplicidade, sem novo snapshot e preservação de revogação;
- role nova sem auto-grant;
- FKs, índices, órfão, duplicidade de grants e par módulo/serviço divergente;
- duplicidade equivalente de visibilidade true/true, false/false e NULL/NULL aceita em migration/backfill/seed e reexecução, com todas as linhas preservadas;
- duplicidade conflitante true/false e NULL/booleano bloqueada antes de DDL, sem alteração das linhas;
- retomada depois da coluna inicial e restauração de FK/índice ausentes;
- rollback após configuração recusado sem perda;
- rollback sem uso, down repetido e novo up/backfill;
- rollback da escrita administrativa com falha na segunda ação após SQL real na primeira;
- concorrência administrativa real sem duplicação/perda de atualização;
- direitos da role/setor atuais, visibilidade ausente/false, revogação, usuário/serviço excluídos logicamente.

O runner E2E registrou plugins reais e escutou somente em loopback:3099. O servidor foi encerrado depois dos testes. Ao fechar a validação, o container dedicado foi removido e os arquivos efêmeros de conexão/sessão conhecidos foram apagados do scratch; os containers `app_prefeitura_front` e `sap_prefeitura_db` permaneceram em execução. Não versionar manifest com tokens ou conexão efêmera de teste.

## Contratos

Contrato SAP canônico: `contracts/sap.openapi.json` dentro do backend. Cópia de compatibilidade: `../contracts/sap.openapi.json`. Frontend consome o canônico. Redocly validou SAP/PDF com regras `struct`, `no-unresolved-refs` e `operation-operationId-unique`: zero erros.

Normalização OpenAPI 3.0 não altera schemas de validação runtime nem payloads: converte representações JSON Schema de null/uniões e preserva constraints, referências e dados de exemplo. Teste de regressão protege interseção do enum original com o schema null-only.

## Bloqueio na base do usuário

O erro antigo `Permission migration blocked: service_visibilities duplicate; count=1` era excessivamente restritivo para linhas equivalentes. A correção focal agora permite duplicatas com o mesmo valor, sem removê-las nem alterar permissões. Foi reproduzida com RED/GREEN e validada no MariaDB real, inclusive NULL/NULL e reexecução. O comportamento na base do usuário ainda não foi executado ou confirmado por esta sessão.

Somente valores distintos no mesmo par permanecem bloqueados com `service_visibilities conflicting duplicate; count=N`, inclusive NULL misturado com booleano. Diagnóstico somente leitura: `scripts/sql/diagnose-permission-visibilities.sql`, coluna `conflitante`. Procedimento: `docs/permissions.md`. Não escolher visibilidade, apagar registros, limpar SequelizeMeta ou desligar precheck automaticamente. Para duplicatas equivalentes, basta executar `npm run migrate` com o código atualizado; conflitos reais exigem resolução aprovada.

Nesta correção focal foram reexecutados todos os gates backend, 20 testes de segurança e os harnesses DB/runtime. As métricas frontend/PDF e os E2E deste registro são da validação anterior; nenhum código desses projetos foi alterado nesta correção.

## Versionamento e limites

Manifests não tiveram bump: backend 2.2.2, frontend 4.5.0, PDF 1.1.0. HEADs-base do worktree: backend `28ec9a29bea9b840f1a8f8b486e3862b1485d592`, frontend `5ea0a3813f0f4546e22d2a94bdfc32a7ca5f9bbb`. Esses SHAs não contêm a feature não commitada. Publicação/release exige autorização, inventário de consumidores da quebra de contrato e verificação remota.

Preservar `Prefeitura_APP/docker-compose.yml`, alteração preexistente de exposição da porta. Artefatos de teste e variações LF/CRLF não devem ser incluídos em eventual staging da feature. Revisão de diff/Git obrigatória antes de eventual commit; a execução local não cria autorização para publicação.
