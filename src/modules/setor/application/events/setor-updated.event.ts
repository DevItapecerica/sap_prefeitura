import { ApplicationEventContext } from "../../../../core/event/application-event.js";
import { Setor } from "../../domain/entity/Setor.js";

export interface SetorUpdatedEvent {
  context: ApplicationEventContext;
  before: Setor;
  after: Setor;
}
