import AppError from "../../../../core/appError.js";
import ValidateQueryOrder from "../../../../core/utils/ValidateQueryOrder.js";
import { PermissionListResult } from "../../domain/repository/permission-list-result.js";
import { PermissionRepository } from "../../domain/repository/permission.repository.js";
import { ListPermissionsDto } from "../dto/list-permissions.dto.js";

export class ListPermissionsUseCase {
  private readonly allowedOrderFields = ["id", "role_id", "service_id"];

  constructor(private readonly repository: PermissionRepository) {}

  async execute(query: ListPermissionsDto = {}): Promise<PermissionListResult> {
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
