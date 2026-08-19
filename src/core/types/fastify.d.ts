import "fastify";
import { AuditableAction } from "../event/auditable-action.js";

export interface AuditRouteMetadata {
  failureAction: AuditableAction;
  module: string;
  resourceType: string;
  resourceIdParam?: string;
}

declare module "fastify" {
  interface FastifyRequest {
    user: {
      id: number | string;
      name: string;
      role_id: number | string;
      setor_id: number | string | null;
    };
  }

  interface FastifyContextConfig {
    audit?: AuditRouteMetadata;
  }
}
