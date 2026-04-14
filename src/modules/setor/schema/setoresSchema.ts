import errorResponseSchema from "../../../core/shared/schema/errorSchema.js";

export default class setoresSchema {
  static getSetores = {
    tags: ["Setores"],
    security: [{ APIKey: [] }],
    response: {
      200: {
        description: "Lista de setores",
        type: "object",
        properties: {
          setores: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "integer", example: 1 },
                name: { type: "string", example: "Tecnologia" },
                description: { type: "string", example: "Setor de tecnologia" },
              },
            },
          },
        },
      },
      ...errorResponseSchema,
    },
  };

  static getOneSetor = {
    tags: ["Setores"],
    security: [{ APIKey: [] }],
    response: {
      200: {
        description: "Setor específico",
        type: "object",
        properties: {
          setor: {
            type: "object",
            properties: {
              id: { type: "integer", example: 1 },
              name: { type: "string", example: "Tecnologia" },
              description: {
                type: "string",
                example: "Setor para gerenciamento do sistema",
              },
            },
          },
        },
      },
      ...errorResponseSchema,
    },
  };

  static postSetor = {
    tags: ["Setores"],
    description: "Cria um novo setor",
    security: [{ APIKey: [] }],
    body: {
      type: "object",
      required: ["setor"],
      properties: {
        setor: {
          type: "object",
          required: ["name", "description"],
          properties: {
            name: { type: "string" },
            description: { type: "string" },
          },
        },
      },
    },
    responses: {
      201: {
        description: "Setor criado com sucesso",
        type: "object",
        properties: {
          setor: {
            type: "object",
            properties: {
              id: { type: "integer", example: 1 },
              name: { type: "string", example: "Tecnologia" },
              description: {
                type: "string",
                example: "Setor de tecnologia",
              },
            },
          },
        },
      },
      ...errorResponseSchema,
    },
  };

  static updateSetor = {
    tags: ["Setores"],
    description: "Atualiza um setor existente",
    security: [{ APIKey: [] }],
    body: {
      type: "object",
      required: ["setor"],
      properties: {
        setor: {
          type: "object",
          required: ["name", "description"],
          properties: {
            name: { type: "string" },
            description: { type: "string" },
          },
        },
      },
    },
    responses: {
      204: {
        description: "Setor atualizado com sucesso",
      },
      ...errorResponseSchema,
    },
  };

  static deleteSetor = {
    tags: ["Setores"],
    security: [{ APIKey: [] }],
    response: {
      204: {
        description: "Setor deletado com sucesso",
      },
      ...errorResponseSchema,
    },
  };
}
