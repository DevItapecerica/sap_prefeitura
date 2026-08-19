import test from "node:test";
import assert from "node:assert/strict";
import Atleta from "../../domain/entity/Atleta.js";
import Municipe from "../../../municipe/domain/entity/Municipe.js";
import AppError from "../../../../core/appError.js";
import { makeService } from "./atleta.service.helpers.js";

test("AtletaService cria atleta e rejeita municipe inexistente ou ativo duplicado", async () => {
  const { service, municipeRepo, atletaRepo } = makeService();

  const atleta = await service.createAtleta(
    { municipe_uuid: "mun-1", ativo: true },
    1,
  );
  assert.equal(atleta.uuid, "atl-1");

  municipeRepo.municipe = null;
  await assert.rejects(
    () => service.createAtleta({ municipe_uuid: "missing", ativo: true }, 1),
    (error: AppError) => error.code === "MUNICIPE_NOT_FOUND",
  );

  municipeRepo.municipe = new Municipe(
    "Maria",
    "123",
    "2000-01-01",
    null,
    "Rua",
    "Bairro",
    "Cidade",
    "SP",
    "00000",
    "1",
    null,
    1,
    "mun-1",
  );
  atletaRepo.activeByMunicipe = new Atleta("mun-1", true, 1, "atl-active");
  await assert.rejects(
    () => service.createAtleta({ municipe_uuid: "mun-1", ativo: true }, 1),
    (error: AppError) => error.code === "ATLETA_ALREADY_EXISTS",
  );
});
