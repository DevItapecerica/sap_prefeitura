# Retirada mensal de benefícios do PEAAD

Branch dos dois projetos: `feature/peaad-beneficios-mensais`, criada a partir dos estados atuais, preservando commits existentes. Sem publicação e sem aplicar migrations/seeds na base corrente.

## Comportamento aprovado

- Usar os benefícios mensais já configurados no edital, sem alterar o bloqueio após a primeira convocação.
- Entrega parcial de um ou vários benefícios, apenas na competência atual de Brasília. Data e responsável são definidos pelo servidor.
- Uma retirada vigente por pessoa + edital + benefício + mês, inclusive em retornos com outra participação.
- Constante `PERMITIR_RETIRADA_BENEFICIOS_APOS_ENCERRAMENTO=false`: por enquanto somente ativos, não vencidos, em edital aberto/vigente. Quando habilitada, permitir também encerrados com ao menos um dia ativo no mês.
- Relatório considera ao menos um dia ativo na competência independentemente da constante. Convocados nunca ativados não têm direito; faltas não reduzem benefícios.
- Estorno integral justificado, com permissão independente, sem apagar histórico; permitido após encerramento ou em mês anterior. Nova entrega continua limitada à competência atual e à elegibilidade vigente.

## Implementação

- Módulo `ft-beneficios` com domínio puro, contratos de repositório/UoW, aplicação, controllers, schemas específicos, rotas explícitas e factory. Sequelize e SQL exclusivamente em infra.
- Migration incremental para cabeçalhos, snapshots dos itens, cobertura única vigente e operações idempotentes. Trava do edital seguida de participações; escrita, cobertura, auditoria e idempotência na mesma transação.
- Novas ações `consultar_entregas_beneficios`, `entregar_beneficios`, `estornar_entrega_beneficios` e `gerar_relatorio_beneficios`, seed idempotente sem concessões automáticas.
- Sob `/frente-de-trabalho/edital`: prévia e entrega em `/:id/participacoes/:participacaoId/beneficios`; POST em `/beneficios/entregas` desse participante; histórico em `/:id/beneficios/entregas`; estorno em `/:id/beneficios/entregas/:entregaId/estornar`; relatório e CSV em `/:id/beneficios/relatorio[.csv]`.
- Entrega recebe somente operação e IDs dos benefícios. Corpo estrito rejeita competência, autor, data ou outros campos extras.
- UI PrimeReact: WorkflowAction em Ativos/detalhe; painel único com destinatário fixo, pendentes, já retirados e confirmação. Histórico por participação, histórico geral com estorno e relatório filtrável com CSV completo.
- Hooks controlam consultas, respostas atrasadas e comandos; transporte/tipos no serviço HTTP. Sem foco, polling ou carregamento global. Preservados filtros/páginas e formulários em falhas.
- OpenAPI/tipos, READMEs e os três planos serão atualizados com evidências.

## Validação

- Testar seleção parcial, duplicidade por pessoa em retornos, virada do mês em Brasília, elegibilidade com a constante nos dois estados, estorno, snapshots, idempotência e rollback da auditoria.
- Conferir HTTP/permissões, rejeição de bypass, seed sem concessões, migration incremental e concorrência em MariaDB descartável.
- Validar desktop/mobile, teclado, mesmo painel, histórico correto, visibilidade por permissão e recuperação de erros.
- Executar arquitetura, tipos, testes/cobertura, builds, lint disponível e orçamento do frontend.

## Evidências finais — 2026-11-09

- Backend: 505 testes aprovados; cobertura de linhas/statements 92,38%, branches 90,33%, funções 96,17%, sem reduzir limites.
- Frontend: 47 arquivos / 192 testes aprovados, incluindo sete cenários novos de benefício. A medição configurada pelo projeto permanece no conjunto existente: linhas 84,34%, statements 83,65%, branches 69,92%, funções 72,15%; não foi alterada a abrangência nem reduzido qualquer limite.
- Regras/HTTP específicos: sete testes aprovados, incluindo a virada do mês e início futuro que ainda não gera direito. Arquitetura e tipos dos dois projetos aprovados; build dos dois, lint do frontend sem warnings e orçamento do frontend aprovados. O backend não oferece comando lint separado.
- MariaDB 11.8 em loopback:33327, datadir exclusivo de testes e usuário restrito ao schema descartável. Cadeia de migrations/seeds aplicada apenas nesse alvo.
- Após corrigir a cidade da massa de teste, integração específica e harness completo passaram: quatro ações sem concessões, idempotência, disputa de retirada, unicidade SQL, rollback de auditoria, estorno integral, nova entrega, CSV, disputa com encerramento e consulta após encerramento. Regressões existentes de folha, estoque, inscrições, convocações, ativação e expirações continuaram aprovadas.
- Migration também validada em up/down/up vazio com FKs restritivas; rollback após utilização é recusado. Todas as operações ocorreram exclusivamente na instância descartável em porta 33327.
- Chromium: três cenários aprovados, nos tamanhos 1280px e 390px, com teclado, botão padronizado, painel único, retorno ao detalhe, histórico filtrado por participação, relatório/arquivo CSV e visibilidade por permissão. Esses testes usam respostas HTTP controladas; a persistência real foi validada separadamente pelo harness SQL.
- O navegador identificou e confirmou a correção do índice das abas condicionais: sem acesso ao histórico de materiais, a aba Benefícios passa a carregar corretamente. Seleções permanecem em falha e uma nova conferência descarta benefícios recebidos por outro operador.
- OpenAPI e tipos regenerados. Comparação dos contratos confirmou seis novas rotas e nenhuma remoção ou modificação de rotas anteriores; metadado de política de encerrados foi acrescentado ao item de participação.
- Logs locais: .tmp/benefits-back-final.log, benefits-front-final-coverage.log, benefits-browser-final.log, benefits-sql.log e benefits-front-final-budget.log.
- READMEs e os três planos atualizados. Sem alterações na autenticação, foco, polling, banco corrente ou API PDF. Sem commit, push ou publicação.

