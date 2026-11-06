# Histórico de entregas no estoque e no bolsista

## Plano

- Reutilizar a aba Entregas do estoque como Histórico de entregas, preservando busca, filtros, paginação e Nova entrega.
- No detalhe de participações convocadas, ativas e encerradas, acrescentar abas Participação | Entregas na área de histórico. Inscrições isoladas mantêm somente a linha do tempo atual.
- Consultar exclusivamente o `participacao_id` selecionado, separando retornos da mesma pessoa; incluir estornadas por padrão.
- Compartilhar lista responsiva e detalhe com itens, tamanhos, quantidades, custos históricos, justificativa e estorno. Navegar no mesmo painel, sem sobreposição. No bolsista, somente consulta; estorno permanece no estoque.
- Usar `consultar_entregas_estoque` para a consulta, independentemente de permissão de entregar. Preservar as autorizações da tela de participação.
- Manter consultas/estados em hooks e transporte/tipos em serviços HTTP. Preservar contexto, invalidar após operações locais e ignorar respostas atrasadas. Carregamento e erros locais com nova tentativa; sem foco, polling ou carregamento global.
- Reutilizar listagem/detalhe existentes, sem novos endpoints, permissões, migrations ou seeds. Continuar na branch atual e não publicar.

## Validação

Cobrir lista/detalhe, kits/avulsos/estornos, vazio, filtros/paginação, IDs distintos em retornos, permissões, encerrados, respostas atrasadas e atualização após entrega/estorno. Conferir desktop/mobile, retorno e formulário preservado. Executar testes pertinentes, arquitetura, lint, tipos, build/orçamento e verificar o contrato HTTP utilizado.

## Progresso e evidências

- Confirmado: o backend já filtra entregas por `participacao_id`, antes da paginação, e permite consultar o detalhe com `consultar_entregas_estoque`.
- Confirmado: o estoque já lista entregas, mas sua apresentação está embutida na página. O detalhe do bolsista atualmente contém somente dados e a linha do tempo.
- Implementado: lista responsiva e detalhe compartilhados entre estoque e participação; abas Participação | Entregas, com autorização de consulta independente da entrega.
- O hook preserva filtros, página e seleção por participação, consulta ao abrir/retornar à seção e após operações locais, e descarta respostas atrasadas. Detalhes de outra participação são recusados. Não há foco/polling ou carregamento global.
- Entrega pelo bolsista invalida somente o histórico de materiais; não reinicializa nem consulta novamente a lista de participações. Consulta permanece disponível em edital/participação encerrados. O estorno continua restrito ao estoque.
- Frontend: **185 testes aprovados** (46 arquivos). A cobertura anterior à última ampliação passou com 184 testes, mantendo os limites existentes; os seis testes do hook e a suíte completa foram aprovados novamente após a revisão final.
- Navegador: **oito cenários novos aprovados**, cobrindo consulta por participação, retornos, snapshots, filtros/paginação, permissões, encerramento, nova tentativa, estorno e atualização após entrega; desktop 1280px e celular 390px. **20 cenários de regressão** de Editais/Estoque/Entregas também passaram. O teste de estoque antigo foi adaptado para os cartões no celular.
- Contrato HTTP: teste existente ampliado e aprovado para conferir negação sem permissão, consulta com somente `consultar_entregas_estoque`, IDs distintos, paginação/filtros e rejeição de UUID inválido. Backend `check` aprovado; nenhum endpoint ou implementação de persistência alterado.
- Frontend: `check:architecture`, `lint`, `typecheck`, `build` e `bundle:check` aprovados. Artefatos/logs locais ignorados em `.tmp`; evidências de navegador em `test-results`, sem dados reais.
- READMEs e planos atualizados na raiz, frontend e backend. Nenhuma migration/seed aplicada. Publicação Git das branches atuais autorizada posteriormente pelo usuário; sem deploy ou PR automático.
