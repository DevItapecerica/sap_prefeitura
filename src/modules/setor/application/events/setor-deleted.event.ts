import { ApplicationEventContext } from "../../../../core/event/application-event.js";
import { Setor } from "../../domain/entity/Setor.js";

export interface SetorDeletedEvent {
  context: ApplicationEventContext;
  before: Setor;
}
