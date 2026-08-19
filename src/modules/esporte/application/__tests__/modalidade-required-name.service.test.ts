import test from "node:test";
import assert from "node:assert/strict";
import AppError from "../../../../core/appError.js";
import { makeService } from "./modalidade.service.helpers.js";

test("ModalidadeService rejeita nome vazio no create e update", async () => {
  const { service } = makeService();

  await assert.rejects(
    () => service.createModalidade({ nome: " " }),
    (error: AppError) => error.code === "MODALIDADE_NOME_REQUIRED",
  );

  await assert.rejects(
    () => service.updateModalidade("mod-1", { nome: "" }),
    (error: AppError) => error.code === "MODALIDADE_NOME_REQUIRED",
  );
});
