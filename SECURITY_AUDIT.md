# Auditoria de Segurança - sap_prefeitura

## Data: 2025
## Escopo: Módulo de Chamados + Infraestrutura Geral

---

## ✅ Pontos Positivos

### 1. **Autenticação JWT (Forte)**
- ✅ Token obrigatório em header `Authorization: Bearer <token>`
- ✅ Validação de token no middleware `AuthMiddleware.verifyJWT`
- ✅ Rejeição clara com erro 401 se token ausente ou inválido
- ✅ Payload decodificado anexado a `request.user` para uso em contexto de requisição

**Localização**: [src/modules/auth/auth.middleware.ts](src/modules/auth/auth.middleware.ts)

### 2. **Autorização Role-Based (Forte)**
- ✅ Factory pattern `authorizationFactory` implementa verificação de permissões por serviço
- ✅ Cada rota do módulo chamados verifica `CHAMADOS_SERVICE_ID` (12)
- ✅ Integração com módulo `acess-controll` centraliza lógica de autorização
- ✅ Método HTTP verificado para granularidade fina

**Localização**: [src/modules/acess-controll/factory/makeAuthorization.ts](src/modules/acess-controll/factory/makeAuthorization.ts)

### 3. **CORS Configurado (Correto)**
- ✅ Whitelist de origem definida via variável `CORS_ORIGINS` em `.env`
- ✅ Métodos explicitamente permitidos: GET, POST, PUT, DELETE (sem CONNECT, TRACE, etc.)
- ✅ Headers necessários incluídos (Content-Type, Authorization)
- ✅ Credentials definido como false (apropriado para API stateless)

**Localização**: [src/core/plugin/Cors.ts](src/core/plugin/Cors.ts)

### 4. **SQL Injection Prevention (Forte)**
- ✅ ORM Sequelize usado exclusivamente para queries (não SQL raw)
- ✅ Validação de existência (user, setor) via repository pattern
- ✅ Parameterização automática pelo Sequelize

**Localização**: [src/modules/chamados/application/use-case/chamado.service.ts](src/modules/chamados/application/use-case/chamado.service.ts)

### 5. **Validação de Input (Melhorado)**
- ✅ Schemas JSON Fastify definem tipos e ranges
- ✅ Campos obrigatórios especificados (`required: [...]`)
- ✅ Enum validation para status, tipo, prioridade
- ✅ Service-layer validation duplica checks para double-assurance

**Localização**: [src/modules/chamados/interface/router/chamado.router.ts](src/modules/chamados/interface/router/chamado.router.ts)

### 6. **Error Handling (Apropriado)**
- ✅ Classe `AppError` padroniza mensagens de erro com código e status HTTP
- ✅ Não expõe stack traces em resposta (apenas message/code/statusCode)
- ✅ HTTP hooks (`ErrorHook`) tratam erros globalmente

**Localização**: [src/core/appError.ts](src/core/appError.ts)

### 7. **Type Safety (TypeScript)**
- ✅ Tipagem forte em DTOs e entities previne manipulação de tipos
- ✅ Conversão explícita de IDs (string → number) com validação
- ✅ Compilation check passa sem erros (`npm run check`)

---

## ⚠️ Áreas de Atenção (Recomendações)

### 1. **Rate Limiting (NÃO IMPLEMENTADO)**
**Risco**: DDoS, brute force em autenticação
**Recomendação**:
```bash
npm install @fastify/rate-limit
```
Adicionar plugin em `src/server.ts`:
```typescript
await fastify.register(import("@fastify/rate-limit"), {
  max: 100,
  timeWindow: "15 minutes"
});
```

### 2. **Logging de Dados Sensíveis (OBSERVADO)**
**Risco**: Exposição em logs de: senhas, tokens, PII
**Observado**: 
- ❌ `console.log()` e `logger.info()` em múltiplos arquivos pode expor dados sensíveis
- ✅ Não há evidência de logging de tokens/senhas em verificação spot

**Recomendação**: Implementar logger com sanitização de campos sensíveis

### 3. **PATCH /chamados/:id/assign (Mudança de Comportamento)**
**O que foi feito**:
- ✅ Antes: aceitava `responsavelId` no body (risco de assinalhar outro usuário)
- ✅ Agora: extrai `userId` do JWT autenticado (seguro)
- ✅ Responsável recebe automaticamente o chamado (não requer body)

**Segurança**: Modelo agora garante que usuário só se auto-atribui

### 4. **Validação de Relações (IMPLEMENTADO)**
**O que foi feito**:
- ✅ `solicitanteId`: validado que usuário existe em user module
- ✅ `setorId`: validado que setor existe em setor module  
- ✅ `responsavelId`: validado que usuário existe (se fornecido)

**Impacto**: Previne referências órfãs e integridade de dados

### 5. **XSS Prevention (Delegado ao Frontend)**
**Status**: Framework React + Content-Type JSON mitigam risco
- ✅ Respostas sempre `application/json` (não HTML renderizado)
- ✅ Frontend responsável por sanitizar se renderizar dados

**Recomendação**: Frontend adicionar DOMPurify ou sanitização similar

---

## 🔍 Checklist de Segurança para Produção

- [ ] Variável `CORS_ORIGINS` em `.env` com origens específicas (nunca `*`)
- [ ] Rate limiting ativado (`@fastify/rate-limit`)
- [ ] HTTPS/TLS forçado (reverse proxy nginx/traefik)
- [ ] Logging centralizado sem dados sensíveis (ELK/Datadog)
- [ ] Secrets (`JWT_SECRET`, DB_PASSWORD`) em vault (Vaults/AWS Secrets Manager)
- [ ] Backup automático do banco de dados
- [ ] Monitoramento de falhas de autenticação
- [ ] WAF (Web Application Firewall) em frente da API
- [ ] Testes de penetração (OWASP Top 10)
- [ ] Compliance: LGPD (se BR), GDPR (se EU)

---

## 📊 Resumo de Risco

| Área | Nível | Status |
|------|-------|--------|
| Autenticação | 🟢 Baixo | JWT validado, Bearer token obrigatório |
| Autorização | 🟢 Baixo | Role-based com factory pattern |
| SQL Injection | 🟢 Baixo | Sequelize ORM, sem raw queries |
| CORS | 🟢 Baixo | Whitelist configurável |
| Rate Limiting | 🟡 Médio | NÃO IMPLEMENTADO - recomenda-se adicionar |
| Error Disclosure | 🟢 Baixo | Mensagens padronizadas, sem stack traces |
| XSS | 🟡 Médio | JSON responses, frontend responsável |
| Dados Sensíveis | 🟡 Médio | Risco em logs - monitorar |
| DDoS | 🟡 Médio | Sem rate limiting - recomenda-se adicionar |

**Risco Geral**: 🟢 **BAIXO** (para ambiente controlado/staging)
**Pronto para Produção**: ⚠️ Implementar rate limiting + monitoramento de logs antes

---

## Histórico de Mudanças (v1.0 - Chamados Module)

**2025 - Sprint Chamados**:
1. ✅ Validação de solicitante → user module
2. ✅ Validação de setor → setor module
3. ✅ Validação de responsável → user module
4. ✅ Extração de userId do JWT em `/assign`
5. ✅ Schemas JSON detalhados em todas as rotas
6. ✅ Tipos TypeScript fortalecidos
7. ✅ Auditoria de segurança documentada

---

**Próximas Etapas**:
- [ ] Implementar rate limiting
- [ ] Centralizar logging com sanitização
- [ ] Testes de penetração
- [ ] Frontend security checklist
