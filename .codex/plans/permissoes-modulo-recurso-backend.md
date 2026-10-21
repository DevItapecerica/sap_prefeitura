# Plano backend aprovado

Execução local autorizada pelo usuário. Sem commit, push, tag, PR ou banco de produção. Fonte: `.hermes/plans/2026-10-20_230609-permissoes-modulo-recurso.md` na raiz do workspace. PDF sem alteração funcional.

# Permissões por módulo + recurso e concessões por role

## 1. Objetivo

Substituir a autorização inferida pelo método HTTP por permissões explícitas `modulo:acao`, atribuídas às roles e herdadas pelos usuários de sua role atual, mantendo a visibilidade por setor e tornando o cadastro/exclusão de serviços e o catálogo de ações exclusivos de migrations/seeds.

## 2. Estado deste documento e limites

- **Revisão de escopo confirmada pelo usuário:** concessões exclusivamente por role; diferenciação exige outra role, sem exceções individuais e sem múltiplas roles por usuário. Esta revisão substitui integralmente a proposta anterior de concessões diretas por usuário.
- Este documento é um plano, não uma implementação. Nenhum teste, migration, build ou publicação foi executado nesta etapa.
- Workspace: `D:/Projetos/Node_React/prefeitura`.
- Os nomes reais dos diretórios são `sap_prefeitura`, `Prefeitura_APP` e `gerador_de_PDF`; não criar diretórios paralelos chamados `front_prefeitura` ou `api_PDF`.
- A raiz não é um repositório Git. Há três repositórios independentes.
- Neste turno somente este Markdown pode ser escrito. Os planos convencionais por projeto serão desdobrados apenas depois da aprovação, na implementação.
- Aprovar este plano autoriza implementação local e validações em ambiente descartável. **Não autoriza commits, tags, push, PR, merge, deploy ou execução contra banco real.** Os pontos de commit abaixo são sugestões de agrupamento; executá-los somente com autorização específica posterior.

## 3. Contexto verificado

| Projeto | Branch atual/base | HEAD observado | Worktree |
|---|---|---|---|
| `sap_prefeitura` | `develop` | `28ec9a29bea9b840f1a8f8b486e3862b1485d592` | limpo |
| `Prefeitura_APP` | `development` | `5ea0a3813f0f4546e22d2a94bdfc32a7ca5f9bbb` | alteração preexistente em `docker-compose.yml`, preservar |
| `gerador_de_PDF` | `develop` | `ab1627b7eba66148d9e264ea18d1f2926a10d897` | limpo |

- Comparação com upstream local: `0 0` nos três repositórios. Não houve fetch; isso não comprova o estado atual do GitHub.
- `gh` não está instalado/disponível no PATH. Issues, subissues e PRs não foram consultados. Não há número de issue fornecido. Antes de implementar, consultar por integração autenticada disponível; se indisponível, registrar a limitação e solicitar os links relevantes, sem inventar vínculos.
- Não foi localizado `AGENTS.md` ou `CLAUDE.md` na árvore inspecionada, excluindo dependências/artefatos. Ler novamente se arquivos novos aparecerem.
- READMEs lidos; o README do backend usa nomes de diretórios antigos e menciona Compose integrado que não está presente na raiz atual. Os caminhos efetivos deste documento prevalecem para os comandos.
- Node disponível: `v24.15.0`; npm: `12.0.0`. Os três manifests exigem Node `>=22 <23`. **Trocar para Node 22 antes de instalar ou validar; não modificar engines para contornar isso.**
- Backend `2.2.2`, frontend `4.5.0`, PDF `1.1.0`.

### 3.1 Fluxo de autorização atual

1. `sap_prefeitura/src/modules/auth/auth.middleware.ts` valida JWT.
2. Routers chamam `authorizationFactory(...).authorize(userId, serviceId, request.method)`.
3. `sap_prefeitura/src/modules/acess-controll/application/authorization.usecase.ts` busca usuário, serviço, visibilidade `setor + serviço`, role e registro `role + serviço`.
4. `sap_prefeitura/src/infra/database/sequelize/models/permission.model.ts` representa `permissions(role_id, service_id, read, write, edit, del)` com exclusão lógica.
5. `GET /service/user` usa `ListVisibleServicesUseCase`, filtra `read` da role e retorna as quatro flags.
6. `Prefeitura_APP/src/context/user/UserProvider.jsx` escolhe `service.permissions[0]` pelo ID da página. Componentes consultam `permissions.read/write/edit/del`.
7. `PUT /service/:id` também altera permissões por role através de `SequelizeServiceAggregateRepository`. Não basta trocar apenas `/permissions`.
8. A reconciliação em `sap_prefeitura/src/modules/acess-controll/events/index.ts` e `service-access-defaults.usecase.ts` cria permissões ao cadastrar roles/serviços. Após a transição, não poderá recriar flags CRUD nem habilitar ações automaticamente por nome de role; ausência de vínculo role/ação significa negar.

**Correções de terminologia:** os números `1`, `3`, `6`, `9`, `10`, `11` usados nos routers são IDs de **serviços**, não de setores. Setores continuam relevantes para `service_visibilities`.

**Regressão principal real:** cancelar vínculo de bolsista com edital usa `PUT /:bolsista/edital/:edital`, no router FT Bolsista, e hoje exige `edit`; excluir o cadastro usa `DELETE /:id`, exige `del`. Embora o exemplo do pedido cite DELETE, não alterar verbos nem regras de cancelamento para implementar autorização.

**Outra lacuna encontrada:** `sap_prefeitura/src/modules/espelho-ponto/interface/router/espelho-ponto.router.ts` protege `/pdf` apenas com JWT. Incluí-lo em `ft:gerar_espelho_ponto`; não deixar uma rota alternativa contornar o controle.

## 4. Decisões de domínio confirmadas e limites de escopo

1. **Permissões são por role.** Cada usuário mantém exatamente o `role_id` já existente e herda as ações dessa role. Não criar concessões por usuário, exceções, múltiplas roles, hierarquia, wildcard ou união de perfis.
2. Para diferenciar responsabilidades, criar outra role pelo fluxo já existente, configurar suas ações e atribuí-la ao usuário. Criar a role não concede direitos; não criar clonagem automática nem copiar ações de outra role por semelhança de nome.
3. Alterar as concessões de uma role afeta todos os seus usuários nas próximas requisições. Trocar o `role_id` do usuário faz valer o conjunto da nova role imediatamente na próxima consulta ao banco; não copiar ou materializar permissões no usuário.
4. Ausência de vínculo role/ação equivale a negar; `allowed=false` é negação explícita. Não há bypass de administrador por nome/ID de role, setor ou usuário.
5. Visibilidade por setor continua obrigatória e independente: uma ação permitida na role não torna o serviço visível ao setor. Usuários da mesma role podem ter serviços visíveis diferentes por pertencerem a setores distintos.
6. `services` continua sendo a entidade de módulo. Acrescentar `module_key` estável; `services.name` permanece nome de apresentação editável. Não usar `tag`, nome da role ou nome do setor para resolver permissões.
7. Criar `permission_actions` para o catálogo e `role_permissions(role_id, permission_action_id, allowed)` para concessões. Conservar `permissions` intacta como legado de migração e rollback; não manter dupla escrita nem fallback nas flags antigas. A tabela nova evita misturar linhas CRUD com linhas por ação na mesma estrutura durante a transição.
8. Módulo/ação são determinados pela FK para o catálogo e retornados por JOIN; não duplicar `service_id`/`action` nas concessões. O vínculo da role é a única fonte persistida do direito.
9. Serviços: remover criação/exclusão da UI e API. Manter edição de metadados e visibilidade; `module_key`/ID são imutáveis por HTTP. Catálogo de ações e existência de serviços são controlados por migrations/seeds.
10. Configurar concessões da role exige `servicos:gerenciar_permissoes`, separado de `servicos:editar_servico`. O catálogo é somente leitura na API; somente `allowed` de ações cadastradas pode ser alterado no endpoint administrativo.
11. Backfill converte cada flag antiga da **role**, por serviço, nas ações equivalentes. Não multiplicar concessões pelo número de usuários; roles existentes sem usuários também são migradas. Cancelar vínculo deriva de `edit`, excluir cadastro deriva de `del`.
12. Role nova começa sem ações permitidas. Usuário novo herda a role atribuída, sem seed de permissões individuais. Adicionar ação ao catálogo também começa negado para todas as roles até concessão explícita; seed reexecutado não sobrescreve revogações.
13. Renomear uma role não altera seus direitos, que são vinculados pelo ID. Role inexistente não autoriza. Preservar constraints e política existente de exclusão de role referenciada; não realocar usuários automaticamente nem apagar concessões silenciosamente.
14. As políticas adicionais de impedir edição da própria role, impedir remoção do último gestor, limitar o que um gestor pode conceder e criar recuperação administrativa **não foram aprovadas**. São propostas separadas na seção 14; não implementá-las, não expandir use cases de usuário/setor para esse fim e não incluí-las nos critérios obrigatórios desta feature. Manter validação de autorização e integridade nas operações aprovadas.

**Modelo fechado para implementação:** `usuário → role atual → ações permitidas`, combinado com `setor atual → visibilidade do módulo`. Diferenciação entre pessoas exige outra role; não adicionar exceção por usuário “para garantir”.

## 5. Arquitetura proposta

Usar `services.module_key` como código estável do módulo, catálogo persistido `permission_actions(service_id, module_key, action)` e vínculos `role_permissions(role_id, permission_action_id, allowed)`. Cada router declara seu módulo uma vez e cada rota declara somente a ação; o preHandler carrega o usuário atual do banco, resolve seu `role_id`, confirma a role e a visibilidade do setor atual e consulta a concessão dessa role, sem inferir direitos pelo método HTTP. Frontend recebe ações efetivas já resolvidas para a role e o setor do usuário e usa `can(module, action)`; a administração seleciona uma role e explicita que salvar afeta todos os usuários dela.

