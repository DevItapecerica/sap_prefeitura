import assert from "node:assert/strict";
import test from "node:test";
import AppError from "../../../../core/appError.js";
import { User } from "../../domain/entity/User.js";
import { PasswordPolicyService } from "../../domain/services/password-policy.service.js";
import { ChangeUserPasswordUseCase } from "../use-case/change-user-password.use-case.js";
import { FakeBcrypt, FakeUserRepository, userPayload } from "./user-use-case.helpers.js";

const makeUseCase = () => {
  const repository = new FakeUserRepository();
  repository.users.set(
    1,
    new User("User", userPayload.email, "1", 1, 1, 1, false, "hashed:SenhaAtual1"),
  );
  return {
    repository,
    useCase: new ChangeUserPasswordUseCase(
      repository,
      new FakeBcrypt(),
      new PasswordPolicyService(),
    ),
  };
};

test("ChangeUserPasswordUseCase validates and changes the password", async () => {
  await assert.rejects(
    () => makeUseCase().useCase.execute(1, "Errada1", "NovaSenha1"),
    (error: AppError) => error.code === "USER_PASSWORD_INCORRECT",
  );
  await assert.rejects(
    () => makeUseCase().useCase.execute(1, "SenhaAtual1", "fraca"),
    (error: AppError) => error.code === "USER_PASSWORD_WEAK",
  );
  await assert.rejects(
    () => makeUseCase().useCase.execute(1, "SenhaAtual1", "SenhaAtual1"),
    (error: AppError) => error.code === "USER_PASSWORD_REUSED",
  );

  const { repository, useCase } = makeUseCase();
  assert.equal(await useCase.execute(1, "SenhaAtual1", "NovaSenha1"), true);
  assert.equal(repository.users.get(1)?.password, "hashed:NovaSenha1");
});
