import errorResponseSchema from "../../../../core/schema/errorSchema.js";
import { permissionsArraySchema } from "./permission-resource.schema.js";
import { serviceResourceSchema } from "./service-resource.schema.js";

const visibleServiceSchema = {
  ...serviceResourceSchema,
  properties: {
    ...serviceResourceSchema.properties,
    permissions: permissionsArraySchema,
  },
};

export const listVisibleServicesSchema = {
  description: "Retorna todos os serviços do usuário com permissões",
  tags: ["Services"],
  security: [{ JWTToken: [] }],
  response: {
    200: {
      description: "Verificação bem sucedida",
      type: "object",
      properties: {
        message: { type: "string" },
        services: { type: "array", items: visibleServiceSchema },
        ok: { type: "boolean", example: true },
      },
    },
    ...errorResponseSchema,
  },
};
