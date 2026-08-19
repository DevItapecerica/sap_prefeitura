import test from "node:test";
import assert from "node:assert/strict";
import AtletaPresentation from "../presentation/atleta.presentation.js";
import { makeAtleta } from "./atleta.presentation.helpers.js";

test("AtletaPresentation nao retorna NaN para nascimento invalido", () => {
  const atleta = makeAtleta();
  atleta.municipe!.nascimento = "valor-invalido";

  const response = AtletaPresentation.Masked(atleta);

  assert.equal(response?.municipe?.nascimento, null);
});
