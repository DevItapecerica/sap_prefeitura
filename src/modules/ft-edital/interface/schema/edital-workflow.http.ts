import errorResponseSchema from "../../../../core/schema/errorSchema.js";
import { collection, itemRef, pdfResponse } from "./edital-workflow.schema.js";

const workflowAudit = {
  module: "ft-edital",
  resourceType: "edital_workflow",
  resourceIdParam: "id",
  omitRequestedChanges: true,
};

export const workflowViewConfig = {
  audit: { ...workflowAudit, failureAction: "VIEW" as const },
};
export const workflowCreateConfig = {
  audit: { ...workflowAudit, failureAction: "CREATE" as const },
};
export const workflowUpdateConfig = {
  audit: { ...workflowAudit, failureAction: "UPDATE" as const },
};
export const workflowPdfConfig = {
  audit: {
    ...workflowAudit,
    failureAction: "EXPORT" as const,
    resourceType: "participacao_pdf",
    resourceIdParam: "participacaoId",
  },
};

export const workflowMetadata = {
  tags: ["PEAAD - Edital"],
  security: [{ JWTToken: [] }],
};

const workflowErrors = {
  ...errorResponseSchema,
  409: errorResponseSchema[400],
  410: errorResponseSchema[400],
  422: errorResponseSchema[400],
};

export const workflowItemResponse = { 200: itemRef, ...workflowErrors };
export const workflowCollectionResponse = {
  200: collection,
  ...workflowErrors,
};
export const workflowPdfResponse = { 200: pdfResponse, ...workflowErrors };
