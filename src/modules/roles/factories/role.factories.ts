import { SequelizeRolesRepository } from "../../../infra/database/sequelize/repositories/sequelize.roles.repository.js";
import { EventBusAdapter } from "../../../infra/event/event-bus.adapter.js";
import { EventPublisher, EventSubscriber } from "../../../core/event/event-contracts.js";
import { RoleEventMap } from "../application/events/role.events.js";
import { CreateRoleUseCase } from "../application/use-case/create-role.use-case.js";
import { DeleteRoleUseCase } from "../application/use-case/delete-role.use-case.js";
import { GetRoleByIdUseCase } from "../application/use-case/get-role-by-id.use-case.js";
import { ListRolesUseCase } from "../application/use-case/list-roles.use-case.js";
import { UpdateRoleUseCase } from "../application/use-case/update-role.use-case.js";

export const makeCreateRoleUseCase = () =>
  new CreateRoleUseCase(new SequelizeRolesRepository());
export const makeUpdateRoleUseCase = () =>
  new UpdateRoleUseCase(new SequelizeRolesRepository());
export const makeGetRoleByIdUseCase = () =>
  new GetRoleByIdUseCase(new SequelizeRolesRepository());
export const makeListRolesUseCase = () =>
  new ListRolesUseCase(new SequelizeRolesRepository());
export const makeDeleteRoleUseCase = () =>
  new DeleteRoleUseCase(new SequelizeRolesRepository());
export const makeRoleEventPublisher = (): EventPublisher<RoleEventMap> =>
  new EventBusAdapter<RoleEventMap>();
export const makeRoleEventSubscriber = (): EventSubscriber<RoleEventMap> =>
  new EventBusAdapter<RoleEventMap>();
