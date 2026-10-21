# Autorização por módulo/ação e role

## Modelo

Cada usuário possui uma role (`users.role_id`). As concessões são registradas em `role_permissions(role_id, permission_action_id, allowed)`; não existem exceções individuais. A ação vem de `permission_actions`, vinculada ao módulo/serviço por ID e código técnico estável. Ausência de vínculo ou `allowed=false` nega acesso.

O backend carrega o usuário, a role e o setor atuais do banco em cada requisição. Além da ação específica, é necessário `acessar` no módulo e visibilidade do serviço para o setor do usuário. Não há bypass pelo nome “admin”, método HTTP ou dados recebidos do frontend. Alterar a role do usuário substitui seus direitos; alterar uma role afeta todos os usuários associados, sem exigir novo login.

`ft:remover_bolsista` permite cancelar/inativar o vínculo com edital. Não permite excluir o cadastro, que exige `ft:excluir_bolsista`. O cancelamento continua usando PUT; este trabalho não muda suas regras de negócio.

Para diferenciar conjuntos de responsabilidades: criar outra role, configurar suas ações e atribuí-la aos usuários. Role nova começa negada por padrão. Não há clonagem automática nem múltiplas roles por usuário.

## Catálogo e administração

- Serviços são criados/excluídos somente por migrations/seeds; POST e DELETE de `/service` não são oferecidos.
- O catálogo de ações também é controlado por migrations/seeds. HTTP não cria, renomeia nem exclui ações.
- `module_key` é identidade técnica. Nome, descrição e categoria são apresentação; renomear o nome não muda as concessões.
- O update de metadados/visibilidade do serviço não aceita `permissions`, `module_key` ou troca de ID.
- `GET /api/v2/permissions/catalog`: catálogo paginado.
- `GET /api/v2/permissions?role_id=2&service_id=6&page=0&limit=25`: ações da role, incluindo `allowed=false` quando ausente.
- `PUT /api/v2/permissions/role/:roleId`: lote atômico de até 100 itens `{permission_action_id,allowed}`, dentro de `{permissions:[...]}`. Omitidos não são alterados.
- `GET /api/v2/permissions/me`: direitos efetivos da role/setor atuais do usuário autenticado. Não aceita escolher outro usuário/role.
- Gestão exige `servicos:gerenciar_permissoes`; consulta administrativa exige `servicos:consultar_permissoes`, sempre com `servicos:acessar` e visibilidade.

As políticas de bloquear alteração da própria role, proteger o último administrador ou limitar a atribuição de roles privilegiadas não fazem parte desta feature. Gestores são privilegiados; atribuição de roles deve ser controlada operacionalmente e revisada separadamente.

## Instalação e atualização

Não executar alterações diretamente na produção sem janela, backup validado e revisão do inventário de consumidores: há mudanças incompatíveis nos contratos antigos de permissões.

1. Validar Node 22 e instalar dependências com `npm ci`.
2. Executar testes, cobertura e build antes da implantação.
3. Parar escritas administrativas durante a conversão.
4. Aplicar migrations em ordem; depois executar seeds necessários. Em instalação limpa, o seed final completa o catálogo/backfill após os seeds legados.
5. Conferir contagens, equivalência com as flags anteriores por role e existência de gestor com acesso ao serviço 3.
6. Subir frontend/backend compatíveis juntos e executar smoke tests antes de liberar usuários.

O snapshot converte flags da role por operação real: cancelar vínculo deriva de edit; excluir cadastro deriva de del. Nenhum vínculo de usuário é modificado. A tabela antiga `permissions` é preservada como legado e não deve continuar como fonte runtime ou dupla escrita.

Reexecutar o seed não restaura concessões revogadas nem concede ações futuras automaticamente. A conclusão do backfill é marcada uma única vez. Dados ambíguos, órfãos, flags nulas ou escrita sem leitura exigem diagnóstico, não limpeza automática.

DDL MariaDB pode realizar commit implícito; testar retomada parcial, não presumir transação atômica de DDL. Rollback recusa configurações granulares que não possam ser revertidas sem perda; após configuração administrativa real, preferir forward-fix. Nunca mover tags publicadas ou restaurar silenciosamente a autorização CRUD antiga.

## Compatibilidade de duplicatas de visibilidade

