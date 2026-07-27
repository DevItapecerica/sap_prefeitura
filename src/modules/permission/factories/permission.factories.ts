import { SequelizePermissionRepository } from "../../../infra/database/sequelize/repositories/sequelize.permission.repository.js";
import { EventBusAdapter } from "../../../infra/event/event-bus.adapter.js";
import { EventPublisher, EventSubscriber } from "../../../core/event/event-contracts.js";
import { PermissionEventMap } from "../application/events/permission.events.js";
import { GetPermissionByIdUseCase } from "../application/use-case/get-permission-by-id.use-case.js";
import { ListPermissionsUseCase } from "../application/use-case/list-permissions.use-case.js";
import { UpdatePermissionUseCase } from "../application/use-case/update-permission.use-case.js";

export const makeListPermissionsUseCase = () =>
  new ListPermissionsUseCase(new SequelizePermissionRepository());
export const makeGetPermissionByIdUseCase = () =>
  new GetPermissionByIdUseCase(new SequelizePermissionRepository());
export const makeUpdatePermissionUseCase = () =>
  new UpdatePermissionUseCase(new SequelizePermissionRepository());
export const makePermissionEventPublisher = (): EventPublisher<PermissionEventMap> =>
  new EventBusAdapter<PermissionEventMap>();
export const makePermissionEventSubscriber = (): EventSubscriber<PermissionEventMap> =>
  new EventBusAdapter<PermissionEventMap>();
