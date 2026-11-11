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

## Instalação limpa

A nova linha base usa sete migrations e três seeds, exclusivamente em banco vazio. Não há tabela CRUD antiga, backfill ou limpeza de serviços aposentados. Consulte o [guia de instalação](bootstrap-banco-novo.md) antes de executar os comandos.

O primeiro administrador é criado com credenciais explícitas de ambiente e recebe o catálogo inicial. Outros perfis começam sem concessões. Reexecutar seeds preserva senhas, revogações e visibilidades; novas ações não são concedidas automaticamente.

## Validação

O workflow Quality inclui instalação real em MariaDB 10.11 descartável. Os harnesses exigem alvos de teste explícitos. O harness de permissões recusa schemas populados em vez de apagar tabelas; o opt-in PERMISSIONS_TEST_RESET=YES mantém apenas seu nome por compatibilidade.

O histórico de validação anterior permanece em [permissions-validation.md](permissions-validation.md); não é instrução para aplicar a antiga sequência sobre esta linha base.

## Contratos

URLs, payloads, ações e checkboxes continuam os mesmos para os serviços ativos. O contrato SAP canônico é contracts/sap.openapi.json; a geração também mantém ../contracts/sap.openapi.json no workspace.
