export const roleResourceSchema = {
  type: "object",
  properties: {
    id: { type: "integer" },
    name: { type: "string" },
  },
};

export const roleInputSchema = {
  type: "object",
  required: ["name"],
  properties: { name: { type: "string" } },
};
