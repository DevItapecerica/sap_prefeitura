import assert from "node:assert/strict";
import test from "node:test";
import AppError from "../../../../core/appError.js";
import { GetServiceByIdUseCase } from "../use-case/get-service-by-id.use-case.js";
import { makeServiceFakes } from "./service-use-case.helpers.js";

test("GetServiceByIdUseCase returns the complete aggregate", async () => {
  const fakes = makeServiceFakes();
  const result = await new GetServiceByIdUseCase(fakes.aggregate).execute(6);

  assert.equal(result.services.id, 6);
  assert.equal(result.permissions.length, 2);
  assert.equal(result.visibility.length, 2);
});

test("GetServiceByIdUseCase rejects an unknown service", async () => {
  const fakes = makeServiceFakes();
  await assert.rejects(
    () => new GetServiceByIdUseCase(fakes.aggregate).execute(99),
    (error: AppError) => error.code === "SERVICE_NOT_FOUND",
  );
});