### 5.1 Modelo de dados exato

| Tabela/campo | Definição |
|---|---|
| `services.module_key` | `VARCHAR(64)` ASCII binário, único, não nulo após backfill |
| `services(id,module_key)` | índice único composto para a FK abaixo |
| `permission_actions.id` | INTEGER PK auto increment |
| `permission_actions.service_id` | INTEGER NOT NULL |
| `permission_actions.module_key` | VARCHAR(64), mesmo charset/collation de `services.module_key`, NOT NULL |
| `permission_actions.action` | VARCHAR(96) ASCII binário NOT NULL, padrão `^[a-z][a-z0-9_]*$` validado no catálogo |
| `permission_actions.createdAt/updatedAt` | DATE NOT NULL, convenção existente |
| catálogo: unicidade | UNIQUE(service_id, action) e UNIQUE(module_key, action) |
| catálogo: integridade | FK(service_id,module_key) → services(id,module_key), UPDATE CASCADE, DELETE RESTRICT |
| `role_permissions.id` | INTEGER PK auto increment |
| `role_permissions.role_id` | INTEGER NOT NULL, FK roles.id, UPDATE CASCADE, DELETE RESTRICT |
| `role_permissions.permission_action_id` | INTEGER NOT NULL, FK permission_actions.id, UPDATE CASCADE, DELETE RESTRICT |
| `role_permissions.allowed` | BOOLEAN NOT NULL DEFAULT FALSE |
| `role_permissions.createdAt/updatedAt` | DATE NOT NULL |
| concessão: unicidade | UNIQUE(role_id, permission_action_id), mais índice na FK de action |
| `permission_migration_state` | tabela técnica singleton com `id=1`, `completed` BOOLEAN, `completedAt` DATE nullable; controla finalização do snapshot, não autorização |

Não usar `paranoid` nas duas tabelas novas: revogar = atualizar `allowed=false`, não excluir/recriar. Isso evita a unicidade problemática com `deletedAt` e conserva o histórico pelo mecanismo de auditoria existente. Usuário/serviço excluído logicamente nunca pode ser autorizado, mesmo com concessão verdadeira na role. O model atual de roles não possui `deletedAt`: validar sua existência, sem inventar soft delete nessa tabela.

O `module_key` repetido no catálogo atende ao identificador textual solicitado e fica protegido pela FK composta; `services.name` não é replicado, para não gerar nomes divergentes. Usar os tipos de PK existentes, não mudar IDs para UUID.

### 5.2 Módulos iniciais

Mapeamento fixo confirmado pelos seeds e routers, não por nome/tag:

| service_id | module_key |
|---:|---|
| 1 | `usuarios` |
| 2 | `setores` |
| 3 | `servicos` |
| 4 | `roles` |
| 5 | `demandas_ti` (legado inativo, não reativar) |
| 6 | `ft` |
| 7 | `iptu` |
| 9 | `municipes` |
| 10 | `esporte` |
| 11 | `auditoria` |

Serviços legados fora do mapa recebem código `legado_<id>` por migration, com somente a ação `acessar`. Não criar rotas para eles, não reativar registros excluídos e não tentar adivinhar funcionalidades pelo nome. Antes do deploy, apresentar a relação desses módulos ao responsável; existência de rota de negócio não inventariada bloqueia a ativação.

`acessar` é a ação de entrada do módulo. Derivação inicial: `read`. Todas as ações de negócio exigem simultaneamente `acessar` e a própria ação. Isso conserva o requisito de entrada já imposto pela navegação; roles legadas com escrita sem leitura devem ser apontadas no relatório de pré-migração, pois não são normalizadas silenciosamente.

## 6. Catálogo e matriz de rotas — fonte única de verdade

Criar `sap_prefeitura/src/modules/acess-controll/domain/permission-catalog.ts` com a matriz abaixo. Cada item contém `module`, `action`, `legacyFlag: 'read'|'write'|'edit'|'del'|null` e `serviceId`; aliases da mesma operação reutilizam a mesma ação. O backend deriva dessa matriz os tipos literais e os seeds; frontend consome os resultados persistidos e os tipos de contrato, não mantém um segundo catálogo que decida autorização.

**Importante:** `legacyFlag` é metadado exclusivamente para o backfill único. Nenhuma verificação de produção pode ler esse campo ou converter método HTTP em ação.

### 6.1 Frente de Trabalho — módulo `ft`, serviço 6

Nos caminhos abaixo, `B` significa arquivo `sap_prefeitura/src/modules/ft-bolsista/interface/router/frente-de-trabalho-bolsista.router.ts`; `E`: `sap_prefeitura/src/modules/ft-edital/interface/router/ft-edital.router.ts`; `R`: `sap_prefeitura/src/modules/ft-relatorio/interface/router/ft-relatorio.router.ts`. Caminhos são relativos ao prefixo já registrado por cada módulo; preservar prefixos existentes.

| Arquivo/handler ou rota | Ação | Flag inicial |
|---|---|---|
| entrada do módulo | `acessar` | read |
| B: getBolsistas, getOneBolsista | `consultar_bolsista` | read |
| B: getBolsistasParaVinculo | `consultar_candidatos_vinculo` | read |
| B: getAniversariantes | `consultar_aniversariantes` | read |
| B: getToExpire, incluindo `/toexpire` e `/toExpire` | `consultar_vinculos_a_vencer` | read |
| B: getBolsistaEdital; E: getEditalWithBolsista, getAllEditalWithBolsista | `consultar_vinculos` | read |
| B: getHistoricoBolsista | `consultar_historico_bolsista` | read |
| B: createBolsista | `cadastrar_bolsista` | write |
| B: updateBolsista | `editar_bolsista` | edit |
| B: deleteBolsista | `excluir_bolsista` | del |
| B: cancelBolsistaEdital | `remover_bolsista` | edit |
| B: prorrogate | `prorrogar_vinculo` | edit |
| B: createFalta | `registrar_falta` | write |
| B: listFaltas | `consultar_faltas` | read |
| B: deleteFalta | `excluir_falta` | del |
| B: createOcorrencia | `registrar_ocorrencia` | write |
| B: listOcorrencias | `consultar_ocorrencias` | read |
| B: deleteOcorrencia | `excluir_ocorrencia` | del |
| B: gerarEspelhoPonto | `gerar_espelho_ponto` | read |
| E: getEdital, getEditalById | `consultar_edital` | read |
| E: postEdital | `cadastrar_edital` | write |
| E: updateEdital | `editar_edital` | edit |
| E: deleteEdital | `excluir_edital` | del |
| E: vincularBolsista | `vincular_bolsista` | write |
| E: atualizarVinculo | `editar_vinculo` | edit |
| E: getRelatory; R: gerarRelatorioEdital | `gerar_relatorio_edital` | read |
| R: gerarRelatorioFaltasEdital | `gerar_relatorio_faltas` | read |
| R: gerarListaPresencaEdital | `gerar_lista_presenca` | read |
| R: solicitarEspelhosPonto | `solicitar_espelhos_ponto` | write |
| R: solicitarFolhasPresenca | `solicitar_folhas_presenca` | write |
| R: listarDownloads | `consultar_downloads` | read |
| R: baixarArquivo | `baixar_relatorio` | read |
| R: retryDownload | `reprocessar_relatorio` | write |
| `sap_prefeitura/src/modules/espelho-ponto/interface/router/espelho-ponto.router.ts`: render | `gerar_espelho_ponto` | read, sem importar o acesso amplo antigo dessa rota |

`ft:remover_bolsista` significa somente cancelar/inativar vínculo, não apagar cadastro. Manter os nomes de UI “Inativar bolsista”/“Cancelar vínculo” e documentar essa correspondência.

Para `sap_prefeitura/src/modules/ft-pagador/pagador.router.ts`: list/get/capacity → `consultar_pagador`/read; create → `cadastrar_pagador`/write; update → `editar_pagador`/edit; delete → `excluir_pagador`/del.

Para `sap_prefeitura/src/modules/ft-turno/turno.router.ts`: list/get → `consultar_turno`/read; create → `cadastrar_turno`/write; update → `editar_turno`/edit; delete → `excluir_turno`/del.

### 6.2 Demais módulos

Cada módulo abaixo também contém `acessar`/read.

| Arquivo exato | Módulo | Handlers → ação / flag |
|---|---|---|
| `sap_prefeitura/src/modules/user/interface/routes/user.routes.ts` | usuarios | getAllByQuery/getOne → consultar_usuario/read; cadastrar → cadastrar_usuario/write; update → editar_usuario/edit; delete → excluir_usuario/del; alterPassword → alterar_senha_usuario/edit |
| `sap_prefeitura/src/modules/setor/interface/router/setor.router.ts` | setores | getSetores/getOneSetor → consultar_setor/read; postSetor → cadastrar_setor/write; updateSetor → editar_setor/edit; deleteSetor → excluir_setor/del |
| `sap_prefeitura/src/modules/roles/interface/routes/roles.router.ts` | roles | GET lista/detalhe → consultar_role/read; POST → cadastrar_role/write; PUT → editar_role/edit; DELETE → excluir_role/del |
| `sap_prefeitura/src/modules/services/interface/router/services.router.ts` | servicos | getService/getOneService → consultar_servico/read; updateService → editar_servico/edit; criação/exclusão removidas |
| `sap_prefeitura/src/modules/permission/interface/routes/permission.router.ts` | servicos | catálogo e concessões administrativas GET → consultar_permissoes/read; concessões PUT → gerenciar_permissoes/edit; leitura própria `/me` → JWT, sem poder consultar outro usuário |
| `sap_prefeitura/src/modules/municipe/interface/routes/municipe.router.ts` | municipes | getMunicipe/getMunicipeById → consultar_municipe/read; postMunicipe → cadastrar_municipe/write; updateMunicipe → editar_municipe/edit |
| `sap_prefeitura/src/modules/esporte/interface/router/atleta.router.ts` | esporte | findAll/findOne → consultar_atleta/read; create → cadastrar_atleta/write; update → editar_atleta/edit; delete → excluir_atleta/del; addModalidade → vincular_modalidade/write; removeModalidade → remover_modalidade/del; findCarteirinhas/findCarteirinhasByAtleta → consultar_carteirinha/read; createCarteirinha → emitir_carteirinha/write; getCarteirinhaPdf → gerar_pdf_carteirinha/read |
| `sap_prefeitura/src/modules/esporte/interface/router/modalidade.router.ts` | esporte | findAll/findOne → consultar_modalidade/read; create → cadastrar_modalidade/write; update → editar_modalidade/edit; delete → excluir_modalidade/del |
| `sap_prefeitura/src/modules/audit/interface/audit.routes.ts` | auditoria | list/detail → consultar_auditoria/read; export → exportar_auditoria/write |

