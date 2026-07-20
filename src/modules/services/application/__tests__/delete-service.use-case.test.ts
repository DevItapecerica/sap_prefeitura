import assert from "node:assert/strict";
import test from "node:test";
import AppError from "../../../../core/appError.js";
import { DeleteServiceUseCase } from "../use-case/delete-service.use-case.js";
import { makeServiceFakes } from "./service-use-case.helpers.js";

test("DeleteServiceUseCase returns the aggregate before deletion", async () => {
  const fakes = makeServiceFakes();
  const result = await new DeleteServiceUseCase(fakes.aggregate).execute(6);

  assert.equal(result.before.services.id, 6);
  assert.equal(result.before.permissions.length, 2);
  assert.equal(result.after, null);
});

test("DeleteServiceUseCase protects base services and rejects missing ids", async () => {
  const fakes = makeServiceFakes();
  const useCase = new DeleteServiceUseCase(fakes.aggregate);

  await assert.rejects(
    () => useCase.execute(3),
    (error: AppError) => error.code === "SERVICE_DELETE_FORBIDDEN",
  );
  await assert.rejects(
    () => useCase.execute(99),
    (error: AppError) => error.code === "SERVICE_NOT_FOUND",
  );
});
