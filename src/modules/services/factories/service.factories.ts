import { SequelizePermissionRepository } from "../../../infra/database/sequelize/repositories/sequelize.permission.repository.js";
import { SequelizeServiceAggregateRepository } from "../../../infra/database/sequelize/repositories/sequelize.service-aggregate.repository.js";
import { SequelizeServicesRepository } from "../../../infra/database/sequelize/repositories/sequelize.services.repository.js";
import { SequelizeServiceVisibilityRepository } from "../../../infra/database/sequelize/repositories/sequelize.servicesVisibility.repository.js";
import { EventBusServiceEventsAdapter } from "../../../infra/event/event-bus-service-events.adapter.js";
import {
  ServiceEventPublisher,
  ServiceEventSubscriber,
} from "../application/events/service-event-bus.js";
import { CreateServiceUseCase } from "../application/use-case/create-service.use-case.js";
import { DeleteServiceUseCase } from "../application/use-case/delete-service.use-case.js";
import { GetServiceByIdUseCase } from "../application/use-case/get-service-by-id.use-case.js";
import { ListServicesUseCase } from "../application/use-case/list-services.use-case.js";
import { ListVisibleServicesUseCase } from "../application/use-case/list-visible-services.use-case.js";
import { UpdateServiceUseCase } from "../application/use-case/update-service.use-case.js";
import { ServicesVisiblesService } from "../domain/services/services-visibles.service.js";

export const makeCreateServiceUseCase = () =>
  new CreateServiceUseCase(new SequelizeServicesRepository());

export const makeUpdateServiceUseCase = () =>
  new UpdateServiceUseCase(new SequelizeServiceAggregateRepository());

export const makeGetServiceByIdUseCase = () =>
  new GetServiceByIdUseCase(new SequelizeServiceAggregateRepository());

export const makeListServicesUseCase = () =>
  new ListServicesUseCase(new SequelizeServicesRepository());

export const makeListVisibleServicesUseCase = () =>
  new ListVisibleServicesUseCase(
    new SequelizeServicesRepository(),
    new SequelizeServiceVisibilityRepository(),
    new SequelizePermissionRepository(),
    new ServicesVisiblesService(),
  );

export const makeDeleteServiceUseCase = () =>
  new DeleteServiceUseCase(new SequelizeServiceAggregateRepository());

export const makeServiceEventPublisher = (): ServiceEventPublisher =>
  new EventBusServiceEventsAdapter();

export const makeServiceEventSubscriber = (): ServiceEventSubscriber =>
  new EventBusServiceEventsAdapter();
