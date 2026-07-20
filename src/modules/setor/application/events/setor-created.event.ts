import { ApplicationEventContext } from "../../../../core/event/application-event.js";
import { Setor } from "../../domain/entity/Setor.js";

export interface SetorCreatedEvent {
  context: ApplicationEventContext;
  setor: Setor;
}
