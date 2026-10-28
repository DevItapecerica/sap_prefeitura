# Melhorias operacionais do fluxo PEAAD

Plano aprovado em 2026-10-27. Este documento registra o escopo; implementação concluída, com evidências ao final.

## Preparação

- [x] Atualizar `development` do frontend por avanço direto a partir de `origin/development`.
- [x] Atualizar `develop` do backend por avanço direto a partir de `origin/develop`.
- [x] Criar `feature/peaad-melhorias-fluxo` nos dois repositórios, preservando alterações locais.
- [x] Registrar este plano em `codex/plans/peaad-melhorias-fluxo.md` na raiz, no frontend e no backend.

## 1. Busca e filtros

Aplicar às listas de inscrições, convocados e participantes:

- Busca pelo **nome atual do munícipe** ou CPF completo, com ou sem máscara. Preservar os dados originais da inscrição no detalhe histórico.
- Filtros combináveis por situação, pagador, turno e exceção. Distinguir inscrição excepcional de convocação excepcional.
- Nas inscrições, pagador e turno correspondem à participação convocada/ativa atual; inscrições sem alocação não aparecem quando esses filtros estiverem selecionados.
- Executar filtros e contagem no backend **antes da paginação**. Buscar CPF pelo hash já existente, sem criar armazenamento de CPF em texto aberto.
- Usar busca com debounce, botão “Limpar filtros” e retorno à primeira página quando um filtro mudar. Buscar pagadores e turnos em todo o cadastro do edital, respeitando a paginação.
- Evitar consultas individuais por pessoa para obter nome, alocação e marcações de exceção.

## 2. Conferência do pagamento

O botão **Pagamento CSV** sempre abrirá a prévia, usando a permissão existente `gerar_relatorio_edital`.

- Adicionar consulta JSON de prévia junto às rotas de relatórios do edital, com o mesmo período utilizado na exportação.
- Reutilizar a seleção de participantes e o cálculo atual de pagamento. Exibir nome, CPF, pagador, dados bancários, data e valor líquido.
- Mostrar totais do conjunto completo: participantes distintos, registros de pagamento, valor líquido e registros com alertas. A tabela será paginada.
- Identificar CPF ausente/inválido e dados bancários ausentes ou incompatíveis com os formatos já aceitos pela aplicação, preservando zeros e dígitos verificadores alfabéticos.
- **Alertas não impedem exportar.** Exibir claramente sua quantidade junto ao botão de download. Falhas de negócio que já impedem gerar o relatório continuam bloqueantes.
- Manter o CSV com nove campos, sem cabeçalho ou totais, com centavos inteiros, data `DDMMAAAA` e CPF somente números.
- Retornar uma versão da prévia calculada sobre seu conteúdo. O frontend enviará essa versão ao exportar; se os dados tiverem mudado, o backend recusará o download com conflito, a interface atualizará a prévia e exigirá novo clique.
- Preservar a compatibilidade da rota CSV existente: a versão será opcional para clientes atuais, mas sempre enviada pela interface após a conferência. Não armazenar um arquivo ou snapshot novo para cada prévia.

## 3. Vencimentos e reservas pendentes

Usar datas civis de Brasília e limites fixos nesta etapa:

- Destacar participações ativas com término entre hoje e os próximos **30 dias**, inclusive. Participações vencidas ainda não processadas terão indicação própria.
- Informar a possibilidade de prorrogar e o motivo quando indisponível.
- Na confirmação de prorrogação, mostrar término atual, período cadastrado, limite do edital e **nova data final exata**, calculada pelo backend com a mesma regra da operação.
- Para convocados, mostrar data da convocação, início previsto e quantidade de dias com a vaga reservada. Contar da criação da participação, não da data prevista de início.
- Destacar reservas com **7 dias ou mais**. A sinalização não cancela nem libera vagas automaticamente.
- Mostrar as pendências atuais de ativação, incluindo cadastro/confirmação dos dados bancários e impedimentos das regras existentes. Não acrescentar novas exigências para ativar.
- Não recalcular idade da reserva a partir de `updatedAt`, pois alterações da alocação não devem reiniciar a contagem.

