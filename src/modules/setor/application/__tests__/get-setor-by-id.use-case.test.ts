import assert from "node:assert/strict";
import test from "node:test";
import AppError from "../../../../core/appError.js";
import { GetSetorByIdUseCase } from "../use-case/get-setor-by-id.use-case.js";
import { FakeSetorRepository } from "./setor-use-case.helpers.js";

test("GetSetorByIdUseCase returns a setor and rejects an unknown id", async () => {
  const useCase = new GetSetorByIdUseCase(new FakeSetorRepository());

  assert.equal((await useCase.execute(2)).name, "TI");
  await assert.rejects(
    () => useCase.execute(99),
    (error: AppError) => error.code === "SETOR_NOT_FOUND",
  );
});
