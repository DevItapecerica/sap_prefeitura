# Holerites da folha fechada do PEAAD

## Entrega

- Continuar na branch atual dos três projetos, preservando os commits existentes. Sem commit, push, publicação, migrations, seeds ou acesso à base corrente.
- PDF individual por bolsista na consulta da folha fechada, na tabela e nos cartões. Solicitação assíncrona de ZIP ao lado do CSV, com acompanhamento e atualização manual em Arquivos gerados.
- Emitir somente de snapshot fechado: pessoas, CPF mascarado, edital, competência, período, pagador, data prevista, bruto, descontos e líquido. Sem dados bancários ou confirmação de pagamento efetivo.
- Nas novas folhas, preservar detalhamento de faltas e proporcionalidade, reconciliado em centavos. Folhas antigas mantêm os totais e indicam detalhamento não registrado. Nunca recalcular registros fechados.
- Um PDF por bolsista, incluindo todas as linhas/pagadores preservados e total consolidado. Folha vazia não gera lote.
- API PDF renderiza com cabeçalho institucional compartilhado e repetido nas continuações. Backend monta o contrato pelos registros autorizados.
- Reutilizar fila, armazenamento, retenção e descarte de arquivos; tipo holerites. Falhas individuais resultam em falhas.csv seguro e escapado, inclusive se todos falharem. Não interromper os demais documentos.
- Rotas: GET /frente-de-trabalho/relatorio/edital/:id/holerites/:bolsistaId?mes=AAAA-MM; POST /frente-de-trabalho/relatorio/edital/:id/holerites com mes; POST /api/v1/holerites/render na API PDF.
- Usar gerar_relatorio_edital para individual e solicitação. Arquivos de holerites exigem também essa ação além das permissões existentes de consulta, download ou reprocessamento.
- Preservar arquitetura, factories nomeadas, repositórios Sequelize e snapshots criptografados. Frontend: componentes, hooks e serviços HTTP, PrimeReact, estados locais e proteção a respostas atrasadas. Sem polling ou atualização por foco.

## Validação

- Bloqueio antes do fechamento, pessoa ausente, competência e permissões, folha vazia e participantes encerrados.
- Valores preservados, detalhamento novo, legado, centavos, zero e múltiplos pagadores.
- Lote completo, parcial e falha total; CSV escapado e seguro; recuperação individual, nomes únicos e falhas do armazenamento.
- PDF real: acentos, textos extensos, múltiplas páginas, cabeçalho e ausência de dados bancários.
- Navegador desktop/mobile com API simulada; downloads, contexto e carregamento local.
- Arquitetura, tipos, testes, cobertura, lint disponível, builds, OpenAPI, tipos gerados e orçamento.

## Evidências

- Implementado nos três projetos na branch `feature/peaad-ajustes-relatorios-espelho-pagamento`, preservando os commits anteriores.
- Backend: 540 testes aprovados; cobertura de linhas 91,68%, branches 90,71% e funções 94,27%. Tipos de src e scripts, arquitetura, lint sem avisos, build e format:check aprovados. Testes cobrem snapshot antigo/novo, centavos, múltiplos pagadores, autorização composta e filtragem antes da paginação, bodies estritos, fonte do lote, falhas parciais/totais e rollback do arquivo.
- API PDF: 43 testes aprovados; cobertura de linhas 97,74%, branches 93,63% e funções 98,34%. Arquitetura e build aprovados. Testes HTTP geram PDFs reais e verificam CPF mascarado, cabeçalho, continuação e textos extensos. Não há comando de lint neste projeto.
- Frontend: 54 arquivos / 230 testes aprovados com cobertura; linhas 83,78% no escopo configurado. Comando final: vitest run --coverage --maxWorkers=2 --testTimeout=15000. A execução inicial com concorrência padrão excedeu o timeout de um teste de permissões fora desta alteração; a repetição completa e limitada passou. Tipos, arquitetura, lint sem avisos, build e orçamento aprovados.
- Navegador: oito cenários Chromium aprovados, a 1280px e 390px, com API simulada: individual, solicitação do lote, folha aberta e regressão do CSV/fechamento/conflito. O mock ignora imports de módulos e intercepta somente o prefixo /api/. A execução final usou PLAYWRIGHT_BASE_URL apontando para o Vite local e concluiu com oito aprovados; a execução com webServer embutido passava os cenários mas permanecia no teardown no Windows.
- Integração real separada: caso de uso do SAP → gateway Axios → rota e renderer reais da API PDF, com repositório em memória e sem banco. Conferidos PDF individual, legado, múltiplos pagadores, ZIP parcial e ZIP contendo somente falhas.csv. Inspeção textual e visual, limites de página, cabeçalhos repetidos e ausência de dados bancários/CPF completo aprovados.
- Amostras fictícias locais: `.tmp/holerite-novembro-2026.pdf`, `.tmp/holerite-legado.pdf`, `.tmp/holerite-varios-pagadores.pdf`, `.tmp/holerites-batch/partial.zip` e `.tmp/holerites-batch/all-fail.zip`. Scripts de conferência em `.tmp/holerites-roundtrip.mjs` e `.tmp/holerites-preview.py`.
- READMEs, OpenAPI das duas APIs e tipos gerados atualizados. Sem migrations, seeds, acesso à base corrente, commit, push ou publicação.
