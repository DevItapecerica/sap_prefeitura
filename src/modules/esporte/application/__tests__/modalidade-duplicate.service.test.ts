import test from "node:test";
import assert from "node:assert/strict";
import AppError from "../../../../core/appError.js";
import { makeService } from "./modalidade.service.helpers.js";

test("ModalidadeService rejeita nome duplicado", async () => {
  const { service } = makeService();

  await service.createModalidade({ nome: "Futebol" });

  await assert.rejects(
    () => service.createModalidade({ nome: "Futebol" }),
    (error: AppError) => error.code === "MODALIDADE_ALREADY_EXISTS",
  );
});
