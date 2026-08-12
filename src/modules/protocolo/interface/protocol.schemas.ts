export const protocolStates = [
  "EM_TRIAGEM",
  "EM_ANALISE",
  "AGUARDANDO_COMPLEMENTO",
  "CONCLUIDO",
  "INDEFERIDO",
  "CANCELADO",
];
export const protocolTypes = ["REQUERIMENTO", "DENUNCIA", "RECURSO", "SOLICITACAO_SERVICO"];

const uuid = { type: "string", format: "uuid" };
const positiveInteger = { type: "integer", minimum: 1 };

export const protocolParamsSchema = {
  type: "object",
  additionalProperties: false,
  required: ["id"],
  properties: { id: uuid },
};

export const protocolRequirementParamsSchema = {
  type: "object",
  additionalProperties: false,
  required: ["id", "requirementId"],
  properties: { id: uuid, requirementId: uuid },
};

export const protocolAttachmentParamsSchema = {
  type: "object",
  additionalProperties: false,
  required: ["id", "attachmentId"],
  properties: { id: uuid, attachmentId: uuid },
};

export const serviceParamsSchema = {
  type: "object",
  additionalProperties: false,
  required: ["id"],
  properties: { id: positiveInteger },
};

export const serviceFormParamsSchema = {
  type: "object",
  additionalProperties: false,
  required: ["id", "formId"],
  properties: { id: positiveInteger, formId: positiveInteger },
};

export const roleParamsSchema = {
  type: "object",
  additionalProperties: false,
  required: ["roleId"],
  properties: { roleId: positiveInteger },
};

export const protocolCapabilitiesBodySchema = {
  type: "object",
  additionalProperties: false,
  required: ["manageCatalog", "triage", "route", "decide", "viewSector", "export", "managePrivacy", "viewRestricted", "viewOperations"],
  properties: {
    manageCatalog: { type: "boolean" },
    triage: { type: "boolean" },
    route: { type: "boolean" },
    decide: { type: "boolean" },
    viewSector: { type: "boolean" },
    export: { type: "boolean" },
    managePrivacy: { type: "boolean" },
    viewRestricted: { type: "boolean" },
    viewOperations: { type: "boolean" },
  },
};

export const attachmentQuerySchema = {
  type: "object",
  additionalProperties: false,
  properties: { requirementId: uuid },
};

export const internalListQuerySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    state: { type: "string", enum: protocolStates },
    sectorId: positiveInteger,
    assigneeId: positiveInteger,
    from: { type: "string", format: "date-time" },
    to: { type: "string", format: "date-time" },
    protocolType: { type: "string", enum: protocolTypes },
  },
};

export const protocolBodySchema = {
  type: "object",
  additionalProperties: false,
  required: ["serviceId", "subject", "answers"],
  properties: {
    serviceId: positiveInteger,
    subject: { type: "string", minLength: 1, maxLength: 180 },
    answers: { type: "object", additionalProperties: true },
    relatedProtocolId: uuid,
  },
};

export const internalProtocolBodySchema = {
  ...protocolBodySchema,
  required: ["citizenId", "email", ...protocolBodySchema.required],
  properties: {
    ...protocolBodySchema.properties,
    citizenId: uuid,
    email: { type: "string", format: "email", maxLength: 254 },
  },
};

export const transitionBodySchema = {
  type: "object",
  additionalProperties: false,
  required: ["to"],
  properties: {
    to: { type: "string", enum: ["CONCLUIDO", "INDEFERIDO"] },
    publicMessage: { type: "string", maxLength: 4000 },
    internalMessage: { type: "string", maxLength: 4000 },
  },
};

export const requirementBodySchema = {
  type: "object",
  additionalProperties: false,
  required: ["description", "dueAt"],
  properties: {
    description: { type: "string", minLength: 1, maxLength: 4000 },
    dueAt: { type: "string", format: "date-time" },
  },
};

