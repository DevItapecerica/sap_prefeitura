import assert from "node:assert/strict";
import test from "node:test";
import AppError from "../../../../core/appError.js";
import { User } from "../../domain/entity/User.js";
import { ListUsersUseCase } from "../use-case/list-users.use-case.js";
import { FakeUserRepository, userPayload } from "./user-use-case.helpers.js";

test("ListUsersUseCase validates and maps pagination", async () => {
  const repository = new FakeUserRepository();
  repository.users.set(1, new User("User", userPayload.email, "1", 1, 1, 1));
  const useCase = new ListUsersUseCase(repository);

  const result = await useCase.execute({
    page: 2,
    limit: 5,
    order: "name:asc",
    search: "User",
    setorId: 3,
  });
  assert.equal(result.count, 1);
  assert.deepEqual(repository.lastQuery, {
    page: 1,
    limit: 5,
    order: "name:asc",
    search: "User",
    setorId: 3,
  });
  await assert.rejects(
    () => useCase.execute({ page: 0 }),
    (error: AppError) => error.code === "INVALID_PAGE",
  );
  await assert.rejects(
    () => useCase.execute({ order: "password:desc" }),
    (error: AppError) => error.code === "INVALID_QUERY_ORDER",
  );
});