`iptu` e módulos legados sem router mantêm somente `acessar`; este trabalho não cria endpoints novos desses domínios.

### 6.3 Declaração no router

Criar `sap_prefeitura/src/modules/acess-controll/interface/require-permission.ts`. Sua interface pública é `requirePermission(module)(action)`, que retorna um `preHandler` Fastify. O módulo fica no fechamento do router e nunca é lido de body, query ou parâmetro do cliente.

Exemplo completo de uso (trechos a aplicar ao router existente, preservando schema/config de auditoria/handler):

```ts
const allow = requirePermission("ft");

// Em DELETE /:id:
preHandler: allow("excluir_bolsista"),

// Em PUT /:bolsista/edital/:edital:
preHandler: allow("remover_bolsista"),
```

Remover os hooks globais que passam `request.method`; manter `verifyJWT` registrado antes da autorização. Não deduzir ação de `audit.failureAction`: exportações GET, cancelamentos PUT e remoção de vínculos são operações diferentes apesar dos verbos.

## 7. Contratos novos e contratos removidos

Manter prefixo atual `/api/v2`; os caminhos relativos não mudam para autenticação, usuários, roles e operações de negócio.

| Endpoint | Autorização | Contrato |
|---|---|---|
| GET `/permissions/catalog?service_id=6&page=0&limit=25` | servicos:acessar + consultar_permissoes | `{permission:[{id,service_id,module,action}],count,ok:true}`; paginação 0-based; limite 1..100 |
| GET `/permissions/me` | JWT | `{permissions:[{service_id,module,actions:string[]}],ok:true}` com ações da role atual do usuário autenticado, filtradas pelo setor atual; rejeitar user_id/role_id fornecidos pelo cliente |
| GET `/permissions?role_id=2&service_id=6&page=0&limit=25` | servicos:acessar + consultar_permissoes | catálogo LEFT JOIN concessões da role, `{permission:[{permission_action_id,role_id,service_id,module,action,allowed}],count,ok:true}`; ausência retorna false |
| PUT `/permissions/role/:roleId` | servicos:acessar + gerenciar_permissoes | body abaixo; retorno 204; alteração atômica de até 100 ações; omitidas permanecem inalteradas; afeta toda a role |
| GET `/service/user` | JWT | serviços visíveis ao setor atual e com `acessar=true` na role atual; cada serviço inclui `module` e `actions:string[]`; sem flags CRUD |
| GET `/service/:id`, GET `/service` | servicos:acessar + consultar_servico | metadados + catálogo quando necessário; não retornar concessões de todas as roles por padrão |
| PUT `/service/:id` | servicos:acessar + editar_servico | `{service:{name,description,url,tag?},visibility?:[...]}`; rejeitar campo legado `permissions` e `module_key` |
| POST `/service`, DELETE `/service/:id` | inexistentes | remover registros e OpenAPI; 404 pelo handler padrão, sem efeito no banco |
| GET `/permissions/:id`, PUT `/permissions/:id` legados | removidos | não reinterpretar IDs antigos como IDs novos; resposta 404 |
| `/permissions/user/:userId` | inexistente | não criar endpoint de concessão individual; resposta 404 |

Body exato para concessão à role:

```json
{
  "permissions": [
    { "permission_action_id": 12, "allowed": true },
    { "permission_action_id": 13, "allowed": false }
  ]
}
```

- `roleId` alvo vem exclusivamente do path; cada item contém apenas `permission_action_id` e `allowed`. Rejeitar `user_id`, `role_id`, `service_id`, `module`, `action` e campos extras no body; o ator vem exclusivamente do JWT autenticado.
- Rejeitar IDs não inteiros/positivos, IDs de ação duplicados/inexistentes, array vazio/maior que 100 e `allowed` não booleano. No GET administrativo, `role_id` é obrigatório e deve identificar role existente; service_id é filtro opcional válido.
- Fastify/Ajv pode coagir/remover campos: provar em testes HTTP rejeição real de `"false"` e campos proibidos. Se necessário, validação estrita somente nessas rotas/schemas, sem modificar globalmente contratos existentes.
- 401: autenticação inválida ou usuário excluído depois do JWT; 403 `NOT_PERMITTED`: falta de concessão/visibilidade ou role atual inexistente; 404 `ROLE_NOT_FOUND`: role alvo administrativa inexistente; 400: payload inválido; 409: conflito de integridade real. Não inventar 403 de autoalteração ou 409 de último gestor sem aprovação dessa política.
- O `userId` recebido na autorização identifica o ator autenticado, **não uma chave de concessão individual**. Carregar role_id/setor_id atuais do banco, ignorando claims antigas para essas decisões.
- Ação desconhecida no código é erro de configuração: negar, registrar somente módulo/ação e erro técnico e responder erro interno padronizado. Ausência no catálogo nunca permite acesso.
- Não abrir CRUD HTTP de permission_actions/module_key. Não embutir concessões no JWT nem manter cache entre requisições nesta feature. Revogação na role e mudança de role valem na próxima requisição, sem novo login; requisição já autorizada não é cancelada retroativamente.
- Criação e atribuição de roles continuam nos endpoints existentes. O painel de permissões requer `roles:consultar_role` para carregar o seletor via GET `/roles`; se faltar, exibir a restrição em vez de enumerar roles por um endpoint sem autorização. Não adicionar seleção de usuário à configuração de concessões.

## 8. Migração, seeds e preservação de dados

### 8.1 Estratégia expandir → preencher → ativar

Adicionar arquivos novos, sem editar o histórico de migrations:

1. `sap_prefeitura/src/infra/database/sequelize/migrations/20261021090000-create-action-permissions.ts`: estrutura, backfill de module_key, índices/FKs.
2. `sap_prefeitura/src/infra/database/sequelize/migrations/20261021091000-backfill-role-action-permissions.ts`: catálogo e snapshot das flags por role/serviço nas concessões role/ação existentes.
3. `sap_prefeitura/src/infra/database/sequelize/seeders/20261021092000-ensure-action-permissions.ts`: após todos os seeds legados, garante catálogo e conclui snapshot apenas se a migration não encontrou estrutura de dados de acesso para migrar.

Timestamps são nomes propostos de ordenação; confirmar inexistência antes de criar.

**Pré-checagens antes de DDL:** órfãos em permissions/users/services/service_visibilities, duplicidade ativa `(role_id,service_id)`, flags nulas, module_key repetido, visibilidade duplicada `(setor_id,service_id)` e tipos/collations. Abortar inconsistência ambígua com tabela/contagem, sem PII. Não escolher primeiro/último, OR ou AND entre flags conflitantes.

**Snapshot por role:** para cada role existente e ação do serviço, localizar a permissão legada ativa correspondente. `allowed` inicial é estritamente a flag verdadeira/1; ausente = false. Não copiar linha soft-deleted. Materializar false para comparação auditável. Incluir roles sem usuários, não criar linhas por usuário e não alterar `users.role_id`/`users.setor_id`.

- `gerenciar_permissoes` deriva de `edit` do serviço 3; `acessar` deriva de read; cancelar vínculo deriva de edit e excluir cadastro deriva de del. Não conceder pelo nome “admin”.
- Role com escrita true e read false é discrepância: reportar por IDs técnicos e bloquear cutover até aprovação; não conceder read silenciosamente.
- A rota PDF antes só autenticada passa ao controle FT; registrar a restrição intencional no rollout.
- Não alterar roles legadas, seus vínculos de usuários, flags históricas, setores, bolsistas ou dados pessoais. A migração só cria o catálogo/vínculos normalizados e o identificador estável do serviço.
- Migrations executam antes de seeds. Banco limpo pode ter `roles` criadas mas serviços/flags ainda ausentes: nesse caso deixar `permission_migration_state.completed=false`; o seed final conclui após todos os seeds legados. Banco populado sem usuários mas com roles/permissões **deve ser migrado normalmente**; presença de usuário não determina finalização.
- O marcador só vira true após snapshot completo e verificado em transação DML. Interrupção DML reverte inserções e marcador juntos.
- Se completed=true, reexecução garante catálogo/estrutura mas não repete snapshot nem sobrescreve allowed administrado. Não usar INSERT IGNORE para esconder inconsistência arbitrária.
- Role criada posteriormente começa negada por ausência; nenhuma reconciliação lhe copia direitos antigos. Usuário criado depois herda as concessões atuais de sua role sem gravar novas linhas. Ação futura adicionada ao catálogo também permanece negada nas roles até configuração explícita.
- MariaDB faz commit implícito de DDL: conferir existência e definição de cada objeto, completar DDL parcial compatível e abortar divergência de definição. Transações protegem DML, não prometem rollback atômico de DDL.

