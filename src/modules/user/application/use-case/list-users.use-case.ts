import AppError from "../../../../core/appError.js";
import { QueryParams } from "../../../../core/types/genericTypes.js";
import ValidateQueryOrder from "../../../../core/utils/ValidateQueryOrder.js";
import { User } from "../../domain/entity/User.js";
import UserRepository from "../../domain/repository/user.repository.js";

export class ListUsersUseCase {
  private readonly allowedOrderFields = ["id", "name", "email", "createdAt"];

  constructor(private readonly repository: UserRepository) {}

  async execute(query: QueryParams): Promise<{ user: User[]; count: number }> {
    const {
      search,
      page = 1,
      limit = 10,
      order = "createdAt:desc",
      setorId,
    } = query;

    if (page < 1) {
      throw new AppError("Pagina invalida", 400, "INVALID_PAGE");
    }
    if (!(await ValidateQueryOrder(order, this.allowedOrderFields))) {
      throw new AppError(
        "Ordem de busca invalida",
        400,
        "INVALID_QUERY_ORDER",
      );
    }

    return this.repository.getAllUser({
      search,
      page: Number(page) - 1,
      limit,
      order,
      setorId,
    });
  }
}
