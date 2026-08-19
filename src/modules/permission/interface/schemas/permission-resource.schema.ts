export const permissionResourceSchema = {
  type: "object",
  properties: {
    id: { type: "integer" },
    service_id: { type: "integer" },
    role_id: { type: "integer" },
    read: { type: "boolean" },
    write: { type: "boolean" },
    edit: { type: "boolean" },
    del: { type: "boolean" },
  },
};

export const permissionInputSchema = {
  type: "object",
  required: ["read", "write", "edit", "del"],
  properties: {
    read: { type: "boolean" },
    write: { type: "boolean" },
    edit: { type: "boolean" },
    del: { type: "boolean" },
  },
};
