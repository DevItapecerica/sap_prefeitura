import { ServiceVisibility } from "../entity/ServiceVisibility.js";

export interface ServiceVisibilityRepository {
  findOneServiceVisibility(serviceId: number): Promise<ServiceVisibility[]>;
  createServiceVisibility(
    setorId: number,
    serviceId: number,
    visibility?: boolean,
  ): Promise<ServiceVisibility>;
  findVisibilityByServiceAndSetor(
    setorId: number,
    serviceId: number,
  ): Promise<ServiceVisibility | null>;
  findVisibilityBySetor(setorId: number | string): Promise<ServiceVisibility[]>;
}
