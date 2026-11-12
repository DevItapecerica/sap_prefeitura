import assert from "node:assert/strict";
import test from "node:test";
import { CpfMask } from "../cpf-mask.js";

test("CPF masks normalize punctuation and preserve leading zeros", () => {
  for (const cpf of ["00123456789", "001.234.567-89", " 001.234.567-89 "]) {
    assert.equal(CpfMask.middleDigits(cpf), "***.234.567-**");
    assert.equal(CpfMask.lastThreeDigits(cpf), "********789");
  }
  assert.equal(CpfMask.lastThreeDigits("123.456.789-00"), "********900");
  assert.equal(CpfMask.middleDigits("00000000000"), "***.000.000-**");
  // Masking does not replace the separate CPF validation policy.
  assert.equal(CpfMask.lastThreeDigits("00000000000"), "********000");
});

test("missing, incomplete, oversized or previously masked CPFs expose no digits", () => {
  for (const cpf of [
    null,
    undefined,
    "",
    "invalid",
    "123",
    "123456789012",
    "***.234.567-**",
    "********900",
  ]) {
    assert.equal(CpfMask.middleDigits(cpf), "***.***.***-**");
    assert.equal(CpfMask.lastThreeDigits(cpf), "***********");
  }
});
