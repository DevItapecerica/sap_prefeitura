# SAP Prefeitura

Ecossistema web formado pela API principal, pelo frontend React e pelo serviço de geração de PDFs. O ambiente integrado usa MariaDB e pode ser iniciado pela raiz com Docker Compose.

## Componentes

| Componente | Tecnologia | Porta no desenvolvimento | Saúde |
| --- | --- | ---: | --- |
| `front_prefeitura` | React 18, Vite e Nginx | 3001 | `/` |
| `sap_prefeitura` | Node.js 22, TypeScript, Fastify e Sequelize | 3000 | `/health`, `/ready` |
| `api_PDF` | Node.js 22, TypeScript e Fastify | 3002 | `/health`, `/ready` |
| `db` | MariaDB 10.11 | somente rede interna | healthcheck nativo |

O Nginx do frontend encaminha `/api/*` para `/api/v2/*` na API principal. A API principal acessa a API PDF internamente por `http://api_pdf:3002/api/v1`. O projeto `setores_api` não faz parte do ecossistema mantido.

## Pré-requisitos

- Docker com Compose v2 para executar o ecossistema completo; ou
- Node.js 22 LTS, npm 10 ou superior e MariaDB 10.11 para execução nativa.

Use `npm ci` em todos os projetos. Os arquivos `.nvmrc` e `.node-version` na raiz fixam a versão principal do Node.js.

## Início rápido com Docker

1. Copie `.env.example` para `.env` e substitua todos os valores `change-*`.
2. Inicie o ambiente:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build --wait
```

3. Acesse o frontend em `http://localhost:3001`.

O override de desenvolvimento publica as APIs em `http://localhost:3000` e `http://localhost:3002`. O banco não é publicado no host. Em uma execução sem o override, somente o frontend é exposto:

```bash
docker compose -f docker-compose.yml up --build --wait
```

Para encerrar sem apagar dados:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml down
```

O volume `sap-prefeitura_db_data` é persistente. Não use `down --volumes` em ambientes com dados que devam ser preservados.

## Variáveis de ambiente

O arquivo `.env.example` da raiz contém as variáveis consumidas pelo Compose. Cada aplicação também mantém seu próprio exemplo:

- `sap_prefeitura/.env.example`: banco, JWT, bootstrap administrativo, SMTP, CORS, proxy confiável e API PDF;
- `api_PDF/.env.example`: chave do serviço, SMTP, CORS e porta;
- `front_prefeitura/.env.example`: modo do frontend e base URL da API.

Nunca versione `.env` ou credenciais reais. Em produção, use segredos longos e aleatórios, origens CORS explícitas e proxies confiáveis restritos.

## Execução nativa

Instale as dependências em cada projeto:

```bash
cd sap_prefeitura && npm ci
cd ../api_PDF && npm ci
cd ../front_prefeitura && npm ci
```

Crie um `.env` a partir do exemplo de cada diretório. Com MariaDB disponível e as URLs apontando para `localhost`, execute em terminais separados:

```bash
cd sap_prefeitura
npm run dev
```

```bash
cd api_PDF
npm run dev
```

```bash
cd front_prefeitura
npm run dev
```

O servidor Vite informa sua porta ao iniciar; por padrão, costuma usar `5173`.

## Banco, migrations e seeds

O container da API executa migrations pendentes antes de iniciar. Na execução nativa, use os comandos abaixo em `sap_prefeitura`:

```bash
npm run migrate
npm run seed
```

Reversões disponíveis:

```bash
npm run migrate:undo
npm run seed:undo
```

Toda alteração de banco deve possuir migration reversível e teste correspondente. Não apague volumes ou migrations para contornar falhas.

## Relatórios de espelho de ponto em lote

A Frente de Trabalho pode solicitar a geração assíncrona dos espelhos de ponto de todos os bolsistas vinculados a um edital no mês informado. A API principal consulta os dados, solicita cada PDF à `api_PDF`, cria um ZIP e o disponibiliza na aba **Downloads** do frontend.

### Fila e worker

A fila não usa BullMQ ou Redis. A tabela `ft_relatorio_arquivos` no MariaDB é a fonte persistente de verdade. Um evento em memória apenas desperta o worker imediatamente; o polling a cada cinco segundos garante que pedidos sejam encontrados mesmo após reinicialização ou perda do evento.

O ciclo de estados é:

```text
aguardando -> processando -> concluido -> excluido
                         \-> erro -> aguardando (nova tentativa)
