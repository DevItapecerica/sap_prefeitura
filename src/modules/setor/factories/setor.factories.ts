import { SequelizeSetorRepository } from "../../../infra/database/sequelize/repositories/sequelize.setor.repository.js";
import { EventBusAdapter } from "../../../infra/event/event-bus.adapter.js";
import { EventPublisher, EventSubscriber } from "../../../core/event/event-contracts.js";
import { SetorEventMap } from "../application/events/setor.events.js";
import { CreateSetorUseCase } from "../application/use-case/create-setor.use-case.js";
import { DeleteSetorUseCase } from "../application/use-case/delete-setor.use-case.js";
import { GetSetorByIdUseCase } from "../application/use-case/get-setor-by-id.use-case.js";
import { ListSetoresUseCase } from "../application/use-case/list-setores.use-case.js";
import { UpdateSetorUseCase } from "../application/use-case/update-setor.use-case.js";

export const makeCreateSetorUseCase = () =>
  new CreateSetorUseCase(new SequelizeSetorRepository());

export const makeUpdateSetorUseCase = () =>
  new UpdateSetorUseCase(new SequelizeSetorRepository());

export const makeGetSetorByIdUseCase = () =>
  new GetSetorByIdUseCase(new SequelizeSetorRepository());

export const makeListSetoresUseCase = () =>
  new ListSetoresUseCase(new SequelizeSetorRepository());

export const makeDeleteSetorUseCase = () =>
  new DeleteSetorUseCase(new SequelizeSetorRepository());

export const makeSetorEventPublisher = (): EventPublisher<SetorEventMap> =>
  new EventBusAdapter<SetorEventMap>();

export const makeSetorEventSubscriber = (): EventSubscriber<SetorEventMap> =>
  new EventBusAdapter<SetorEventMap>();