### 8.2 Bootstrap e ciclo de vida das roles

Instalação limpa: executar seeds legados de roles, serviços, usuário e visibilidades; o seed final traduz as permissões legadas das roles uma única vez. Não criar credencial nova nem introduzir bypass por role admin no runtime. Validar antes do rollout que existe usuário ativo em setor visível ao serviço 3 cuja role tem `acessar` e `gerenciar_permissoes`; se faltar, registrar o bloqueio para configuração administrativa explícita, sem auto-grant.

Criar nova role usa o fluxo existente, sem copiar concessões de outra role. A UI orienta: criar role → configurar ações → atribuir aos usuários. Nome da role é apresentação, ID é identidade. Atualizar ações da role afeta todos os associados; exibir aviso claro antes de salvar.

Gravação de lote: usar transação, lock da role alvo e ordem crescente de permission_action_id; conferir ator atual, role alvo e catálogo dentro da transação. Serializar escritas da mesma role e revalidar os direitos do ator após obter os locks necessários; impedir duplicidade por UNIQUE. Ao editar a própria role, autorizar com o estado anterior válido, aplicar atomicamente e usar o estado novo nas próximas requisições. Não bloquear essa edição por política não aprovada. Excluir role usada por usuários continua sujeito às regras/FKs existentes; FK das novas concessões usa RESTRICT, sem remoção silenciosa de grants.

Não ampliar esta feature para regras de último gestor, autoalteração, recuperação ou refatoração de exclusão de usuário/setor. Essas propostas ficam destacadas separadamente na seção 14.

### 8.3 Rollback

- Conservar `permissions` e seus registros sem escrita pelo novo fluxo.
- `down` do backfill precisa comparar o estado atual com o snapshot esperado a partir do legado preservado; se houver concessões administradas após o snapshot, novas ações/concessões, ou impossibilidade de representar as ações atuais pelas quatro flags legadas da role, **abortar antes de apagar dados**. Não reduzir permissões por OR/AND nem aceitar perda silenciosa.
- `down` estrutural exige zero dependências novas e snapshot revertido; remover FKs/índices em ordem inversa e só então tabelas/coluna nova. Reexecução de down sem objetos deve ser segura.
- Após uso administrativo real, rollback de banco pode ser intencionalmente bloqueado; recuperação recomendada é forward-fix. Se houver necessidade de rollback do aplicativo, usar backup validado e plano aprovado; retornar ao código antigo reativa o modelo amplo por role e não pode ser feito silenciosamente.

## 9. Plano de execução em microtarefas

### Convenção TDD e comandos

Cada item enumerado abaixo é uma unidade pequena de trabalho; se exigir mais de um comportamento, executar um ciclo por comportamento. Para cada alteração de código:

1. adicionar somente o teste indicado;
2. rodar o comando indicado e verificar **falha da asserção esperada** (não falta de dependência/banco);
3. implementar o comportamento mínimo descrito;
4. rodar novamente: exit code 0, nenhum teste falho;
5. executar `npm run check` no backend ou `npm run typecheck` no frontend;
6. revisar diff; registrar checkpoint local. Se commits tiverem sido autorizados, usar a mensagem indicada no fechamento do grupo, sempre após `git diff --check`.

Comandos executados da raiz:

```bash
# Teste backend focal (trocar somente o caminho pelo teste listado):
(cd sap_prefeitura && node --import tsx --test src/modules/acess-controll/application/authorization.usecase.test.ts)
# Teste frontend focal:
(cd Prefeitura_APP && npm test -- src/context/user/UserProvider.permissions.test.jsx)
```

Usar a forma com subshell/cd para todos os testes abaixo, pois vários testes usam `process.cwd()`. Não rodar suítes vermelhas em background sem acompanhar o resultado.

### A. Preparação — sem alteração funcional

**A1. Revalidar ambiente e Git.** Ler instruções locais e executar:

```bash
node --version
npm --version
git -C sap_prefeitura status --short --branch
git -C Prefeitura_APP status --short --branch
git -C sap_prefeitura rev-list --left-right --count HEAD...origin/develop
git -C Prefeitura_APP rev-list --left-right --count HEAD...origin/development
git -C Prefeitura_APP diff -- docker-compose.yml
```

Esperado: Node 22.x; nenhuma alteração inesperada. Preservar integralmente o diff de Compose. Consultar issues/PRs por ferramenta autenticada read-only; informar indisponibilidade se persistir. Se autorização posterior permitir fetch, atualizar referências antes de criar branch; não declarar base atualizada só pelas referências locais.

**A2. Branches futuras.** Após conferir bases e autorização para executar implementação, criar `feat/permissoes-modulo-recurso` em cada repositório a partir de `develop`/`development`; verificar inexistência antes. O frontend tem alteração local: não fazer checkout que a sobrescreva; usar worktree separado se necessário, mantendo o arquivo do usuário intocado. Não criar branch no PDF, que não recebe código funcional.

**A3. Desdobrar documentação.** Criar, a partir deste documento, `codex/plans/permissoes-modulo-recurso.md`, `sap_prefeitura/.codex/plans/permissoes-modulo-recurso-backend.md` e `Prefeitura_APP/.codex/plans/permissoes-modulo-recurso-frontend.md`. Registrar que PDF não requer implementação. Estes arquivos são uma etapa futura, não mudanças permitidas neste turno.

**A4. Baseline.** Com Node correto/dependências instaladas via `npm ci`, executar validações completas da seção 11 antes de mexer em produção; guardar comandos/saídas e métricas iniciais. Não atribuir falhas preexistentes à feature nem ignorá-las para encerrar a tarefa.

### B. Catálogo e regras puras

**B1. Adicionar teste de chave estável.** Novo arquivo `sap_prefeitura/src/modules/acess-controll/domain/permission-key.test.ts`, com o conteúdo integral abaixo:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { permissionKey } from "./permission-key.js";

test("monta chave explícita sem depender de método HTTP", () => {
  assert.equal(permissionKey("ft", "remover_bolsista"), "ft:remover_bolsista");
  assert.notEqual(permissionKey("ft", "remover_bolsista"), permissionKey("ft", "excluir_bolsista"));
});

test("rejeita componentes ambíguos e não normaliza silenciosamente", () => {
  for (const value of ["", "FT", "ft:excluir", " ft", "ft-"]) {
    assert.throws(() => permissionKey(value, "remover_bolsista"), TypeError);
    assert.throws(() => permissionKey("ft", value), TypeError);
  }
  assert.throws(() => permissionKey("a".repeat(65), "consultar"), TypeError);
  assert.throws(() => permissionKey("ft", "a".repeat(97)), TypeError);
});
```

Executar `node --import tsx --test src/modules/acess-controll/domain/permission-key.test.ts` no backend; RED esperado: módulo inexistente. Criar `sap_prefeitura/src/modules/acess-controll/domain/permission-key.ts` com:

```ts
const componentPattern = /^[a-z][a-z0-9_]*$/;

