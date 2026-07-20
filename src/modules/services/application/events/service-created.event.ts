import { ApplicationEventContext } from "../../../../core/event/application-event.js";
import { Services } from "../../domain/entity/Services.js";

export interface ServiceCreatedEvent {
  context: ApplicationEventContext;
  service: Services;
}
