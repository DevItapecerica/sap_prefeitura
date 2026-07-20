export const permissionResourceSchema = {
  type: "object",
  required: [
    "id",
    "service_id",
    "role_id",
    "read",
    "write",
    "edit",
    "del",
  ],
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

export const permissionsArraySchema = {
  type: "array",
  items: permissionResourceSchema,
};
