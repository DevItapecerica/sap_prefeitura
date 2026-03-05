import { UserDB } from "../../db/models/user.model.js";

export type userParams = Pick<UserDB, "id">;

export type userRequired = Pick<
  UserDB, "name" | "email" | "ramal" | "setor_id" | "role_id" | "firstLogin"
>;

export type userResponse = UserDB;

export interface userResponseAll {
  user: UserDB[] | UserDB;
  count: number;
}

export type userLogin = Pick<UserDB, "email" | "password">;

export type userToken = Pick<UserDB, "id" | "name" | "email" | "role_id" | "setor_id">;

export interface userAuth extends userToken {
  token: string;
  iat: number;
  exp: number;
}