A checagem antiga recusava qualquer par `(setor_id,service_id)` duplicado com o erro `service_visibilities duplicate; count=N`. Agora duplicatas equivalentes (`true/true`, `false/false` ou `NULL/NULL`) são aceitas e preservadas integralmente: a migration não exclui, mescla nem atualiza essas linhas. Essa tolerância não concede direitos nem elimina defaults false.

Somente valores distintos no mesmo par continuam bloqueando: `service_visibilities conflicting duplicate; count=N`. NULL misturado com booleano também é conflito. `count` informa pares conflitantes, não quantidade de linhas excedentes. O precheck ocorre antes de DDL. A idempotência do seed `20251029125003-population-db-permissions-visibilities` evita criar novas duplicatas; não faz limpeza de registros existentes.

Execute somente as consultas de `scripts/sql/diagnose-permission-visibilities.sql` na base que apresentou o erro. O diagnóstico lista IDs técnicos, quantidade, valores de visibilidade, a coluna `conflitante` (0 = equivalente; 1 = valores distintos) e FKs que referenciam esses registros, sem PII. Ele não contém DELETE, UPDATE ou DDL.

- Se os valores divergirem (incluindo NULL), o responsável precisa escolher explicitamente a visibilidade válida. Não aplicar OR, AND, primeiro/último ou defaults para decidir acesso.
- Com valores iguais, não é necessário reparar para executar a migration; apenas preservar as linhas. Eventual deduplicação é manutenção separada, exige backup, referências externas e autorização específica. O ID técnico pode ser consumido por uma integração sem FK.
- Não apagar linhas da `SequelizeMeta`, não executar `migrate:undo:all` e não comentar o precheck para contornar esse erro.
- Se as duplicatas forem equivalentes, executar `npm run migrate` novamente com o código atualizado; o comando recompila a correção antes de aplicar migrations. Se houver conflito real, somente reexecutar depois da resolução aprovada e verificada. Em instalação limpa, executar os seeds depois das migrations; em base populada, não reseedar toda a base para tentar reparar o erro.

## Validação em banco descartável

O harness **apaga as tabelas do banco de teste especificado**. Ele recusa banco sem sufixo `_permissions_test`, host não local, usuário root (inclusive percent-encoded), query parameters/fragmentos, variável ausente e ausência de consentimento explícito. Não lê DATABASE_URL do `.env` por conveniência. Use container próprio, credencial restrita ao único schema descartável e nenhum dado real.

```bash
npm run build
npm run test:permissions:safety
# Defina DATABASE_URL fora do histórico/log, apontando apenas ao banco descartável.
# Defina PERMISSIONS_TEST_RESET=YES explicitamente para autorizar reset desse schema.
npm run test:permissions:db
# Depois do harness, com o mesmo alvo descartável:
npm run test:permissions:runtime
```

`test:permissions:runtime` usa o repositório e o banco reais para validar rollback de lote após uma escrita SQL efetiva, concorrência administrativa, revogação, mudança de role/setor e exclusão lógica. Cria e remove somente suas fixtures sintéticas; usa o mesmo guard/opt-in, nunca a base da aplicação. O runner E2E `scripts/serve-permissions-e2e.ts` exige `PERMISSIONS_E2E_FIXTURE` fora do repositório, registra os plugins reais e escuta somente em `127.0.0.1:3099`; trace/vídeo de sessão ficam desligados em `Prefeitura_APP/e2e/permissions.spec.js`.

O harness executa migrations/seeds compilados na ordem do projeto e verifica instalação limpa, atualização populada sintética, reexecução, revogação preservada, role nova negada, constraints, concorrência de unicidade e rollback seguro. Testes de autorização e HTTP continuam obrigatórios na suíte de aplicação; a unicidade do banco não substitui testes de transações da API.

## Contratos e validações

```bash
npm run check
npm test
npm run test:coverage
npm run build
npm run openapi:generate
```

O contrato SAP canônico deve ser versionado em `contracts/sap.openapi.json` dentro deste repositório; a saída `../contracts/sap.openapi.json` no workspace é mantida para compatibilidade de geração. Frontend deve regenerar tipos a partir do contrato canônico antes de validar typecheck, lint, testes, cobertura e build.

Nenhuma dessas instruções comprova validação: registrar os resultados efetivamente obtidos na entrega da implementação.
