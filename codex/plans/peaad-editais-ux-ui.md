# Simplificação de UX/UI dos editais do PEAAD

Branch: `feature/peaad-estoque-epi`. Preservar estoque e alterações anteriores.

## Escopo aprovado

- Lista com busca por nome, situação e inscrições abertas, filtros no SQL antes da paginação; distinguir fase do prazo de inscrição. Tabela desktop e cartões mobile.
- Preservar contexto e histórico do navegador, URL `/services/:id/ft-app/editais/:editalId`, abas Editais | Estoque e contexto anterior ao alternar.
- Organizar o detalhe em Visão geral | Pessoas | Configurações | Relatórios por permissão. Cabeçalho compacto; indicadores e atalhos de vagas somente na visão geral.
- Cadastro em três passos: identificação/prazos (Brasília), condições, conferência. Validar cada passo, manter valores em falhas e salvar uma única vez como rascunho. Idade máxima sem padrão.
- Configurações de condições/pagadores/turnos/benefícios, edição lateral local, sem perder página. Detalhe expõe campos bloqueados e mínimos de vagas/vigência pela mesma política transacional de atualização. Preenchimento inicial da idade preservado.
- Não exigir pagadores/turnos para abrir edital; pendências apenas preparam convocação. Abertura denominada Abrir edital. Encerramento secundário informa ativos concluídos/convocados cancelados, mantendo bloqueios financeiros.
- Pessoas com Inscrições (registro), Convocados, Ativos e Encerrados (participações, incluindo retornos distintos), sem combinar permissões de leitura.
- Busca por nome/CPF, filtros adicionais recolhidos com contagem; estado por visão/edital; atualização após operações sem remontar listas. Colunas compactas, cartões mobile, próxima ação e menu secundário.
- Dados e histórico lado a lado desktop/empilhados mobile; painel único alterna detalhe/operação com retorno, sem botão exclusivo de histórico.
- AutoComplete remoto de munícipe com identidade/nascimento preservados; consultar detalhe autorizado. Troca de pessoa limpa residência e declarações. Reutilizar cadastro municipal dentro do fluxo.
- Inscrição comum/encaixe/exceção no mesmo formulário por permissões e justificativas independentes. Declarações começam desmarcadas/vermelhas; família opcional.
- Convocação sequencial com capacidade, turno, local textual, início e pré-validação contextual. Ativação mostra alocação e pede início/banco textual. Prorrogação somente leitura com data exata.
- Relatórios em Pagamento | Presença e faltas | Arquivos gerados. Mês único; situação de folha; prévia/fechamento autorizado ou consulta/CSV preservado. CSV de nove colunas, irreversibilidade e conflito de versão mantidos. Conferência mobile por cartões; PDFs/arquivos manuais.
- Remover carregamento global apenas das operações deste fluxo, mantendo demais formulários. Não alterar autenticação/foco, não adicionar polling.
- Backend: filtros de fase/inscrições abertas e grupo encerrados antes da paginação, metadados de edição. Preservar endpoints, autorizações, transações e regras.
- Sem novas permissões, migrations ou seeds. Não aplicar migrations/seeds na base corrente.

## Validação prevista

Navegação e links diretos/voltar/avançar/contexto; permissões; wizard/datas/limites/erros; filtros e contagens SQL/retornos; inscrição/encaixe/exceções/convocação/ativação/prorrogação/encerramento; declarações/idade/capacidade/folha fechada; desktop/mobile/teclado/foco/carregamento local. Testes, tipos, lint disponível, builds, orçamento e integração pertinente em banco descartável. Atualizar READMEs, OpenAPI e tipos.

## Progresso e evidências

Implementado em 03/11/2026 na branch `feature/peaad-estoque-epi`, preservando o estoque e as alterações anteriores.

- Navegação com URL de edital, retorno por histórico e contexto entre Editais/Estoque; filtros SQL de fase/prazo; listas/cards responsivos.
- Cadastro em três passos, único POST final, confirmação de rascunho, validação entre datas e manutenção dos valores em falhas. Painel PrimeReact com carregamento local, sem o Modal global.
- Política compartilhada de edição em `edital-editing.policy.ts`: motivos por campo, mínimo de vagas e limite de redução da vigência; preservação do preenchimento inicial da idade.
- Pessoas unifica as quatro visões por permissão, com filtros/páginas por visão/edital, atualizações por revisão sem usar a revisão como chave dos componentes, menu secundário, detalhe/timeline e retorno das operações no painel.
- AutoComplete municipal autorizado, confirmação do nascimento no detalhe, troca limpa residência/declarações, modos comum/encaixe/exceção e cadastro municipal inline sem sobrepor modais. Campos bancários continuam textuais.
- Relatórios agrupados, situação mensal da folha, conferência desktop/mobile e snapshots/CSV/fechamento irreversível preservados.
- OpenAPI na API/raiz e tipos gerados atualizados; READMEs dos três diretórios atualizados. Nenhuma alteração em autenticação, listener de foco ou polling. Nenhuma nova permissão, migration ou seed nesta revisão.

### Checks

- Backend: **511 testes aprovados**; `npm run check` e `npm run build` aprovados. Sem script de lint no backend.
- Frontend: **170 testes em 44 arquivos aprovados**; lint, tipos, build e orçamento aprovados.
- Playwright: **14 casos com API simulada** (6 de editais/cadastro municipal, 3 regressões de estoque e 5 de pagamento), incluindo desktop 1280px e celular 390px. **1 integração real** com Fastify/MariaDB descartáveis aprovada: rascunho/configuração/abertura, inscrição comum/excepcional, convocação/ativação e cancelamento.
- Conferidos erros locais, retenção dos dados, foco sem novas requisições, separação das permissões de inscrição/vínculos, links diretos e voltar/avançar. Capturas desktop/mobile inspecionadas e largura lateral/indicador mobile corrigidos.
- Banco exclusivo em `127.0.0.1:33324`, schema inicialmente vazio `editais_20261103_ft_test`, usuário restrito `editais_test`. Harness completo aprovado, incluindo filtros/contagens SQL, fase versus janela, abertura sem pagadores/turnos, metadados, páginas de participações encerradas/retornos, concorrência, folha fechada e estoque.
- Logs na raiz: `.tmp/editais-back-tests-final.log`, `.tmp/editais-back-build.log`, `.tmp/editais-front-tests-final.log`, `.tmp/editais-front-{lint,types,build,budget}.log`, `.tmp/peaad-editais-db/test.log`, `.tmp/editais-browser-final.log`, `.tmp/editais-browser-verified.log` e `.tmp/editais-browser-real2.log`.
- Capturas em `.tmp/editais-browser-verified`; regressões de estoque/pagamento em `.tmp/editais-browser-final`; integração real em `.tmp/editais-browser-real2`.
- Migrations/seeds executadas exclusivamente pelo harness no schema descartável. A base corrente não foi alterada. Serviços temporários encerrados ao concluir; sem commits/push nesta solicitação.
