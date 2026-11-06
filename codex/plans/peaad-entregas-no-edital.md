# Entregas de materiais pelo bolsista no edital

Branch: `feature/peaad-estoque-epi`. Data: 04/11/2026.

## Plano aprovado

- Botão Entregar nas participações das visões Convocados e Ativos e em seus detalhes. Destinatário e edital fixos, usando o ID da participação atual, inclusive em retornos.
- Formulário reutiliza a entrega do estoque, em modo integrado ao painel lateral existente. Oferecer Kit completo de EPI e Item avulso por permissão; preferência inicial pelo kit quando autorizado. Sem sobrepor janelas.
- Preservar retorno ao detalhe/lista, filtros, páginas, seleção e confirmação de sucesso.
- Manter kit integral, escolha de tamanhos, saldo, resumo de custos e um kit não estornado por participação. Item avulso aceita EPI ou não EPI, quantidade positiva e justificativa obrigatória.
- Exigir consultar_estoque e consultar_vinculos, além da ação entregar_kit_epi e/ou entregar_item_estoque. Modalidades não autorizadas não aparecem.
- Desabilitar para edital encerrado/fora da vigência ou participação ativa vencida, mostrando o motivo. Prévia e gravação continuam validando no backend.
- Reutilizar endpoints, idempotência, auditoria e transações existentes. A página Estoque continua permitindo selecionar destinatários.
- Sem novas permissões, migrations, seeds ou mudanças na folha. Carregamento local, sem foco/polling.
- Registrar plano/evidências na raiz, frontend e backend e atualizar README do frontend. Backend não exige alterações funcionais nem contratos novos.

## Validação

- Destinatário fixo sem consulta à listagem de pessoas; ID da participação correto e distinto em retornos; modalidades por permissão.
- Kit completo, tamanho sem saldo, segundo kit, justificativa e quantidade do item avulso, erros preservando dados e chave de operação.
- Prévia recusada, respostas antigas, cliques repetidos e preservação das validações definitivas existentes.
- Convocados/ativos, encerrados, edital fora da vigência e ativos vencidos, usando datas civis de Brasília.
- Navegador desktop/mobile, detalhe → entrega → detalhe, ausência de sobreposição/global loading/foco/polling e regressão da página Estoque.
- Testes pertinentes do frontend, lint, tipos, build e orçamento. Nenhuma migration/seed na base corrente.

## Progresso e evidências

Implementado em 04/11/2026, preservando a branch e as alterações existentes.

- Entregar nas visões Convocados/Ativos e no detalhe; identificação por participação, destinatário fixo, modalidades por permissão, mesmo painel e retorno ao contexto.
- Formulário compartilhado com modos `participacao` predefinida/`inline`; o modo original do Estoque mantém a busca de destinatários. Sem consulta a `/destinatarios` no fluxo integrado.
- Motivos de indisponibilidade seguem datas civis de Brasília, incluindo limites inclusivos de vigência/vencimento; prévia e gravação continuam definitivas no backend.
- Carregamento local comunicado ao painel, bloqueio de cliques repetidos e preservação de dados/chave idempotente após falhas. Nenhuma atualização por foco/polling.
- **12 testes direcionados aprovados**: integração do formulário, modalidades, dados preservados, prévia recusada, respostas atrasadas, ID do retorno e limites de datas.
- **20 testes Playwright aprovados**: 11 novos de entrega pelo edital + 6 regressões de editais + 3 regressões do Estoque, incluindo 1280px/390px. Capturas inspecionadas, um único painel e ausência de diálogo sobreposto.
- Lint, tipos, build e orçamento do frontend aprovados.
- Logs: `.tmp/entregas-edital-unit.log`, `.tmp/entregas-edital-browser.log`, `.tmp/entregas-edital-{lint,types,build,budget}.log`; capturas em `.tmp/entregas-edital-browser`.
- Backend funcional, endpoints, permissões e contratos reutilizados; sem necessidade de codegen, migration ou seed nesta entrega. Nenhuma migration/seed aplicada à base corrente.
- Suíte completa do frontend aprovada: **175 testes em 44 arquivos**. Log: `.tmp/entregas-edital-tests.log`.
- Servidor Vite temporário de testes encerrado ao concluir. Sem commits ou push nesta solicitação.
