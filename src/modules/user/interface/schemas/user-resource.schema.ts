export const userResourceSchema = {
  type: "object",
  properties: {
    id: { type: "integer", example: 1 },
    name: { type: "string", example: "kadoia" },
    email: { type: "string", example: "email@dominio.com.br" },
    ramal: { type: "string", example: "1234" },
    setor_id: { type: "integer", example: 1 },
    role_id: { type: "integer", example: 1 },
    firstLogin: { type: "boolean", example: true },
    createdAt: { type: "string", example: "2023-01-01T00:00:00.000Z" },
    updatedAt: { type: "string", example: "2023-01-01T00:00:00.000Z" },
  },
};
