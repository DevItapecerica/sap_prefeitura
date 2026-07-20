import AppError from "../../../../core/appError.js";
import { PermissionRepository } from "../../../permission/domain/repository/permission.repository.js";
import { ServiceVisibilityRepository } from "../../domain/repository/service-visibility.repository.js";
import { ServicesRepository } from "../../domain/repository/services.repository.js";
import { ServiceAggregateDto } from "../dto/service-aggregate.dto.js";

export const loadServiceAggregate = async (
  id: number,
  servicesRepository: ServicesRepository,
  visibilityRepository: ServiceVisibilityRepository,
  permissionRepository: PermissionRepository,
): Promise<ServiceAggregateDto> => {
  const services = await servicesRepository.getOneServices(id);
  if (!services) {
    throw new AppError("Service not found", 404, "SERVICE_NOT_FOUND");
  }

  const [visibility, permissions] = await Promise.all([
    visibilityRepository.findOneServiceVisibility(id),
    permissionRepository.getByServiceId(id),
  ]);

  return { services, visibility, permissions };
};
