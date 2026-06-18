import test from "node:test";
import assert from "node:assert/strict";
import { makeService } from "./modalidade.service.helpers.js";

test("ModalidadeService cria modalidade e normaliza nome", async () => {
  const { service } = makeService();

  const modalidade = await service.createModalidade({ nome: "  Futebol  " });

  assert.equal(modalidade.uuid, "mod-1");
  assert.equal(modalidade.nome, "Futebol");
});
