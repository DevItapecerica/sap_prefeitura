import { ApplicationEventContext } from "./application-event.js";

export const RESOURCE_READ_EVENTS = {
  listed: "RESOURCE_LISTED",
  viewed: "RESOURCE_VIEWED",
  exported: "RESOURCE_EXPORTED",
} as const;

interface ResourceReadEvent {
  context: ApplicationEventContext;
  module: string;
  resourceType: string;
}

export interface ResourceListedEvent extends ResourceReadEvent {
  filters?: unknown;
  returnedCount: number;
}

export interface ResourceViewedEvent extends ResourceReadEvent {
  resourceId: string;
}

export interface ResourceExportedEvent extends ResourceReadEvent {
  resourceId?: string;
  filters?: unknown;
  returnedCount: number;
}

export interface ResourceReadEventMap {
  [RESOURCE_READ_EVENTS.listed]: ResourceListedEvent;
  [RESOURCE_READ_EVENTS.viewed]: ResourceViewedEvent;
  [RESOURCE_READ_EVENTS.exported]: ResourceExportedEvent;
}
