# Issue #39 - Backend

## Entregas

- Migration, model, repositório, CRUD, auditoria e OpenAPI de turnos.
- `turno_id` nullable em `bolsistas_edital`, obrigatório na aplicação para novos vínculos.
- Turno aninhado em vínculos, históricos e consultas de relatório.
- Constante `MAX_IDADE_VINCULO = 65` e validação na busca, no caso de uso e na transação.
- Endpoint de aniversariantes do mês para bolsistas com vínculo ativo.
- Migration e operações de criação, listagem e exclusão lógica de ocorrências.
- Horários dos relatórios obtidos do turno; legado exibido como não informado.

## Verificação

- Migration/rollback, CRUD e soft delete de turnos.
- Vínculos novos, edição, legado sem turno e turno excluído.
- Limites de idade, nascimento ausente e datas limítrofes.
- Aniversariantes, ocorrências, auditoria e relatórios.
- Check, testes, cobertura, OpenAPI e build.

## Correções de robustez

- Adicionar e preencher snapshots nullable do turno em `bolsistas_edital`.
- Usar o vínculo mais recente que intercepte o período nos relatórios individuais e em lote.
- Criar ocorrências por `bolsista_edital_id`, validando a propriedade do vínculo.
- Substituir a listagem integral de candidatos por cursor opaco e limite máximo de 50.
- Padronizar UUIDs das migrations, reexecução parcial, limites de entrada e datas de São Paulo.

## Retorno mensal, pagamento e faltas

- Liberar novo vínculo histórico com `CANT_DUPLICATE = false`, mantendo bloqueio de qualquer vínculo ativo.
- Bloquear retorno antes do mês seguinte com `CANT_REENTER_SAME_MONTH = true`, inclusive em candidatos e validação transacional.
- Tornar `data_vinculo` obrigatória nos candidatos e considerar históricos excluídos logicamente.
- Entregar todas as janelas válidas ao relatório, rejeitar sobreposição e preservar pagador, local e turno de cada período.
- Controlar o desconto de faltas por `DESCONTAR_FALTA = false`, com suporte testado ao modo `true`.
- Lançar novas faltas somente contra vínculo ativo e dentro de sua vigência.
