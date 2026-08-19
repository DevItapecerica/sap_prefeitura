import { Permissions } from "../entity/Permission.js";
import { PermissionListResult } from "./permission-list-result.js";
import { PermissionQuery } from "./permission-query.js";

export type PermissionCreateData = Pick<
  Permissions,
  "service_id" | "role_id"
> &
  Partial<Pick<Permissions, "read" | "write" | "edit" | "del">>;

export type PermissionUpdateData = Pick<
  Permissions,
  "read" | "write" | "edit" | "del"
>;

export interface PermissionRepository {
  findAll(query: PermissionQuery): Promise<PermissionListResult>;
  findById(id: number): Promise<Permissions | null>;
  findByRoleAndService(
    roleId: number,
    serviceId: number,
  ): Promise<Permissions | null>;
  findReadableByRole(roleId: number | string): Promise<Permissions[]>;
  create(data: PermissionCreateData): Promise<Permissions>;
  update(id: number, data: PermissionUpdateData): Promise<Permissions | null>;
}
