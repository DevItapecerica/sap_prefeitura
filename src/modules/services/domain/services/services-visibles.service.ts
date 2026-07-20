import { Services } from "../entity/Services.js";
import { ServiceVisibility } from "../entity/ServiceVisibility.js";

export class ServicesVisiblesService {
  execute(
    services: Services[],
    visibility: ServiceVisibility[],
  ): Services[] {
    const visibleIds = new Set(
      visibility.filter((item) => item.visibility).map((item) => item.service_id),
    );
    return services.filter((service) => visibleIds.has(service.id));
  }
}
