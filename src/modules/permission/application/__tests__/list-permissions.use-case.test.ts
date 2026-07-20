import assert from "node:assert/strict";
import test from "node:test";
import AppError from "../../../../core/appError.js";
import { ListPermissionsUseCase } from "../use-case/list-permissions.use-case.js";
import { FakePermissionRepository } from "./permission-use-case.helpers.js";

test("ListPermissionsUseCase normalizes persistence criteria", async () => {
  const repository = new FakePermissionRepository();
  const result = await new ListPermissionsUseCase(repository).execute({ page: 2, limit: 10, order: "role_id:asc" });
  assert.equal(result.count, 1);
  assert.deepEqual(repository.lastQuery, { search: undefined, page: 2, limit: 10, order: "role_id:asc" });
});

test("ListPermissionsUseCase rejects invalid page and order", async () => {
  const useCase = new ListPermissionsUseCase(new FakePermissionRepository());
  await assert.rejects(() => useCase.execute({ page: -1 }), (error: AppError) => error.code === "INVALID_PAGE");
  await assert.rejects(() => useCase.execute({ order: "read:desc" }), (error: AppError) => error.code === "INVALID_QUERY_ORDER");
});
