import { Roles } from "../../domain/entity/Role.js";

export interface UpdateRoleResultDto {
  before: Roles;
  after: Roles;
}
