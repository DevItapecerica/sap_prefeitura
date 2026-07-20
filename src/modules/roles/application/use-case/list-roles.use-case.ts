import AppError from "../../../../core/appError.js";
import ValidateQueryOrder from "../../../../core/utils/ValidateQueryOrder.js";
import { RoleListResult } from "../../domain/repository/role-list-result.js";
import { RolesRepository } from "../../domain/repository/roles.repository.js";
import { ListRolesDto } from "../dto/list-roles.dto.js";

export class ListRolesUseCase {
  private readonly allowedOrderFields = ["id", "name"];

  constructor(private readonly repository: RolesRepository) {}

  async execute(query: ListRolesDto = {}): Promise<RoleListResult> {
    const { search, page = 0, limit, order = "id:desc" } = query;
    if (page < 0) throw new AppError("Pagina invalida", 400, "INVALID_PAGE");
    if (!(await ValidateQueryOrder(order, this.allowedOrderFields))) {
      throw new AppError(
        "Ordem de busca invalida",
        400,
        "INVALID_QUERY_ORDER",
      );
    }
    return this.repository.findAll({ search, page, limit, order });
  }
}
