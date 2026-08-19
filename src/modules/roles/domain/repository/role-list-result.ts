import { Roles } from "../entity/Role.js";

export interface RoleListResult {
  roles: Roles[];
  count: number;
}
