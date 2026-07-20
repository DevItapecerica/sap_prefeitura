import AppError from "../../../core/appError.js";
import { PermissionRepository } from "../../permission/domain/repository/permission.repository.js";
import { RolesRepository } from "../../roles/domain/repository/roles.repository.js";
import {
  ServicesRepository,
} from "../../services/domain/repository/services.repository.js";
import { ServiceVisibilityRepository } from "../../services/domain/repository/service-visibility.repository.js";
import UserRepository from "../../user/domain/repository/user.repository.js";

export class AuthorizationUseCase {
  constructor(
    private serviceRepo: ServicesRepository,
    private serviceVisibilityRepository: ServiceVisibilityRepository,
    private rolesRepo: RolesRepository,
    private permissionRepo: PermissionRepository,
    private userRepo: UserRepository,
    private logger: any,
  ) {}

  authorize = async (
    userId: number,
    service: number,
    methode: string,
  ) => {
    this.logger.info("Authorizing user");
    const methodes = ["GET", "POST", "PUT", "DELETE"];

    this.logger.info("Validating method");
    if (!methodes.includes(methode)) {
      throw new AppError("Method not allowed", 405, "METHOD_NOT_ALLOWED");
    }

    const user = await this.userRepo.getUserById(userId);
    const serviceData = await this.serviceRepo.getOneServices(service);

    this.logger.info("Validating user");
    if (!user) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }
    this.logger.info("Validating service");
    if (!serviceData) {
      throw new AppError("Service not found", 404, "SERVICE_NOT_FOUND");
    }

    if (user.setor_id === null) {
      throw new AppError(
        "User has no associated setor",
        403,
        "USER_WITHOUT_SETOR",
      );
    }

    const visibility =
      await this.serviceVisibilityRepository.findVisibilityByServiceAndSetor(
        user.setor_id,
        service,
      );

    this.logger.info("Validating visibility");
    if (!visibility || !visibility.visibility) {
      throw new AppError(
        "You don't have the right to access this service",
        403,
        "SERVICE_NOT_FOUND",
      );
    }

    const role = await this.rolesRepo.getOneRoles(user.role_id);
    this.logger.info("Validating role");
    if (!role) {
      throw new AppError("Role not found", 404, "ROLE_NOT_FOUND");
    }

    const permissions = await this.permissionRepo.getByRoleAndServiceId(
      user.role_id,
      service,
    );
    this.logger.info("Validating permissions");
    if (!permissions) {
      throw new AppError("Permission not found", 404, "PERMISSION_NOT_FOUND");
    }
    this.logger.info("Validating permissions do método");

    switch (methode) {
      case "GET":
        if (!permissions?.read) {
          throw new AppError(
            "You don't have the right to read this service",
            403,
            "NOT_PERMITTED",
          );
        }
        break;

      case "POST":
        if (!permissions?.write) {
          throw new AppError(
            "You don't have the right to create this service",
            403,
            "NOT_PERMITTED",
          );
        }
        break;

      case "PUT":
        if (!permissions?.edit) {
          throw new AppError(
            "You don't have the right to edit this service",
            403,
            "NOT_PERMITTED",
          );
        }
        break;

      case "DELETE":
        if (!permissions?.del) {
          throw new AppError(
            "You don't have the right to delete this service",
            403,
            "NOT_PERMITTED",
          );
        }
        break;

      default:
        throw new AppError("Method not allowed", 405, "METHOD_NOT_ALLOWED");
    }

    this.logger.info("User authorized");
  };
}
