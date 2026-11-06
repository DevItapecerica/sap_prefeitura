import assert from "node:assert/strict";
import test from "node:test";
import { fileNameSlug } from "../file-name-slug.js";

test("filename components normalize accents and preserve separators and fallback behavior", () => {
  assert.equal(
    fileNameSlug("---João da Silva_01---", "bolsista"),
    "Joao-da-Silva_01",
  );
  assert.equal(fileNameSlug("a---b", "bolsista"), "a---b");
  assert.equal(fileNameSlug("", "edital"), "edital");
  assert.equal(fileNameSlug(" ! / ", "edital"), "edital");
  assert.equal(fileNameSlug("__nome__", "bolsista"), "__nome__");
});

test("long hyphen runs with a non-hyphen suffix are trimmed in linear passes", () => {
  const padding = "-".repeat(100_000);
  assert.equal(fileNameSlug(padding + "nome" + padding, "fallback"), "nome");
  assert.equal(fileNameSlug(padding, "fallback"), "fallback");
});
