import { ApplicationEventContext } from "../../../../core/event/application-event.js";
import { ServiceAggregateDto } from "../dto/service-aggregate.dto.js";

export interface ServiceUpdatedEvent {
  context: ApplicationEventContext;
  before: ServiceAggregateDto;
  after: ServiceAggregateDto;
}