export function permissionKey(module: string, action: string): string {
  if (!componentPattern.test(module) || module.length > 64 ||
      !componentPattern.test(action) || action.length > 96) {
    throw new TypeError("Invalid permission key");
  }
  return `${module}:${action}`;
}
```

GREEN: os dois testes aprovados. Essa função é usada pelo catálogo e representação da chave; não substitui consulta de autorização.

**B2. Fixar catálogo.** Criar `permission-catalog.ts` no mesmo diretório, materializando cada linha das matrizes da seção 6 uma única vez por ação. Adicionar `permission-catalog.test.ts`: chaves únicas, IDs corretos, `remover_bolsista !== excluir_bolsista`, flags corretas e todo módulo com `acessar`. Executar teste focal RED antes de acrescentar cada grupo de ações; GREEN sem duplicidade. Não acrescentar novas permissões genéricas `write`/`delete`.

**B3. Contratos de repositório.** Adicionar os tipos e a interface em `sap_prefeitura/src/modules/permission/domain/repository/role-permission.repository.ts`:

```ts
export interface PermissionAction {
  id: number;
  service_id: number;
  module: string;
  action: string;
}
export interface PermissionChange {
  permission_action_id: number;
  allowed: boolean;
}
export interface RolePermissionRepository {
  findAction(module: string, action: string): Promise<PermissionAction | null>;
  isAllowed(roleId: number, actionId: number): Promise<boolean>;
  listAllowed(roleId: number): Promise<PermissionAction[]>;
}
```

Contrato de escrita administrativa deve ser separado deste contrato de leitura, receber o ator e executar a transação integral; não expor um `update(id, payload)` irrestrito ao controller.

Checkpoint sugerido, se autorizado: `feat(auth): define explicit module action catalog`.

### C. Estrutura e migração — um cenário por ciclo

**C1. Estrutura nova.** Teste novo `sap_prefeitura/src/infra/database/sequelize/migrations/__tests__/action-permissions-migration.test.ts`: tabelas, colunas, FKs e índices da seção 5.1. Rodar focal, observar RED; criar a primeira migration da seção 8; GREEN.

**C2. Falha parcial.** No mesmo teste, cenários separados: coluna já criada; somente uma tabela criada; índice faltante; FK faltante; objeto preexistente com definição divergente. Completar somente objetos compatíveis; divergência aborta. RED/GREEN para cada cenário.

**C3. Pré-checagens.** Mesmo teste: órfãos e duplicidade ativa abortam antes da primeira mudança de DDL/DML; duplicidade de registro excluído não é tratada como concessão ativa. Verificar que a mensagem não contém dados pessoais. RED/GREEN para cada caso.

**C4. Backfill.** Novo `sap_prefeitura/src/infra/database/sequelize/migrations/__tests__/role-permissions-backfill.test.ts`; segunda migration. Fixture: duas roles com usuários, uma role sem usuários, usuários de setores diferentes e um usuário excluído, flags edit=true/del=false na primeira role. Esperado: `remover_bolsista=true` e `excluir_bolsista=false` na primeira role; role sem usuários também migrada; nenhuma linha vinculada a user_id; usuários/roles/visibilidades intactos. Trocar quantidade de usuários não muda a contagem de concessões da role.

**C5. Idempotência DML.** No teste anterior, simular finalização, alteração manual para false, role criada depois e usuário criado depois e nova execução. Esperado: nenhuma sobrescrita, nenhum novo snapshot pós-finalização e role nova negada por padrão e usuário novo herdando apenas as concessões atuais de sua role, sem linhas adicionais. Falha entre inserção e marcador reverte a transação inteira.

**C6. Instalação limpa.** Novo `sap_prefeitura/src/infra/database/sequelize/seeders/__tests__/action-permissions-seed.test.ts`; seed final. Banco sem serviços/flags de acesso semeados na migration não conclui o marcador; banco com roles e permissões mas sem usuários conclui normalmente; seeds legados + seed final geram catálogo e concessões iniciais; repetição mantém false administrado. Seeds não podem reativar serviço inativo.

**C7. Rollback seguro.** No teste de migration, verificar down na ordem inversa, segunda execução sem erro e abort com concessão de role alterada, catálogo posterior ou snapshot não representável. Conferir que não ocorre DROP/DELETE antes da recusa.

Comando focal para C1–C7, no backend:

```bash
node --import tsx --test 'src/infra/database/sequelize/migrations/__tests__/*permissions*.test.ts' 'src/infra/database/sequelize/seeders/__tests__/action-permissions-seed.test.ts'
```

Esperado GREEN: zero falhas. Doubles não substituem a validação MariaDB da seção 11.

### D. Models e adapter persistido

**D1. Registrar models.** Novos arquivos `sap_prefeitura/src/infra/database/sequelize/models/permission-action.model.ts` e `role-permission.model.ts`; alterar `service.model.ts` para module_key e associações novas; alterar `roles.model.ts` para associação com RolePermissionsModel. Não adicionar associação de concessão no user.model.ts nem migrar user.role_id para outra estrutura. Expandir `sap_prefeitura/src/infra/database/sequelize/__tests__/model-metadata.test.ts` com PKs, allowNull, unique/FKs, nomes de tabela e `paranoid=false` dos novos models. Rodar RED, implementar e rodar GREEN. Loader atual descobre arquivos automaticamente; não introduzir novo loader.

**D2. Consultas.** Novo adapter `sap_prefeitura/src/infra/database/sequelize/repositories/sequelize.role-permission.repository.ts` e teste `repositories/__tests__/sequelize.role-permission.repository.test.ts`. Implementar B3 usando os novos models, filtros exatos, JOIN com serviço não excluído e booleano estrito. Casos separados: true, false, ausente, serviço excluído, ação inexistente. Não usar `Boolean('0')`.

**D3. Listagens.** Mesmo adapter/teste, implementar catálogo e listagem administrativa pelo catálogo como entidade principal: contar/paginar ações **antes** do LEFT JOIN; filtro role/service; limite 1..100; ordenação estável module/action/id; role sem concessão retorna false para todas as ações da página. Não contar múltiplas linhas de JOIN como permissões diferentes.

Checkpoint sugerido: `feat(auth): persist action catalog and per-role grants`.

### E. Autorização em runtime

**E1. RED da separação real.** Reescrever `sap_prefeitura/src/modules/acess-controll/application/authorization.usecase.test.ts` para o contrato `(userId,module,action)`. Em testes separados: permitir remover vínculo com negar excluir bolsista; inverso; editar vínculo não permite cancelar; mesmo verbo HTTP não interfere; módulo errado não permite ação homônima.

**E2. Serviço de autorização.** Alterar `authorization.usecase.ts` e `factories/makeAuthorization.ts`: buscar usuário ativo pelo ID, resolver ação e serviço por module_key, verificar visibilidade atual do setor, exigir `acessar` e ação explícita. Manter validação da existência da role atual e substituir apenas PermissionRepository legado por RolePermissionRepository. Consultar allowed por user.role_id persistido, nunca pelo ID do usuário. Não cachear direitos entre requisições. GREEN dos testes E1. Adicionar ciclos separados para dois usuários da mesma role com mesmo setor terem os mesmos direitos; setores distintos poderem restringir visibilidade; troca de role com JWT antigo passar a usar a role nova; mudança de concessão afetar todos os usuários da role sem novo login; role inexistente negar acesso.

**E3. Negação por padrão.** No teste focal, adicionar uma hipótese por ciclo: sem concessão, false, sem setor, visibilidade ausente/false, serviço excluído, usuário excluído, ação não cadastrada, falha de banco. Nenhuma hipótese chama handler protegido. Erro de banco não vira allow nem “lista vazia bem-sucedida”.

**E4. PreHandler reutilizável.** Criar `interface/require-permission.ts` e `interface/require-permission.test.ts` em `sap_prefeitura/src/modules/acess-controll`. Testar resolução de user ID do JWT, módulo/ação fixos vindos do fechamento, ordem JWT→autorização e propagação do erro. Usar factory existente, sem singleton global com usuário armazenado.

**E5. Integrar uma rota por ciclo.** Aplicar a matriz da seção 6 aos arquivos exatos nela indicados. Remover os hooks antigos somente no router convertido e adicionar preHandler a todas as rotas daquele arquivo. Começar pelas duas ações FT que motivaram o pedido; depois faltas/ocorrências; depois demais módulos. Aliases e rotas alternativas exigem a mesma ação.

**E6. Testes HTTP.** Criar `sap_prefeitura/src/modules/acess-controll/interface/permission-routes.test.ts` usando Fastify `inject`, sem escutar porta e com fontes de autorização substituídas por dependência controlada. Registrar os routers reais, não cópias de handlers fictícios. Para cada rota protegida da matriz: sem token → 401; token sem concessão → 403 e handler não chamado; concessão específica → código original e handler correto. Incluir `/espelho-ponto/pdf`.

**E7. Cobertura de metadados de autorização.** Criar `sap_prefeitura/src/core/hooks/__tests__/permission-route-metadata.test.ts`. Inventariar rotas registradas em teste (`onRoute`) e conferir que toda rota de negócio tem preHandler específico ou exceção explícita justificada. Exceções: autenticação/sessão, saúde/ready e leituras de direitos do próprio usuário. HEAD gerado automaticamente herda o controle GET; OPTIONS permanece transporte/CORS, não ação de negócio. Não copiar somente o teste de regex de auditoria: a verificação deve observar os routers reais registrados.

Checkpoint sugerido: `feat(auth): enforce explicit actions across business routes`.

### F. Escrita administrativa por role

**F1. Use case transacional.** Criar `sap_prefeitura/src/modules/permission/application/use-case/set-role-permissions.use-case.ts` e teste `sap_prefeitura/src/modules/permission/application/__tests__/set-role-permissions.use-case.test.ts`. Entrada: actorUserId autenticado, targetRoleId e PermissionChange[]. Novo contrato `sap_prefeitura/src/modules/permission/domain/repository/role-permission-management.repository.ts`, adapter `sap_prefeitura/src/infra/database/sequelize/repositories/sequelize.role-permission-management.repository.ts`. Validar lote, carregar ator e role alvo, iniciar transação, obter locks determinísticos nas roles necessárias, revalidar role atual/permissões/visibilidade do ator, validar catálogo, obter before, upsert por `(role_id,permission_action_id)`, obter after e retornar diff. Nenhuma concessão individual.

**F2. Segurança.** No teste focal, ciclos independentes para ator sem gerenciar_permissoes, role alvo inexistente, action inexistente, duplicidade e tentativa de enviar user_id ou role_id no body. Esperado: recusa sem escrita. Ator autorizado pode editar ações de sua própria role; mudança vale para todos os usuários da role nas requisições seguintes, inclusive o ator. Não implementar bloqueio de autoalteração/último gestor sem aprovação específica.

**F3. Concorrência.** Novo `sap_prefeitura/src/infra/database/sequelize/repositories/__tests__/sequelize.role-permission-management.repository.test.ts`: transaction passada a todas as consultas/escritas; falha na segunda ação reverte a primeira; dois upserts do mesmo par não duplicam; mesmo lote reexecutado mantém resultado; locks em ordem determinística para evitar deadlock entre gestores de roles distintas. Provar concorrência também no harness MariaDB real. Se houver deadlock transitório, rollback integral e erro padronizado; não aplicar retry parcial escondido.

**F4. Troca e criação de role.** Acrescentar testes em `sap_prefeitura/src/modules/acess-controll/application/authorization.usecase.test.ts` e `sap_prefeitura/src/modules/services/application/__tests__/list-visible-services.use-case.test.ts`: usuário muda de role via fluxo existente, mas JWT antigo não conserva direitos da role anterior; role nova, mesmo com nome “admin”, começa sem concessões. Testar que renomear role não altera ações e que excluir role referenciada respeita as constraints existentes. Não reescrever use cases de usuário/setor nem acrescentar auto-grant. A autorização dos endpoints de gestão de usuários/roles continua pela matriz de ações, não pelo nome do cargo.

**F5. Auditoria.** Reutilizar `sap_prefeitura/src/modules/permission/application/events/permission.events.ts`, factories/controller e `sap_prefeitura/src/modules/audit/events/on-permission-events.ts`. Evento contém ator autenticado/contexto, role alvo, IDs das ações, before/after allowed; não usar role alvo como ator. Operação idempotente sem mudança não publica falso evento. Preservar tratamento atual de falha/outbox, sem prometer atomicidade inexistente entre commit e publicação. Atualizar `sap_prefeitura/src/modules/audit/events/__tests__/on-role-permission-events.test.ts`; verificar ausência de PII/token e presença de role_id alvo.

**F6. Defaults seguros.** Alterar `sap_prefeitura/src/modules/acess-controll/application/service-access-defaults.usecase.ts`, `events/index.ts`, `events/on-role-create.ts` e `events/on-service-create.ts`: criação de role pode deixar vínculos ausentes (negação) e não cria flags CRUD ou direitos true, mesmo para nome/id de administrador. Manter defaults de visibilidade por setor necessários. Testes existentes de defaults/eventos devem provar que role nova nega tudo e que reconciliação/startup não altera allowed configurado. Seeds históricos servem ao bootstrap anterior ao seed final e não voltam a ser fonte runtime; seed final não sincroniza flags antigas para role já migrada.

### G. API de catálogo e concessões

**G1. Schemas.** Criar `catalog-permissions.schema.ts`, `my-permissions.schema.ts`, `set-role-permissions.schema.ts` em `sap_prefeitura/src/modules/permission/interface/schemas`; adaptar `list-permissions.schema.ts` e `permission-resource.schema.ts`. Contratos exatos da seção 7, validação estrita e schemas de resposta sem atributos internos. Testes HTTP em `interface/routes/permission.router.test.ts` provam 400 de cada payload inválido antes da implementação do endpoint.

**G2. Controller/factories/router.** Atualizar `sap_prefeitura/src/modules/permission/interface/controller/permission.controller.ts`, `factories/permission.factories.ts`, `interface/routes/permission.router.ts`. Registrar `/catalog` e `/me` antes de qualquer parâmetro; remover rotas por ID legado. GET `/me` deriva usuário somente da sessão; não permite enumeração de outro usuário. Controller delega; não faz consultas ou regras de negócio.

**G3. Serviço visível.** Alterar `sap_prefeitura/src/modules/services/application/use-case/list-visible-services.use-case.ts`, `dto/visible-service.dto.ts`, `factories/service.factories.ts`, `interface/controller/services.controller.ts`, `interface/schemas/list-visible-services.schema.ts`. Entrada passa a ser userId; carregar setor atual persistido, não claims antigas. Retornar módulo e ações efetivas, sem as quatro flags. Atualizar `application/__tests__/list-visible-services.use-case.test.ts`: ações herdadas da role atual, usuários da mesma role, ausência de concessão, visibilidade negada e troca de role com claims antigas. Não usar quatro chamadas por módulo se uma consulta agrupada resolve a leitura.

**G4. Fechar cadastro/exclusão de serviços.** Em `sap_prefeitura/src/modules/services/interface/router/services.router.ts`, remover POST/DELETE e imports schemas. Remover entradas públicas controller/factories e arquivos de use case/DTO/schema de criação/exclusão que perderem todos os consumidores. Preservar a criação via SQL de seeds. Teste `sap_prefeitura/src/modules/services/interface/router/services.router.test.ts`: POST/DELETE retornam 404 e repository não é chamado; GET e PUT autorizados continuam disponíveis.

**G5. Fechar update legado de permissões.** Em `services/interface/schemas/update-service.schema.ts`, DTOs de update/aggregate e `sequelize.service-aggregate.repository.ts`, retirar permissões do write path e bloquear payload legado, inclusive tentativa de alterar só permissões com service válido. Atualizar `sap_prefeitura/src/infra/database/sequelize/repositories/__tests__/sequelize.service-aggregate.repository.test.ts`. Remover associação/serialização de permissions antiga da resposta nova de agregado, sem apagar a tabela histórica.

Checkpoint sugerido: `feat(permissions): add role grant administration and close legacy writes`.

### H. Frontend: fonte de direitos e UI administrativa

**H1. Função pura.** Criar `Prefeitura_APP/src/context/user/permission-access.ts` e `permission-access.test.ts` com estes conteúdos integrais:

```ts
// permission-access.ts
export interface ModulePermissions {
  service_id: number;
  module: string;
  actions: string[];
}
export function canPerform(
  permissions: readonly ModulePermissions[],
  module: string,
  action: string,
): boolean {
  const current = permissions.find((item) => item.module === module);
  return Boolean(current?.actions.includes("acessar") && current.actions.includes(action));
}
```

```ts
// permission-access.test.ts
import { describe, expect, it } from "vitest";
import { canPerform } from "./permission-access";

