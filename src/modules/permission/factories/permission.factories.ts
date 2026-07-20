import { SequelizePermissionRepository } from "../../../infra/database/sequelize/repositories/sequelize.permission.repository.js";
import { EventBusPermissionEventsAdapter } from "../../../infra/event/event-bus-permission-events.adapter.js";
import {
  PermissionEventPublisher,
  PermissionEventSubscriber,
} from "../application/events/permission-event-bus.js";
import { GetPermissionByIdUseCase } from "../application/use-case/get-permission-by-id.use-case.js";
import { ListPermissionsUseCase } from "../application/use-case/list-permissions.use-case.js";
import { UpdatePermissionUseCase } from "../application/use-case/update-permission.use-case.js";

export const makeListPermissionsUseCase = () =>
  new ListPermissionsUseCase(new SequelizePermissionRepository());
export const makeGetPermissionByIdUseCase = () =>
  new GetPermissionByIdUseCase(new SequelizePermissionRepository());
export const makeUpdatePermissionUseCase = () =>
  new UpdatePermissionUseCase(new SequelizePermissionRepository());
export const makePermissionEventPublisher = (): PermissionEventPublisher =>
  new EventBusPermissionEventsAdapter();
export const makePermissionEventSubscriber = (): PermissionEventSubscriber =>
  new EventBusPermissionEventsAdapter();