export const citizenBodySchema = {
  type: "object",
  additionalProperties: false,
  required: ["nome", "cpf", "nascimento", "rua", "bairro", "cidade", "uf", "cep", "numero"],
  properties: {
    nome: { type: "string", minLength: 2, maxLength: 120 },
    cpf: { type: "string", pattern: "^(?:[0-9]{11}|[0-9]{3}\\.[0-9]{3}\\.[0-9]{3}-[0-9]{2})$" },
    nascimento: { type: "string", format: "date" },
    telefone: { type: ["string", "null"], maxLength: 30 },
    rua: { type: "string", minLength: 2, maxLength: 180 },
    bairro: { type: "string", minLength: 2, maxLength: 120 },
    cidade: { type: "string", minLength: 2, maxLength: 120 },
    uf: { type: "string", pattern: "^[A-Za-z]{2}$" },
    cep: { type: "string", pattern: "^(?:[0-9]{8}|[0-9]{5}-[0-9]{3})$" },
    numero: { type: "string", minLength: 1, maxLength: 30 },
    complemento: { type: ["string", "null"], maxLength: 120 },
  },
};

export const fieldSchema = {
  type: "object",
  additionalProperties: false,
  required: ["key", "label", "type"],
  properties: {
    key: { type: "string", pattern: "^[a-z][a-z0-9_]{1,49}$" },
    label: { type: "string", minLength: 1, maxLength: 120 },
    type: { type: "string", enum: ["text", "textarea", "number", "date", "select", "multiselect", "checkbox", "cpf", "phone", "email", "address"] },
    required: { type: "boolean" },
    options: { type: "array", maxItems: 100, items: { type: "string", maxLength: 120 } },
    helpText: { type: "string", maxLength: 500 },
  },
};

const nullableInteger = { type: ["integer", "null"] };
const nullableString = { type: ["string", "null"] };
const dateTime = { type: "string", format: "date-time" };

export const protocolMovementPublicSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    id: positiveInteger,
    protocolId: uuid,
    fromSectorId: nullableInteger,
    toSectorId: nullableInteger,
    actorId: nullableInteger,
    actorType: { type: "string", enum: ["CITIZEN", "USER", "SYSTEM"] },
    fromState: nullableString,
    toState: { type: "string", enum: protocolStates },
    publicMessage: nullableString,
    createdAt: dateTime,
  },
};

export const protocolMovementInternalSchema = {
  ...protocolMovementPublicSchema,
  properties: {
    ...protocolMovementPublicSchema.properties,
    internalMessage: nullableString,
  },
};

export const protocolRequirementResponseSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    id: uuid,
    protocolId: uuid,
    description: { type: "string" },
    dueAt: dateTime,
    response: nullableString,
    resolvedAt: { type: ["string", "null"], format: "date-time" },
    createdAt: dateTime,
    updatedAt: dateTime,
  },
};

export const protocolAttachmentResponseSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    id: uuid,
    protocolId: uuid,
    requirementId: { type: ["string", "null"], format: "uuid" },
    originalName: { type: "string" },
    mimeType: { type: "string" },
    size: { type: "integer", minimum: 0 },
    sha256: { type: "string", pattern: "^[a-f0-9]{64}$" },
    status: { type: "string", enum: ["QUARANTINED", "AVAILABLE", "REJECTED"] },
    ownerType: { type: "string", enum: ["CITIZEN", "USER"] },
    createdAt: dateTime,
  },
};

export const protocolResponseSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    id: uuid,
    publicNumber: { type: "string", pattern: "^[0-9]{4}/[0-9]{6}$" },
    authenticityCode: { type: "string" },
    citizenId: uuid,
    serviceId: positiveInteger,
    formId: positiveInteger,
    protocolType: { type: "string", enum: protocolTypes },
    confidentiality: { type: "string", enum: ["NORMAL", "RESTRICTED"] },
    relatedProtocolId: { type: ["string", "null"], format: "uuid" },
    typePolicyVersion: nullableString,
    subject: { type: "string" },
    answers: { type: "object", additionalProperties: true },
    currentSectorId: nullableInteger,
    assigneeId: nullableInteger,
    state: { type: "string", enum: protocolStates },
    dueAt: dateTime,
    privacyNoticeVersion: nullableString,
    createdAt: dateTime,
    updatedAt: dateTime,
  },
};

export const publicProtocolDetailResponseSchema = {
  ...protocolResponseSchema,
  properties: {
    ...protocolResponseSchema.properties,
    movements: { type: "array", items: protocolMovementPublicSchema },
    requirements: { type: "array", items: protocolRequirementResponseSchema },
    attachments: { type: "array", items: protocolAttachmentResponseSchema },
  },
};

export const internalProtocolDetailResponseSchema = {
  ...protocolResponseSchema,
  properties: {
    ...protocolResponseSchema.properties,
    legalHoldAt: { type: ["string", "null"], format: "date-time" },
    retentionReviewAt: { type: ["string", "null"], format: "date-time" },
    movements: { type: "array", items: protocolMovementInternalSchema },
    requirements: { type: "array", items: protocolRequirementResponseSchema },
    attachments: { type: "array", items: protocolAttachmentResponseSchema },
  },
};

