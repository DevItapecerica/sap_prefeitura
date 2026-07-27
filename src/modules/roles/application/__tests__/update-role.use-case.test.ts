import assert from "node:assert/strict";
import test from "node:test";
import AppError from "../../../../core/appError.js";
import { UpdateRoleUseCase } from "../use-case/update-role.use-case.js";
import { FakeRolesRepository } from "./role-use-case.helpers.js";

test("UpdateRoleUseCase returns before and after snapshots", async () => {
  const result = await new UpdateRoleUseCase(new FakeRolesRepository()).execute(2, { name: "Operador" });
  assert.equal(result.before.name, "Gestor");
  assert.equal(result.after.name, "Operador");
});

test("UpdateRoleUseCase rejects missing or concurrently removed roles", async () => {
  const repository = new FakeRolesRepository();
  const useCase = new UpdateRoleUseCase(repository);
  await assert.rejects(() => useCase.execute(99, { name: "X" }), (error: AppError) => error.code === "ROLE_NOT_FOUND");
  repository.failUpdate = true;
  await assert.rejects(() => useCase.execute(2, { name: "X" }), (error: AppError) => error.code === "ROLE_NOT_FOUND");
});
