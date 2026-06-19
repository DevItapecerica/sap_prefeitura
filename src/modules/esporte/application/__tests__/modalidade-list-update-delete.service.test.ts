import test from "node:test";
import assert from "node:assert/strict";
import { makeService } from "./modalidade.service.helpers.js";

test("ModalidadeService lista com query, busca por uuid, atualiza e remove", async () => {
  const { service, modalidadeRepo } = makeService();

  await service.createModalidade({ nome: "Futebol" });
  await service.createModalidade({ nome: "Volei" });

  const list = await service.findAllModalidades({
    search: "Fut",
    page: 0,
    limit: 10,
    order: "nome:asc",
  });

  assert.equal(list.count, 1);
  assert.equal(list.modalidades[0].nome, "Futebol");
  assert.equal(modalidadeRepo.lastQuery.order, "nome:asc");
  assert.equal((await service.findOneModalidade("mod-1")).nome, "Futebol");
  assert.equal(
    (await service.updateModalidade("mod-1", { nome: "Futsal" })).nome,
    "Futsal",
  );
  assert.equal(await service.deleteModalidade("mod-1"), true);
});
