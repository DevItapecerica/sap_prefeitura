export const serviceResourceSchema = {
  type: "object",
  properties: {
    id: { type: "integer", example: 1 },
    name: { type: "string", example: "Serviço 1" },
    description: { type: ["string", "null"], example: "Descrição" },
    tag: { type: "string", example: "outros" },
    url: { type: "string", example: "/admin" },
  },
};
