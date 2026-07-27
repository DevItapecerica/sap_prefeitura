import assert from "node:assert/strict";
import test from "node:test";
import AppError from "../../../../core/appError.js";
import { ListServicesUseCase } from "../use-case/list-services.use-case.js";
import { FakeServicesRepository } from "./service-use-case.helpers.js";

test("ListServicesUseCase maps normalized persistence criteria", async () => {
  const repository = new FakeServicesRepository();
  const result = await new ListServicesUseCase(repository).execute({
    page: 2,
    limit: 5,
    search: "FT",
    order: "name:asc",
  });

  assert.equal(result.count, 1);
  assert.deepEqual(repository.lastQuery, {
    page: 2,
    limit: 5,
    search: "FT",
    order: "name:asc",
  });
});

test("ListServicesUseCase rejects invalid page and order", async () => {
  const useCase = new ListServicesUseCase(new FakeServicesRepository());
  await assert.rejects(
    () => useCase.execute({ page: -1 }),
    (error: AppError) => error.code === "INVALID_PAGE",
  );
  await assert.rejects(
    () => useCase.execute({ order: "url:drop" }),
    (error: AppError) => error.code === "INVALID_QUERY_ORDER",
  );
});
