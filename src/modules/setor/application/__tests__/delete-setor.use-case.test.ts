import assert from "node:assert/strict";
import test from "node:test";
import AppError from "../../../../core/appError.js";
import { DeleteSetorUseCase } from "../use-case/delete-setor.use-case.js";
import { FakeSetorRepository } from "./setor-use-case.helpers.js";

test("DeleteSetorUseCase returns before and after", async () => {
  const repository = new FakeSetorRepository();
  const result = await new DeleteSetorUseCase(repository).execute(2);

  assert.equal(result.before.name, "TI");
  assert.equal(result.after, null);
  assert.equal(repository.setores.has(2), false);
});

test("DeleteSetorUseCase protects main setor and rejects missing ids", async () => {
  const useCase = new DeleteSetorUseCase(new FakeSetorRepository());

  await assert.rejects(
    () => useCase.execute(1),
    (error: AppError) => error.code === "SETOR_MAIN_DELETE_FORBIDDEN",
  );
  await assert.rejects(
    () => useCase.execute(99),
    (error: AppError) => error.code === "SETOR_NOT_FOUND",
  );
});
