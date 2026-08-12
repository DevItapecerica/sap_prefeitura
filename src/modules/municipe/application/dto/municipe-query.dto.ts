import AppError from "../../../../core/appError.js";
import { QueryParams } from "../../../../core/types/genericTypes.js";

const allowedOrders = new Set([
  "uuid:asc",
  "uuid:desc",
  "nome:asc",
  "nome:desc",
  "createdAt:asc",
  "createdAt:desc",
]);

export function normalizeMunicipeQuery(query: QueryParams): QueryParams {
  const page = query.page === undefined ? undefined : Number(query.page);
  const limit = query.limit === undefined ? undefined : Number(query.limit);
  if (page !== undefined && (!Number.isInteger(page) || page < 0)) {
    throw new AppError("Pagina invalida", 400, "INVALID_PAGE");
  }
  if (limit !== undefined && (!Number.isInteger(limit) || limit < 1 || limit > 100)) {
    throw new AppError("Limite invalido", 400, "INVALID_LIMIT");
  }
  if (query.order && !allowedOrders.has(query.order)) {
    throw new AppError("Ordenacao invalida", 400, "INVALID_ORDER");
  }

  const search = String(query.search ?? "").trim();
  return {
    ...(search ? { search } : {}),
    ...(page === undefined ? {} : { page }),
    ...(limit === undefined ? {} : { limit }),
    ...(query.order ? { order: query.order } : {}),
  };
}
