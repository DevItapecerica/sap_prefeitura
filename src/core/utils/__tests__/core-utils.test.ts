import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import ValidateQueryOrder from "../ValidateQueryOrder.js";
import { generateRandomPassword } from "../generateRandomPassword.js";
import comparePass from "../comparePass.js";

test("ValidateQueryOrder aceita campo e direcao permitidos", async () => {
  assert.equal(await ValidateQueryOrder("name:asc", ["id", "name"]), true);
  assert.equal(await ValidateQueryOrder("id:desc", ["id", "name"]), true);
});

test("ValidateQueryOrder rejeita campo ou direcao invalidos", async () => {
  assert.equal(await ValidateQueryOrder("email:asc", ["id", "name"]), false);
  assert.equal(await ValidateQueryOrder("name:up", ["id", "name"]), false);
});

test("generateRandomPassword respeita tamanho e alfabeto", () => {
  const password = generateRandomPassword(12);

  assert.equal(password.length, 12);
  assert.match(password, /^[A-Za-z0-9]+$/);
});

test("comparePass compara senha com hash bcrypt", async () => {
  const hash = await bcrypt.hash("SenhaForte1", 10);

  assert.equal(await comparePass("SenhaForte1", hash), true);
  assert.equal(await comparePass("SenhaErrada1", hash), false);
});
