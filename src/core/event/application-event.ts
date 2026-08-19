export type ApplicationEventOriginType = "HTTP" | "SYSTEM" | "SCHEDULER";

export interface ApplicationEventActor {
  id: number | string;
  name?: string | null;
  roleId?: number | string | null;
  setorId?: number | string | null;
}

export interface ApplicationEventOrigin {
  type: ApplicationEventOriginType;
  ip?: string | null;
  method?: string | null;
  route?: string | null;
}

export interface ApplicationEventContext {
  correlationId: string;
  actor?: ApplicationEventActor;
  origin?: ApplicationEventOrigin;
}
