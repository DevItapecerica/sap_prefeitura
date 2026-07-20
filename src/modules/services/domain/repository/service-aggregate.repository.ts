import { Permissions } from "../../../permission/domain/entity/Permission.js";
import { Services } from "../entity/Services.js";
import { ServiceVisibility } from "../entity/ServiceVisibility.js";

export interface ServiceAggregate {
  services: Services;
  permissions: Permissions[];
  visibility: ServiceVisibility[];
}

export interface ServiceAggregateUpdate {
  service: {
    name: string;
    description: string;
    tag?: string;
    url: string;
  };
  permissions?: Array<{
    id: number;
    role_id: number;
    service_id: number;
    read: boolean;
    write: boolean;
    edit: boolean;
    del: boolean;
  }>;
  visibility?: Array<{
    id: number;
    setor_id: number;
    service_id: number;
    visibility: boolean;
  }>;
}

export type ServiceAggregateErrorCode =
  | "SERVICE_NOT_FOUND"
  | "PERMISSION_NOT_FOUND"
  | "VISIBILITY_NOT_FOUND";

export class ServiceAggregateError extends Error {
  constructor(public readonly code: ServiceAggregateErrorCode) {
    super(code);
    this.name = "ServiceAggregateError";
  }
}

export interface ServiceAggregateRepository {
  findById(id: number): Promise<ServiceAggregate | null>;
  update(
    id: number,
    input: ServiceAggregateUpdate,
  ): Promise<{ before: ServiceAggregate; after: ServiceAggregate }>;
  delete(
    id: number,
  ): Promise<{ before: ServiceAggregate; after: null }>;
}
