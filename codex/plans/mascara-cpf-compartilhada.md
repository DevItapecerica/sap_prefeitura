# Classe compartilhada de máscara de CPF

## Objetivo e implementação

- Centralizar a apresentação parcial de CPF em `core/utils/cpf-mask.ts`, no backend, seguindo o padrão de classe com métodos estáticos já usado pelas presentations.
- `CpfMask.middleDigits`: formato dos comprovantes, como `***.234.567-**`.
- `CpfMask.lastThreeDigits`: formato das respostas minimizadas de Munícipes e Esportes, como `********789`.
- Normalizar pontuação antes de ocultar os dígitos, preservando zeros iniciais. CPFs sem onze dígitos, ausentes ou já mascarados recebem ocultação integral, sem revelar dígitos adicionais.
- Substituir a lógica local do caso de uso de comprovantes e da apresentação de munícipes. Esportes reutiliza a classe por sua apresentação compartilhada de munícipes.
- Corrigir a exposição do CPF pontuado na expressão anterior de Munícipes, sem ampliar os dados mostrados nas respostas.
- Preservar os mappers de criptografia e os CPFs completos nos fluxos autorizados, hashes, validação, persistência, relatórios e CSVs. A classe só apresenta dados; não valida dígitos verificadores.

## Validação e limites

- Testes unitários para ambos os formatos, pontuação, espaços, zeros iniciais, ausências, tamanhos inválidos e valores previamente mascarados.
- Regressões de Munícipes e Esportes verificam CPF pontuado e preservação do objeto de domínio; testes existentes de comprovantes verificam o valor enviado à API PDF.
- Backend: 517 testes aprovados; cobertura global 91,51% de linhas, 90,56% de branches e 94,17% de funções. Tipos de código/scripts, arquitetura, lint, formatação e build aprovados. Evidências em `.tmp/cpf-mask-coverage.log` e `.tmp/cpf-mask-format.log`.
- Sem alterações no frontend, API PDF, banco, permissões, migrations ou seeds. Sem commit ou publicação.
