export const visibilityResourceSchema = {
  type: "object",
  required: ["id", "setor_id", "service_id", "visibility"],
  properties: {
    id: { type: "integer" },
    setor_id: { type: "integer" },
    service_id: { type: "integer" },
    visibility: { type: "boolean" },
  },
};

export const visibilityArraySchema = {
  type: "array",
  items: visibilityResourceSchema,
};
