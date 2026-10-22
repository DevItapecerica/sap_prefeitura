# FT centrada no edital

## Objetivo e decisões
Edital é a entrada principal. Fluxo: inscrição interna -> convocação com reserva -> ativação manual com confirmação bancária. Base nova; nenhuma exclusão automática de banco.
- Configuração por edital: vigência, janela de inscrição em America/Sao_Paulo, vagas, capacidades dos pagadores, locais, turnos, cargas semanal e mensal independentes, auxílio, benefícios com nome/descrição, duração e uma prorrogação limitada.
- Parâmetros por edital para participação anterior em outros editais e retorno ao mesmo edital; ambos false inicialmente. Inscrições em vários editais são permitidas; apenas uma convocação/participação corrente por pessoa.
- Participação anterior conta somente quando houve ativação. Retorno permitido apenas no mês seguinte ao encerramento. Cancelamento antes da ativação não conta.
- Inscrição sem banco; requisitos: 18 anos até o limite inclusivo informado no edital, desemprego, sem renda/previdência, residência municipal de um ano, vulnerabilidade e aceite. Vínculo familiar somente booleano declaratório.
- Encaixe depois do prazo requer permissão e motivo, nunca depois da vigência. Sem autoinscrição pública, capacitação, documentos, classificação, cotas, preferências ou notificações.
- Convocado e ativo ocupam capacidade; cancelamento/expiração/conclusão liberam. Ativação manual; início corrigível. Vínculo e prorrogação nunca ultrapassam vigência.
- Condições bloqueadas após primeira convocação; capacidades não podem ficar abaixo da ocupação. Vigência só pode aumentar depois disso.

## Etapas
1. Branch feature/ft-centrada-no-edital nos repositórios front e back; registrar planos.
2. Migrations, modelos, regras e transações; permissões e auditoria.
3. HTTP, contratos e adaptação de relatórios/worker/scheduler, sem atalhos legados.
4. Frontend por edital: resumo, inscrições, convocados, participantes, configuração e relatórios.
5. Testes de regras, HTTP, banco descartável e fluxo de navegador; builds e documentação.

## Aceite
Reservas concorrentes não excedem vagas/capacidade. Banco obrigatório somente na ativação. Estados anteriores e histórico preservados. Convocados nunca geram pagamento/frequência. Testar permissões, isolamento de edital, prazo/encaixe, elegibilidade, repetição/retorno, prorrogação, relatórios e encerramento.
Não executar migrations/reset na base corrente. Instalar em schema vazio separado; implantar frontend/backend juntos.

## Progresso
- [x] Decisões de produto e leitura do edital PDF.
- [x] Branches criadas e planos registrados.
- [x] Implementação e validação; evidências abaixo.

## Resultado da implementação — 2026-10-22
- [x] Modelo, migration com precheck, reversão vazia e proteção do histórico.
- [x] Inscrição, encaixe, convocação, reserva atômica e ativação bancária manual.
- [x] Configurações por edital, parâmetros, prorrogação e encerramento/scheduler.
- [x] Permissões negadas por padrão, trilha durável e omissão de respostas/banco na auditoria de falhas.
- [x] Interface por edital, relatórios, downloads filtrados e PDFs por participação.
- [x] Contratos OpenAPI/tipos regenerados, documentação e harness descartável.
- [x] Backend: check/build e 445 testes; cobertura de linhas 94,49%, branches 90,31%, funções 95,26%, sem reduzir limiares.
- [x] Frontend: suíte completa de 134 testes e cobertura aprovadas; dois testes direcionados (incluindo a nova conversão de janela) aprovados; lint/typecheck/build e orçamento aprovados.
- [x] Integração SQL real: migrations/seeds, up/down/up vazio, recusa de rollback com dados, concorrência da última vaga, rollback bancário, relatórios, isolamento, prorrogação, cancelamento e scheduler.
- [x] Chromium com API e banco reais: criar/configurar/abrir edital, inscrever sem banco, convocar/reservar, ativar manualmente e cancelar/liberar vaga. Sem interceptação de rotas.
- Instância MariaDB de teste separada na porta 33317; API de teste em loopback:3117. Nenhum reset/migration executado na base da aplicação.
- Ambiente local de validação: Node 24.6.0 e MariaDB 11.8.2. A combinação Docker Node 22/MariaDB 10.11 não foi executada nesta estação; manter verificação no ambiente alvo antes da implantação.
- Implantação: preparar schema FT vazio, migrations/seeds e concessões explícitas das novas ações; publicar frontend/backend compatíveis juntos.


## Backend
Preservar munícipe/bolsista como identidade. Inscrição única pessoa/edital e múltiplas participações históricas. Usar IDs de participação nas mutações e histórico; estados convocado/ativo/cancelado/concluido/expirado.
Rotas sob /frente-de-trabalho/edital; configuração isolada por edital. Locks da identidade, edital e pagadores; validar capacidades e regras dentro da transação. Respostas paginadas e schemas estritos. Auditoria sem questionário ou dados bancários. Novas permissões negadas por padrão; atribuição explícita.
Migrations reversíveis para instalação limpa, sem conversão de dados antigos. Atualizar contrato canônico e documentação. Testar transações com MariaDB descartável opt-in; não usar .env da aplicação para testes destrutivos.



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

Validação desta extensão: backend com 451 testes aprovados e cobertura de linhas 94,51%, branches 90,60%, funções 95,15%; frontend com 141 testes aprovados. Cinco cenários Chromium com fixtures sintéticas (desktop/mobile/permissões) e um cenário completo com API e MariaDB reais aprovados. Check/build do backend e lint/typecheck/build/orçamento do frontend aprovados. Instância descartável encerrada ao concluir.

### Ajuste de abertura e local de trabalho — 2026-10-22

O edital pode ser aberto sem cadastrar pagadores, turnos ou locais previamente. Na convocação comum ou excepcional e na alteração da reserva, pagador e turno permanecem selecionáveis e o local é texto livre obrigatório, de até 255 caracteres. A API recebe `local` em vez de `local_id`; o texto é preservado na participação e nos relatórios. Locais antigos são preservados, sem necessidade de migration para esta alteração. As capacidades de pagador e as vagas do edital continuam verificadas na convocação e na ativação.

Validação antes dos commits do ajuste de local: check/build e 452 testes unitários do backend aprovados. Teste de abertura sem configuração e convocação/ativação com local livre incluído; nenhuma migration necessária.
