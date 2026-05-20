import { FastifyInstance, FastifyRequest } from "fastify";
import { ChamadoController } from "../controller/chamado.controller.js";
import chamadoFactory from "../../factories/chamado.factory.js";
import AuthMiddleware from "../../../auth/auth.middleware.js";
import { authorizationFactory } from "../../../acess-controll/factory/makeAuthorization.js";
import { eventBus } from "../../../../core/event/index.js";

// TODO: ajustar o ID do serviço conforme cadastro em `services` no banco
const CHAMADOS_SERVICE_ID = 1;

export async function chamadosRoutes(fastify: FastifyInstance) {
  const chamadoService = chamadoFactory(fastify.log);
  const chamadoController = new ChamadoController(chamadoService);

  fastify.addHook("preHandler", AuthMiddleware.verifyJWT);
  fastify.addHook("preHandler", async (request: FastifyRequest) => {
    const verifyAuthorization = authorizationFactory(request.log);
    await verifyAuthorization.authorize(
      Number(request.user.id),
      21,
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
          "Cria um novo chamado vinculado a solicitante, setor e responsável",
        tags: ["Chamados"],
        body: {
          type: "object",
          required: [
            "patrimonio",
            "tipo",
            "setorId",
            "solicitanteId",
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
              minimum: 1,
              description:
                "ID do usuário solicitante (vinculado ao módulo de usuários)",
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
              type: ["integer", "null"],
              description: "ID opcional do responsável inicial",
            },
            observacoes: {
              type: ["string", "null"],
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
              solicitanteId: { type: "integer" },
              descricao: { type: "string" },
              prioridade: { type: "string" },
              responsavelId: { type: ["integer", "null"] },
              observacoes: { type: ["string", "null"] },
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
                setorId: { type: "string" },
                solicitanteId: { type: "string" },
                descricao: { type: "string" },
                prioridade: { type: "string" },
                responsavelId: { type: ["string", "null"] },
                observacoes: { type: ["string", "null"] },
                dataResolucao: {
                  type: ["string", "null"],
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
              responsavelId: { type: ["integer", "null"] },
              observacoes: { type: ["string", "null"] },
              dataResolucao: { type: ["string", "null"], format: "date-time" },
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
              type: ["integer", "null"],
              minimum: 1,
              description:
                "ID do responsável (vinculado ao módulo de usuários)",
            },
            observacoes: {
              type: ["string", "null"],
              description: "Observações adicionais",
            },
            dataResolucao: {
              type: ["string", "null"],
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
