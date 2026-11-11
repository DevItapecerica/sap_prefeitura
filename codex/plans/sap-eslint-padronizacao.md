# ESLint e padronização do backend SAP

## Plano

- Continuar na branch atual e preservar alterações existentes, sem commit ou push.
- Usar Permissões como referência: dois espaços, aspas duplas, ponto e vírgula, vírgulas finais, largura 80, UTF-8 e LF.
- Adotar ESLint flat com JavaScript/TypeScript recomendado e ambiente Node; Prettier separado, sem conflito entre ferramentas.
- Abranger código, testes, scripts, configurações, migrations e seeds; respeitar CommonJS em `.sequelizerc`.
- Ignorar dependências, builds, cobertura, caches e artefatos gerados/OpenAPI.
- Inventariar erros antes das correções; separar formatação de correções semânticas e preservar efeitos colaterais.
- Manter `any` existente e não habilitar lint com informação de tipos nesta etapa.
- Criar lint/lint:fix/format/format:check, integrar checagens à CI e documentar no README.
- Executar lint, formatação, arquitetura, tipos, cobertura e build; conferir idempotência e compatibilidade.
- Não executar migrations/seeds ou alterar frontend/API PDF.

## Evidências

- Estado inicial: branch `develop`, sem alterações pendentes no backend. Nenhuma configuração ESLint/Prettier ou script lint anterior.
- Referências lidas: factories e rotas do módulo `permission`, configuração TypeScript, scripts de arquitetura e workflow Quality.
- Inventário inicial: 72 erros (46 `no-unused-vars`, 22 `no-empty-object-type`, quatro `prefer-const`). Inventário de formatação: 721 arquivos, incluindo diferenças de final de linha.
- ESLint 10 e regras recomendadas JS/TypeScript, sem lint dependente de tipos; Prettier separado. `.sequelizerc` mantém parser Babel e ESLint CommonJS. `.editorconfig` e `.gitattributes` fixam UTF-8/LF nos editores e LF nos checkouts.
- Convenções explícitas: parâmetros contratuais sem uso usam `_`; `ignoreRestSiblings` preserva projeções que descartam dados internos. Sem isenções por módulo ou para variáveis locais comuns. `no-explicit-any` permanece desativado conforme o plano aprovado.
- Correções não estilísticas: imports/constantes/fake sem uso removidos; `await service.config` mantido mesmo sem consumir seu retorno; parâmetros contratuais renomeados; declarações `const`; tipos de parâmetros HTTP vazios expressos como `Record<string, never>`. Contratos públicos e strings preservados.
- Comparação sintática dos 704 arquivos de código, normalizando parênteses e aspas em nomes de propriedades: 32 arquivos com correções além de estilo; nenhuma alteração sintática em migrations/seeds. Revisão isolada em `.tmp/sap-lint-syntax-review.json`.
- CI Quality passa a executar `npm run lint` e `npm run format:check` antes das checagens existentes. README documenta estilo, comandos, abrangência e convenções.
- Baseline: 506 testes aprovados; linhas/statements 92,57%, branches 90,57%, funções 95,97%.
- Após padronização: 506 testes aprovados; linhas/statements 92,50%, branches 90,57%, funções 95,97%, preservando todos os limites. Mudança no percentual de linhas decorre da reformatação; contagens de branches e funções mantidas.
- Arquitetura aprovada (sete testes do verificador e fronteiras), tipos de src/scripts e build aprovados.
- Instalação limpa por `npm ci` aprovada com Node 22.23.4. Dependências diretas e versões transitivas de produção preservadas; versões adicionais exigidas pelo ESLint isoladas sob o pacote de desenvolvimento no lockfile.
- Sondas locais verificam a detecção de variáveis sem uso, parâmetros contratuais, projeções por rest, exclusão de gerados e CommonJS de `.sequelizerc`.
- Consolidação final concluída: `npm run lint` sem erros/avisos, `npm run format:check`, arquitetura, tipos src/scripts e build aprovados. Segunda execução de `npm run format` não alterou nenhum hash dos arquivos versionáveis.
- Cobertura repetida após instalação limpa com o lockfile final: 506 testes aprovados, zero falhas; linhas/statements 92,50%, branches 90,57%, funções 95,97%.
- `git diff --check` aprovado, contratos gerados sem alterações e dependências de produção preservadas. Frontend/API PDF não foram alterados nesta entrega.
- Branch `develop` mantida conforme o estado inicial. A implementação foi concluída sem migrations/seeds, staging ou publicação; posteriormente o usuário autorizou a separação em commits. Logs e sondas de revisão ficam em `.tmp/sap-lint-*`, `.tmp/sap-eslint-*` e `.tmp/sap-format-*` no workspace.
- Entrega separada em quatro commits: configuração das ferramentas; formatação pura; correções de lint; integração na CI e documentação. A separação foi feita pelo index, preservando o conteúdo validado do working tree. Push não solicitado e não executado.
