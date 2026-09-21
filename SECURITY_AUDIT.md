# Auditoria de Segurança - sap_prefeitura

## Data da revisão: 2026-09-15
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
- ✅ Credentials habilitado para o cookie HttpOnly de refresh, restrito às origens permitidas

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

### 1. **Rate Limiting (IMPLEMENTADO)**
**Status**: limite global de 100 requisições por minuto e limites específicos para login, validação, refresh e logout.

O identificador usa `request.ip`. Cabeçalhos encaminhados só são aceitos quando o proxy está explicitamente listado em `TRUSTED_PROXIES`; sem configuração, `trustProxy` permanece desativado.

### 2. **Logging de Dados Sensíveis (MITIGADO)**
**Status**: o Pino remove headers de autenticação, cookies, senhas, tokens, CPF, fotos e dados bancários conhecidos. Logs HTTP usam a rota normalizada e não gravam query strings. Saídas diretas por `console.*` foram removidas dos runtimes.

**Risco residual**: novos campos sensíveis precisam ser incluídos na política de redaction e validados por revisão/testes.

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
- [x] Rate limiting ativado (`@fastify/rate-limit`)
- [ ] HTTPS/TLS forçado (reverse proxy nginx/traefik)
- [x] Logging estruturado com redaction local de dados sensíveis
- [ ] Agregação e monitoramento central dos logs
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
| Rate Limiting | 🟢 Baixo | Global e autenticação protegidos; proxy é opt-in |
| Error Disclosure | 🟢 Baixo | Mensagens padronizadas, sem stack traces |
| XSS | 🟡 Médio | JSON responses, frontend responsável |
| Dados Sensíveis | 🟡 Médio | Redaction implementado; manter política atualizada |
| DDoS | 🟡 Médio | Rate limiting reduz abuso; proteção de borda ainda recomendada |

**Risco Geral**: 🟢 **BAIXO** (para ambiente controlado/staging)
**Pronto para Produção**: ⚠️ Requer TLS, configuração correta de proxy/origens, monitoramento, backup e validação operacional

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
- [x] Implementar rate limiting
- [x] Sanitizar logging da aplicação
- [ ] Centralizar e monitorar logs
- [ ] Testes de penetração
- [ ] Frontend security checklist
