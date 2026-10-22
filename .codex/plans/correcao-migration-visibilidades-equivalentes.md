# Correção do precheck de visibilidade na migration de permissões

Plano integrado: `../codex/plans/correcao-migration-visibilidades-equivalentes.md` relativo à raiz deste repositório (workspace: `D:/Projetos/Node_React/prefeitura`).

- Escopo autorizado: tolerar duplicatas equivalentes de `(setor_id,service_id,visibility)` sem escrita/limpeza nessas linhas; recusar somente duplicatas conflitantes de visibilidade, incluindo NULL misturado com booleano.
- Preservar outras pré-checagens e retomada/idempotência do DDL; sem nova concessão para admin.
- TDD com `src/infra/database/sequelize/migrations/__tests__/visibility-precheck.test.ts`, regressão de diagnóstico e harness MariaDB real dedicado.
- Executar check, testes, cobertura, build, testes de segurança e integração DB/runtime; atualizar documentação com comportamento e resultados efetivos.
- Não alterar migrations históricas, base da aplicação, frontend, tags ou Git remoto. Sem commits nesta etapa.

## Resultado local confirmado

- RED: 8 regressões falharam com o bloqueio antigo; GREEN: teste focal + migration, 27 aprovados.
- Check, suíte completa (435 aprovados), cobertura, build e 20 testes de segurança: exit 0.
- Cobertura backend: lines/statements 94,19%; functions 96,67%; branches 90,91%.
- MariaDB 10.11 em container dedicado `sap-permissions-visibilities-test`, tmpfs e credencial restrita: instalação limpa, atualização populada, parcial, duplicatas equivalentes 1/0/NULL, conflitos incluindo NULL, reexecução, rollback, atomicidade e concorrência aprovados; comparação das linhas de visibilidade antes/depois sem alterações.
- Runtime persistido e geração OpenAPI SAP aprovados. Frontend/PDF não alterados nem revalidados nesta correção focal.
- Container descartável removido; containers da aplicação preservados. Não foi executada migration na base configurada pelo usuário.
- Branch mantida `feat/permissoes-modulo-recurso`, HEAD-base `28ec9a29bea9b840f1a8f8b486e3862b1485d592`; correção não commitada. Versão 2.2.2 sem tag/push/PR.
