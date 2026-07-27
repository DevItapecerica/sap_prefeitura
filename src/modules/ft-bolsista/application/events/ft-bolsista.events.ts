import { ApplicationEventContext } from "../../../../core/event/application-event.js";

export const FT_BOLSISTA_EVENTS = {
  created: "FT_BOLSISTA_RESOURCE_CREATED",
  updated: "FT_BOLSISTA_RESOURCE_UPDATED",
  deleted: "FT_BOLSISTA_RESOURCE_DELETED",
} as const;

export type FtBolsistaResource = "bolsista" | "vinculo" | "falta";
export interface FtBolsistaCreatedEvent {
  context: ApplicationEventContext;
  resourceType: FtBolsistaResource;
  after: unknown;
  resourceId?: string;
}
export interface FtBolsistaUpdatedEvent {
  context: ApplicationEventContext;
  resourceType: FtBolsistaResource;
  before: unknown;
  after: unknown;
  resourceId?: string;
}
export interface FtBolsistaDeletedEvent {
  context: ApplicationEventContext;
  resourceType: FtBolsistaResource;
  before: unknown;
  resourceId: string;
}

export interface FtBolsistaEventMap {
  [FT_BOLSISTA_EVENTS.created]: FtBolsistaCreatedEvent;
  [FT_BOLSISTA_EVENTS.updated]: FtBolsistaUpdatedEvent;
  [FT_BOLSISTA_EVENTS.deleted]: FtBolsistaDeletedEvent;
}
