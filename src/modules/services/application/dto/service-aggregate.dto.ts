import { Permissions } from "../../../permission/domain/entity/Permission.js";
import { Services } from "../../domain/entity/Services.js";
import { ServiceVisibility } from "../../domain/entity/ServiceVisibility.js";

export interface ServiceAggregateDto {
  services: Services;
  permissions: Permissions[];
  visibility: ServiceVisibility[];
}