## 4. Histórico e motivos de bloqueio

### Histórico

- Adicionar consultas paginadas de histórico da inscrição e da participação, limitadas ao edital autorizado.
- Reutilizar `consultar_inscricoes` e `consultar_vinculos`, respectivamente, sem exigir acesso à auditoria global.
- Exibir uma linha do tempo com inscrição, convocação, ativação, alteração de reserva, prorrogação e encerramento; identificar exceções, responsável, data e justificativa quando registrados.
- Relacionar a inscrição às suas tentativas de participação no mesmo edital, distinguindo cada tentativa.
- Usar os eventos e marcos persistidos. Para registros antigos incompletos, indicar ausência de responsável, data ou justificativa, sem inventar informações.
- Registrar os futuros encerramentos em lote e automáticos também por participação, na mesma transação da alteração, identificando usuário ou sistema.
- Não expor questionários, dados bancários ou conteúdo de faltas/ocorrências pelo histórico de ciclo de vida.
- Preparar índice incremental para consulta dos eventos por edital, recurso e ordem cronológica.

### Bloqueios antecipados

- Acrescentar pré-validações somente de leitura para inscrição, convocação, ativação e prorrogação, protegidas pelas permissões das respectivas operações e modalidades.
- Reutilizar as políticas do backend e retornar pendências estruturadas com código, mensagem e campo relacionado.
- Consultar ao abrir o formulário e ao alterar dados relevantes. Ignorar respostas antigas quando a seleção mudar.
- Mostrar impedimentos como falta de vagas, capacidade do pagador, participação simultânea, idade, prazo e requisitos cadastrais.
- Respeitar os limites das exceções e do encaixe já existentes; a pré-validação não autoriza bypass.
- Não reservar vagas, alterar dados ou registrar eventos de negócio na pré-validação. Não registrar dados bancários nos logs.
- Manter todas as validações e locks na confirmação, pois a disponibilidade pode mudar depois da consulta.

## 5. Entrega e validação

- Usar PrimeReact e o padrão visual atual. Atualizar dados por ações do usuário e operações concluídas, **sem reintroduzir atualização automática por foco ou timers**.
- Atualizar READMEs, OpenAPI e tipos gerados; registrar progresso e evidências neste plano nos três locais.
- Testar filtros combinados, CPF com máscara, nome atualizado, paginação e contagem global.
- Conferir igualdade entre prévia e CSV, alertas com exportação permitida, mudanças entre conferência e download, pagamentos proporcionais e múltiplos pagadores.
- Cobrir os limites exatos de 30 e 7 dias, virada de mês, Brasília, ano bissexto, prorrogação já utilizada e participação no limite do edital.
- Validar autorização dos novos endpoints, isolamento entre editais, histórico incompleto, eventos automáticos e ausência de exposição de dados protegidos.
- Testar concorrência da última vaga e capacidade do pagador, incluindo ativação que já possui a própria reserva.
- Executar testes unitários, HTTP, integração em banco descartável e navegador desktop/mobile, além dos checks dos dois projetos.
- Preparar apenas migrations incrementais necessárias; **não aplicar migrations ou seeds na base corrente**.

## Acompanhamento da implementação

- [x] Busca e filtros no backend e interface.
- [x] Prévia de pagamento e proteção contra exportação de uma versão diferente da conferida.
- [x] Avisos de vencimento, reservas antigas e data exata de prorrogação.
- [x] Histórico autorizado e registro dos futuros encerramentos por participação.
- [x] Pré-validações estruturadas, reutilizando as políticas existentes.
- [x] Documentação, contratos, migrations incrementais necessárias e validações concluídas.

## Evidências de preparação

