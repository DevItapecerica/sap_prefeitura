import { ServicePermissionDto } from "./service-permission.dto.js";
import { ServiceVisibilityDto } from "./service-visibility.dto.js";

export interface ServiceDto {
  name: string;
  description: string;
  tag?: string;
  url: string;
}
export interface UpdateServiceDto {
  service: ServiceDto;
  permissions?: ServicePermissionDto[];
  visibility?: ServiceVisibilityDto[];
}
