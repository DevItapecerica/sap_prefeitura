import { userParams, userRequired, userResponse, userResponseAll } from "../../application/dto/user.dto.js";
import { QueryParams } from "../../../../core/shared/types/genericTypes.js";
import { User } from "../entity/User.js";

export default interface UserRepository {
  getAllUser: (queryParams: QueryParams) => Promise<{ user: User[]; count: number }>;
  getUserById: (id: userParams) => Promise<User | null>;
  getUserByEmail: (email: string, excludeId?: userParams) => Promise<User>;
  createUser: (data: userRequired, password: string) => Promise<User>;
  updateUser: (id: userParams, data: userRequired) => Promise<User>;
  deleteUser: (id: userParams) => Promise<boolean>;
}
