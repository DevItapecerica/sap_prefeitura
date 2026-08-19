import assert from "node:assert/strict";
import test from "node:test";
import AppError from "../../../../core/appError.js";
import { User } from "../../domain/entity/User.js";
import { EmailPolicyService } from "../../domain/services/email-policy.service.js";
import { UpdateUserUseCase } from "../use-case/update-user.use-case.js";
import { FakeUserRepository, userPayload } from "./user-use-case.helpers.js";

test("UpdateUserUseCase returns the previous and updated user", async () => {
  const repository = new FakeUserRepository();
  repository.users.set(1, new User("Antes", userPayload.email, "1", 1, 1, 1));
  const useCase = new UpdateUserUseCase(repository, new EmailPolicyService());

  const result = await useCase.execute(1, {
    ...userPayload,
    name: "Depois",
    email: "depois@itapecerica.sp.gov.br",
  });
  assert.equal(result.before.name, "Antes");
  assert.equal(result.after.name, "Depois");
});

test("UpdateUserUseCase validates existence and email", async () => {
  const repository = new FakeUserRepository();
  const useCase = new UpdateUserUseCase(repository, new EmailPolicyService());
  await assert.rejects(
    () => useCase.execute(99, userPayload),
    (error: AppError) => error.code === "USER_NOT_FOUND",
  );
  await assert.rejects(
    () => useCase.execute(1, { ...userPayload, email: "invalid" }),
    (error: AppError) => error.code === "USER_EMAIL_INVALID",
  );
  repository.duplicatedEmail = true;
  await assert.rejects(
    () => useCase.execute(1, userPayload),
    (error: AppError) => error.code === "USER_EMAIL_EXISTS",
  );
});
