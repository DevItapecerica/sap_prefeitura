import test from "node:test";
import assert from "node:assert/strict";
import AppError from "../../../../core/appError.js";
import { makeService } from "./modalidade.service.helpers.js";

test("ModalidadeService retorna not found para operacoes em uuid inexistente", async () => {
  const { service } = makeService();

  await assert.rejects(
    () => service.findOneModalidade("missing"),
    (error: AppError) => error.code === "MODALIDADE_NOT_FOUND",
  );

  await assert.rejects(
    () => service.updateModalidade("missing", { nome: "Futebol" }),
    (error: AppError) => error.code === "MODALIDADE_NOT_FOUND",
  );

  await assert.rejects(
    () => service.deleteModalidade("missing"),
    (error: AppError) => error.code === "MODALIDADE_NOT_FOUND",
  );
});
