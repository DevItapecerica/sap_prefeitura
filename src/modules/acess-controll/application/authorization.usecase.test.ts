import assert from "node:assert/strict";
import test from "node:test";
import AppError from "../../../core/appError.js";
import { AuthorizationUseCase, AuthorizationRepository } from "./authorization.usecase.js";
const make = (overrides: Partial<AuthorizationRepository> = {}) => new AuthorizationUseCase({
 user: async () => ({role_id: 1, setor_id: 2}), roleExists: async () => true,
 service: async () => ({id: 6, module: "ft"}), visible: async () => true,
 actions: async () => ["acessar", "remover_bolsista"], ...overrides,
});
const status = (expected: number) => (error: unknown) => error instanceof AppError && error.statusCode === expected;
test("denies missing, false grants and deleted/invisible services without admin bypass", async () => {
 for (const overrides of [
  {roleExists: async () => false}, {service: async () => null}, {visible: async () => false},
  {actions: async () => []}, {actions: async () => ["remover_bolsista"]},
  {user: async () => ({role_id: 1, setor_id: null})},
 ]) await assert.rejects(make(overrides).authorize(1,"ft","remover_bolsista"),status(403));
});
test("deleted actor returns 401 and unknown code action is configuration error", async () => {
 await assert.rejects(make({user: async () => null}).authorize(1,"ft","remover_bolsista"),status(401));
 await assert.rejects(make().authorize(1,"ft","GET"),status(500));
 await assert.rejects(make().authorize(1,"unknown","acessar"),status(500));
});
