import { Permissions } from "../../domain/entity/Permission.js";

export interface UpdatePermissionResultDto {
  before: Permissions;
  after: Permissions;
}
