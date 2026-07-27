import assert from "node:assert/strict";
import test from "node:test";
import AppError from "../../../../core/appError.js";
import { User } from "../../domain/entity/User.js";
import { DeleteUserUseCase } from "../use-case/delete-user.use-case.js";
import { FakeUserRepository, userPayload } from "./user-use-case.helpers.js";

test("DeleteUserUseCase returns the previous state and removes the user", async () => {
  const repository = new FakeUserRepository();
  repository.users.set(1, new User("User", userPayload.email, "1", 1, 1, 1));
  const useCase = new DeleteUserUseCase(repository);

  const result = await useCase.execute(1);
  assert.equal(result.before.id, 1);
  assert.equal(result.after, null);
  assert.equal(repository.users.has(1), false);
  await assert.rejects(
    () => useCase.execute(1),
    (error: AppError) => error.code === "USER_NOT_FOUND",
  );
});
