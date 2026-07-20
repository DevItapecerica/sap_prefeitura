import { ApplicationEventContext } from "../../../../core/event/application-event.js";
import { Services } from "../../domain/entity/Services.js";
import { ServiceAggregateDto } from "../dto/service-aggregate.dto.js";

export const SERVICE_EVENTS = {
  created: "SERVICE_CREATED",
  updated: "SERVICE_UPDATED",
  deleted: "SERVICE_DELETED",
} as const;

export interface ServiceCreatedEvent {
  context: ApplicationEventContext;
  service: Services;
}

export interface ServiceUpdatedEvent {
  context: ApplicationEventContext;
  before: ServiceAggregateDto;
  after: ServiceAggregateDto;
}

export interface ServiceDeletedEvent {
  context: ApplicationEventContext;
  before: ServiceAggregateDto;
}
