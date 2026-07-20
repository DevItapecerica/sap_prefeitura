import { User } from "../entity/User.js";

export interface UserListResult {
  user: User[];
  count: number;
}
