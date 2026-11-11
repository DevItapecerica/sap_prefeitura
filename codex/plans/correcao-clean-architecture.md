# Correção arquitetural dos três projetos

Branch: `feature/refatoracao-clean-architecture`, criada a partir do estado existente em cada repositório, sem atualização das bases.

## Objetivo e execução

Aplicar rotas explícitas → controllers → casos de uso/serviços → contratos tipados; infraestrutura e composição nas implementações/factories. Preservar comportamento, dados e contratos HTTP.

1. Registrar referência inicial de contratos, permissões e fluxos. Implementar contratos e unidade de trabalho.
2. Corrigir estoque, workflow/consultas de edital e fechamento: nenhuma dependência ORM na aplicação/domínio; manter transações compartilhadas com auditoria/idempotência e ordens de trava existentes.
3. Substituir helpers de rota/validação por endpoints explícitos, schemas específicos, controllers tipados e validação nativa estrita somente dos bodies.
4. Corrigir dependências invertidas nos demais módulos: DTOs/erros de domínio, sessões de autenticação, gateways PDF e armazenamento/ZIP.
5. Separar renderização técnica e leitura de templates do domínio/casos de uso na API PDF, com contratos e factories.
6. Extrair orquestração do frontend para hooks e transporte para serviços HTTP, seguindo Munícipes; preservar componentes, contexto e autenticação.
7. Verificação arquitetural nos três projetos/CI, testes de regras permitidas/proibidas, contratos/OpenAPI/tipos, documentação e validações.

## Invariantes

- Mesmas URLs, verbos, payloads, paginação, permissões, erros públicos, CSV de nove colunas e snapshots.
- Workflow mantém munícipe → edital → participação; estoque mantém edital → participação → controle. Movimentações e fechamento compartilham a trava do edital.
- Domínio recebe dados e lança erros semânticos; aplicação recebe portas tipadas e repositórios vinculados à unidade de trabalho, sem models/where/Transaction ou transações disfarçadas como unknown.
- Bodies rejeitam propriedades extras e coerção; querystrings preservam tratamento anterior.
- Nenhuma migration, seed, permissão nova ou funcionalidade. Não aplicar migrations/seeds na base corrente.
- Nenhuma atualização por foco/polling/carregamento global novo. Não publicar alterações.
- Remover caminhos legados somente depois de rastrear referências, sem reativá-los.

## Validação

Arquitetura/imports estáticos, dinâmicos e reexports; tipos, lint disponível, testes e builds/orçamento. Testes de aplicação com fakes de portas; adapters e concorrência/rollback em banco descartável. Cobrir workflow, exceções, kit/avulso/estorno, snapshots/CSV, permissões e payloads estritos. PDFs por conteúdo/layout/paginação. Navegador desktop/mobile e preservação de formulários/foco/contexto.

## Evidências

- Referência inicial em `.tmp/clean-architecture-baseline/baseline.json` e cópias dos contratos publicados.
- Nenhuma migration/seed aplicada à base corrente. Nenhuma publicação.

## Inventário implementado

| Responsabilidade          | Correção                                                                                                                                                                                                                                                                                                                        |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unidade de trabalho       | `core/contracts/unit-of-work.ts`; callback com repositórios e auditoria vinculados ao mesmo commit/rollback. Implementações Sequelize em `infra/database/sequelize/repositories`.                                                                                                                                               |
| Estoque                   | Contratos e políticas de domínio; serviço de aplicação; controller, schemas por recurso e rotas explícitas; factory. Preservados composição do kit, custos históricos, estorno, saldo, idempotência e autorização condicional da entrada inicial.                                                                               |
| Editais                   | Workflow e consultas/histórico dependem de portas tipadas. SQL, operadores, models e travas ficam no adapter. Política de competência fechada recebe dados, sem consultar banco.                                                                                                                                                |
| Folha                     | Fechamento e leitura usam unidade de trabalho, calculadora e snapshots criptografados; CSV armazenado permanece exato.                                                                                                                                                                                                          |
| HTTP                      | Removidos `route`, `strict` e `strictBody`. Validação nativa estrita de bodies com normalização dos erros contratuais; queries mantêm coerção anterior.                                                                                                                                                                         |
| Dependências invertidas   | Tipos internos de domínio substituem imports de DTO; erros semânticos do PEAAD são mapeados para os erros públicos. Sessões e publicação de eventos são injetadas. Composição de Munícipes e Permissões transferida para factories.                                                                                             |
| PDF e arquivos no backend | Portas de renderização e armazenamento/ZIP; Axios, streams e filesystem encapsulados em adapters.                                                                                                                                                                                                                               |
| API PDF                   | Casos de uso recebem renderizadores tipados; templates, fontes, Sharp e pdf-lib ficam em `infra/rendering`; controllers recebem casos de uso montados nas factories.                                                                                                                                                            |
| Frontend                  | Hooks por responsabilidade para editais, pessoas, configurações, relatórios, estoque e entregas; extração equivalente das telas administrativas e demais componentes com HTTP embutido. Serviços concentram transporte e conversões; utilitários puros separados. Provider delega transporte sem mudar o fluxo de autenticação. |
| Proteção                  | `check:architecture` nos três projetos e workflows; análise AST de imports estáticos/dinâmicos, reexports, require e import types; testes positivos e negativos.                                                                                                                                                                |

Removidos os caminhos legados não referenciados de router/controller/factory/serviço de edital, casos de uso de vínculo/atualização, repositório e DTO antigos. Nenhum endpoint legado foi reativado. Os pequenos barrels de estoque mantêm compatibilidade de imports existentes, sem implementação própria.

## Compatibilidade e evidências por etapa

