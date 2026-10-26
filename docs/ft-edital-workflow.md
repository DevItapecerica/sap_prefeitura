# FT centrada no edital

O edital reúne inscrições, convocações, participantes, pagadores, turnos, locais, benefícios e relatórios. A identidade pessoal continua em munícipes; o bolsista é somente a referência reutilizável dessa pessoa em FT.

## Implantação em base nova

Esta versão exige frontend e backend compatíveis e **base FT vazia**. A migration `20261022120000-ft-edital-workflow` recusa execução quando há editais existentes. Ela não apaga dados, não converte participações antigas e não usa `sync({force:true})`. Prepare um schema novo e aponte `DATABASE_URL` para ele antes de executar `npm run migrate` e os seeds de instalação. Preserve a base anterior até validar a nova instalação. Não remova entradas da `SequelizeMeta` para contornar o precheck.

O rollback só é permitido antes de cadastrar editais/inscrições; depois disso, a migration recusa perder o novo histórico e exige forward-fix. O harness valida up/down/up em base descartável antes dos seeds e a recusa de rollback depois da utilização.

As novas permissões começam negadas, inclusive para roles que possuíam CRUD legado. Um gestor com acesso à administração de permissões deve concedê-las explicitamente. Não há bypass por nome de role. O frontend exige `ft:consultar_edital`; consulta e cadastro de munícipes também dependem das permissões do módulo `municipes`.

## Configuração e ciclo de vida

Cadastre o edital como rascunho e configure publicação, vigência, abertura/fim das inscrições, vagas, dia de pagamento, auxílio mensal, cargas semanal/mensal independentes, duração em meses e período fixo de uma prorrogação. Os parâmetros `permitir_participacao_anterior` e `permitir_retorno` começam false.

Pagadores e turnos pertencem ao edital; locais e benefícios têm tabelas próprias com FK para ele. Cada pagador possui capacidade. Benefícios têm nome e descrição, sem valor calculado ou controle de entregas. A abertura do edital não exige configuração prévia. Pagador e turno devem estar cadastrados ao convocar; o local de trabalho é informado como texto livre nessa etapa. Turnos devem terminar após seu horário de início; turnos que atravessam a meia-noite não são contemplados nesta versão.

Após a primeira convocação, auxílio, benefícios, cargas, duração, parâmetros e horários ficam bloqueados. Nomes referenciados também ficam bloqueados para preservar relatórios. É possível ampliar a vigência e ajustar vagas/capacidade sem ficar abaixo da ocupação. O período de inscrição tem operação e permissão próprias, com justificativa auditada.

O fluxo é:

```text
Edital: rascunho -> aberto -> encerrado
Inscrição: inscrito -> convocado -> ativo -> concluido/cancelado/expirado
                       \-> cancelado antes da ativação
```

O estado de inscrição é mantido separadamente; cada nova tentativa de convocação cria uma participação histórica. Cancelar uma convocação não apaga a inscrição. Reservas são feitas na convocação e convertidas em ocupação na ativação, sem consumir uma segunda vaga.

## Inscrições e ativação

A inscrição é interna, com seleção/cadastro de munícipe e respostas fixas: desemprego, renda, benefício previdenciário, início da residência municipal, vulnerabilidade atestada, booleano de beneficiário familiar e aceite. Respostas e snapshot são cifrados; os eventos não incluem questionário nem dados bancários.

São exigidos idade de 18 anos até o limite inclusivo informado no edital, desemprego, ausência de renda/previdência, residência em Itapecerica da Serra por um ano e declaração de vulnerabilidade/aceite. O booleano familiar é declaratório, sem cruzamento automático de famílias. Não há seleção automática, preferências, cotas, capacitação, documentos ou inscrição pública nesta etapa.

A inscrição respeita a janela em Brasília. Encaixe permite cadastrar após seu fim com permissão e motivo; não permite antecipar a janela, ignorar requisitos ou cadastrar em edital encerrado/fora da vigência. Uma pessoa pode se inscrever em diversos editais, mas só pode estar convocada/ativa em um deles por vez.

Na convocação, selecione pagador, local, turno e data de início. Convocados e ativos ocupam vagas do edital e capacidade do pagador. A operação usa locks e valida as capacidades dentro da transação. Quando a repetição está proibida, somente participações que chegaram à ativação em outro edital impedem a convocação; cancelamento prévio sem ativação não impede.

Na ativação manual, informe/confirme banco, agência/dígito e conta/dígito. É possível corrigir a data de início; o período deve caber na vigência. Preencher o banco isoladamente não muda o estado. A alocação pode ser corrigida enquanto convocado e fica bloqueada após ativar, preservando os relatórios.

Uma única prorrogação aplica integralmente o período em meses cadastrado no edital, contado do término atual da participação e limitado ao último dia de vigência do edital. O fim de mês é ajustado para o último dia válido. Retorno ao mesmo edital exige o parâmetro habilitado e só pode ocorrer a partir do mês seguinte ao encerramento anterior. Cancelamento/conclusão exigem motivo; encerramento do edital cancela reservas pendentes e conclui ativos. O scheduler também encerra editais e expira participações vencidas.

