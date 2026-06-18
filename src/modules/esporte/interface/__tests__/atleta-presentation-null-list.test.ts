import test from "node:test";
import assert from "node:assert/strict";
import AtletaPresentation from "../presentation/atleta.presentation.js";
import { makeAtleta } from "./atleta.presentation.helpers.js";

test("AtletaPresentation trata atleta nulo e lista mascarada", () => {
  assert.equal(AtletaPresentation.Masked(null), null);

  const response = AtletaPresentation.MaskedList([makeAtleta()]);

  assert.equal(response.length, 1);
  assert.equal(response[0]?.municipe?.nome, "Maria ***");
  assert.equal("telefone" in response[0]!.municipe!, false);
});