describe("canPerform", () => {
  it("separa remover vínculo de excluir cadastro", () => {
    const grants = [{ service_id: 6, module: "ft", actions: ["acessar", "remover_bolsista"] }];
    expect(canPerform(grants, "ft", "remover_bolsista")).toBe(true);
    expect(canPerform(grants, "ft", "excluir_bolsista")).toBe(false);
    expect(canPerform(grants, "esporte", "remover_bolsista")).toBe(false);
  });
  it("nega ausência e ausência de entrada do módulo", () => {
    expect(canPerform([], "ft", "remover_bolsista")).toBe(false);
    expect(canPerform([{ service_id: 6, module: "ft", actions: ["remover_bolsista"] }], "ft", "remover_bolsista")).toBe(false);
  });
});
```

Criar teste primeiro; executar `(cd Prefeitura_APP && npm test -- src/context/user/permission-access.test.ts)` para RED e depois GREEN.

**H2. Provider.** Modificar `Prefeitura_APP/src/context/user/UserProvider.jsx` e `Prefeitura_APP/src/context/user/UserContext.jsx`, removendo seleção `permissions[0]` e expondo `can(module,action)` baseado no resultado de `/permissions/me`. `getServices` continua cuidando da navegação, não vira fonte de permissão por posição de array. Novo `UserProvider.permissions.test.jsx`: carregando/falha/sem usuário negam; logout limpa; resposta antiga de usuário anterior é descartada; troca rápida de usuário não restaura direitos antigos. Usar AbortController ou contador de geração local para impedir respostas fora de ordem. Revalidar após edição de concessões e ao restaurar foco; backend permanece fonte definitiva. Em 403, não restaurar direitos pelo cache antigo.

**H3. Tipos.** Adaptar `Prefeitura_APP/src/types/contracts.ts` para os contratos novos; usar o tipo gerado das respostas no service novo `Prefeitura_APP/src/service/permissionServices.ts`. Funções desse service: getCatalog, getRolePermissions, updateRolePermissions e getMyPermissions com URLs exatas da seção 7; nenhum método de criar/excluir ação.

**H4. Remover cadastro/exclusão de serviços.** Modificar os quatro arquivos existentes `Prefeitura_APP/src/pages/admin/services_user/Services.jsx`, `table/ServicesTable.jsx`, `modal/SaveServiceModal.jsx` e `Prefeitura_APP/src/service/user_serviceServices.js`: remover botão Cadastrar, lixeira, estado/modal de exclusão e função saveService via POST. Manter edição com permissão específica e visibilidade. Substituir a matriz CRUD por role pelo painel de ações por role, usando endpoint específico; não mandar permissions no updateService. Novo `Services.permissions.test.jsx` comprova ausência dos botões e ausência de POST/DELETE nas interações, com edição ainda funcional.

**H5. Concessões por role.** Novo `Prefeitura_APP/src/pages/admin/services_user/RolePermissionsPanel.jsx` e teste `Prefeitura_APP/src/pages/admin/services_user/RolePermissionsPanel.component.test.jsx`, integrados ao modal de serviço existente. Reutilizar GET `/roles` e a lista de roles já carregada pelo painel; respeitar `roles:consultar_role`, sem endpoint de enumeração indevido. Selecionar role, carregar suas ações por catálogo paginado e exibir checkbox allowed, incluindo false para vínculo ausente. Não criar seletor de usuário, exceção individual ou clone automático. Exibir “As alterações afetam todos os usuários desta role”. Somente consultar_permissoes lê, somente gerenciar_permissoes salva; editar a própria role é permitido conforme a autorização existente. Mostrar módulo, ação, role alvo, loading/erro/vazio/salvando; catálogo somente leitura.

**H6. Corridas e falhas.** Um teste por ciclo: troca de role A→B e resposta A tardia; erro de save preserva checkboxes; ausência de role impede salvar; payload tem somente permission_action_id/allowed; body não inclui usuário ou role_id alvo, que vai no path; lote acima de 100 é recusado visivelmente, sem gravação parcial silenciosa. No sucesso, reconsultar concessões da role e revalidar `/permissions/me` e `/service/user` do ator, especialmente se alterou a própria role; perda do direito de edição deve desabilitar controles após salvar, não restaurar cache. Desabilitar troca da role alvo durante salvamento. Não iniciar um request por checkbox.

**H7. Orientar diferenciação.** Nos componentes já existentes `Prefeitura_APP/src/pages/admin/roles/modal/SaveRolesModal.jsx` e `Prefeitura_APP/src/pages/admin/users/modal/SaveUserModal.jsx`, acrescentar ajuda concisa: “Para outro conjunto de permissões, crie/configure outra role e atribua ao usuário”. Nova role não herda ações; mudança de role substitui, não soma direitos. Adaptar testes desses componentes para a informação e para preservar os endpoints atuais; não adicionar multi-select de roles.

### I. Frontend: migrar cada ação de negócio

Para cada linha abaixo: escrever/adaptar teste do componente primeiro; observar RED com can diferente por ação; substituir leitura de flag pelo `can` da seção 6; observar GREEN. Não manter uma conversão genérica das novas ações de volta para quatro flags.

| Arquivo exato | Alteração mínima |
|---|---|
| `Prefeitura_APP/src/components/components-ft/edital/Table/EditalTable.jsx` | separar editar_vinculo e remover_bolsista, hoje dentro do mesmo bloco; Novo Edital, Vincular e Relatório têm guards independentes |
| `Prefeitura_APP/src/components/components-ft/bolsistas/Table/BolsistasTable.jsx` | consultar/editar/excluir/cadastrar separados; histórico, faltas e ocorrências não dependem de uma flag global |
| `Prefeitura_APP/src/components/components-ft/bolsistas/modal/FT_Bolsista_Faltas_Modal.jsx` | consultar_faltas, registrar_falta e excluir_falta independentes |
| `Prefeitura_APP/src/components/components-ft/bolsistas/modal/FT_Bolsista_Ocorrencias_Modal.jsx` | consultar_ocorrencias, registrar_ocorrencia e excluir_ocorrencia independentes |
| `Prefeitura_APP/src/components/components-ft/bolsistas/modal/FT_Bolsista_Prorrogate_Bolsista.jsx` | prorrogar_vinculo |
| `Prefeitura_APP/src/components/components-ft/edital/modal/Relatorio_Edital_Modal.jsx` | guard por operação do relatório, não write global |
| `Prefeitura_APP/src/components/components-ft/pagadores/Pagadores.jsx` | consultar/cadastrar/editar/excluir pagador |
| `Prefeitura_APP/src/components/components-ft/turnos/Turnos.jsx` | consultar/cadastrar/editar/excluir turno |
| `Prefeitura_APP/src/pages/municipes/components/MunicipeTable.jsx` | consultar/cadastrar/editar munícipe |
| `Prefeitura_APP/src/pages/esporte/components/modalidade/Table.jsx` | CRUD de modalidade independente do CRUD de atleta |
| `Prefeitura_APP/src/pages/esporte/components/atleta/Table.jsx` | atleta/carteirinha/vínculo modalidade separados |
| `Prefeitura_APP/src/pages/esporte/components/atleta/ModalAtleta.jsx` | vincular/remover modalidade separados de cadastrar atleta |
| `Prefeitura_APP/src/pages/audit/Audit.jsx` | consultar_auditoria e exportar_auditoria separados |
| `Prefeitura_APP/src/pages/admin/users/table/UserTable.jsx` | ações usuarios independentes |
| `Prefeitura_APP/src/pages/admin/setor/table/SetorTable.jsx` | ações setores independentes |
| `Prefeitura_APP/src/pages/admin/roles/table/RolesTable.jsx` | ações de gestão de roles independentes; criar role não concede ações, que são configuradas no painel específico |
| `Prefeitura_APP/src/pages/Services.jsx` | navegação por module/acessar, atualizar Services.authorization.test.jsx |
| `Prefeitura_APP/src/components/components-ft/downloads/DownloadsRelatorios.jsx` | somente consultar_downloads inicia listagem/polling; baixar_relatorio e reprocessar_relatorio têm botões e handlers independentes; atualizar DownloadsRelatorios.component.test.jsx |
| `Prefeitura_APP/src/pages/FT_APP.jsx` | não montar/consultar abas sem sua ação de consulta; manter índices/abas consistentes sem chamar APIs proibidas na montagem |

**I1. Regressão central obrigatória.** Atualizar `Prefeitura_APP/src/components/components-ft/edital/Table/EditalTable.component.test.jsx` para três cenários: remover=true/excluir=false; editar_vinculo=true/remover=false; consultar apenas. No primeiro, botão de cancelar vínculo disponível e ação de excluir cadastro ausente no componente correspondente. No segundo, editar disponível, cancelar ausente. Não mockar `can` como função que sempre retorna true.

**I2. Inventário final dos consumidores.** Busca read-only por `permissions.read`, `permissions.write`, `permissions.edit`, `permissions.del`, variantes opcionais e destructuring em `Prefeitura_APP/src`; migrar todo consumidor ativo seguindo a operação real. `Prefeitura_APP/src/pages/minhacasa/Table/CadastrosTable.jsx` também contém flags legadas. A inspeção adicional confirmou que `Prefeitura_APP/src/App.jsx` registra a página e que `Prefeitura_APP/src/context/minhacasa/MinhaCasaProvider.jsx` contém dados mockados; `Prefeitura_APP/src/pages/minhacasa/MinhaCasa.jsx` exibe “Em desenvolvimento”. Não criar permissões persistidas nem backend para esse protótipo neste trabalho. Remover a dependência das quatro flags nessa tabela e deixar ações de escrita explicitamente indisponíveis, com aviso de funcionalidade em desenvolvimento; não tratar mocks como fonte oficial nem habilitar o protótipo pelo ID de outro serviço. Adicionar teste que a página não oferece cadastro/edição/exclusão operacional após a remoção das flags. Implantação de Minha Casa é outra tarefa.

Checkpoint sugerido: `feat(ui): use explicit action permissions and manage role grants`.

### J. Contratos gerados e documentação

**J1. OpenAPI backend.** Atualizar schemas citados e executar `(cd sap_prefeitura && npm run openapi:generate)`. Saída esperada: `contracts/sap.openapi.json` na raiz, sem POST/DELETE service ou PUT permission legado, com os endpoints novos e schemas booleanos/limites corretos. Validar JSON e resolução de `$ref`; adicionar teste de contrato no backend que afirma paths/schemas, não só geração sem erro.

**J2. Tipos frontend.** O script `npm run contracts:generate` do frontend exige `contracts/pdf.openapi.json`, inexistente na raiz na inspeção. Gerar primeiro `(cd gerador_de_PDF && npm run openapi:generate)` (não muda contrato funcional do PDF), depois `(cd Prefeitura_APP && npm run contracts:generate)`. Conferir que `src/types/generated/pdf-api.d.ts` não sofreu mudança semântica não relacionada. Se gerador PDF estiver indisponível, não criar JSON falso: usar temporariamente o comando já instalado `openapi-typescript ../contracts/sap.openapi.json -o src/types/generated/sap-api.d.ts` para o SAP, registrar a limitação e não declarar geração completa aprovada.

**J3. Propriedade dos artefatos.** A raiz não tem Git; `contracts/` não pode ser considerado versionado por estar no disco. Versionar o contrato SAP canônico em `sap_prefeitura/contracts/sap.openapi.json` e ajustar `sap_prefeitura/scripts/generate-openapi.ts` para também exportar nesse destino, preservando a saída workspace hoje consumida. Ajustar o script frontend para consumir o contrato SAP canônico `../sap_prefeitura/contracts/sap.openapi.json`; a origem PDF permanece a já suportada. Testar os dois destinos SAP por igualdade. Não iniciar um quarto repositório sem autorização.

**J4. Documentação.** Atualizar `sap_prefeitura/README.md` e `Prefeitura_APP/README.md` somente nas seções de autorização/seeds/admin, com semântica de acesso por role, diferenciação criando outra role, efeito sobre todos os associados, incompatibilidade das quatro flags e procedimento de rollout/rollback. Não aproveitar para reescrever todo README ou Compose.

## 10. Notas de implementação para evitar atalhos errados

- Não instalar CASL, Casbin, Redis, policy server ou outra biblioteca: FK + catálogo + consulta específica resolvem o escopo.
- Não fazer autorização por substring, prefixo, startsWith ou `action.includes('delete')`.
- Não confiar em `tag`, texto de botão, URL do frontend, nome da role ou nome do setor.
- Não aceitar `user_id` do cliente como ator; somente JWT autenticado. O alvo administrativo é distinto do ator.
- Não criar fallback individual: allowed false ou ausente na role nega. Não criar tabela de concessão por usuário ou somar permissões de múltiplas roles.
- Não converter indiscriminadamente todo GET em consulta ou todo DELETE em exclusão de cadastro: relatório/exportação e remoção de relação têm ações próprias.
- Não introduzir auto-grant no startup, cron, evento de role ou seed reexecutável.
- Não alterar regras históricas de cancelamento, exclusão lógica ou relatórios nesta feature.
- Não apagar testes das regras antigas apenas para subir cobertura; substituir expectativas relacionadas ao contrato removido e adicionar regressões equivalentes.
- Não logar token, credenciais, CPF/email ou dados de usuários; diagnósticos de migração usam tabela + contagem + IDs técnicos quando indispensável.

## 11. Validação verificável

### 11.1 Backend completo

Em `sap_prefeitura`:

```bash
npm run check
npm test
npm run test:coverage
npm run build
npm run openapi:generate
```

Esperado: todos exit code 0; nenhuma redução dos thresholds atuais. Mínimos: lines 90%, statements 90%, functions 94%, branches 90%; meta branches >=90,5%. Registrar os quatro valores **obtidos**, não os limites. Não há script lint no manifest atual; registrar `check` como typecheck, não dizer que ESLint passou.

### 11.2 Frontend completo

Em `Prefeitura_APP`:

```bash
npm run typecheck
npm run lint
npm test
npm run test:coverage
npm run contracts:generate
npm run build
npm run bundle:check
```

Esperado: todos exit code 0; sem alterar thresholds para baixo. O `vite.config.js` atual inclui somente cinco fontes na cobertura e limites baixos. Acrescentar explicitamente `src/context/user/permission-access.ts`, `src/service/permissionServices.ts` e os novos componentes administrativos à lista de cobertura, sem remover arquivos existentes. Relatar cobertura total e dos módulos de autorização; não apresentar a porcentagem parcial atual como cobertura de todo o frontend.

Criar `Prefeitura_APP/e2e/permissions.spec.js` e executar `npm run e2e -- e2e/permissions.spec.js` com ambiente integrado descartável e usuários sintéticos. Cenários: gestor concede somente cancelamento à role alvo; dois usuários dessa role cancelam vínculo mas não excluem cadastro; usuário de outra role não recebe o direito; troca de role substitui ações sem novo login; edição sem cancelamento; sem permissão a API nega mesmo com requisição direta; revogação aparece após refresh sem novo login; UI não tem criar/excluir serviço. Usar banco real de teste nos cenários integrados, não somente rotas interceptadas.

### 11.3 MariaDB real — bloqueador de conclusão

Criar `sap_prefeitura/scripts/test-action-permissions-mariadb.ts` como harness específico da feature, com recusa explícita a qualquer DATABASE_URL cujo nome de banco não termine em `_permissions_test`; a configuração deve usar credencial restrita ao banco descartável. O script não imprime URL nem senha. Adicionar `test:permissions:db` no package.json como `tsx scripts/test-action-permissions-mariadb.ts`; testar a recusa com URL não permitida sem abrir conexão.

Execução futura, somente com banco descartável autorizado e variável definida fora do histórico do shell:

```bash
(cd sap_prefeitura && npm run test:permissions:db)
```

O harness usa o runner de migrations no dist conforme `.sequelizerc`, sem modificar banco configurado no `.env` do projeto por acidente. Rodar `npm run build` antes. Cada cenário usa um schema descartável separado ou recriação somente dentro desse banco com nome validado. Resultado esperado: exit code 0 e resumo nominal de cada cenário:

1. instalação limpa: todas as migrations + seeds em ordem, bootstrap com gestor efetivo;
2. atualização: estado anterior populado sintético, migrations novas e concessões iguais à matriz;
3. reexecução: mesmos registros/contagens e false administrado preservado;
4. parcial: falha após primeiro DDL e retomada completa;
5. FKs: ação com módulo divergente é rejeitada; concessão órfã e duplicada rejeitadas;
6. concorrência: dois upserts do mesmo par não duplicam; alterações administrativas simultâneas à mesma role respeitam atomicidade e locks;
7. rollback sem uso: down/up preservam estado legado;
8. rollback após divergência das ações da role: down recusado sem perda de linhas;
9. exclusão lógica: usuário/serviço excluído não autoriza; role inexistente também nega;
10. visibilidade e role alteradas com claims antigos: efeito baseado no banco atual; alteração de concessão afeta todos os usuários da role.

Se não houver MariaDB de teste acessível, registrar o bloqueio e não considerar migrations/conclusão aprovadas. Não apontar comandos migrate/undo para a base real para “testar”.

### 11.4 PDF

Sem mudança de autorização dentro de `gerador_de_PDF`; proteção funcional acontece na API principal. Como o gerador será exercitado para os contratos, executar em ambiente preparado:

```bash
npm test
npm run test:coverage
npm run openapi:generate
npm run build
```

Esperado: exit code 0 e contrato gerado válido. Se não houver alteração de código/contrato PDF, não criar versão/commit PDF só para registrar que os comandos rodaram.

### 11.5 Diff/Git

Em cada repo alterado, antes de qualquer commit eventualmente autorizado:

```bash
git diff
git diff --check
git status --short --branch
```

Esperado: diff sem whitespace inválido; sem `.env`, dados reais, node_modules, dist ou coverage; `Prefeitura_APP/docker-compose.yml` mantém exatamente a mudança preexistente e fica fora do staging da feature. Stage por caminhos explícitos, nunca `git add .` neste workspace.

## 12. Rollout e versionamento

- A mudança remove endpoints e troca contratos públicos de permissões; tratar como **breaking change** se o contrato `/api/v2` tiver consumidores externos. Não bump de patch por conveniência.
- Recomendação para release futura: major backend `3.0.0` e frontend `5.0.0`, após inspeção das tags reais e aprovação de publicação; PDF permanece `1.1.0` se sem mudança funcional. Esses números são proposta, não instrução para editar manifests agora. Confirmar se outros consumidores usam `/api/v2`; se sim, aprovar migração de versão de rota antes de retirar contratos. Não implantar uma quebra sem inventário.
- Release interna coordenada: janela de manutenção, backup validado, parar escritas administrativas/usuários durante snapshot, aplicar migrations/seeds necessárias, validar contagens e gestor efetivo, subir backend e frontend compatíveis juntos, smoke tests, liberar tráfego.
- Não criar modo fallback para HTTP ou dupla escrita legado/novo. Isso reabre precisamente a falha que a feature corrige.
- Após publicação autorizada: conferir SHA da branch remota, tag local/remota imutável e head SHA do PR. PR deve listar breaking contracts, migrations, snapshot legado, bootstrap, cobertura final e limitações. Sem permissão GitHub, registrar erro real e entregar descrição pronta; não afirmar PR criado.

## 13. Critérios de aceite

- [ ] Uma role pode ter `ft:remover_bolsista=true` e `ft:excluir_bolsista=false`, com comportamento correto na API e UI para todos os usuários associados.
- [ ] Diferenciação exige outra role; não existem concessões/exceções individuais nem múltiplas roles por usuário.
- [ ] Role nova começa negada; usuário novo herda sua role atual; alteração de concessão afeta todos os associados; troca de role substitui os direitos na próxima requisição com o mesmo JWT.
- [ ] Editar vínculo, cancelar vínculo, prorrogar, faltas e ocorrências são direitos separados.
- [ ] Nenhuma rota de negócio usa método HTTP como direito ou tem bypass alternativo só por JWT.
- [ ] Mesmo módulo/ação textual aponta sempre ao módulo persistido correto; renomear nome de apresentação não afeta acesso.
- [ ] False e ausência negam; nenhuma role/admin implícito ignora essa regra.
- [ ] Visibilidade por setor e usuário/serviço ativo continuam exigidos com estado persistido atual.
- [ ] Catálogo é gerenciado somente por migrations/seeds; concessões por API administrativa específica.
- [ ] POST/DELETE service não existem; UI não cadastra/exclui serviço; update service não altera permissões por fora.
- [ ] Gestão de concessões exige ação específica, grava role/ação atomicamente e audita ator e role alvo; políticas de autoalteração/último gestor não são implementadas sem aprovação separada.
- [ ] Migração preserva dados e direitos anteriores conforme matriz; discrepâncias são diagnosticadas e não normalizadas silenciosamente.
- [ ] Seed reexecutável não ressuscita concessões revogadas nem concede ações automaticamente a roles novas. Usuários herdam a role sem materialização de concessões próprias.
- [ ] MariaDB real aprova instalação limpa, atualização, parcial, reexecução, concorrência e rollback seguro.
- [ ] Contratos SAP gerados estão versionados no repo correto; frontend usa tipos regenerados.
- [ ] Testes, check/typecheck, lint disponível, cobertura e builds aprovados com métricas registradas.
- [ ] Worktree do usuário preservado; nenhum push/tag/PR/deploy sem autorização.

## 14. Riscos, trade-offs e propostas fora do escopo aprovado

1. **Quantidade de roles:** distinção de responsabilidade exige outra role. Preferir nomes por responsabilidade, não uma role por pessoa sem necessidade. Exceções por usuário e múltiplas roles ficam fora deste desenho.
2. **Efeito coletivo:** alterar ação de uma role afeta todos os seus usuários; UI informa esse impacto. Criar outra role se a intenção não for mudar o grupo inteiro.
3. **Legado amplo:** backfill conserva as flags existentes em ações específicas; não decide automaticamente quem deve perder direitos. Fazer revisão administrativa das roles depois, sem limpeza automática.
4. **Escrita sem leitura:** novo gate acessar pode restringir acessos diretos legados. Diagnóstico bloqueia cutover até aprovação, não normaliza dados silenciosamente.
5. **Rollback de ações granulares:** mesmo com o titular continuando role, conjuntos novos podem não caber nas quatro flags antigas. Abortar down antes de perder configuração; preferir forward-fix após uso real.
6. **Gestores são privilegiados:** gerenciar_permissoes permite configurar ações das roles, inclusive sua própria. Impedir edição da própria role, proteger último gestor, delegação limitada e recuperação automática são **propostas adicionais não aprovadas**, não requisitos implícitos. Se desejadas, aprovar plano separado antes de expandir fluxos de usuários/setores/concurrency.
7. **Atribuição de roles:** quem pode atribuir uma role privilegiada pode elevar direitos. O endpoint atual de edição de usuário continua sob usuarios:editar_usuario e as regras existentes; revisar segregação de atribuição de role e gerenciamento de concessões como decisão de segurança separada. Não afirmar que o risco foi corrigido por esta feature nem introduzir restrição nova sem aprovação.
8. **DDL MariaDB não transacional:** retomada por objeto e testes reais obrigatórios.
9. **UI não é segurança:** botão pode levar até revalidação para sumir, mas a próxima requisição consulta role/setor/concessões atuais no backend e nega após revogação.
10. **Contratos externos ainda não inventariados:** sem confirmação, não aprovar deploy breaking em /api/v2. Node/versões e contexto remoto da inspeção original precisam ser revalidados antes da implementação.
11. **Issues/PRs não consultados e refs sem fetch:** pendência de contexto remoto, não resultado confirmado. A revisão deste Markdown não executa consultas mutantes no GitHub.
12. **Protótipos:** Minha Casa está no App mas usa mocks; não promovê-lo a novo domínio persistido nesta feature. Contrato/rota adicional encontrado durante implementação exige atualização do plano antes de alterar esse domínio.

## 15. Entrega esperada da implementação futura

Relatar separadamente: implementado localmente, testado, commitado, publicado e implantado. Informar módulos/arquivos principais, comandos e exit codes reais, cobertura de lines/statements/functions/branches, resultado dos cenários MariaDB/E2E, branches e SHAs efetivos, versões/tags apenas se criadas com autorização, URL/head SHA de PR se existir e todas as limitações restantes. Não chamar a tarefa de concluída com critérios obrigatórios pendentes.
