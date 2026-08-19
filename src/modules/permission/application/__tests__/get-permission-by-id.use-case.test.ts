import assert from "node:assert/strict";
import test from "node:test";
import AppError from "../../../../core/appError.js";
import { GetPermissionByIdUseCase } from "../use-case/get-permission-by-id.use-case.js";
import { FakePermissionRepository } from "./permission-use-case.helpers.js";

test("GetPermissionByIdUseCase returns a permission and rejects missing ids", async () => {
  const useCase = new GetPermissionByIdUseCase(new FakePermissionRepository());
  assert.equal((await useCase.execute(1)).service_id, 6);
  await assert.rejects(() => useCase.execute(99), (error: AppError) => error.code === "PERMISSION_NOT_FOUND");
});
