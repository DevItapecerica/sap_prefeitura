import { FastifyInstance, FastifyRequest } from "fastify";
import { ChamadoController } from "../controller/chamado.controller.js";
import chamadoFactory from "../../factories/chamado.factory.js";
import AuthMiddleware from "../../../auth/auth.middleware.js";
import { authorizationFactory } from "../../../acess-controll/factory/makeAuthorization.js";
import { eventBus } from "../../../../core/event/index.js";

const CHAMADOS_SERVICE_ID = 8;

export async function chamadosRoutes(fastify: FastifyInstance) {
  const chamadoService = chamadoFactory(fastify.log);
  const chamadoController = new ChamadoController(chamadoService);

  fastify.addHook("preHandler", AuthMiddleware.verifyJWT);
  fastify.addHook("preHandler", async (request: FastifyRequest) => {
    const verifyAuthorization = authorizationFactory(request.log);
    await verifyAuthorization.authorize(
      Number(request.user.id),
      CHAMADOS_SERVICE_ID,
      request.method,
    );
  });

  // POST - Criar novo chamado
  fastify.post<{ Body: any }>(
    "/chamados",
    {
      // preHandler: [
      //   AuthMiddleware.verifyJWT,
      //   async (request) => {
      //     const verifyAuthorization = authorizationFactory(request.log);
      //     await verifyAuthorization.authorize(
      //       Number((request as any).user.id),
      //       CHAMADOS_SERVICE_ID,
      //       request.method,
      //     );
      //   },
      // ],
      schema: {
        description:
          "Cria um novo chamado vinculado a setor e solicitante opcional",
        tags: ["Chamados"],
        body: {
          type: "object",
          required: [
            "patrimonio",
            "tipo",
            "setorId",
            "descricao",
            "prioridade",
          ],
          properties: {
            patrimonio: {
              type: "string",
              minLength: 1,
              description: "Identificação do patrimônio",
            },
            tipo: {
              type: "string",
              enum: ["manutencao", "reparo", "instalacao", "suporte", "outros"],
              description: "Tipo de chamado",
            },
            setorId: {
              type: "integer",
              minimum: 1,
              description: "ID do setor (vinculado ao módulo de setores)",
            },
            solicitanteId: {
              type: "integer",
              nullable: true,
              minimum: 1,
              description:
                "ID do usuário solicitante (vinculado ao módulo de usuários). Opcional.",
            },
            descricao: {
              type: "string",
              minLength: 5,
              description: "Descrição detalhada do chamado",
            },
            prioridade: {
              type: "string",
              enum: ["baixa", "media", "alta", "critica"],
              description: "Nível de prioridade",
            },
            responsavelId: {
              type: "integer",
              nullable: true,
              description: "ID opcional do responsável inicial",
            },
            observacoes: {
              type: "string",
              nullable: true,
              description: "Observações adicionais",
            },
          },
        },
        response: {
          201: {
            description: "Chamado criado com sucesso",
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              patrimonio: { type: "string" },
              status: { type: "string" },
              tipo: { type: "string" },
              dataEntrada: { type: "string", format: "date-time" },
              setorId: { type: "integer" },
              solicitanteId: { type: "integer", nullable: true },
              descricao: { type: "string" },
              prioridade: { type: "string" },
              responsavelId: { type: "integer", nullable: true },
              observacoes: { type: "string", nullable: true },
            },
          },
          400: {
            description:
              "Erro de validação (solicitante/setor/responsável não encontrado)",
            type: "object",
            properties: {
              message: { type: "string" },
              code: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      return chamadoController.create(request, reply);
    },
  );

  // GET - Listar todos os chamados
  fastify.get(
    "/chamados",
    {
      // preHandler: [
      //   AuthMiddleware.verifyJWT,
      //   async (request) => {
      //     const verifyAuthorization = authorizationFactory(request.log);
      //     await verifyAuthorization.authorize(
      //       Number((request as any).user.id),
      //       CHAMADOS_SERVICE_ID,
      //       request.method,
      //     );
      //   },
      // ],
      schema: {
        description: "Lista todos os chamados com filtros opcionais",
        tags: ["Chamados"],
        querystring: {
          type: "object",
          properties: {
            status: {
              type: "string",
              enum: [
                "aberto",
                "em_progresso",
                "resolvido",
                "fechado",
                "cancelado",
              ],
              description: "Filtrar por status",
            },
            setorId: {
              type: "integer",
              minimum: 1,
              description: "Filtrar por ID do setor",
            },
            solicitanteId: {
              type: "integer",
              minimum: 1,
              description: "Filtrar por ID do solicitante",
            },
            responsavelId: {
              type: "integer",
              minimum: 1,
              description: "Filtrar por ID do responsável",
            },
            tipo: {
              type: "string",
              enum: ["manutencao", "reparo", "instalacao", "suporte", "outros"],
              description: "Filtrar por tipo",
            },
            prioridade: {
              type: "string",
              enum: ["baixa", "media", "alta", "critica"],
              description: "Filtrar por prioridade",
            },
            page: {
              type: "integer",
              minimum: 0,
              description: "Número da página",
            },
            limit: {
              type: "integer",
              minimum: 1,
              maximum: 100,
              description: "Quantidade por página",
            },
          },
        },
        response: {
          200: {
            description: "Lista de chamados retornada com sucesso",
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                patrimonio: { type: "string" },
                status: { type: "string" },
                tipo: { type: "string" },
                dataEntrada: { type: "string", format: "date-time" },
                setorId: { type: "integer" },
                solicitanteId: { type: "integer", nullable: true },
                descricao: { type: "string" },
                prioridade: { type: "string" },
                responsavelId: { type: "integer", nullable: true },
                observacoes: { type: "string", nullable: true },
                dataResolucao: {
                  type: "string",
                  nullable: true,
                  format: "date-time",
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      return chamadoController.getAll(request, reply);
    },
  );

  // GET - Stream SSE de eventos de chamados
  fastify.get(
    "/chamados/stream",
    {
      schema: {
        description: "Abre uma conexão SSE para acompanhar eventos de chamados em tempo real",
        tags: ["Chamados"],
        querystring: {
          type: "object",
          properties: {
            token: {
              type: "string",
              description: "JWT de autenticação (utilizado apenas para conexões SSE)",
            },
          },
        },
        response: {
          200: {
            description: "Conexão SSE aberta com sucesso",
            type: "string",
          },
        },
      },
    },
    async (request, reply) => {
      const raw = reply.raw;
      raw.setHeader("Content-Type", "text/event-stream");
      raw.setHeader("Cache-Control", "no-cache, no-transform");
      raw.setHeader("Connection", "keep-alive");
      raw.write("retry: 10000\n\n");

      const sendEvent = (eventName: string, data: any) => {
        if (raw.writableEnded) return;
        raw.write(`event: ${eventName}\n`);
        raw.write(`data: ${JSON.stringify(data)}\n\n`);
        if ("flush" in raw && typeof (raw as any).flush === "function") {
          (raw as any).flush();
        }
      };

      const onCreated = (payload: any) => sendEvent("CHAMADO_CREATED", payload);
      const onUpdated = (payload: any) => sendEvent("CHAMADO_UPDATED", payload);
      const onDeleted = (payload: any) => sendEvent("CHAMADO_DELETED", payload);
      const onAssigned = (payload: any) => sendEvent("CHAMADO_ASSIGNED", payload);

      eventBus.on("CHAMADO_CREATED", onCreated);
      eventBus.on("CHAMADO_UPDATED", onUpdated);
      eventBus.on("CHAMADO_DELETED", onDeleted);
      eventBus.on("CHAMADO_ASSIGNED", onAssigned);

      const cleanup = () => {
        eventBus.off("CHAMADO_CREATED", onCreated);
        eventBus.off("CHAMADO_UPDATED", onUpdated);
        eventBus.off("CHAMADO_DELETED", onDeleted);
        eventBus.off("CHAMADO_ASSIGNED", onAssigned);
      };

      request.raw.on("close", cleanup);
      raw.on("close", cleanup);

      return reply;
    },
  );

  // GET - Relatório de chamados por setor/período
  fastify.get(
    "/chamados/reports",
    {
      // preHandler: [
      //   AuthMiddleware.verifyJWT,
      //   async (request) => {
      //     const verifyAuthorization = authorizationFactory(request.log);
      //     await verifyAuthorization.authorize(
      //       Number((request as any).user.id),
      //       CHAMADOS_SERVICE_ID,
      //       request.method,
      //     );
      //   },
      // ],
      schema: {
        description:
          "Gera relatório de chamados com filtros de setor e período",
        tags: ["Chamados", "Relatórios"],
        querystring: {
          type: "object",
          properties: {
            setorId: {
              type: "integer",
              minimum: 1,
              description: "ID do setor para filtrar",
            },
            dateFrom: {
              type: "string",
              format: "date-time",
              description: "Data inicial (ISO 8601)",
            },
            dateTo: {
              type: "string",
              format: "date-time",
              description: "Data final (ISO 8601)",
            },
          },
        },
        response: {
          200: {
            description: "Relatório gerado com sucesso",
            type: "array",
          },
        },
      },
    },
    async (request, reply) => {
      return chamadoController.getReport(request, reply);
    },
  );

  // GET - Relatório de chamados por setor/período (completo)
  fastify.get(
    "/chamados/reports/all",
    {
      // preHandler: [
      //   AuthMiddleware.verifyJWT,
      //   async (request) => {
      //     const verifyAuthorization = authorizationFactory(request.log);
      //     await verifyAuthorization.authorize(
      //       Number((request as any).user.id),
      //       CHAMADOS_SERVICE_ID,
      //       request.method,
      //     );
      //   },
      // ],
      schema: {
        description:
          "Gera relatório completo de chamados com filtros opcionais",
        tags: ["Chamados", "Relatórios"],
        querystring: {
          type: "object",
          properties: {
            setorId: {
              type: "integer",
              minimum: 1,
              description: "ID do setor para filtrar",
            },
            status: {
              type: "string",
              enum: [
                "aberto",
                "em_progresso",
                "resolvido",
                "fechado",
                "cancelado",
              ],
              description: "Filtrar por status",
            },
            dateFrom: {
              type: "string",
              format: "date",
              description: "Data inicial (YYYY-MM-DD)",
            },
            dateTo: {
              type: "string",
              format: "date",
              description: "Data final (YYYY-MM-DD)",
            },
          },
        },
        response: {
          200: {
            description: "Relatório completo gerado com sucesso",
            type: "array",
          },
        },
      },
    },
    async (request, reply) => {
      return chamadoController.getReport(request, reply);
    },
  );

  // GET - Relatório de tempo médio de resolução
  fastify.get(
    "/chamados/reports/average-time",
    {
      schema: {
        description:
          "Gera relatório de tempo médio de resolução dos chamados agrupado por período",
        tags: ["Chamados", "Relatórios"],
        querystring: {
          type: "object",
          properties: {
            period: {
              type: "string",
              enum: ["mensal", "semestral", "anual"],
              description: "Período de agrupamento (default: mensal)",
            },
            year: {
              type: "integer",
              minimum: 2020,
              description: "Ano do relatório (default: ano atual)",
            },
            setorId: {
              type: "integer",
              minimum: 1,
              description: "ID do setor para filtrar (opcional)",
            },
            tipo: {
              type: "string",
              enum: ["manutencao", "reparo", "instalacao", "suporte", "outros"],
              description: "Filtrar por tipo de chamado (opcional)",
            },
          },
        },
        response: {
          200: {
            description: "Relatório de tempo médio gerado com sucesso",
            type: "object",
            properties: {
              period: { type: "string" },
              year: { type: "integer" },
              setorId: {
                oneOf: [{ type: "integer" }, { type: "string" }],
              },
              tipo: { type: "string" },
              dados: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    periodo: { type: "string" },
                    totalChamados: { type: "integer" },
                    tempoMedioHoras: { type: "number" },
                    tempoMedioDias: { type: "number" },
                    tempoMinimoHoras: { type: "number" },
                    tempoMaximoHoras: { type: "number" },
                  },
                },
              },
              totalChamados: { type: "integer" },
              tempoMedioHoras: { type: "number" },
              tempoMedioDias: { type: "number" },
              tempoMinimoHoras: { type: "number" },
              tempoMaximoHoras: { type: "number" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      return chamadoController.getAverageTimeReport(request, reply);
    },
  );

  // GET - Buscar chamado por ID
  fastify.get<{ Params: { id: string } }>(
    "/chamados/:id",
    {
      // preHandler: [
      //   AuthMiddleware.verifyJWT,
      //   async (request) => {
      //     const verifyAuthorization = authorizationFactory(request.log);
      //     await verifyAuthorization.authorize(
      //       Number((request as any).user.id),
      //       CHAMADOS_SERVICE_ID,
      //       request.method,
      //     );
      //   },
      // ],
      schema: {
        description: "Busca um chamado específico pelo ID",
        tags: ["Chamados"],
        params: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "ID único do chamado",
            },
          },
          required: ["id"],
        },
        response: {
          200: {
            description: "Chamado encontrado",
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              patrimonio: { type: "string" },
              status: { type: "string" },
              tipo: { type: "string" },
              dataEntrada: { type: "string", format: "date-time" },
              setorId: { type: "integer" },
              solicitanteId: { type: "integer" },
              descricao: { type: "string" },
              prioridade: { type: "string" },
              responsavelId: { type: "integer", nullable: true },
              observacoes: { type: "string", nullable: true },
              dataResolucao: {
                type: "string",
                nullable: true,
                format: "date-time",
              },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
            },
          },
          404: {
            description: "Chamado não encontrado",
          },
        },
      },
    },
    async (request, reply) => {
      return chamadoController.getById(request, reply);
    },
  );

  // PUT - Atualizar chamado
  fastify.put<{ Params: { id: string }; Body: any }>(
    "/chamados/:id",
    {
      // preHandler: [
      //   AuthMiddleware.verifyJWT,
      //   async (request) => {
      //     const verifyAuthorization = authorizationFactory(request.log);
      //     await verifyAuthorization.authorize(
      //       Number((request as any).user.id),
      //       CHAMADOS_SERVICE_ID,
      //       request.method,
      //     );
      //   },
      // ],
      schema: {
        description: "Atualiza um chamado existente (campos opcionais)",
        tags: ["Chamados"],
        params: {
          type: "object",
          properties: { id: { type: "string", format: "uuid" } },
          required: ["id"],
        },
        body: {
          type: "object",
          properties: {
            status: {
              type: "string",
              enum: [
                "aberto",
                "em_progresso",
                "resolvido",
                "fechado",
                "cancelado",
              ],
              description: "Novo status do chamado",
            },
            responsavelId: {
              type: "integer",
              nullable: true,
              minimum: 1,
              description:
                "ID do responsável (vinculado ao módulo de usuários)",
            },
            observacoes: {
              type: "string",
              nullable: true,
              description: "Observações adicionais",
            },
            dataResolucao: {
              type: "string",
              nullable: true,
              format: "date-time",
              description:
                "Data de resolução (auto-preenchida se status=resolvido)",
            },
            prioridade: {
              type: "string",
              enum: ["baixa", "media", "alta", "critica"],
              description: "Nível de prioridade",
            },
          },
        },
        response: {
          200: {
            description: "Chamado atualizado com sucesso",
          },
          400: {
            description: "Erro de validação (responsável não encontrado)",
          },
          404: {
            description: "Chamado não encontrado",
          },
        },
      },
    },
    async (request, reply) => {
      return chamadoController.update(request, reply);
    },
  );

  // DELETE - Deletar chamado
  fastify.delete<{ Params: { id: string } }>(
    "/chamados/:id",
    {
      // preHandler: [
      //   AuthMiddleware.verifyJWT,
      //   async (request) => {
      //     const verifyAuthorization = authorizationFactory(request.log);
      //     await verifyAuthorization.authorize(
      //       Number((request as any).user.id),
      //       CHAMADOS_SERVICE_ID,
      //       request.method,
      //     );
      //   },
      // ],
      schema: {
        description: "Deleta um chamado",
        tags: ["Chamados"],
        params: {
          type: "object",
          properties: { id: { type: "string", format: "uuid" } },
          required: ["id"],
        },
        response: {
          200: {
            description: "Chamado deletado com sucesso",
            type: "object",
            properties: { success: { type: "boolean" } },
          },
          404: {
            description: "Chamado não encontrado",
          },
        },
      },
    },
    async (request, reply) => {
      return chamadoController.delete(request, reply);
    },
  );

  // PATCH - Atribuir responsável (usuário autenticado recebe o chamado)
  fastify.patch<{ Params: { id: string } }>(
    "/chamados/:id/assign",
    {
      // preHandler: [
      //   AuthMiddleware.verifyJWT,
      //   async (request) => {
      //     const verifyAuthorization = authorizationFactory(request.log);
      //     await verifyAuthorization.authorize(
      //       Number((request as any).user.id),
      //       CHAMADOS_SERVICE_ID,
      //       request.method,
      //     );
      //   },
      // ],
      schema: {
        description:
          "Atribui o chamado ao usuário autenticado como responsável (status muda para em_progresso)",
        tags: ["Chamados"],
        params: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "ID do chamado",
            },
          },
          required: ["id"],
        },
        response: {
          200: {
            description: "Responsável atribuído com sucesso",
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              responsavelId: { type: "integer" },
              status: { type: "string", enum: ["em_progresso"] },
            },
          },
          400: {
            description: "Usuário autenticado inválido",
          },
          404: {
            description: "Chamado não encontrado",
          },
        },
      },
    },
    async (request, reply) => {
      return chamadoController.assignResponsavel(request, reply);
    },
  );
}
