# SAP Prefeitura — API principal

API modular em Node.js 22, TypeScript, Fastify 5 e Sequelize/MariaDB. Registra autenticação, usuários, setores, roles, serviços, permissões, munícipes, Esporte, PEEAD - PROGRAMA EMERGENCIAL E ASSISTENCIAL DE AUXÍLIO DESEMPREGO e auditoria. A visão do ecossistema está no [README principal](../README.md).

## PEEAD centrado no edital

O fluxo de FT passa a ser **inscrição → convocação com reserva → ativação manual com pagamento**. Editais concentram suas configurações e listas de participantes. Esta versão exige instalação em base FT vazia e não converte os editais anteriores. A migration recusa bases FT populadas; nenhuma rotina apaga o banco automaticamente.

Consulte [docs/ft-edital-workflow.md](docs/ft-edital-workflow.md) para campos, permissões, contratos, restrições de alteração, implantação e integração real com banco descartável. O plano do backend fica em [codex/plans/ft-centrada-no-edital.md](codex/plans/ft-centrada-no-edital.md).

Os comandos de Compose e os caminhos de componentes nas seções abaixo são relativos à raiz do workspace (`sap`), um nível acima deste diretório.

## Permissões por módulo/ação

A evolução para concessões por role, os contratos administrativos e o procedimento de migração/validação estão em [docs/permissions.md](docs/permissions.md). Diferenciação de acesso é feita criando/configurando outra role; não há exceções individuais.

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

Os volumes `sap-prefeitura_db_data` (banco) e `sap-prefeitura_ft_report_data` (ZIPs de relatórios) são persistentes. Não use `down --volumes` em ambientes com dados que devam ser preservados.

## Variáveis de ambiente

O arquivo `.env.example` da raiz contém as variáveis consumidas pelo Compose. Cada aplicação também mantém seu próprio exemplo:

- `sap_prefeitura/.env.example`: banco, JWT, bootstrap administrativo, SMTP, CORS, proxy confiável e API PDF;
- `api_PDF/.env.example`: chave do serviço, SMTP, CORS e porta;
- `front_prefeitura/.env.example`: modo do frontend e base URL da API.

Nunca versione `.env` ou credenciais reais. Em produção, use segredos longos e aleatórios, origens CORS explícitas e proxies confiáveis restritos.

## Execução nativa

Instale as dependências em cada projeto:

