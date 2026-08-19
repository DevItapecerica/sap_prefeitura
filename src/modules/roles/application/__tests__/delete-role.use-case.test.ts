import assert from "node:assert/strict";
import test from "node:test";
import AppError from "../../../../core/appError.js";
import { DeleteRoleUseCase } from "../use-case/delete-role.use-case.js";
import { FakeRolesRepository } from "./role-use-case.helpers.js";

test("DeleteRoleUseCase returns the complete aggregate snapshot", async () => {
  const result = await new DeleteRoleUseCase(new FakeRolesRepository()).execute(2);
  assert.equal(result.before.role.id, 2);
  assert.equal(result.before.permissions.length, 1);
  assert.equal(result.after, null);
});

test("DeleteRoleUseCase protects admin, missing and in-use roles", async () => {
  const repository = new FakeRolesRepository();
  const useCase = new DeleteRoleUseCase(repository);
  await assert.rejects(() => useCase.execute(1), (error: AppError) => error.code === "ROLE_DELETE_FORBIDDEN");
  await assert.rejects(() => useCase.execute(99), (error: AppError) => error.code === "ROLE_NOT_FOUND");
  repository.roleInUse = true;
  await assert.rejects(() => useCase.execute(2), (error: AppError) => error.code === "ROLE_IN_USE");
});
