import assert from "node:assert/strict";
import test from "node:test";
import AppError from "../../../../core/appError.js";
import { User } from "../../domain/entity/User.js";
import { GetUserByIdUseCase } from "../use-case/get-user-by-id.use-case.js";
import { FakeUserRepository, userPayload } from "./user-use-case.helpers.js";

test("GetUserByIdUseCase returns a user and rejects an unknown id", async () => {
  const repository = new FakeUserRepository();
  repository.users.set(1, new User("User", userPayload.email, "1", 1, 1, 1));
  const useCase = new GetUserByIdUseCase(repository);

  assert.equal((await useCase.execute(1)).id, 1);
  await assert.rejects(
    () => useCase.execute(99),
    (error: AppError) => error.code === "USER_NOT_FOUND",
  );
});