## Limitações

- Meses sem registros aparecem como pendentes; entregas realizadas fora do sistema não são presumidas.
- Sem estoque, folha, quantidades, benefícios retroativos ou API PDF nesta entrega. O CSV de pagamento permanece com nove colunas.

## Correção conforme os padrões existentes — 2026-11-09

### Referências conferidas antes da implementação

- Serviços: models/repositórios Sequelize, dependência padrão do banco encapsulada em infra e factories por caso de uso.
- Munícipes: policy como classe e mapper da aplicação responsável pela criptografia.
- Unidade de trabalho existente: contratos sem drivers, composição por factory e auditoria com a mesma transação.

### Alterações

- Quatro models tipados: entrega, item, retirada vigente e operação idempotente, com associações, chaves compostas e índices da migration existente; timestamps desabilitados. Nenhuma alteração de schema/migration.
- Adapter inteiramente pelo ORM: findByPk/findOne/findAll/findAndCountAll, create/bulkCreate/update/destroy e transações. Retiradas por pessoa/mês; histórico paginado pelo ORM; relatório limitado a candidatos e entregas pertinentes à competência.
- Removidos SQL manual, formatação de datas SQL, carga geral load() e criptografia da infraestrutura. Conversores de infra devolvem contratos; BeneficiosMapper na aplicação trata CPF e snapshot idempotente.
- BeneficiosPolicy concentra competência, período ativo, bloqueios, seleção e estorno. Constante de encerrados permanece false e sem controle por payload.
- Seis casos de uso com factories nomeadas, factory própria da UoW e controller recebendo os casos necessários. Removido o serviço monolítico anterior.
- Fakes representam portas de negócio; teste dos models verifica metadados sem simular Sequelize nos testes de regras.
- Corrigidas as contagens unknown com count do ORM e a alocação da massa de teste com validação efetiva de IDs.
- Adicionado tsconfig.scripts.json e check:scripts, chamado por npm run check e consequentemente pelo CI existente. A checagem ampliada identificou mais três erros antigos no servidor E2E de permissões; corrigidas apenas suas anotações de tipos. Build continua restrito a src.

### Evidências da correção

- npm run check: tipos de src e de todos os scripts aprovados; sem casts para esconder IDs opcionais.
- Backend: 506 testes aprovados. Cobertura: linhas/statements 92,54%, branches 90,57%, funções 95,97%, sem alterar limites.
- Arquitetura e build aprovados. O repositório de benefícios não contém SQL direto nem chamadas sequelize.query.
- MariaDB 11.8 descartável em loopback:33327: cadeia existente, models, idempotência, unicidade, concorrência, estorno, snapshots, auditoria/rollback e disputa com encerramento aprovados; regressões de workflow, estoque e folha também aprovadas.
- OpenAPI regenerado com configuração sintética desconectada e comparado semanticamente: idêntico ao contrato anterior à refatoração. Artefatos originais preservados; sem necessidade de regenerar tipos.
- Frontend: sete testes pertinentes e três cenários Chromium desktop/mobile/download aprovados, com respostas HTTP controladas no navegador e persistência real validada separadamente no MariaDB.
- Logs: .tmp/benefits-refactor-final-coverage.log, benefits-refactor-front-tests.log, benefits-refactor-browser.log e benefits-sql.log.
- README e planos atualizados. Alterações anteriores preservadas. Sem alterações na base corrente, novas funcionalidades, migrations, permissões, commit ou publicação nesta correção.

## Publicação autorizada

Após a implementação e a correção, o usuário autorizou separar os commits e publicar `feature/peaad-beneficios-mensais` nos dois repositórios. Separação por responsabilidade: funcionalidade/persistência, verificações/testes e documentação/contratos. Permanecem proibidas alterações na base corrente; não há aplicação de migrations ou seeds durante a publicação.
