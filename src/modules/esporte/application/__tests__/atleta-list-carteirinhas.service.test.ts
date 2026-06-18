import test from "node:test";
import assert from "node:assert/strict";
import { makeService } from "./atleta.service.helpers.js";

test("AtletaService lista somente carteirinhas de esporte", async () => {
  const { service, carterinhaRepo } = makeService();

  const response = await service.findCarteirinhasEsporte({
    origem: "biblioteca",
    limit: 10,
  } as any);

  assert.equal(response.count, 1);
  assert.equal(carterinhaRepo.query.origem, "esporte");
  assert.equal(carterinhaRepo.query.limit, 10);
});
