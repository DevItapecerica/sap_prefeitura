import { UserDB } from "../db/models/user.model.js";
import { genericResponse } from "./genericTypes.js";

export type userParams = Pick<UserDB, "id">;

export type userRequired = Pick<
  UserDB, "name" | "email" | "ramal" | "setor_id" | "role_id" | "firstLogin"
>;

export interface userResponse extends genericResponse {
  data: UserDB[] | UserDB;
  count: number;
  total: number;
}

export type userLogin = Pick<UserDB, "email" | "password">;

export type userToken = Pick<UserDB, "id" | "name" | "email" | "role_id" | "setor_id">;

export interface userAuth extends userToken {
  token: string;
  iat: number;
  exp: number;
}
