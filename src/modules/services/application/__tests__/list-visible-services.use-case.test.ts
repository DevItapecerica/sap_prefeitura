import assert from "node:assert/strict";
import test from "node:test";
import { ServicesVisiblesService } from "../../domain/services/services-visibles.service.js";
import { ListVisibleServicesUseCase } from "../use-case/list-visible-services.use-case.js";
import { makeServiceFakes } from "./service-use-case.helpers.js";

test("ListVisibleServicesUseCase intersects visibility and read permission", async () => {
  const fakes = makeServiceFakes();
  const result = await new ListVisibleServicesUseCase(
    fakes.services as any,
    fakes.visibility as any,
    fakes.permissions as any,
    new ServicesVisiblesService(),
  ).execute(1, 1);

  assert.equal(result.length, 1);
  assert.equal(result[0].id, 6);
  assert.equal(result[0].permissions.length, 1);
});
