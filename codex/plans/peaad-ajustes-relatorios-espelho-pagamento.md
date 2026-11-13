# Ajustes de relatórios: espelho com dias futuros identificados

## Preparação e abrangência

- Criada a branch `feature/peaad-ajustes-relatorios-espelho-pagamento` nos três repositórios, a partir dos estados atuais de `develop`, sem atualizar as bases. Árvores inicialmente limpas.
- Corrigir somente o espelho de ponto, individual e em lote. Folha de presença, pagamento e holerites mantêm as regras atuais.
- Preservar arquivos já gerados; novas emissões respeitam o corte. Sem commit, push, publicação, migrations, seeds ou alterações na base corrente.

## Regra e implementação

- Exibir todos os dias do mês. Apurar até hoje, inclusive, em Brasília; dias posteriores ficam como **Dia futuro**, sem horário previsto, marcações, apontamentos ou efeito nos totais. Meses passados seguem completos; mês futuro continua recusado.
- Centralizar o período em uma policy de domínio, reutilizando o utilitário de data de Brasília. A aplicação recebe um relógio injetável.
- Aplicar o corte à seleção do vínculo, consulta de faltas e totais. A policy também fornece o último dia do mês para preservar o calendário completo. O cabeçalho apresenta o período apurado e as observações explicitam a data do corte e os dias futuros.
- Em cada execução do lote, capturar uma referência de tempo única e usá-la na consulta dos destinatários e em todos os PDFs, inclusive ao atravessar a meia-noite. Nova tentativa captura nova referência.
- A referência compartilhada pertence somente ao contrato interno; não criar parâmetro HTTP de data de corte.
- A API PDF continua responsável apenas pela renderização do período recebido. Não adicionar regras de frequência ao renderer.
- Atualizar descrições OpenAPI e documentação, sem novos endpoints ou permissões. Manter presença com o mês completo, conforme decisão explícita do usuário.

## Validação

- Cobrir hoje inclusivo, amanhã e todos os dias restantes como Dia futuro, meses anterior/futuro, fim de mês, ano bissexto e virada do dia/mês em Brasília.
- Conferir faltas futuras fora do total e recusa de participação com início após o corte.
- Testar emissão individual e lote, corte uniforme, nova tentativa e regressão da folha de presença.
- Inspecionar PDF real: calendário completo, cabeçalho com período apurado e datas posteriores identificadas, sem informação de frequência futura.
- Executar testes, cobertura e checks pertinentes; registrar resultados ao concluir.

## Evidências

- Backend: 528 testes aprovados; cobertura de linhas 91,56%, branches 90,66% e funções 94,18%. Cobertos corte inclusivo, calendário completo, faltas futuras, Brasília, lote atravessando meia-noite e nova tentativa.
- Build e geração OpenAPI do backend concluídos; tipos gerados do SAP atualizados sem alteração de contrato público.
- API PDF: 40 testes e build aprovados. Integração real via HTTP, com repositórios falsos e sem banco, gerou espelhos individuais e ZIP com dois documentos. Inspeção textual e visual confirmou 30 linhas em novembro, 17 como Dia futuro após o corte de 13/11, sem horários ou apontamentos futuros. Outubro manteve 31 dias e a folha de presença manteve novembro completo.
- Frontend: tipos, arquitetura, lint, build e orçamento aprovados. Sem alteração de componentes ou comportamento da interface; não foram necessários novos cenários de navegador.
- Amostras locais em `.tmp/espelho-ponto-ate-13-11-2026.pdf`, `.tmp/espelho-ponto-outubro-completo.pdf` e `.tmp/timesheet-cutoff-batch/cutoff-batch.zip`. Dados fictícios.
- Sem acesso à base corrente, migrations, seeds, commit ou publicação.
