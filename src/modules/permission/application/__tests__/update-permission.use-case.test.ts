import assert from "node:assert/strict";
import test from "node:test";
import AppError from "../../../../core/appError.js";
import { UpdatePermissionUseCase } from "../use-case/update-permission.use-case.js";
import { FakePermissionRepository } from "./permission-use-case.helpers.js";

const update = { read: true, write: true, edit: false, del: false };

test("UpdatePermissionUseCase returns complete before and after snapshots", async () => {
  const result = await new UpdatePermissionUseCase(new FakePermissionRepository()).execute(1, update);
  assert.equal(result.before.write, false);
  assert.equal(result.after.write, true);
  assert.equal(result.after.service_id, 6);
  assert.equal(result.after.role_id, 1);
});

test("UpdatePermissionUseCase rejects missing or concurrently removed permissions", async () => {
  const repository = new FakePermissionRepository();
  const useCase = new UpdatePermissionUseCase(repository);
  await assert.rejects(() => useCase.execute(99, update), (error: AppError) => error.code === "PERMISSION_NOT_FOUND");
  repository.failUpdate = true;
  await assert.rejects(() => useCase.execute(1, update), (error: AppError) => error.code === "PERMISSION_NOT_FOUND");
});
