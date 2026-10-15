import { EventPublisher, EventSubscriber } from "../../core/event/event-contracts.js";
import { SequelizeTurnoRepository } from "../../infra/database/sequelize/repositories/sequelize.turno.repository.js";
import { EventBusAdapter } from "../../infra/event/event-bus.adapter.js";
import { TurnoEventMap } from "./application/turno.events.js";
import { TurnoService } from "./application/turno.service.js";

export const makeTurnoService = () => new TurnoService(new SequelizeTurnoRepository());
export const makeTurnoEventPublisher = (): EventPublisher<TurnoEventMap> => new EventBusAdapter<TurnoEventMap>();
export const makeTurnoEventSubscriber = (): EventSubscriber<TurnoEventMap> => new EventBusAdapter<TurnoEventMap>();
