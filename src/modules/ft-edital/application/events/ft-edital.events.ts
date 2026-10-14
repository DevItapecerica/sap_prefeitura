import { ApplicationEventContext } from "../../../../core/event/application-event.js";

export const FT_EDITAL_EVENTS = {
  created: "FT_EDITAL_CREATED",
  updated: "FT_EDITAL_UPDATED",
  deleted: "FT_EDITAL_DELETED",
  bolsistasLinked: "FT_EDITAL_BOLSISTAS_LINKED",
  vinculoUpdated: "FT_EDITAL_VINCULO_UPDATED",
  editalConcluded: "FT_EDITAL_CONCLUDED",
  vinculoExpired: "FT_EDITAL_VINCULO_EXPIRED",
} as const;

export interface FtEditalCreatedEvent {
  context: ApplicationEventContext;
  after: unknown;
}
export interface FtEditalUpdatedEvent {
  context: ApplicationEventContext;
  before: unknown;
  after: unknown;
}
export interface FtEditalDeletedEvent {
  context: ApplicationEventContext;
  before: unknown;
  resourceId: string;
}
export interface FtEditalBolsistasLinkedEvent {
  context: ApplicationEventContext;
  editalId: string;
  after: unknown[];
}
export interface FtEditalVinculoUpdatedEvent {
  context: ApplicationEventContext;
  editalId: string;
  bolsistaId: string;
  before: unknown;
  after: unknown;
}
export interface FtEditalConcludedEvent {
  context: ApplicationEventContext;
  editalId: string;
  before: unknown;
  after: unknown;
  vinculos: unknown[];
}
export interface FtEditalVinculoExpiredEvent {
  context: ApplicationEventContext;
  editalId: string;
  bolsistaId: string;
  vinculoId: string;
  before: unknown;
  after: unknown;
}

export interface FtEditalEventMap {
  [FT_EDITAL_EVENTS.created]: FtEditalCreatedEvent;
  [FT_EDITAL_EVENTS.updated]: FtEditalUpdatedEvent;
  [FT_EDITAL_EVENTS.deleted]: FtEditalDeletedEvent;
  [FT_EDITAL_EVENTS.bolsistasLinked]: FtEditalBolsistasLinkedEvent;
  [FT_EDITAL_EVENTS.vinculoUpdated]: FtEditalVinculoUpdatedEvent;
  [FT_EDITAL_EVENTS.editalConcluded]: FtEditalConcludedEvent;
  [FT_EDITAL_EVENTS.vinculoExpired]: FtEditalVinculoExpiredEvent;
}
