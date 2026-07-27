import { Permissions } from "../../../permission/domain/entity/Permission.js";
import { Roles } from "../entity/Role.js";
import { RoleListResult } from "./role-list-result.js";
import { RoleQuery } from "./role-query.js";

export type RoleWriteData = Pick<Roles, "name">;

export interface RoleAggregate {
  role: Roles;
  permissions: Permissions[];
}

export type DeleteRoleRepositoryResult =
  | { status: "deleted"; before: RoleAggregate }
  | { status: "not_found" }
  | { status: "in_use" };

export interface RolesRepository {
  findAll(query: RoleQuery): Promise<RoleListResult>;
  findById(id: number): Promise<Roles | null>;
  create(data: RoleWriteData): Promise<Roles>;
  update(id: number, data: RoleWriteData): Promise<Roles | null>;
  deleteWithPermissions(id: number): Promise<DeleteRoleRepositoryResult>;
}
