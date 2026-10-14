# Backend — pagadores e vínculo

## Banco

- Criar `pagadores` e a FK nullable `bolsistas_edital.pagador_id`.
- Semear os oito pagadores mockados, copiar valores reconhecidos, auditar inválidos e remover a coluna de `payment_info`.
- Implementar rollback protegido contra múltiplos pagadores por bolsista.

## Aplicação

- Criar agregado/repositório/serviço/controller/router de pagadores sob o serviço 6, com auditoria e soft delete.
- Validar unicidade, quantidade não negativa e redução compatível com a ocupação.
- Vincular cada bolsista com `local` e `pagador_id`, aplicando limite por edital dentro da transação.
- Remover o mock e o pagador de pagamento; incluir pagador nos vínculos e relatórios.
- Expor `GET /pagador/capacidade/:editalId` com total, ativos e disponíveis por pagador ativo, contando somente vínculos ativos do edital.
- Manter a validação transacional no vínculo como proteção contra concorrência.
- Permitir atualizar local e pagador de um vínculo ativo, sem contar o próprio vínculo ao validar a capacidade do destino e auditando antes/depois.

## Verificação

- Cobrir migração, CRUD, capacidade, lotes, históricos e relatórios.
- Cobrir edital inexistente, isolamento entre editais, pagador lotado e disponibilidade nunca negativa.
- Rodar `npm run check`, `npm test`, `npm run test:coverage`, `npm run openapi:generate` e `npm run build`.
