import test from "node:test";
import assert from "node:assert/strict";
import Atleta from "../../domain/entity/Atleta.js";
import Municipe from "../../../municipe/domain/entity/Municipe.js";
import AtletaPresentation from "../presentation/atleta.presentation.js";

function makeAtleta() {
  const createdAt = new Date("2026-06-02T00:00:00.000Z");
  const updatedAt = new Date("2026-06-03T00:00:00.000Z");
  const municipe = new Municipe(
    "Maria Silva",
    "12345678900",
    "2000-05-10",
    "(11) 99999-9999",
    "Rua Completa",
    "Bairro Completo",
    "Itapecerica da Serra",
    "SP",
    "06850000",
    "123",
    "Casa 2",
    7,
    "mun-1",
    createdAt,
    updatedAt,
  );

  return new Atleta(
    "mun-1",
    true,
    7,
    "atl-1",
    createdAt,
    updatedAt,
    null,
    municipe,
  );
}

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

test("AtletaPresentation trata atleta nulo e lista mascarada", () => {
  assert.equal(AtletaPresentation.Masked(null), null);

  const response = AtletaPresentation.MaskedList([makeAtleta()]);

  assert.equal(response.length, 1);
  assert.equal(response[0]?.municipe?.nome, "Maria ***");
  assert.equal("telefone" in response[0]!.municipe!, false);
});

test("AtletaPresentation nao retorna NaN para nascimento invalido", () => {
  const atleta = makeAtleta();
  atleta.municipe!.nascimento = "valor-invalido";

  const response = AtletaPresentation.Masked(atleta);

  assert.equal(response?.municipe?.nascimento, null);
});
