import test from "node:test";
import assert from "node:assert/strict";
import AppError from "../../../../core/appError.js";
import { makeService } from "./atleta.service.helpers.js";

test("AtletaService lista carteirinhas pelo municipe do atleta", async () => {
  const { service, carterinhaRepo } = makeService();
  await service.createAtleta({ municipe_uuid: "mun-1", ativo: true }, 1);

  const response = await service.findCarteirinhasByAtleta("atl-1", {
    origem: "biblioteca",
    limit: 10,
  } as any);

  assert.equal(response.count, 1);
  assert.equal(carterinhaRepo.queryByMunicipe.municipe_uuid, "mun-1");
  assert.equal(carterinhaRepo.queryByMunicipe.origem, "esporte");
  assert.equal(carterinhaRepo.queryByMunicipe.limit, 10);
  await assert.rejects(
    () => service.findCarteirinhasByAtleta("missing"),
    (error: AppError) => error.code === "ATLETA_NOT_FOUND",
  );
});
