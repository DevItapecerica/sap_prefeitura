# Comprovantes de entrega do PEAAD

## Plano aprovado

- Comprovantes sob demanda para kits, itens avulsos EPI ou não EPI e benefícios.
- Ações após entrega, nos históricos e detalhes do estoque, participação e edital.
- Identificar prefeitura, programa, edital, pessoa, CPF mascarado, entrega, data de Brasília e responsável.
- Materiais usam nome/tamanho/quantidade históricos, sem custos; benefícios usam nome/descrição históricos e competência.
- Assinaturas no papel do bolsista e responsável; entregas estornadas exibem aviso, data e motivo, sem declaração de recebimento vigente.
- Reemissão gera novamente, usando identificação atual da pessoa/edital e itens históricos. Sem persistir PDF nem assinatura.

## Contratos e arquitetura

- SAP: GET `/frente-de-trabalho/estoque/entregas/:id/comprovante`, com `consultar_entregas_estoque`.
- SAP: GET `/frente-de-trabalho/edital/:id/beneficios/entregas/:entregaId/comprovante`, com `consultar_edital`, `consultar_vinculos` e `consultar_entregas_beneficios`.
- API PDF: POST `/api/v1/comprovantes-entrega/render`, contrato tipado com modalidade, pessoa, edital, itens e estorno; responde PDF em memória.
- Backend monta e autoriza o documento por repositório específico ORM e caso de uso. O navegador fornece somente identificadores.
- Renderer/layout/fontes/paginação pertencem à API PDF; gateway HTTP em infraestrutura, timeout de 15 segundos e validação do PDF retornado.
- Factories nomeadas, controllers e rotas explícitas. Geração independente da transação de entrega.
- Frontend mantém componentes → hooks → serviços HTTP, carregamento/erro local e cancelamento de respostas atrasadas; sem foco/polling.
- API PDF usa o compilador AJV do Fastify como dependência direta para rejeitar campos extras e coerção no novo endpoint, sem alterar outros endpoints.

## Implementação e validação

- Implementados módulo de comprovantes, adapter ORM, gateway PDF, endpoint renderer e botão compartilhado.
- Históricos e detalhes compartilham a ação. Após entrega, a confirmação oferece o download quando há permissão de consulta.
- Testes backend: 513 aprovados; cobertura global 91,50% linhas, 90,54% branches, 94,14% funções.
- Testes API PDF: 37 aprovados; cobertura global final 96,70% linhas, 91,03% branches, 98,05% funções.
- Testes frontend: 223 aprovados, incluindo falhas, cancelamento, cliques repetidos e rotas dos downloads.
- Testes de PDF exercitam conteúdo, horário de Brasília, estorno, CPF mascarado, assinaturas, textos longos e múltiplas páginas.
- Navegador Chromium: seis cenários aprovados em desktop (1280px) e celular (390px), com API simulada. Os dois cenários novos foram reexecutados com teclado (Enter), recuperação de 502 e capturas de tela; ambos aprovados.
- Verificados preservação da página do histórico, destinatário, ausência de download automático e ações em participação encerrada. Os demais quatro cenários cobrem estornos, permissões e isolamento entre participações.
- Integração local real caso de uso SAP → gateway HTTP → API PDF → PDF: kits, avulsos e benefícios aprovados; indisponibilidade 503 do renderer mapeada para 502 e recuperação confirmada. Fonte de dados substituída por fake; nenhum banco utilizado.
- PDFs reais inspecionados visualmente para kit, benefícios estornados e documento extenso de quatro páginas; texto dentro das margens e assinaturas presentes. Quando assinaturas exigem página própria, repetir identificação da entrega, bolsista e declaração nessa página.
- Arquitetura aprovada nos três projetos; backend com tipos de código/scripts, ESLint, Prettier e build aprovados; frontend com tipos, lint, build e orçamento aprovados; API PDF com build/tipos aprovados (não há script próprio de lint).
- OpenAPI das duas APIs e tipos gerados do frontend atualizados. Confirmado que apenas novos endpoints foram acrescentados ao contrato SAP.
- Logs locais ignorados: `.tmp/receipt-back-coverage.log`, `.tmp/receipt-pdf-final-coverage.log`, `.tmp/receipt-front-tests.log`, `.tmp/receipt-browser-final.log` e `.tmp/receipt-browser-keyboard.log`. Amostras PDF e imagens ficam em `.tmp/receipt-*`; capturas do navegador em `front_prefeitura/test-results`.

## Limites

Sem migrations, seeds, novas permissões, mudanças financeiras, armazenamento de PDFs ou captura de assinatura. Sem commit, push ou publicação. Não executar alterações na base corrente. Testes de navegador usam API simulada; não equivalem a integração com banco ou serviço publicado.
