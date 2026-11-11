# Instalação em banco novo

Esta versão substitui a sequência histórica por uma linha base exclusiva para banco vazio. Não é um upgrade de bancos com as migrations antigas. A primeira migration recusa tabelas existentes ou histórico preenchido, antes de criar estruturas. Crie outro banco e configure `DATABASE_URL`; não apague a `SequelizeMeta` da base antiga para tentar executar esta sequência.

## Migrations

São sete migrations, em ordem de dependência:

| Arquivo | Estruturas |
| --- | --- |
| `20261106090000-create-core-schema` | Perfis, setores, serviços, usuários, sessões, visibilidades, ações e concessões. |
| `20261106091000-create-municipes-schema` | Munícipes e carteirinhas gerais. |
| `20261106092000-create-esporte-schema` | Atletas, modalidades, vínculos e carteirinhas de Esporte. |
| `20261106093000-create-peaad-schema` | Editais, pessoas do programa, configurações, inscrições, participações, pagamento bancário, faltas, ocorrências, eventos e arquivos. |
| `20261106094000-create-payroll-schema` | Fechamentos mensais e seus snapshots imutáveis. |
| `20261106095000-create-stock-schema` | Itens, tamanhos, saldos, movimentações e entregas. |
| `20261106100000-create-audit-schema` | Auditoria e outbox. |

As 38 tabelas já nascem no formato final, sem conversão de CPF, transferência de pagadores, renomeação de programa ou tabelas auxiliares de migração. As permissões são exclusivamente `permission_actions` e `role_permissions`; a tabela CRUD antiga e o estado de backfill não são criados. A idade máxima do edital é obrigatória no banco, sem valor automático. O par setor/serviço das visibilidades é único.

Os tipos financeiros, campos criptografados, UUIDs e collations binárias, FKs, índices de ocupação/histórico, kit único e competência única foram preservados. O rollback recusa tabelas com registros para não apagar dados de operação. Em schema vazio, a sequência pode ser desfeita em ordem inversa.

## Seeds

1. `20261106100000-system-catalogs`: setor de tecnologia, quatro perfis, nove serviços ativos e controle técnico do estoque com versão zero.
2. `20261106101000-permission-actions`: catálogo atual de ações, sem conceder acesso a perfis existentes.
3. `20261106102000-bootstrap-admin`: primeiro administrador, com senha hash e troca obrigatória no primeiro login. Apenas a primeira criação concede as ações iniciais ao perfil 1.

Os serviços ativos preservam os IDs **1, 2, 3, 4, 6, 7, 9, 10 e 11**, suas URLs e seus módulos. Demandas TI e Chamados não são inseridos. Nenhuma seed cria munícipes, editais, bolsistas, pagadores, turnos, folhas ou materiais de exemplo.

Os perfis técnico, gestor e usuário começam sem concessões. O administrador inicial possui o catálogo completo, inclusive estoque, exceções e fechamento, por concessões persistidas — não por bypass de autenticação. Depois da instalação, configure cada perfil pelos checkboxes da administração.

Reexecutar as seeds não duplica registros, troca senhas, altera nomes configurados, zera saldo/versão, reativa visibilidades, restaura revogações ou libera ações futuras. Ações novas passam a constar no catálogo e exigem concessão explícita. Os `down` das seeds recusam excluir contas, catálogos e direitos já configurados.

## Execução nativa

Use Node 22, um banco MariaDB vazio e `.env` baseado no exemplo atualizado. `BOOTSTRAP_ADMIN_EMAIL` e `BOOTSTRAP_ADMIN_PASSWORD` são obrigatórios na primeira criação em qualquer ambiente; não existe mais o login automático `admin/admin`.

```sh
npm ci
npm run migrate
npm run seed
npm start
```

`npm run migrate` e `npm run seed` recompilam o projeto antes de chamar o CLI. Não edite `dist` manualmente.

## Container

A imagem deve ser reconstruída com os fontes novos. O comando de inicialização mantém a aplicação de migrations antes do servidor. Para executar as seeds já compiladas, use o diretório `/app` e o CLI instalado na imagem:

```sh
cd /app
npx --no-install sequelize-cli db:seed:all
```

Pelo Compose integrado, o equivalente é `docker compose exec -w /app sap npx --no-install sequelize-cli db:seed:all`. O runtime não inclui as dependências de desenvolvimento necessárias para recompilar com `npm run seed`.

Um volume MariaDB já inicializado continua contendo o banco anterior. Mudar somente `MARIADB_DATABASE` não cria outra instalação nesse volume. Provisione explicitamente um banco vazio ou um projeto/volume Docker separado; esta implementação não remove volumes nem bancos existentes.

## Testes e CI

- `npm run check:architecture`, `npm run check`, `npm run test:coverage`, `npm run build`.
- `npm run test:permissions:safety` verifica que alvos indevidos são recusados antes de conectar.
- `test:permissions:db` exige URL explícita de um schema vazio, local, com usuário não root e sufixo `_permissions_test`, além de `PERMISSIONS_TEST_RESET=YES`. O nome desse opt-in foi preservado por compatibilidade; o novo harness **não reseta** schemas existentes. Ele executa o CLI real e testa instalação, reexecução, FKs, unicidade, preservação de senhas/revogações e rollback.
- `test:permissions:runtime` usa a mesma base descartável preparada para testar autorização e transações reais.
- `test:ft:db` mantém a verificação de inscrições, exceções, concorrência de vagas/saldos, ativações, prorrogações, fechamento imutável, relatórios e entregas, sobre a nova sequência.

O workflow Quality inclui `fresh-database-bootstrap` com MariaDB 10.11 isolado para executar instalação e seeds pelo CLI, além dos testes usuais. Nenhum desses testes aponta para a base corrente da aplicação.
