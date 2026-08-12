import test from "node:test";
import assert from "node:assert/strict";
import { assertProtocolTransition, validateFormAnswers, validateFormDefinition } from "../protocolo.js";

test("protocolo aceita somente transicoes previstas", () => {
  assert.doesNotThrow(() => assertProtocolTransition("EM_TRIAGEM", "EM_ANALISE"));
  assert.throws(() => assertProtocolTransition("CONCLUIDO", "EM_ANALISE"));
  assert.throws(() => assertProtocolTransition("EM_TRIAGEM", "CONCLUIDO"));
});

test("definicao de formulario exige chaves unicas e opcoes validas", () => {
  assert.doesNotThrow(() => validateFormDefinition([{ key: "descricao", label: "Descricao", type: "text" }]));
  assert.throws(() => validateFormDefinition([{ key: "x", label: "A", type: "text" }, { key: "x", label: "B", type: "text" }]));
  assert.throws(() => validateFormDefinition([{ key: "tipo", label: "Tipo", type: "select", options: [] }]));
});

test("formulario dinamico valida obrigatorios e opcoes", () => {
  const fields = [{ key: "descricao", label: "Descricao", type: "textarea" as const, required: true }, { key: "tipo", label: "Tipo", type: "select" as const, options: ["A", "B"] }];
  assert.doesNotThrow(() => validateFormAnswers(fields, { descricao: "Pedido", tipo: "A" }));
  assert.throws(() => validateFormAnswers(fields, { descricao: "", tipo: "A" }));
  assert.throws(() => validateFormAnswers(fields, { descricao: "Pedido", tipo: "C" }));
});
