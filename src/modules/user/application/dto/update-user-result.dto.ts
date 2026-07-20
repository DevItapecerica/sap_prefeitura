import { User } from "../../domain/entity/User.js";

export interface UpdateUserResultDto {
  before: User;
  after: User;
}
