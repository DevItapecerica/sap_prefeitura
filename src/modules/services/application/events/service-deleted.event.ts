import { ApplicationEventContext } from "../../../../core/event/application-event.js";
import { ServiceAggregateDto } from "../dto/service-aggregate.dto.js";

export interface ServiceDeletedEvent {
  context: ApplicationEventContext;
  before: ServiceAggregateDto;
}
