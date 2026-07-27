import { RoleAggregate } from "../../domain/repository/roles.repository.js";

export interface DeleteRoleResultDto {
  before: RoleAggregate;
  after: null;
}
