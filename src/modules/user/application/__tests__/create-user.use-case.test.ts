import assert from "node:assert/strict";
import test from "node:test";
import AppError from "../../../../core/appError.js";
import { EmailPolicyService } from "../../domain/services/email-policy.service.js";
import { CreateUserUseCase } from "../use-case/create-user.use-case.js";
import {
  FakeBcrypt,
  FakePasswordGenerator,
  FakePasswordNotifier,
  FakeUserRepository,
  userPayload,
} from "./user-use-case.helpers.js";

const makeUseCase = () => {
  const operations: string[] = [];
  const repository = new FakeUserRepository(operations);
  const notifier = new FakePasswordNotifier(operations);
  return {
    operations,
    repository,
    notifier,
    useCase: new CreateUserUseCase(
      repository,
      new EmailPolicyService(),
      new FakeBcrypt(operations),
      new FakePasswordGenerator("Temporaria1", operations),
      notifier,
    ),
  };
};

test("CreateUserUseCase hashes, notifies and persists a valid user", async () => {
  const { operations, repository, notifier, useCase } = makeUseCase();
  const user = await useCase.execute(userPayload);

  assert.equal(user.id, 1);
  assert.equal(repository.createdPassword, "hashed:Temporaria1");
  assert.deepEqual(notifier.sent, [
    { email: userPayload.email, password: "Temporaria1" },
  ]);
  assert.deepEqual(operations, ["generate", "hash", "notify", "persist"]);
});

test("CreateUserUseCase rejects duplicated, invalid and non-institutional email", async () => {
  const duplicated = makeUseCase();
  duplicated.repository.duplicatedEmail = true;
  await assert.rejects(
    () => duplicated.useCase.execute(userPayload),
    (error: AppError) => error.code === "USER_EMAIL_EXISTS",
  );

  await assert.rejects(
    () => makeUseCase().useCase.execute({ ...userPayload, email: "invalid" }),
    (error: AppError) => error.code === "USER_EMAIL_INVALID",
  );
  await assert.rejects(
    () => makeUseCase().useCase.execute({ ...userPayload, email: "user@gmail.com" }),
    (error: AppError) => error.code === "USER_EMAIL_INSTITUTIONAL",
  );
});
