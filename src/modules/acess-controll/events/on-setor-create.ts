import { eventBus } from "../../../core/event/index.js";
import ServicesService from "../../services/application/use-case/services.service.js";

export const registerSetorCreatedHandler = (
  ServicesService: ServicesService,
) => {
  eventBus.on("SETOR_CREATED", async (setor) => {
    const data = await ServicesService.getAll({});

    data.services.map(async (sv) => {
      await ServicesService.ServiceVisibilityCreate(setor.id, sv.id);
    });
  });
};

