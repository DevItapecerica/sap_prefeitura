import { Permissions } from "../entity/Permission.js";

export interface PermissionListResult {
  permissions: Permissions[];
  count: number;
}
