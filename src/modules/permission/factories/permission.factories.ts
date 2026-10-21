import { EventBusAdapter } from "../../../infra/event/event-bus.adapter.js";
import { EventPublisher, EventSubscriber } from "../../../core/event/event-contracts.js";
import { PermissionEventMap } from "../application/events/permission.events.js";

export const makePermissionEventPublisher = (): EventPublisher<PermissionEventMap> =>
  new EventBusAdapter<PermissionEventMap>();
export const makePermissionEventSubscriber = (): EventSubscriber<PermissionEventMap> =>
  new EventBusAdapter<PermissionEventMap>();
