import assert from "node:assert/strict";
import test from "node:test";
import { ListVisibleServicesUseCase } from "../use-case/list-visible-services.use-case.js";
test("visible services resolve current identity by userId, never JWT role/setor claims", async () => {
 let userId: number | undefined;
 const expected = [{id: 6, module: "ft", actions: ["acessar", "consultar_bolsista"]}];
 const useCase = new ListVisibleServicesUseCase({visibleServices: async id => {userId = id; return expected;}});
 assert.deepEqual(await useCase.execute(10),expected);
 assert.equal(userId,10);
 assert.ok(!("permissions" in expected[0]));
});
