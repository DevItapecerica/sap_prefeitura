import { ApplicationEventContext } from "../../../../core/event/application-event.js";

export const ESPORTE_EVENTS = {
  atletaCreated: "ATLETA_CREATED",
  atletaUpdated: "ATLETA_UPDATED",
  atletaDeleted: "ATLETA_DELETED",
  atletaModalidadesUpdated: "ATLETA_MODALIDADES_UPDATED",
  modalidadeCreated: "MODALIDADE_CREATED",
  modalidadeUpdated: "MODALIDADE_UPDATED",
  modalidadeDeleted: "MODALIDADE_DELETED",
  carterinhaCreated: "CARTERINHA_ESPORTE_CREATED",
} as const;

export interface EsporteCreatedEvent {
  context: ApplicationEventContext;
  resourceType: "atleta" | "modalidade" | "carterinha_esporte";
  after: Record<string, unknown>;
}

export interface EsporteUpdatedEvent {
  context: ApplicationEventContext;
  resourceType: "atleta" | "modalidade";
  before: Record<string, unknown>;
  after: Record<string, unknown>;
}

export interface EsporteDeletedEvent {
  context: ApplicationEventContext;
  resourceType: "atleta" | "modalidade";
  before: Record<string, unknown>;
}

export interface AtletaModalidadesUpdatedEvent {
  context: ApplicationEventContext;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
}

export interface EsporteEventMap {
  [ESPORTE_EVENTS.atletaCreated]: EsporteCreatedEvent;
  [ESPORTE_EVENTS.atletaUpdated]: EsporteUpdatedEvent;
  [ESPORTE_EVENTS.atletaDeleted]: EsporteDeletedEvent;
  [ESPORTE_EVENTS.atletaModalidadesUpdated]: AtletaModalidadesUpdatedEvent;
  [ESPORTE_EVENTS.modalidadeCreated]: EsporteCreatedEvent;
  [ESPORTE_EVENTS.modalidadeUpdated]: EsporteUpdatedEvent;
  [ESPORTE_EVENTS.modalidadeDeleted]: EsporteDeletedEvent;
  [ESPORTE_EVENTS.carterinhaCreated]: EsporteCreatedEvent;
}
