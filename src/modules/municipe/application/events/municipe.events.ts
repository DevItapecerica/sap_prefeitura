import { ApplicationEventContext } from "../../../../core/event/application-event.js";
import { MunicipeProtectedSnapshot } from "../dto/municipe-protected-snapshot.dto.js";

export const MUNICIPE_EVENTS = {
  created: "MUNICIPE_CREATED",
  updated: "MUNICIPE_UPDATED",
} as const;

export interface MunicipeCreatedEvent {
  context: ApplicationEventContext;
  after: MunicipeProtectedSnapshot;
}

export interface MunicipeUpdatedEvent {
  context: ApplicationEventContext;
  before: MunicipeProtectedSnapshot;
  after: MunicipeProtectedSnapshot;
}

export interface MunicipeEventMap {
  [MUNICIPE_EVENTS.created]: MunicipeCreatedEvent;
  [MUNICIPE_EVENTS.updated]: MunicipeUpdatedEvent;
}
