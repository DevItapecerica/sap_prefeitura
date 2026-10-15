# Issue #37 — Plano do backend

## Banco e migração

- Adicionar `municipe_uuid` em `bolsistas`, `local` em `bolsistas_edital` e permitir nascimento nulo no banco.
- Criar `bolsistas_legacy_archive` como cópia integral e não exposta dos registros antigos.
- Criar script idempotente que normaliza CPF, reutiliza munícipe por `cpfHash`, cria ausentes com campos cifrados e copia o local para vínculos.
- Validar contagens, FKs e unicidade antes de remover nome, CPF, telefone, endereço, local e status de `bolsistas`.

## Domínio e API

- Atualizar associações e consultas para carregar `municipe`, `payment_info` e o vínculo relevante.
- Usar o estado/local de `bolsistas_edital` em elegibilidade, cancelamento, prorrogação, faltas, espelho e relatórios.
- Criar bolsista com `municipe_uuid` e pagamento; impedir troca posterior da identidade vinculada.
- Retornar munícipe aninhado e atualizar schemas OpenAPI, auditoria e tipos.

## Validação

- Cobrir migração vazia, criação/reuso/divergência, arquivo legado, idempotência e rollback.
- Cobrir CRUD, buscas, vínculos, limites, faltas e relatórios no modelo normalizado.
- Executar `npm run check`, `npm test`, `npm run test:coverage`, geração OpenAPI e `npm run build`.
