import {
  EventPublisher,
  EventSubscriber,
} from "../../core/event/event-contracts.js";
import { SequelizePagadorRepository } from "../../infra/database/sequelize/repositories/sequelize.pagador.repository.js";
import { EventBusAdapter } from "../../infra/event/event-bus.adapter.js";
import { PagadorEventMap } from "./application/pagador.events.js";
import { PagadorService } from "./application/pagador.service.js";

export const makePagadorService = () =>
  new PagadorService(new SequelizePagadorRepository());
export const makePagadorEventPublisher = (): EventPublisher<PagadorEventMap> =>
  new EventBusAdapter<PagadorEventMap>();
export const makePagadorEventSubscriber =
  (): EventSubscriber<PagadorEventMap> =>
    new EventBusAdapter<PagadorEventMap>();