export const protocolFormResponseSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    id: positiveInteger,
    serviceId: positiveInteger,
    version: positiveInteger,
    fields: { type: "array", items: fieldSchema },
    publishedAt: { type: ["string", "null"], format: "date-time" },
    createdAt: dateTime,
    updatedAt: dateTime,
  },
};

export const protocolServiceResponseSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    id: positiveInteger,
    name: { type: "string" },
    description: { type: "string" },
    defaultSectorId: nullableInteger,
    deadlineDays: positiveInteger,
    active: { type: "boolean" },
    protocolType: { type: "string", enum: protocolTypes },
    publishedFormId: nullableInteger,
    forms: { type: "array", items: protocolFormResponseSchema },
    createdAt: dateTime,
    updatedAt: dateTime,
  },
};

export const protocolServiceDraftResponseSchema = {
  type: "object",
  additionalProperties: false,
  required: ["service", "form"],
  properties: {
    service: protocolServiceResponseSchema,
    form: protocolFormResponseSchema,
  },
};

export const protocolCapabilitiesResponseSchema = {
  type: "object",
  additionalProperties: false,
  properties: protocolCapabilitiesBodySchema.properties,
};

const groupedCountsSchema = {
  type: "object",
  additionalProperties: { type: "integer", minimum: 0 },
};

export const protocolReadinessResponseSchema = {
  type: "object",
  additionalProperties: false,
  required: ["ready", "checkedAt", "checks"],
  properties: {
    ready: { type: "boolean" },
    checkedAt: dateTime,
    checks: {
      type: "object",
      additionalProperties: false,
      required: ["database", "antivirus", "pdf"],
      properties: {
        database: { type: "string", enum: ["UP", "DOWN"] },
        antivirus: { type: "string", enum: ["UP", "DOWN"] },
        pdf: { type: "string", enum: ["UP", "DOWN"] },
      },
    },
  },
};

export const protocolOperationsResponseSchema = {
  type: "object",
  additionalProperties: false,
  required: ["generatedAt", "protocols", "notifications", "privacy", "attachments", "alerts"],
  properties: {
    generatedAt: dateTime,
    protocols: {
      type: "object", additionalProperties: false, required: ["byState", "byType", "overdue"],
      properties: { byState: groupedCountsSchema, byType: groupedCountsSchema, overdue: { type: "integer", minimum: 0 } },
    },
    notifications: {
      type: "object", additionalProperties: false, required: ["pending", "failed"],
      properties: { pending: { type: "integer", minimum: 0 }, failed: { type: "integer", minimum: 0 } },
    },
    privacy: {
      type: "object", additionalProperties: false, required: ["open", "oldestOpenAt", "oldestOpenAgeDays"],
      properties: {
        open: { type: "integer", minimum: 0 },
        oldestOpenAt: { type: ["string", "null"], format: "date-time" },
        oldestOpenAgeDays: { type: ["integer", "null"], minimum: 0 },
      },
    },
    attachments: {
      type: "object", additionalProperties: false, required: ["quarantined", "rejected"],
      properties: { quarantined: { type: "integer", minimum: 0 }, rejected: { type: "integer", minimum: 0 } },
    },
    alerts: {
      type: "array",
      items: {
        type: "object", additionalProperties: false, required: ["code", "severity", "value", "threshold"],
        properties: {
          code: { type: "string", enum: ["PROTOCOL_OVERDUE", "PROTOCOL_NOTIFICATION_FAILURE", "PROTOCOL_PRIVACY_REQUEST_AGED", "PROTOCOL_ATTACHMENT_STUCK"] },
          severity: { type: "string", enum: ["WARNING", "CRITICAL"] },
          value: { type: "integer", minimum: 0 },
          threshold: { type: "integer", minimum: 1 },
        },
      },
    },
  },
};

export const protocolRolePermissionResponseSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    id: positiveInteger,
    roleId: positiveInteger,
    role: {
      type: "object",
      additionalProperties: false,
      properties: { id: positiveInteger, name: { type: "string" } },
    },
    ...protocolCapabilitiesBodySchema.properties,
    createdAt: dateTime,
    updatedAt: dateTime,
  },
};

