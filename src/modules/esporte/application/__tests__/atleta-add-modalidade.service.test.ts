import test from "node:test";
import assert from "node:assert/strict";
import AppError from "../../../../core/appError.js";
import { makeService } from "./atleta.service.helpers.js";

test("AtletaService vincula modalidade e rejeita duplicidade ou entidade inexistente", async () => {
  const { service, modalidadeRepo } = makeService();
  await service.createAtleta({ municipe_uuid: "mun-1", ativo: true }, 1);

  const atleta = await service.addModalidadeToAtleta("atl-1", {
    modalidade_uuid: "mod-1",
  });
  assert.equal(atleta.modalidades?.[0].nome, "Futebol");

  const response = await service.findAllAtletas({});
  assert.equal(response.atletas[0].modalidades?.[0].nome, "Futebol");

  assert.equal(await service.removeModalidadeFromAtleta("atl-1", "mod-1"), true);

  await assert.rejects(
    () => service.removeModalidadeFromAtleta("atl-1", "mod-1"),
    (error: AppError) => error.code === "ATLETA_MODALIDADE_NOT_FOUND",
  );

  await service.addModalidadeToAtleta("atl-1", { modalidade_uuid: "mod-1" });
  await assert.rejects(
    () => service.addModalidadeToAtleta("atl-1", { modalidade_uuid: "mod-1" }),
    (error: AppError) => error.code === "ATLETA_MODALIDADE_ALREADY_EXISTS",
  );

  modalidadeRepo.modalidade = null;
  await assert.rejects(
    () => service.addModalidadeToAtleta("atl-1", { modalidade_uuid: "missing" }),
    (error: AppError) => error.code === "MODALIDADE_NOT_FOUND",
  );

  await assert.rejects(
    () => service.addModalidadeToAtleta("missing", { modalidade_uuid: "mod-1" }),
    (error: AppError) => error.code === "ATLETA_NOT_FOUND",
  );
});
