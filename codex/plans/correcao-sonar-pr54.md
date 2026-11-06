# Correcao local dos bloqueios do SonarCloud — PR #54

Data: 2026-11-06. Branch: feature/refatoracao-clean-architecture.
Pedido: corrigir confiabilidade D e duplicacao 11,1%, sem commit nem push.

## Diagnostico

- Check remoto consultado: 127955139090, sobre b52c0d8; bloqueios de confiabilidade e duplicacao (limite 3%). O workflow Quality estava aprovado.
- Aplicacao aguardava objetos, arrays e valores sincronos apos a conversao de erros de dominio. Havia tambem ordenacoes sem comparador.
- As rotas explicitas de edital e estoque repetiam grandes trechos de auditoria, metadados e respostas.

## Correcao

- Removidos 42 await sem Promise na aplicacao; preservados awaits de repositorios, transacoes e chamadas assincronas dentro dos try/catch.
- Ordenacoes de datas ISO e nomes de migrations usam comparadores explicitos, sem mudar regras financeiras.
- Metadados, configuracoes de auditoria e schemas de resposta compartilhados em edital-workflow.http.ts e estoque.http.ts. Os 52 endpoints de edital e 22 de estoque continuam explicitos, com verbos, URLs, tipos, bodies, schemas, permissoes e controllers identificaveis. Nenhum helper generico de registro de rotas foi reintroduzido.
- O teste de auditoria usa a AST e resolve constantes importadas/spreads. Verifica campos obrigatorios por rota, em vez de contar a palavra audit no arquivo. Um teste negativo garante a recusa de metadata incompleta.
- Extraidas as etapas de ativacao e encerramento da participacao, a carga do lote PDF e partes do verificador arquitetural; preservadas a ordem das chamadas e as transacoes.
- Normalizacao de componentes de nomes de arquivo compartilha uma funcao pura que remove hifens nas bordas em passagens lineares; testes cobrem nomes acentuados, fallback e entradas longas.
- Senhas sinteticas de SMTP e bootstrap do harness de permissoes passam a ser geradas por execucao. As chaves usadas na criptografia dos dados sinteticos permanecem estaveis entre os processos do harness.
- Removida uma comparacao impossivel de todayInSaoPaulo() com null na politica de faltas; a validacao da data informada permanece obrigatoria.

## Evidencias locais

- Node 22.23.4, ambiente sintetico e URL de banco desconectada; nenhuma migration, seed ou conexao a base corrente.
- 498 testes aprovados; cobertura 92,20% linhas/statements, 96,17% funcoes e 90,19% branches. Limites de cobertura mantidos.
- 7 testes do verificador arquitetural e inventario de dependencias aprovados.
- 22 testes de seguranca do harness aprovados; 43 testes do servico de bolsistas aprovados apos a remocao da comparacao impossivel.
- Tipos e build aprovados.
- OpenAPI regenerado e comparado com o contrato anterior: JSON semanticamente identico, sem mudancas em endpoints, campos ou permissoes. Preservadas as quebras de linha originais do artefato versionado.
- Analise local com eslint-plugin-sonarjs 4.2.2: 117 regras recomendadas do tipo problem, com informacao de tipos em src, sem ocorrencias nos 123 arquivos de codigo do diff do PR e arquivos novos elegiveis. Isso nao equivale a uma nova analise remota.
- Conferencia por tokens (100 tokens / 10 linhas, ignorando imports e normalizando literais) nao encontra mais duplicacoes nos routers revisados. Resta um pequeno bloco comum de inicializacao entre os dois casos de uso PDF. Esta conferencia local nao calcula a porcentagem oficial do SonarCloud.
- Diff sem erros de whitespace; alteracoes anteriores de ambiente, Docker e CI preservadas.

## Entrega

A implementacao inicial ficou local conforme solicitado. Posteriormente o usuario autorizou commit e push: alteracoes separadas por ambiente, confiabilidade, metadados HTTP e protecao arquitetural. Nenhuma regra do Sonar ou exclusao foi alterada para contornar o gate. A nova analise remota sera conferida apos a publicacao; nao se declara Quality Gate remoto aprovado com base apenas nos checks locais.
