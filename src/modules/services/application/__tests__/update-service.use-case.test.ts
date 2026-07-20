import assert from "node:assert/strict";
import test from "node:test";
import AppError from "../../../../core/appError.js";
import { UpdateServiceUseCase } from "../use-case/update-service.use-case.js";
import { makeServiceFakes } from "./service-use-case.helpers.js";

const servicePayload = {
  name: "FT Atualizado",
  description: "Atualizado",
  tag: "ft",
  url: "/ft",
};

test("UpdateServiceUseCase returns complete before and after aggregates", async () => {
  const fakes = makeServiceFakes();
  const result = await new UpdateServiceUseCase(
    fakes.services as any,
    fakes.visibility as any,
    fakes.permissions as any,
  ).execute(
    6,
    servicePayload,
    [{ id: 1, role_id: 1, service_id: 6, read: true, write: true, edit: false, del: false }],
    [{ id: 2, setor_id: 2, service_id: 6, visibility: true }],
  );

  assert.equal(result.before.services.name, "Frente de Trabalho");
  assert.equal(result.before.permissions[0].write, false);
  assert.equal(result.before.visibility[1].visibility, false);
  assert.equal(result.after.services.name, "FT Atualizado");
  assert.equal(result.after.permissions[0].write, true);
  assert.equal(result.after.visibility[1].visibility, true);
});

test("UpdateServiceUseCase allows updating only the service", async () => {
  const fakes = makeServiceFakes();
  const result = await new UpdateServiceUseCase(
    fakes.services as any,
    fakes.visibility as any,
    fakes.permissions as any,
  ).execute(6, { ...servicePayload, tag: undefined });

  assert.equal(result.after.services.tag, "ft");
  assert.deepEqual(fakes.permissions.writes, []);
  assert.deepEqual(fakes.visibility.writes, []);
});

test("UpdateServiceUseCase validates all links before writing", async () => {
  const fakes = makeServiceFakes();
  const useCase = new UpdateServiceUseCase(
    fakes.services as any,
    fakes.visibility as any,
    fakes.permissions as any,
  );

  await assert.rejects(
    () => useCase.execute(6, servicePayload, [
      { id: 1, role_id: 1, service_id: 99, read: true, write: true, edit: false, del: false },
    ]),
    (error: AppError) => error.code === "PERMISSION_NOT_FOUND",
  );
  assert.deepEqual(fakes.services.writes, []);

  await assert.rejects(
    () => useCase.execute(6, servicePayload, [], [
      { id: 2, setor_id: 99, service_id: 6, visibility: true },
    ]),
    (error: AppError) => error.code === "VISIBILITY_NOT_FOUND",
  );
  assert.deepEqual(fakes.services.writes, []);
});
