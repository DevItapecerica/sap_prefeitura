import assert from "node:assert/strict";
import test from "node:test";
import AppError from "../../../../core/appError.js";
import { ListRolesUseCase } from "../use-case/list-roles.use-case.js";
import { FakeRolesRepository } from "./role-use-case.helpers.js";

test("ListRolesUseCase normalizes pagination and order", async () => {
  const repository = new FakeRolesRepository();
  const result = await new ListRolesUseCase(repository).execute({ page: 1, limit: 5, order: "name:asc" });
  assert.equal(result.count, 2);
  assert.deepEqual(repository.lastQuery, { search: undefined, page: 1, limit: 5, order: "name:asc" });
});

test("ListRolesUseCase rejects invalid page and order", async () => {
  const useCase = new ListRolesUseCase(new FakeRolesRepository());
  await assert.rejects(() => useCase.execute({ page: -1 }), (error: AppError) => error.code === "INVALID_PAGE");
  await assert.rejects(() => useCase.execute({ order: "password:asc" }), (error: AppError) => error.code === "INVALID_QUERY_ORDER");
});
