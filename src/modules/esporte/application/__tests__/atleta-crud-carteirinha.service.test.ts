import test from "node:test";
import assert from "node:assert/strict";
import AppError from "../../../../core/appError.js";
import { makeService } from "./atleta.service.helpers.js";

test("AtletaService busca, atualiza, remove e cria carterinha", async () => {
  const { service, createCarterinhaUseCase } = makeService();
  await service.createAtleta({ municipe_uuid: "mun-1", ativo: true }, 1);

  assert.equal((await service.findAllAtletas()).count, 1);
  assert.equal((await service.findOneAtleta("atl-1")).municipe_uuid, "mun-1");
  assert.equal((await service.updateAtleta("atl-1", { ativo: false })).ativo, false);
  await service.addModalidadeToAtleta("atl-1", { modalidade_uuid: "mod-1" });
  const carterinha = await service.createCarteirinha("atl-1", 9);
  assert.equal(carterinha.modalidade, "Futebol");
  assert.equal(createCarterinhaUseCase.payload.municipe_uuid, "mun-1");
  assert.equal(createCarterinhaUseCase.payload.modalidade, "Futebol");
  assert.equal(await service.deleteAtleta("atl-1"), true);
  await assert.rejects(
    () => service.findOneAtleta("atl-1"),
    (error: AppError) => error.code === "ATLETA_NOT_FOUND",
  );
});
