import AppError from "../../../../core/appError.js";
import ValidateQueryOrder from "../../../../core/utils/ValidateQueryOrder.js";
import { ServiceListResult } from "../../domain/repository/service-list-result.js";
import { ServicesRepository } from "../../domain/repository/services.repository.js";
import { ListServicesDto } from "../dto/list-services.dto.js";

export class ListServicesUseCase {
  private readonly allowedOrderFields = ["id", "name", "tag", "createdAt"];

  constructor(private readonly repository: ServicesRepository) {}

  async execute(query: ListServicesDto = {}): Promise<ServiceListResult> {
    const {
      search,
      page = 0,
      limit,
      order = "id:desc",
    } = query;

    if (page < 0) {
      throw new AppError("Pagina invalida", 400, "INVALID_PAGE");
    }
    if (!(await ValidateQueryOrder(order, this.allowedOrderFields))) {
      throw new AppError(
        "Ordem de busca invalida",
        400,
        "INVALID_QUERY_ORDER",
      );
    }

    return this.repository.getAllServices({
      search,
      page: Number(page),
      limit: limit === undefined ? undefined : Number(limit),
      order,
    });
  }
}
