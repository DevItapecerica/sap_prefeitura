import { ApplicationEventContext } from "../../../core/event/application-event.js";

export const PAGADOR_EVENTS = {
  created: "FT_PAGADOR_CREATED",
  updated: "FT_PAGADOR_UPDATED",
  deleted: "FT_PAGADOR_DELETED",
} as const;
type Base = { context: ApplicationEventContext };
export interface PagadorEventMap {
  [PAGADOR_EVENTS.created]: Base & { after: unknown };
  [PAGADOR_EVENTS.updated]: Base & { before: unknown; after: unknown };
  [PAGADOR_EVENTS.deleted]: Base & { before: unknown; resourceId: string };
}
