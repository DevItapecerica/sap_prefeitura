import test from "node:test";
import assert from "node:assert/strict";
import AtletaPresentation from "../presentation/atleta.presentation.js";
import { makeAtleta } from "./atleta.presentation.helpers.js";

test("AtletaPresentation mascara municipe incluido e minimiza dados pessoais", () => {
  const response = AtletaPresentation.Masked(makeAtleta());

  assert.equal(response?.uuid, "atl-1");
  assert.equal(response?.municipe_uuid, "mun-1");
  assert.equal(response?.ativo, true);
  assert.equal(response?.municipe?.uuid, "mun-1");
  assert.equal(response?.municipe?.nome, "Maria ***");
  assert.equal(response?.municipe?.cpf, "********900");
  assert.equal(response?.municipe?.nascimento, 2000);
  assert.equal(response?.municipe?.cidade, "Itapecerica da Serra");
  assert.equal(response?.municipe?.uf, "SP");

  assert.ok(response?.municipe);
  assert.equal("telefone" in response.municipe, false);
  assert.equal("rua" in response.municipe, false);
  assert.equal("bairro" in response.municipe, false);
  assert.equal("cep" in response.municipe, false);
  assert.equal("numero" in response.municipe, false);
  assert.equal("complemento" in response.municipe, false);
  assert.notEqual(response.municipe.cpf, "12345678900");
});