## HTTP e permissões

Prefixo: `/api/v2/frente-de-trabalho/edital`. As listas usam `page` baseado em zero e `limit` de 1 a 50 e respondem `{rows,count}`. As mutações do workflow respondem `200`. IDs são UUIDs; corpos rejeitam propriedades extras e coerção de tipos.

| Operação | Rota relativa | Permissão `ft` |
| --- | --- | --- |
| Consultar/criar/editar edital | `GET/POST /`, `GET/PUT /:id` | `consultar_edital`, `cadastrar_edital`, `editar_edital` |
| Abrir/encerrar | `POST /:id/abrir`, `POST /:id/encerrar` | `editar_edital`, `encerrar_edital` |
| Janela de inscrição | `PUT /:id/janela-inscricoes` | `alterar_janela_inscricoes` |
| Configurações | `/:id/pagadores`, `/:id/turnos`, `/:id/locais`, `/:id/beneficios` | CRUD correspondente para pagador/turno; `consultar_configuracao_edital` e `editar_configuracao_edital` para local/benefício |
| Consultar/inscrever | `GET/POST /:id/inscricoes` | `consultar_inscricoes`, `cadastrar_inscricao` |
| Encaixe | `POST /:id/inscricoes/encaixe` | `encaixar_inscricao` |
| Inscrever por exceção | `POST /:id/inscricoes/excecao` | `cadastrar_inscricao_excecao` |
| Convocar | `POST /:id/inscricoes/:inscricaoId/convocar` | `convocar_inscrito` |
| Convocar por exceção | `POST /:id/inscricoes/:inscricaoId/convocar-excecao` | `convocar_inscrito_excecao` |
| Consultar participações | `GET /:id/participacoes` | `consultar_vinculos` |
| Ativar | `POST /:id/participacoes/:participacaoId/ativar` | `ativar_participacao` |
| Cancelar/concluir | `POST /:id/participacoes/:participacaoId/cancelar` ou `/concluir` | `cancelar_participacao` |
| Prorrogar/alocar | `POST /:id/participacoes/:participacaoId/prorrogar` ou `/alocar` | `prorrogar_vinculo`, `editar_vinculo` |
| Faltas/ocorrências | `/:id/participacoes/:participacaoId/faltas` ou `/ocorrencias` | Consulta/registro/exclusão correspondentes |
| PDF individual | `GET /:id/participacoes/:participacaoId/espelho-ponto` ou `/folha-presenca?mes=AAAA-MM` | `gerar_espelho_ponto`, `gerar_folha_presenca` |

Todas as operações também exigem JWT, `ft:acessar` e visibilidade pelo setor. As antigas escritas globais de bolsistas, pagadores e turnos retornam `410`; não permitem saltar inscrição/convocação. Os detalhes dos corpos estão no OpenAPI canônico.

Faltas e ocorrências são identificadas pela participação. Convocados e cancelados sem ativação não geram pagamento/frequência/PDF. Participações encerradas permanecem nos relatórios do seu período. A fila de ZIPs existente continua disponível; `GET /api/v2/frente-de-trabalho/relatorio/downloads?edital_id=UUID` filtra os arquivos do edital. Faltas continuam informativas por padrão.

## Verificação reproduzível

Execute os testes unitários, cobertura, check e build. Para integração real, prepare um **schema vazio e descartável** em MariaDB local com usuário restrito a ele. O nome deve terminar em `_ft_test`. O harness recusa root, hosts remotos, query/fragmento e schema com tabelas; nunca herda a URL da aplicação para escolher o alvo e nunca executa DROP/reset.

```powershell
# Defina FT_WORKFLOW_TEST_URL no ambiente apontando somente ao schema descartável.
$env:FT_WORKFLOW_TEST_ALLOW_CREATE = 'YES'
npm run test:ft:db
```

O harness executa migrations/seeds e testa concorrência da última vaga, rollback de ativação, relatórios, prorrogação única, isolamento, participação anterior, cancelamento e encerramento. Também verifica que as novas permissões começam negadas e que rollback não destrói o histórico.

Para o teste de navegador, execute o harness em outro schema vazio com `FT_WORKFLOW_TEST_SERVE=1`. Ele habilita explicitamente as permissões de uma fixture sintética e escuta somente em `127.0.0.1:3117`, sem workers. No frontend:

```powershell
$env:FT_WORKFLOW_E2E_DISPOSABLE = '1'
npm run e2e:ft
```

O Playwright sobe o Vite de teste em `127.0.0.1:4173`; o proxy é fixo para a API descartável. O teste verifica o marcador do schema antes de usar a fixture, não intercepta rotas e mantém trace/vídeo/screenshots desligados. Sem opt-in, informa skip, que não comprova integração.

Planos: [backend](../codex/plans/ft-centrada-no-edital.md), [frontend](../../front_prefeitura/codex/plans/ft-centrada-no-edital.md) e [geral](../../codex/plans/ft-centrada-no-edital.md).


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
