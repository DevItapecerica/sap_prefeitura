import assert from "node:assert/strict";
import test from "node:test";
import { isSequelizeModelFile } from "../model-loader.js";

test("model loader accepts models and rejects test files", () => {
  assert.equal(isSequelizeModelFile("user.model.ts"), true);
  assert.equal(isSequelizeModelFile("user.model.js"), true);
  assert.equal(isSequelizeModelFile("user.test.model.ts"), false);
  assert.equal(isSequelizeModelFile("user.model.test.js"), false);
  assert.equal(isSequelizeModelFile("model-loader.ts"), false);
});
