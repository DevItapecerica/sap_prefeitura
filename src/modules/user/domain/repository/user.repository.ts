import { QueryParams } from "../../../../core/types/genericTypes.js";
import { User } from "../entity/User.js";

export default interface UserRepository {
  getAllUser: (queryParams: QueryParams) => Promise<{ user: User[]; count: number }>;
  getUserById: (id: number) => Promise<User | null>;
  getUserByEmail: (email: string, excludeId?: number) => Promise<User | null>;
  createUser: (data: User, password: string) => Promise<User>;
  updateUser: (id: number, data: User) => Promise<User>;
  alterarUserSenha: (id: number, password: string) => Promise<boolean>;
  deleteUser: (id: number) => Promise<boolean>;
}
