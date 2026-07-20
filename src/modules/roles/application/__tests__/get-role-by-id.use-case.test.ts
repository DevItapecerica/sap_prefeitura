import assert from "node:assert/strict";
import test from "node:test";
import AppError from "../../../../core/appError.js";
import { GetRoleByIdUseCase } from "../use-case/get-role-by-id.use-case.js";
import { FakeRolesRepository } from "./role-use-case.helpers.js";

test("GetRoleByIdUseCase returns a role and rejects an unknown id", async () => {
  const useCase = new GetRoleByIdUseCase(new FakeRolesRepository());
  assert.equal((await useCase.execute(2)).name, "Gestor");
  await assert.rejects(
    () => useCase.execute(99),
    (error: AppError) => error.code === "ROLE_NOT_FOUND",
  );
});
