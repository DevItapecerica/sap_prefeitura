import { ServiceVisibilityDto } from "./service-visibility.dto.js";

export interface ServiceDto {
  name: string;
  description: string;
  tag?: string;
  url: string;
}
export interface UpdateServiceDto {
  service: ServiceDto;
  visibility?: ServiceVisibilityDto[];
}
