import test from "node:test";
import assert from "node:assert/strict";
import { makeService } from "./atleta.service.helpers.js";

test("AtletaService envia hash para busca por CPF ou CEP", async () => {
  const { service, atletaRepo } = makeService();

  await service.findAllAtletas({ search: "123.456.789-00" });
  assert.equal(atletaRepo.lastQuery.searchHash, "hash:12345678900");

  await service.findAllAtletas({ search: "06850-000" });
  assert.equal(atletaRepo.lastQuery.searchHash, "hash:06850000");

  await service.findAllAtletas({ search: "Maria" });
  assert.equal(atletaRepo.lastQuery.searchHash, undefined);
});
