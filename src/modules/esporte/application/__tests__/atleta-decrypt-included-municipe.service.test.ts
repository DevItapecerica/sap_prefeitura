import test from "node:test";
import assert from "node:assert/strict";
import Atleta from "../../domain/entity/Atleta.js";
import Municipe from "../../../municipe/domain/entity/Municipe.js";
import { makeService } from "./atleta.service.helpers.js";

test("AtletaService descriptografa municipe incluido antes da apresentacao", async () => {
  const { service, atletaRepo } = makeService();
  const atleta = new Atleta(
    "mun-1",
    true,
    1,
    "atl-1",
    new Date("2026-01-01"),
    new Date("2026-01-02"),
    null,
    new Municipe(
      "Maria Silva",
      "enc:12345678900",
      "enc:2000-01-01",
      "enc:11999999999",
      "enc:Rua A",
      "enc:Centro",
      "enc:Cidade",
      "enc:SP",
      "enc:06850000",
      "enc:10",
      null,
      1,
      "mun-1",
    ),
  );

  atletaRepo.atletas.set("atl-1", atleta);

  const response = await service.findAllAtletas();

  assert.equal(response.atletas[0].municipe?.cpf, "12345678900");
  assert.equal(response.atletas[0].municipe?.nascimento, "2000-01-01");
  assert.equal(response.atletas[0].municipe?.cidade, "Cidade");
});
