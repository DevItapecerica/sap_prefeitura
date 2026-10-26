# CSV de pagamento do PEEAD

## Branches

- [x] Frontend: development atualizada por avanço direto a partir de origin/development; branch feature/peead-csv-pagamento criada.
- [x] Backend: develop atualizada por avanço direto a partir de origin/develop; branch feature/peead-csv-pagamento criada.

## Formato aprovado

CSV separado por ponto e vírgula, somente dados, sem cabeçalhos, resumo, grupos, totais ou linhas em branco. Ordem: Numero Banco;Agencia;Digito;Conta;Digito da Conta;Nome Credor;Valor;DATA do pagamento;CPF do Credor.

Valor líquido em centavos inteiros (900,00 → 90000; 900,01 → 90001); CPF somente números, preservando zeros. Dados bancários mantidos como texto, incluindo zeros e dígitos alfabéticos. Data DDMMAAAA: dia do edital no mês da data inicial do período; dias inexistentes usam o último dia válido do mês. A interface continua selecionando um mês. Preservar cálculos e linhas existentes, sem consolidar pagamentos. Aplicar escape de CSV para aspas, delimitadores e quebras de linha. Relatório vazio produz arquivo vazio.

## Implementação e validação

- [x] Ajustar formatador e testes de centavos, datas, CPF, bancos, múltiplos pagadores, registros vazios e escape.
- [x] Atualizar testes do caso de uso preservando os cálculos de proporcionalidade e faltas.
- [x] Conferir o download via interface em desktop/mobile e suas permissões.
- [x] Atualizar OpenAPI, READMEs e estes planos; manter rotas/permissões e demais relatórios.
- [x] Executar checks pertinentes e registrar resultados.

Sem migrations ou seeds; não aplicar operações na base corrente.

## Evidências — 2026-10-26

- Backend: check, build e suíte completa (476 testes) aprovados. Inclui 17 cenários do formatador e 7 do caso de uso, cobrindo centavos, proporcionalidade, falta informativa, data, vazio, grupos e escape.
- Frontend: lint, typecheck, 151 testes, build e orçamento aprovados.
- Chromium: três cenários com API sintética aprovados: arquivo baixado em 1280px/390px, nome pagamento-AAAA-MM.csv, consulta por mês e ocultação sem permissão. O teste permanece independente do checkout do backend; geração real é coberta pelos testes do formatador/caso de uso.
- OpenAPI e tipos regenerados. Mudança restrita à documentação do layout de pagamento; rotas, queries e permissões preservadas.
- Nenhuma migration ou seed executada; nenhum banco real utilizado. Sem commits ou push nesta entrega.
