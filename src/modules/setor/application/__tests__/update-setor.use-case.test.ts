import assert from "node:assert/strict";
import test from "node:test";
import AppError from "../../../../core/appError.js";
import { UpdateSetorUseCase } from "../use-case/update-setor.use-case.js";
import { FakeSetorRepository } from "./setor-use-case.helpers.js";

test("UpdateSetorUseCase returns before and after", async () => {
  const useCase = new UpdateSetorUseCase(new FakeSetorRepository());
  const result = await useCase.execute(2, {
    name: "Tecnologia",
    description: "Tecnologia atualizada",
  });

  assert.equal(result.before.name, "TI");
  assert.equal(result.after.name, "Tecnologia");
});

test("UpdateSetorUseCase rejects missing or concurrently removed setor", async () => {
  const repository = new FakeSetorRepository();
  const useCase = new UpdateSetorUseCase(repository);

  await assert.rejects(
    () => useCase.execute(99, { name: "X", description: "X" }),
    (error: AppError) => error.code === "SETOR_NOT_FOUND",
  );
  repository.failUpdate = true;
  await assert.rejects(
    () => useCase.execute(2, { name: "X", description: "X" }),
    (error: AppError) => error.code === "SETOR_NOT_FOUND",
  );
});
