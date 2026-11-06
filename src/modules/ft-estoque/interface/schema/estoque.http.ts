import errorResponseSchema from "../../../../core/schema/errorSchema.js";
import {
  previewSchema,
  detailSchema,
  completeSchema,
  itemSchema,
  variationSchema,
  movementSchema,
  deliverySchema,
  itemCollection,
  variationCollection,
  movementCollection,
  deliveryCollection,
  recipientCollection,
} from "./estoque.schema.js";

const estoqueAudit = {
  module: "ft-estoque",
  resourceType: "estoque",
  resourceIdParam: "id",
  omitRequestedChanges: true,
};
export const estoqueViewConfig = {
  audit: { ...estoqueAudit, failureAction: "VIEW" as const },
};
export const estoqueCreateConfig = {
  audit: { ...estoqueAudit, failureAction: "CREATE" as const },
};
export const estoqueUpdateConfig = {
  audit: { ...estoqueAudit, failureAction: "UPDATE" as const },
};
export const estoqueMetadata = {
  tags: ["PEAAD - Estoque"],
  security: [{ JWTToken: [] }],
};
const estoqueErrors = {
  ...errorResponseSchema,
  409: errorResponseSchema[400],
  422: errorResponseSchema[400],
  503: errorResponseSchema[400],
};

export const estoquePreviewResponse = { 200: previewSchema, ...estoqueErrors };
export const estoqueDetailResponse = { 200: detailSchema, ...estoqueErrors };
export const estoqueCompleteResponse = {
  200: completeSchema,
  ...estoqueErrors,
};
export const estoqueItemResponse = { 200: itemSchema, ...estoqueErrors };
export const estoqueVariationResponse = {
  200: variationSchema,
  ...estoqueErrors,
};
export const estoqueMovementResponse = {
  200: movementSchema,
  ...estoqueErrors,
};
export const estoqueDeliveryResponse = {
  200: deliverySchema,
  ...estoqueErrors,
};
export const estoqueItemCollectionResponse = {
  200: itemCollection,
  ...estoqueErrors,
};
export const estoqueVariationCollectionResponse = {
  200: variationCollection,
  ...estoqueErrors,
};
export const estoqueMovementCollectionResponse = {
  200: movementCollection,
  ...estoqueErrors,
};
export const estoqueDeliveryCollectionResponse = {
  200: deliveryCollection,
  ...estoqueErrors,
};
export const estoqueRecipientCollectionResponse = {
  200: recipientCollection,
  ...estoqueErrors,
};
