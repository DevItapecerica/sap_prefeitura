import assert from "node:assert/strict";
import test from "node:test";

import { isValidCpf } from "../cpf.validator.js";

test("isValidCpf aceita CPF sintético válido com ou sem máscara", () => {
  assert.equal(isValidCpf("52998224725"), true);
  assert.equal(isValidCpf("529.982.247-25"), true);
});

test("isValidCpf rejeita tamanho, dígitos repetidos e verificadores inválidos", () => {
  assert.equal(isValidCpf("123"), false);
  assert.equal(isValidCpf("11111111111"), false);
  assert.equal(isValidCpf("52998224724"), false);
});
