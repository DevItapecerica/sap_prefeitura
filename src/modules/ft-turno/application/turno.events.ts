import { ApplicationEventContext } from "../../../core/event/application-event.js";

export const TURNO_EVENTS = { created: "FT_TURNO_CREATED", updated: "FT_TURNO_UPDATED", deleted: "FT_TURNO_DELETED" } as const;
type Base = { context: ApplicationEventContext };
export interface TurnoEventMap {
  [TURNO_EVENTS.created]: Base & { after: unknown };
  [TURNO_EVENTS.updated]: Base & { before: unknown; after: unknown };
  [TURNO_EVENTS.deleted]: Base & { before: unknown; resourceId: string };
}
