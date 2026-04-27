import { Services } from "../entity/Services.js";
import { ServiceVisibility } from "../entity/ServiceVisibility.js";

export class ServicesVisiblesService {
  async execute(
    services: Services[],
    visibility: ServiceVisibility[],
  ): Promise<Services[]> {
    const visiblesIds = new Set(
      visibility.filter((v) => v.visibility === true).map((v) => v.service_id),
    );

    const servicesVisibles = services.filter((service) =>
      visiblesIds.has(service.id),
    );

    return servicesVisibles;
  }
}
