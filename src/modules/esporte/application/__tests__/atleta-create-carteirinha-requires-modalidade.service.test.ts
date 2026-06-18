import test from "node:test";
import assert from "node:assert/strict";
import AppError from "../../../../core/appError.js";
import { makeService } from "./atleta.service.helpers.js";

test("AtletaService exige modalidade para emitir carteirinha", async () => {
  const { service } = makeService();
  await service.createAtleta({ municipe_uuid: "mun-1", ativo: true }, 1);

  await assert.rejects(
    () => service.createCarteirinha("atl-1", 9),
    (error: AppError) => error.code === "ATLETA_MODALIDADE_REQUIRED",
  );
});
