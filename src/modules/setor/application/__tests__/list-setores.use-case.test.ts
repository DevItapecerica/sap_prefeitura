import assert from "node:assert/strict";
import test from "node:test";
import { ListSetoresUseCase } from "../use-case/list-setores.use-case.js";
import { FakeSetorRepository } from "./setor-use-case.helpers.js";

test("ListSetoresUseCase returns every setor without implicit pagination", async () => {
  const setores = await new ListSetoresUseCase(
    new FakeSetorRepository(),
  ).execute();

  assert.equal(setores.length, 2);
});
