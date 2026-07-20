import { User } from "../../domain/entity/User.js";

export interface DeleteUserResultDto {
  before: User;
  after: null;
}
