import test from "node:test";
import assert from "node:assert/strict";
import AppError from "../../../../core/appError.js";
import { makeService } from "./atleta.service.helpers.js";

const FOTO_FIXTURE =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2w==";

test("AtletaService busca, atualiza, remove e cria carterinha", async () => {
  const { service, createCarterinhaUseCase } = makeService();
  await service.createAtleta({ municipe_uuid: "mun-1", ativo: true }, 1);

  assert.equal((await service.findAllAtletas()).count, 1);
  assert.equal((await service.findOneAtleta("atl-1")).municipe_uuid, "mun-1");
  assert.equal((await service.updateAtleta("atl-1", { ativo: false })).ativo, false);
  await service.addModalidadeToAtleta("atl-1", { modalidade_uuid: "mod-1" });
  const carterinha = await service.createCarteirinha("atl-1", 9, {
    observacao: "Liberado",
    validade_exame: "2026-12-31",
    foto: FOTO_FIXTURE,
  });
  assert.equal(carterinha.modalidade, "Futebol");
  assert.equal(createCarterinhaUseCase.payload.municipe_uuid, "mun-1");
  assert.equal(createCarterinhaUseCase.payload.modalidade, "Futebol");
  assert.equal(createCarterinhaUseCase.payload.observacao, "Liberado");
  assert.equal(createCarterinhaUseCase.payload.validade_exame, "2026-12-31");
  assert.equal(createCarterinhaUseCase.payload.foto, FOTO_FIXTURE);
  assert.equal(carterinha.foto, FOTO_FIXTURE);
  assert.equal(await service.deleteAtleta("atl-1"), true);
  await assert.rejects(
    () => service.findOneAtleta("atl-1"),
    (error: AppError) => error.code === "ATLETA_NOT_FOUND",
  );
});

test("AtletaService exige foto valida para emitir carterinha", async () => {
  const { service } = makeService();
  await service.createAtleta({ municipe_uuid: "mun-1", ativo: true }, 1);
  await service.addModalidadeToAtleta("atl-1", { modalidade_uuid: "mod-1" });

  await assert.rejects(
    () => service.createCarteirinha("atl-1", 9, {}),
    (error: AppError) => error.code === "CARTERINHA_FOTO_REQUIRED",
  );

  await assert.rejects(
    () =>
      service.createCarteirinha("atl-1", 9, {
        foto: "data:text/plain;base64,Zm9v",
      }),
    (error: AppError) => error.code === "CARTERINHA_FOTO_INVALID",
  );

  await assert.rejects(
    () =>
      service.createCarteirinha("atl-1", 9, {
        foto: `data:image/jpeg;base64,${"A".repeat(2.1 * 1024 * 1024)}`,
      }),
    (error: AppError) => error.code === "CARTERINHA_FOTO_TOO_LARGE",
  );
});