export const successResponse = (data: Record<string, unknown>) => ({
  type: "object",
  additionalProperties: false,
  required: ["ok", "data"],
  properties: { ok: { type: "boolean", const: true }, data },
});

export const okResponseSchema = {
  type: "object",
  additionalProperties: false,
  required: ["ok"],
  properties: { ok: { type: "boolean", const: true } },
};

const protocolErrorSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    statusCode: { type: "number" },
    message: { type: "string" },
    code: { type: "string" },
    ok: { type: "boolean", const: false },
  },
};

export const protocolErrorResponses = Object.fromEntries(
  [400, 401, 403, 404, 409, 413, 422, 429, 500, 503].map((status) => [status, protocolErrorSchema]),
);

export const privacyRequestTypes = ["CONFIRMATION", "ACCESS", "CORRECTION", "ANONYMIZATION", "BLOCKING", "ERASURE", "SHARING_INFORMATION", "OPPOSITION"];
export const privacyRequestStatuses = ["RECEIVED", "IN_REVIEW", "FULFILLED", "DENIED"];

export const privacyRequestParamsSchema = {
  type: "object",
  additionalProperties: false,
  required: ["requestId"],
  properties: { requestId: uuid },
};

export const privacyRequestBodySchema = {
  type: "object",
  additionalProperties: false,
  required: ["requestType", "details"],
  properties: {
    requestType: { type: "string", enum: privacyRequestTypes },
    details: { type: "string", minLength: 3, maxLength: 2000 },
    protocolId: uuid,
  },
};

export const privacyRequestUpdateSchema = {
  type: "object",
  additionalProperties: false,
  required: ["status"],
  properties: {
    status: { type: "string", enum: ["IN_REVIEW", "FULFILLED", "DENIED"] },
    response: { type: "string", minLength: 3, maxLength: 4000 },
  },
};

export const publicPrivacyRequestResponseSchema = {
  type: "object",
  additionalProperties: false,
  required: ["id", "requestType", "details", "status", "createdAt", "updatedAt"],
  properties: {
    id: uuid,
    protocolId: { type: ["string", "null"], format: "uuid" },
    requestType: { type: "string", enum: privacyRequestTypes },
    details: { type: "string" },
    status: { type: "string", enum: privacyRequestStatuses },
    response: nullableString,
    completedAt: { type: ["string", "null"], format: "date-time" },
    createdAt: dateTime,
    updatedAt: dateTime,
  },
};

export const internalPrivacyRequestResponseSchema = {
  ...publicPrivacyRequestResponseSchema,
  required: [...publicPrivacyRequestResponseSchema.required, "citizenId"],
  properties: {
    ...publicPrivacyRequestResponseSchema.properties,
    citizenId: uuid,
    handledBy: nullableInteger,
  },
};

export const retentionPreviewResponseSchema = {
  type: "object",
  additionalProperties: false,
  required: ["mode", "policyApproved", "policy", "candidates", "scanned"],
  properties: {
    mode: { type: "string", const: "DRY_RUN" },
    policyApproved: { type: "boolean" },
    policy: {
      type: "object",
      additionalProperties: false,
      required: ["reference", "days"],
      properties: { reference: nullableString, days: nullableInteger },
    },
    candidates: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "publicNumber", "state", "updatedAt", "reason"],
        properties: {
          id: uuid,
          publicNumber: { type: "string", pattern: "^[0-9]{4}/[0-9]{6}$" },
          state: { type: "string", enum: protocolStates },
          updatedAt: dateTime,
          reason: { type: "string", const: "ELIGIBLE_FOR_REVIEW" },
        },
      },
    },
    scanned: { type: "integer", minimum: 0 },
  },
};

export const privacyNoticeResponseSchema = {
  type: "object",
  additionalProperties: false,
  required: ["version", "effectiveAt", "controller", "contactUrl", "purposes", "legalBasis", "dataCategories", "sharing", "retention", "rights", "automatedDecision"],
  properties: {
    version: { type: "string" }, effectiveAt: { type: "string", format: "date" }, controller: { type: "string" }, contactUrl: { type: "string", format: "uri" },
    purposes: { type: "array", items: { type: "string" } }, legalBasis: { type: "string" }, dataCategories: { type: "array", items: { type: "string" } },
    sharing: { type: "array", items: { type: "string" } }, retention: { type: "string" }, rights: { type: "array", items: { type: "string", enum: privacyRequestTypes } }, automatedDecision: { type: "boolean" },
  },
};