Em 2026-10-27, os dois repositórios estavam limpos. O fetch confirmou as bases atualizadas; o merge com `--ff-only` não precisou avançar commits. A branch `feature/peaad-melhorias-fluxo` foi criada em ambos. Nesta etapa foram criadas somente as branches e os planos; não houve alteração de código, migration, seed, commit ou push.


## Evidências de implementação — 2026-10-27

Os seis itens foram implementados na branch `feature/peaad-melhorias-fluxo` do frontend e backend. READMEs, OpenAPI e tipos gerados foram atualizados. Não houve commit ou push nesta entrega.

- Backend: `npm run check`, `npm test` (**488 testes aprovados**) e `npm run build`.
- Frontend: `npm run lint`, `npm run typecheck`, `npm test` (**153 testes, 39 arquivos**), `npm run build` e `npm run bundle:check`. Após o ajuste final dos campos incompletos na pré-validação, lint, tipos, testes do componente, build e orçamento foram repetidos com sucesso.
- Chromium: 19 cenários sintéticos distintos, incluindo desktop 1280 px e celular 390 px. Cobertura de declarações comuns/encaixe/exceção, permissões, configuração, prorrogação, filtros combinados, reserva antiga, histórico e impedimentos antes de confirmar; prévia/CSV e conflito exigindo novo clique.
- Integração real no navegador: fluxo completo de inscrição sem banco, convocação, ativação manual e liberação de vaga, com API e banco descartáveis.
- MariaDB 11.8.2 exclusivo em loopback:33319, schema vazio `insights_final_20261027_ft_test`, usuário sintético sem acesso à base do projeto. O harness aplicou migrations/seeds somente nesse schema e validou SQL, locks, última vaga concorrente, capacidade, rollback da ativação, exceções e encerramentos.
- SQL adicional: busca por nome atualizado e CPF com/sem máscara via hash, nome original preservado no detalhe, contagem antes da paginação, filtros de pagador/turno/situação/exceção, pré-validação sem eventos nem escrita e ativação com a própria reserva. Histórico restrito ao edital; prévia e CSV consistentes e versão antiga recusada.
- O índice `idx_ft_eventos_timeline` foi testado com up idempotente, down e novo up no banco descartável. Eventos futuros do scheduler por participação foram conferidos para expiração, cancelamento e conclusão.
- Testes de unidade cobrem limites inclusivos de 30 e 7 dias, Brasília na virada do dia, fim de mês e ano bissexto, prorrogação única e limite do edital, histórico legado incompleto e dados protegidos, pré-validação somente de leitura e descarte de respostas antigas. Prévia cobre totais globais com paginação, uma pessoa em múltiplos pagadores, proporcionalidade, vazio e alertas que permitem exportar.
- Testes HTTP conferem as permissões de cada modalidade de pré-validação, histórico e prévia; rejeitam bypass no corpo e paginação inválida. Pré-validação não gera auditoria de mutação.
- Logs e capturas locais em `.tmp/peaad-insights-*`, fora dos repositórios dos projetos. Ambiente disponível: Node 24.6.0; os projetos declaram Node 22. A validação específica em Node 22 continua a cargo do CI/ambiente de implantação.

## Implantação e operação

A única mudança de banco é a migration incremental `20261028120000-ft-workflow-timeline-index`, para o índice `(edital_id,recurso_id,createdAt,id)`. Nenhuma migration ou seed foi aplicada à base corrente. Nenhuma nova permissão ou concessão automática.

Seletores de pagador e turno respeitam as permissões já existentes de consulta dos respectivos cadastros. Os demais filtros e histórico usam as permissões das listas. A consulta auxiliar não substitui a autorização ou validação transacional da confirmação.

O aviso de reserva antiga não cancela vagas. A exportação mantém os nove campos originais e aceita alertas cadastrais; somente mudanças depois da conferência exigem atualizar a prévia e clicar novamente. Não foi reintroduzida atualização automática por foco nem consulta periódica.
