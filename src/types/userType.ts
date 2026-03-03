import { UserDB } from "../db/models/UserModel.js";

export type userParams = Pick<UserDB, "id">;

export type userRequired = Pick<
  UserDB, "name" | "email" | "ramal" | "setor_id" | "role_id" | "firstLogin"
>;

export type userLogin = Pick<UserDB, "email" | "password">;

export type userToken = Pick<UserDB, "id" | "name" | "email" | "role_id" | "setor_id">;

export interface userAuth extends userToken {
  token: string;
  iat: number;
  exp: number;
}
