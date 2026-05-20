# Módulo de Chamados

## Visão Geral

Módulo modular seguindo **Clean Architecture** para gerenciamento de chamados (tickets/issues) no sistema de prefeitura. Permite cadastrar, listar, atualizar e gerenciar chamados com campos de patrimônio, status, tipo, prioridade e responsável.

## Arquitetura

```
src/modules/chamados/
├── domain/                    # Núcleo de negócio (entidades, interfaces)
│   ├── entity/Chamado.ts      # Entidade com enums
│   └── repository/            # Interface de repositório
├── application/               # Lógica de aplicação
│   ├── use-case/              # Serviços e casos de uso
│   └── dto/                   # Data Transfer Objects
├── interface/                 # Camada de apresentação
│   ├── controller/            # Controllers
│   └── router/                # Rotas Fastify
├── factories/                 # Injeção de dependências
└── index.ts                   # Registro do módulo
```

## Campos do Chamado

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | UUID | Sim | ID único (gerado automaticamente) |
| `patrimonio` | String | Sim | Identificação do patrimônio |
| `status` | Enum | Sim | `aberto`, `em_progresso`, `resolvido`, `fechado`, `cancelado` |
| `tipo` | Enum | Sim | `manutencao`, `reparo`, `instalacao`, `suporte`, `outros` |
| `dataEntrada` | DateTime | Sim | Data/hora de criação (default: agora) |
| `setorId` | Int | Sim | ID do setor solicitante |
| `solicitanteId` | UUID | Sim | ID do usuário que solicitou |
| `descricao` | Text | Sim | Descrição detalhada do chamado |
| `prioridade` | Enum | Sim | `baixa`, `media`, `alta`, `critica` (default: media) |
| `responsavelId` | UUID | Não | ID do usuário responsável pela resolução |
| `observacoes` | Text | Não | Observações adicionais |
| `dataResolucao` | DateTime | Não | Data/hora de resolução |
| `createdAt` | DateTime | Auto | Data de criação |
| `updatedAt` | DateTime | Auto | Data de última atualização |
| `deletedAt` | DateTime | Não | Data de exclusão lógica |

## Endpoints

### POST `/api/v2/chamados`
Criar novo chamado.

**Body:**
```json
{
  "patrimonio": "PAT-001",
  "tipo": "manutencao",
  "setorId": 1,
  "solicitanteId": "user-uuid",
  "descricao": "Máquina apresentando problemas",
  "prioridade": "alta",
  "responsavelId": "tech-uuid",
  "observacoes": "Urgente"
}
```

**Response:** `201 Created`

---

### GET `/api/v2/chamados`
Listar todos os chamados com filtros opcionais.

**Query Params (opcionais):**
- `status`: Filtrar por status
- `setorId`: Filtrar por setor
- `solicitanteId`: Filtrar por solicitante
- `responsavelId`: Filtrar por responsável
- `tipo`: Filtrar por tipo
- `prioridade`: Filtrar por prioridade

**Response:** `200 OK` (Array de chamados)

---

### GET `/api/v2/chamados/:id`
Buscar chamado por ID.

**Response:** `200 OK` (Objeto Chamado)

---

### PUT `/api/v2/chamados/:id`
Atualizar chamado.

**Body (todos os campos opcionais):**
```json
{
  "status": "resolvido",
  "responsavelId": "tech-uuid",
  "observacoes": "Problema resolvido",
  "prioridade": "media"
}
```

**Response:** `200 OK`

---

### DELETE `/api/v2/chamados/:id`
Deletar chamado.

**Response:** `200 OK` (`{ "success": true }`)

---

### PATCH `/api/v2/chamados/:id/assign`
Atribuir responsável ao chamado (muda status para `em_progresso`).

**Body:**
```json
{
  "responsavelId": "tech-uuid"
}
```

**Response:** `200 OK`

---

## Eventos Emitidos

O módulo emite eventos via EventBus:

- `CHAMADO_CREATED`: Quando um chamado é criado
- `CHAMADO_UPDATED`: Quando um chamado é atualizado
- `CHAMADO_DELETED`: Quando um chamado é deletado
- `CHAMADO_ASSIGNED`: Quando um responsável é atribuído

## Estrutura de Pastas

```
src/modules/chamados/
├── domain/
│   ├── entity/
│   │   └── Chamado.ts              # Entidade com enums
│   └── repository/
│       └── chamado.repository.ts   # Interface ChamadoRepository
├── application/
│   ├── use-case/
│   │   └── chamado.service.ts      # ChamadoService
│   └── dto/
│       └── chamado.dto.ts          # DTOs (Create, Update, List)
├── interface/
│   ├── controller/
│   │   └── chamado.controller.ts   # ChamadoController
│   └── router/
│       └── chamado.router.ts       # Rotas Fastify
├── factories/
│   └── chamado.factory.ts          # Factory com injeção de deps
└── index.ts                         # Exporta módulo Fastify

src/infra/database/sequelize/
├── models/
│   └── chamado.model.ts            # Modelo Sequelize
├── repositories/
│   └── sequelize.chamado.repository.ts  # Implementação do repositório
└── migrations/
    └── 001_create_chamados.sql     # Script SQL de criação
```

## Inicialização

O módulo é registrado automaticamente em `src/app.ts`:

```typescript
import chamadosModule from "./modules/chamados/index.js";

const App: FastifyPluginAsync = async (fastify) => {
  // ... outros módulos
  await fastify.register(chamadosModule);
};
```

## Exemplo de Uso (cURL)

```bash
# Criar chamado
curl -X POST http://localhost:3000/api/v2/chamados \
  -H "Content-Type: application/json" \
  -d '{
    "patrimonio": "PAT-001",
    "tipo": "manutencao",
    "setorId": 1,
    "solicitanteId": "550e8400-e29b-41d4-a716-446655440000",
    "descricao": "Máquina com defeito",
    "prioridade": "alta"
  }'

# Listar chamados
curl -X GET http://localhost:3000/api/v2/chamados?status=aberto

# Buscar por ID
curl -X GET http://localhost:3000/api/v2/chamados/550e8400-e29b-41d4-a716-446655440000

# Atualizar chamado
curl -X PUT http://localhost:3000/api/v2/chamados/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{"status": "em_progresso", "prioridade": "media"}'

# Atribuir responsável
curl -X PATCH http://localhost:3000/api/v2/chamados/550e8400-e29b-41d4-a716-446655440000/assign \
  -H "Content-Type: application/json" \
  -d '{"responsavelId": "550e8400-e29b-41d4-a716-446655440001"}'

# Deletar chamado
curl -X DELETE http://localhost:3000/api/v2/chamados/550e8400-e29b-41d4-a716-446655440000
```

## Próximos Passos

1. **Executar migração SQL** para criar tabela no banco:
   ```bash
   # Execute o script: src/infra/database/sequelize/migrations/001_create_chamados.sql
   ```

2. **Testar compilação TypeScript:**
   ```bash
   npm run build
   ```

3. **Iniciar servidor:**
   ```bash
   npm run dev
   ```

4. **Testar endpoints** com Postman ou cURL

## Melhorias Futuras

- [ ] Adicionar autenticação/autorização nos endpoints
- [ ] Validar DTOs com Zod ou Joi
- [ ] Implementar busca avançada/filtros
- [ ] Adicionar histórico de alterações (auditoria)
- [ ] Notificações em tempo real (WebSocket)
- [ ] Relatórios de chamados por setor/período
- [ ] Integração com email para notificações
- [ ] Testes unitários e integração
