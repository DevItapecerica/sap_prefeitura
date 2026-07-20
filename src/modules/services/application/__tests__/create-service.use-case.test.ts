import assert from "node:assert/strict";
import test from "node:test";
import { CreateServiceUseCase } from "../use-case/create-service.use-case.js";
import { FakeServicesRepository } from "./service-use-case.helpers.js";

test("CreateServiceUseCase persists the default tag", async () => {
  const service = await new CreateServiceUseCase(
    new FakeServicesRepository(),
  ).execute({ name: "Novo", description: "Descrição", url: "/novo" });

  assert.equal(service.id, 7);
  assert.equal(service.tag, "outros");
});
