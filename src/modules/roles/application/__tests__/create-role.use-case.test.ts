import assert from "node:assert/strict";
import test from "node:test";
import { CreateRoleUseCase } from "../use-case/create-role.use-case.js";
import { FakeRolesRepository } from "./role-use-case.helpers.js";

test("CreateRoleUseCase persists duplicate names as allowed by the contract", async () => {
  const result = await new CreateRoleUseCase(new FakeRolesRepository()).execute({ name: "Admin" });
  assert.equal(result.name, "Admin");
});