```powershell
cd sap_prefeitura
npm ci
cd ../api_PDF
npm ci
cd ../front_prefeitura
npm ci
cd ..
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

O Vite usa a porta fixa `5173`; o proxy encaminha `/api/*` para `http://localhost:3000/api/v2/*`.

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

Em bases existentes, aplique somente os seeds necessários à atualização. A migração de permissões pode recusar rollback que perderia concessões granulares; consulte [docs/permissions.md](docs/permissions.md) antes de reverter.

## Modelo do PEEAD

- Bolsistas referenciam `municipes` por `municipe_uuid`; dados pessoais vêm do munícipe e dados bancários ficam em `payment_info`.
- Vínculos com edital concentram datas, estado, local de trabalho, pagador e turno. O turno possui snapshot para preservar nome e horários históricos.
- Inscrição exige nascimento cadastrado, idade de 18 anos até o limite inclusivo informado no edital e as declarações de elegibilidade. Banco é exigido somente na ativação. Convocação reserva vaga, pagador, local, turno e início.
- Retorno ao mesmo edital depende do parâmetro e respeita o mês seguinte ao encerramento. Participação anterior em outros editais tem parâmetro próprio; nunca se permite convocação/atividade simultânea.
- Ocorrências pertencem ao vínculo histórico. Faltas são informativas por padrão (`DESCONTAR_FALTA = false`); relatórios consideram as janelas dos vínculos no período solicitado.

Consulte os planos de [migração para munícipes](../codex/plans/37-migracao-para-municipes.md), [cadastro parte II](../codex/plans/39-cadastro-parte-ii.md) e [pagadores](../codex/plans/pagadores-crud-e-vinculo.md).

## Relatórios em lote

O PEEAD pode solicitar a geração assíncrona de espelhos de ponto ou folhas de presença dos bolsistas vinculados a um edital no mês informado. A API principal consulta os dados, solicita cada PDF à `api_PDF`, cria um ZIP e o disponibiliza na aba **Downloads** do frontend. O campo `tipo` distingue `espelhos_ponto` e `folhas_presenca`.

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
- O ZIP é removido depois do primeiro download concluído. Lotes concluídos há mais de sete dias são removidos na limpeza periódica, executada a cada 24 horas; o registro permanece como `excluido` para histórico.

`runtimeWorkers` é uma opção interna do registro da aplicação. Workers e schedulers iniciam por padrão; passar `runtimeWorkers: false` impede a criação de timers e tarefas em segundo plano, principalmente em testes. Essa opção não é uma variável de ambiente nem desativa as rotas HTTP.

### Armazenamento

`FT_REPORT_ARCHIVE_DIR` define o diretório privado dos ZIPs. Em produção a variável é obrigatória e deve ser acrescentada ao ambiente caso não esteja no exemplo copiado. O Compose já define `/var/lib/sap/ft-reports`, montado no volume persistente `ft_report_data`. O caminho físico nunca é retornado pela API.

Na execução nativa em desenvolvimento, a ausência da variável usa `sap_prefeitura/storage/ft-reports`. O diretório deve ser gravável pelo usuário da aplicação. Com múltiplas instâncias, todas precisam compartilhar o mesmo volume; armazenamento local isolado não permite que outra instância entregue o arquivo.

### Rotas protegidas

Prefixo de todas as rotas abaixo: `/api/v2/frente-de-trabalho/relatorio`.

| Método e rota | Finalidade | Ação no módulo `ft` |
| --- | --- | --- |
| `POST /edital/:id/espelhos-ponto` | Cria o lote de espelhos e retorna `202`. | `solicitar_espelhos_ponto` |
| `POST /edital/:id/folhas-presenca` | Cria o lote de folhas e retorna `202`. | `solicitar_folhas_presenca` |
| `GET /downloads` | Lista lotes ainda não excluídos, com `page` e `limit`. | `consultar_downloads` |
| `GET /downloads/:id` | Baixa uma vez o ZIP concluído. | `baixar_relatorio` |
| `POST /downloads/:id/retry` | Recoloca um lote com erro em `aguardando`. | `reprocessar_relatorio` |

As solicitações de lote recebem `{ "mes": "2026-10" }` e respondem com `{ "arquivo": ... }`. Todas as rotas exigem JWT, `ft:acessar`, visibilidade do serviço para o setor e a ação específica. A listagem é compartilhada entre usuários com `ft:consultar_downloads`, sem filtro por solicitante.

### Recuperação e limitação atual

A tabela principal registra o progresso agregado (`total_bolsistas`, `total_gerados` e `total_falhas`), mas não mantém checkpoint individual por bolsista. Se a aplicação cair durante a geração, o lote é recuperado e recomeça desde o primeiro bolsista; PDFs produzidos antes da queda podem ser solicitados novamente. O processamento continua idempotente no resultado final porque o ZIP temporário só é promovido depois de concluído.

Para retomar exatamente do ponto da queda e identificar o bolsista em processamento, será necessário introduzir uma tabela filha de itens do lote, com um estado e um PDF temporário por bolsista. Essa retomada granular não faz parte da implementação atual.

## Verificações locais

API principal:

```bash
cd sap_prefeitura
npm run check
npm test
npm run test:coverage
npm run build
npm run openapi:generate
```

API PDF:

```bash
cd api_PDF
npm test
npm run test:coverage
npm run build
```

Frontend:

```bash
cd front_prefeitura
npm run typecheck
npm run lint
npm test
npm run test:coverage
npm run build
npm run bundle:check
```

Execute cada grupo a partir da raiz do workspace, em terminais separados. O workflow `.github/workflows/quality.yml` não está presente nesta cópia; valide localmente sem presumir execução em CI.

O contrato SAP canônico é `sap_prefeitura/contracts/sap.openapi.json`, relativo à raiz do workspace. Depois de atualizar os contratos das APIs, execute `npm run contracts:generate` no frontend. Os harnesses de banco e runtime de permissões exigem banco descartável e opt-in explícito; a preparação está em [docs/permissions.md](docs/permissions.md).

## Autenticação e segurança

- O access token é aceito exclusivamente em `Authorization: Bearer <token>`.
- O refresh token permanece em cookie HttpOnly.
- Tokens em query string são rejeitados.
- Rate limits específicos protegem autenticação e rotas públicas.
- Swagger e recursos de desenvolvimento não ficam disponíveis em produção.

Consulte a [auditoria de segurança](SECURITY_AUDIT.md) e o [guia de permissões](docs/permissions.md). `/metrics` exige `Authorization: Bearer <METRICS_TOKEN>` e retorna `503` sem configuração ou `401` para token ausente/incorreto. As APIs propagam `X-Request-Id`; use o identificador para correlacionar falhas. A coleta Prometheus/Grafana está descrita no [guia de monitoramento](../monitoring/README.md).

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
- Na API principal, se `/health` responder e `/ready` falhar, verifique as dependências. Na API PDF, `/ready` atualmente retorna estado estático.
- Se o frontend não alcançar a API, confirme que o serviço Compose se chama `sap` e que o proxy recebe requisições sob `/api/`.
- Se a API principal não iniciar, confirme migrations, `DATABASE_URL`, `SECRET_KEY` e as credenciais de bootstrap.

## Documentação do trabalho

- [Planos técnicos](../codex/plans/): escopos e critérios das mudanças.
- [Quadro de protocolo](../codex/protocolo/kamban.md) e [runbook operacional](../codex/protocolo/runbook.md).
- [Auditoria de segurança](SECURITY_AUDIT.md) e [permissões](docs/permissions.md).
- [Frontend](../front_prefeitura/README.md) e [API PDF](../api_PDF/README.md).


## Extensão: idade máxima por edital e exceções — 2026-10-22

- [x] `idade_maxima` inteira, obrigatória na criação, sem valor padrão e inclusiva. Idade mínima mantida em 18 anos; nascimento vem do munícipe. Referência: data da inscrição e início da convocação/ativação.
- [x] Editais existentes preservados com limite nulo, bloqueando novas inscrições, convocações e ativações até o preenchimento explícito. O primeiro preenchimento é permitido mesmo após convocação; alterações posteriores ficam bloqueadas após a primeira convocação.
- [x] Rotas `POST /:id/inscricoes/excecao` e `POST /:id/inscricoes/:inscricaoId/convocar-excecao`, com permissões independentes `cadastrar_inscricao_excecao` e `convocar_inscrito_excecao`. Justificativa obrigatória de 3–1000 caracteres.
- [x] Autor, data e justificativa persistidos por etapa e em evento transacional. Só a convocação excepcional autoriza sua ativação posterior quanto ao máximo etário e histórico/retorno. O cadastro excepcional não autoriza convocação comum.
- [x] Exceção libera máximo etário, histórico em outros editais e retorno ao mesmo edital, inclusive no mesmo mês. Inscrição excepcional admite somente após o prazo final; nunca antes da abertura.
- [x] Mantidos: edital aberto/vigente, declarações, residência, idade mínima, inscrição única por pessoa/edital, bloqueio de convocação/atividade simultânea, vagas/capacidade e banco na ativação. Encaixe continua liberando apenas o prazo final.
- [x] Migração incremental `20261022130000-ft-idade-excecoes` e seed idempotente `20261022131000-ft-exception-permissions`, sem concessões automáticas. Rollback recusa perder limites ou autorizações existentes.
- [x] Interface PrimeReact com limite editável, erro vermelho e Confirmar desabilitado para idade/nascimento inválidos, seleção preservada ao buscar/paginar e botões de exceção por permissão. Limite já configurado fica desabilitado após convocação.
- [x] Removidas as constantes globais de idade, duplicidade e retorno; consumidores usam a política do edital. `DESCONTAR_FALTA = false` permanece global.
- [x] OpenAPI/tipos gerados e READMEs atualizados. Testes unitários, autorização HTTP, seed e integração SQL cobrem as regras; Chromium cobre desktop/mobile e o fluxo real de inscrição, exceção, convocação e ativação bancária.

Validação SQL e HTTP feita em instância MariaDB 11.8.2 isolada, loopback:33318, schemas descartáveis com sufixo `_ft_test`; nenhuma migration/seed aplicada à base corrente. Compatibilidade do ambiente alvo Node 22/MariaDB 10.11 ainda deve ser conferida na implantação.

### Ajuste de abertura e local de trabalho — 2026-10-22

O edital pode ser aberto sem cadastrar pagadores, turnos ou locais previamente. Na convocação comum ou excepcional e na alteração da reserva, pagador e turno permanecem selecionáveis e o local é texto livre obrigatório, de até 255 caracteres. A API recebe `local` em vez de `local_id`; o texto é preservado na participação e nos relatórios. Locais antigos são preservados, sem necessidade de migration para esta alteração. As capacidades de pagador e as vagas do edital continuam verificadas na convocação e na ativação.


## Prorrogação pelo período do edital — 2026-10-23

A prorrogação usa integralmente prorrogacao_meses do edital, contando do término atual da participação. O novo término é a menor data entre esse cálculo e o último dia de vigência do edital; o ajuste para fim de mês e o horário de Brasília são preservados. Exemplo: término em 31/10 e período de 3 meses, com edital até 31/12, resulta em 31/12.

POST /:id/participacoes/:participacaoId/prorrogar recebe {}. O cliente não escolhe meses nem a data final; campos adicionais são rejeitados. A interface apenas confirma o período cadastrado e informa o limite final. O campo do edital passa a se chamar “Período de prorrogação (meses)”.

Continua sendo uma única prorrogação manual, para participação ativa e não vencida em edital aberto/vigente. Período zero desabilita a ação. Se a participação já alcança o fim do edital, a operação é recusada sem alterar o vencimento, consumir a prorrogação ou gravar evento de sucesso. Permissão e auditoria transacional permanecem; nenhuma migration é necessária. Publicar frontend e backend compatíveis juntos por causa da mudança do corpo da operação.


## Declarações afirmativas na inscrição — 2026-10-23

Na inscrição comum, por encaixe ou por exceção, as declarações obrigatórias começam desmarcadas: desemprego, ausência de renda, ausência de benefício da Previdência Social, vulnerabilidade atestada e aceite. Cada pendência aparece em vermelho, com mensagem acessível; Confirmar permanece desabilitado até todas serem confirmadas e a seleção/idade serem válidas. A data de residência e as justificativas continuam sujeitas às validações existentes. Vínculo familiar permanece informativo e não bloqueia a inscrição.

A interface apresenta “Não possui renda de qualquer natureza” e “Não recebe benefício da Previdência Social”. Marcar essas declarações envia possui_renda=false e recebe_previdencia=false; o contrato e as regras do backend permanecem os mesmos. O detalhe interpreta os booleanos antigos conforme o novo texto e mostra “Não informado” para respostas ausentes, sem presumir confirmação. Nenhuma migration, seed ou permissão nova é necessária.


## Nome do programa PEEAD — 2026-10-26

O programa passa a ser identificado como **PEEAD - PROGRAMA EMERGENCIAL E ASSISTENCIAL DE AUXÍLIO DESEMPREGO** nos títulos e no catálogo; notificações e espaços compactos usam **PEEAD**. O nome completo permite quebra de linha em desktop/mobile.

A migration `20261026120000-rename-ft-service-peead` atualiza somente `services.name` do módulo `ft`, preservando ID, URL, categoria, visibilidade, permissões e vínculos. O seed inicial já usa o nome completo para novas instalações; repetir o seed não substitui a migration em bancos existentes. O rollback só reverte o nome quando ainda corresponde ao nome definido pela migration.

Rotas `/frente-de-trabalho`, módulo `ft`, ações, arquivos, tabelas e códigos técnicos permanecem compatíveis. Tags descritivas do OpenAPI usam PEEAD. Auditorias históricas e PDFs já gerados não são reescritos; não foi encontrada a denominação anterior nos geradores de PDF. A migration deve ser aplicada pelo procedimento normal de implantação; não foi executada, nem foi executado seed na base corrente.


## CSV de pagamento do PEEAD

O botão **Pagamento CSV**, dentro do edital em **Relatórios / Downloads**, exporta somente dados separados por ponto e vírgula, sem linha de títulos, resumo do edital, grupos de pagador, totais ou linhas vazias. As nove posições são:

`Numero Banco;Agencia;Digito;Conta;Digito da Conta;Nome Credor;Valor;DATA do pagamento;CPF do Credor`

O valor líquido é exportado em centavos inteiros: 900,00 → 90000; 900,01 → 90001; 0,01 → 1; zero → 0. CPF contém somente números, mantendo zeros iniciais. Banco, agência, conta e seus dígitos são preservados como texto. A data usa o dia de pagamento do edital no mês de referência, em DDMMAAAA (10/09/2026 → 10092026). Dias inexistentes são limitados ao último dia válido do mês; consultas por intervalo usam o mês da data inicial.

Os cálculos de proporcionalidade e faltas permanecem os mesmos, assim como as linhas de pagamentos de cada pagador; não há consolidação. Campos com ponto e vírgula, aspas ou quebras de linha usam escape CSV. Sem pagamentos, o arquivo fica vazio. A interface continua solicitando somente o mês, com o mesmo download, rota e permissão gerar_relatorio_edital. Relatórios de faltas, presença e PDFs mantêm seus formatos. Nenhuma migration ou seed é necessária.
