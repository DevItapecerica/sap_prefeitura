import { UserDB } from "../../../../infra/database/sequelize/models/user.model.js";

export type userParams = number

export type userRequired = Pick<
  UserDB, "name" | "email" | "ramal" | "setor_id" | "role_id"
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