- Bases preservadas: backend `5eee0f5`, frontend `ef4d074`, PDF `42256b1`; branches criadas do estado atual, sem atualizar bases, reset ou rebase.
- Comparação normalizada de **167 operações HTTP** contra o OpenAPI inicial: URLs, verbos, parâmetros, requests, segurança e operationIds preservados. Schemas de resposta do estoque separados por recurso; OpenAPI e tipos regenerados.
- Backend: **493 testes aprovados**, cobertura de linhas 93,77%, branches 90,04%, funções 95,17%; tipos e build aprovados. Verificador arquitetural e seus cinco testes aprovados.
- API PDF: **31 testes aprovados**, cobertura de linhas 94,29%, branches 88,82%, funções 98,07%; build e arquitetura aprovados.
- Regressão PDF: comparação do arquivo inteiro após normalizar somente datas de criação/modificação. Crachá (1 página), carteirinha (1), espelho (5), presença (2) e protocolo (1) idênticos à referência, incluindo conteúdo gráfico, fontes, recursos e paginação.
- Frontend: **179 testes aprovados**; cobertura de linhas 84,34%, branches 69,92%, funções 72,15%. O escopo de cobertura inclui os hooks/serviços que receberam lógica antes coberta nos componentes. Lint, tipos, build e orçamento aprovados.
- Aplicação testada com fakes de portas no estoque e workflow; adapters mantêm seus testes de persistência separados.
- SQL descartável: schema vazio exclusivo no MariaDB local isolado, porta 3338; migrations e seeds existentes exercitadas somente nesse schema. A suíte cobre rollback de auditoria, concorrência, último saldo, kit único, idempotência, estorno, fechamento, ciphertext, reemissão idêntica, bloqueios retroativos, permissões, filtros e cadastro conjunto. Os guards do harness são testados antes de carregar o banco da aplicação.
- Concorrência do estoque: a resolução inicial do ID do edital permanece fora da transação, como antes; as leituras com trava mantêm edital → participação → controle. Isso impede estabelecer um snapshot REPEATABLE READ antigo antes de aguardar a trava. Teste de ordem de travas e integração concorrente aprovados.
- Navegador: 20 cenários atuais de Editais/Estoque/Entregas aprovados em desktop e celular, além do fluxo completo com API e banco descartáveis. Foco, falhas, formulários, navegação, destinatário fixo e retorno ao detalhe preservados.

Na consolidação, a suíte completa de navegador aprovou **55 cenários**, incluindo a integração FT real e os testes antigos atualizados para abas Pessoas, AutoComplete, painéis e cartões atuais. Os **cinco cenários de permissões por role** dependem de outro harness/opt-in e ficaram explicitamente não executados; esse skip não representa validação da integração deles. A integração FT verificou as permissões do PEAAD no banco descartável.

A integração SQL foi repetida com sucesso após a tipagem do scheduler em um terceiro schema vazio, `ca_20261104_03_ft_test`. O scheduler passa referências tipadas, sem models, pelo contrato. A proteção arquitetural também detecta chamadas nativas `fetch`/`XMLHttpRequest` e recusa imports calculados nas camadas protegidas. A busca final identificou e extraiu a consulta ViaCEP de Munícipes para hook e serviço tipado, preservando preenchimento, avisos e tentativas.

Após essa extração final, os seis cenários de Editais/Munícipes passaram novamente no navegador. Quatro testes adicionais cobrem conversão da resposta, CEP incompleto/repetido, preservação do formulário, CEP não encontrado, falhas e nova tentativa. Serviços de teste HTTP e MariaDB descartável encerrados após as validações.

## Entrega

- READMEs e planos nos quatro diretórios atualizados; OpenAPI e tipos gerados atualizados. Commits locais separados por composição/contratos, PEAAD, renderização PDF, frontend e proteção/documentação.
- Comandos executados: backend `check:architecture`, `check`, `test:coverage`, `build`, `openapi:generate`, teste de segurança do harness e `test:ft:db`; API PDF `check:architecture`, `test:coverage`, `build`, `openapi:generate`; frontend `check:architecture`, `lint`, `typecheck`, `test:coverage`, `contracts:generate`, `build`, `bundle:check` e Playwright.
- Ambiente local de validação: Windows, Node 24.6.0; a configuração de produção/CI continua em Node 22. Logs e artefatos sintéticos ficam em `.tmp`/diretórios ignorados, fora dos commits. Os planos registram os resultados para revisão sem depender desses arquivos locais.
- Sem novas migrations, seeds, permissões, atualização por foco, polling, mudanças de autenticação ou publicação.

## Propagacao das correcoes do SonarCloud do PR #53

- Incorporadas as correcoes da branch de estoque, preservando os contratos e a unidade de trabalho desta branch. Nao foram restaurados servicos acoplados ao banco nem testes antigos eliminados na refatoracao.
- Senha do harness gerada por execucao, comparador explicito e compativel com assinaturas antigas, ordenacao nao mutante das linhas, comparacao de campos bloqueados simplificada e filtros extraidos no adapter Sequelize.
- Regressao de assinatura legada e testes dos filtros CPF/nome/excecao adaptados para os contratos e adapters atuais.
- Node 22.23.4, banco desconectado: check, check:architecture (5 casos + inventario), build e 495 testes aprovados; cobertura 92,49% linhas/statements, 96,15% funcoes e 90,05% branches, mantendo os limites existentes. Sem migrations/seeds.
- PR #53 no commit 4dddd61: Quality e SonarCloud aprovados, sem aceitar ou suprimir ocorrencias. O indicador de cobertura da analise automatica Sonar e separado do LCOV publicado no workflow.
