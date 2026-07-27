import { ApplicationEventContext } from "../../../../core/event/application-event.js";
import { Setor } from "../../domain/entity/Setor.js";

export const SETOR_EVENTS = {
  created: "SETOR_CREATED",
  updated: "SETOR_UPDATED",
  deleted: "SETOR_DELETED",
} as const;

export interface SetorCreatedEvent {
  context: ApplicationEventContext;
  setor: Setor;
}

export interface SetorUpdatedEvent {
  context: ApplicationEventContext;
  before: Setor;
  after: Setor;
}

export interface SetorDeletedEvent {
  context: ApplicationEventContext;
  before: Setor;
}

export interface SetorEventMap {
  [SETOR_EVENTS.created]: SetorCreatedEvent;
  [SETOR_EVENTS.updated]: SetorUpdatedEvent;
  [SETOR_EVENTS.deleted]: SetorDeletedEvent;
}
