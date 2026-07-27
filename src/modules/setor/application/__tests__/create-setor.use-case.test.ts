import assert from "node:assert/strict";
import test from "node:test";
import { CreateSetorUseCase } from "../use-case/create-setor.use-case.js";
import { FakeSetorRepository } from "./setor-use-case.helpers.js";

test("CreateSetorUseCase creates and returns the persisted setor", async () => {
  const useCase = new CreateSetorUseCase(new FakeSetorRepository());
  const setor = await useCase.execute({ name: "Saúde", description: "Saúde" });

  assert.equal(setor.id, 3);
  assert.equal(setor.name, "Saúde");
});