```

- Apenas um lote é processado por instância, com até quatro chamadas simultâneas à API PDF.
- A captura do lote e a reserva do download são atômicas.
- Lotes presos em `processando` por mais de 30 minutos voltam para `aguardando`.
- Se parte dos PDFs falhar, o ZIP é concluído com os arquivos gerados e um `falhas.csv`.
- Se nenhum PDF for gerado, o lote termina como `erro` e pode ser reenviado.
- O ZIP é removido depois do primeiro download concluído ou após sete dias sem download; o registro permanece como `excluido` para histórico.

`runtimeWorkers` é uma opção interna do registro da aplicação. Workers e schedulers iniciam por padrão; passar `runtimeWorkers: false` impede a criação de timers e tarefas em segundo plano, principalmente em testes. Essa opção não é uma variável de ambiente nem desativa as rotas HTTP.

### Armazenamento

`FT_REPORT_ARCHIVE_DIR` define o diretório privado dos ZIPs. Em produção a variável é obrigatória. O Compose usa `/var/lib/sap/ft-reports`, montado no volume persistente `ft_report_data`. O caminho físico nunca é retornado pela API.

Na execução nativa em desenvolvimento, a ausência da variável usa `sap_prefeitura/storage/ft-reports`. O diretório deve ser gravável pelo usuário da aplicação. Com múltiplas instâncias, todas precisam compartilhar o mesmo volume; armazenamento local isolado não permite que outra instância entregue o arquivo.

### Rotas protegidas

| Método e rota | Finalidade |
| --- | --- |
| `POST /api/v2/frente-de-trabalho/relatorio/edital/:id/espelhos-ponto` | Cria o lote mensal e retorna `202`. |
| `GET /api/v2/frente-de-trabalho/relatorio/downloads` | Lista lotes ainda não excluídos. |
| `GET /api/v2/frente-de-trabalho/relatorio/downloads/:id` | Baixa uma vez o ZIP concluído. |
| `POST /api/v2/frente-de-trabalho/relatorio/downloads/:id/retry` | Recoloca um lote com erro em `aguardando`. |

Todas as rotas exigem JWT e autorização no serviço Frente de Trabalho. A listagem é compartilhada entre todos os usuários autorizados nesse serviço.

### Recuperação e limitação atual

A tabela principal registra o progresso agregado (`total_bolsistas`, `total_gerados` e `total_falhas`), mas não mantém checkpoint individual por bolsista. Se a aplicação cair durante a geração, o lote é recuperado e recomeça desde o primeiro bolsista; PDFs produzidos antes da queda podem ser solicitados novamente. O processamento continua idempotente no resultado final porque o ZIP temporário só é promovido depois de concluído.

Para retomar exatamente do ponto da queda e identificar o bolsista em processamento, será necessário introduzir uma tabela filha de itens do lote, com um estado e um PDF temporário por bolsista. Essa retomada granular não faz parte da implementação atual.

## Verificações locais

API principal:

```bash
cd sap_prefeitura
npm run check
npm test
npm run build
```

API PDF:

```bash
cd api_PDF
npm test
npm run build
```

Frontend:

```bash
cd front_prefeitura
npm run lint
npm run build
```

O workflow `.github/workflows/quality.yml` executa esses grupos em jobs independentes para push e pull request.

## Autenticação e segurança

- O access token é aceito exclusivamente em `Authorization: Bearer <token>`.
- O refresh token permanece em cookie HttpOnly.
- Tokens em query string são rejeitados.
- Rate limits específicos protegem autenticação e rotas públicas.
- Swagger e recursos de desenvolvimento não ficam disponíveis em produção.

Consulte `sap_prefeitura/SECURITY_AUDIT.md` para a auditoria atualizada.

## Diagnóstico

Confira o estado dos serviços e seus logs:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml ps
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs sap api_pdf app db
```

Valide prontidão diretamente no desenvolvimento:

```bash
curl http://localhost:3000/ready
curl http://localhost:3002/ready
```

- Se `db` não ficar saudável, revise as quatro variáveis `DATABASE_*` e os logs do MariaDB.
- Se `/health` responder e `/ready` falhar, alguma dependência essencial está indisponível.
- Se o frontend não alcançar a API, confirme que o serviço Compose se chama `sap` e que o proxy recebe requisições sob `/api/`.
- Se a API principal não iniciar, confirme migrations, `DATABASE_URL`, `SECRET_KEY` e as credenciais de bootstrap.

## Documentação do trabalho

- `codex/kamban.md`: quadro técnico, dependências, critérios e resultados das melhorias.
- `sap_prefeitura/SECURITY_AUDIT.md`: controles e riscos de segurança.
- READMEs dentro de cada aplicação: detalhes específicos de seus módulos.
