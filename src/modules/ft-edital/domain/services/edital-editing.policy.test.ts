import assert from "node:assert/strict";
import test from "node:test";
import { assertEditable, editingPolicy } from "./edital-editing.policy.js";

const edital = {
  fase: "aberto",
  vagas: 10,
  idade_maxima: 65,
  primeira_convocacao_em: null,
  name: "Teste",
  inscricoes_inicio: "2026-10-01T12:00:00Z",
  inscricoes_fim: "2026-10-31T20:00:00Z",
  data_publicacao: "2026-01-01",
  vigencia_inicio: "2026-01-01",
  data_vencimento: "2028-12-31",
  valor_bolsa: 900,
  dia_pagamento: 5,
  carga_semanal: 30,
  carga_mensal: 180,
  duracao_meses: 6,
  prorrogacao_meses: 3,
  permitir_participacao_anterior: false,
  permitir_retorno: false,
};
test("editing metadata and write policy share floors and locks, including empty payroll and initial age fill", () => {
  const initial = editingPolicy(edital, false, 4);
  assert.equal(initial.vagas_minimas, 4);
  assert.equal(initial.vigencia_minima, null);
  assert.equal(initial.campos_bloqueados.idade_maxima, undefined);
  assert.throws(
    () => assertEditable(edital, { ...edital, vagas: 3 }, initial),
    /Vagas/,
  );
  const closed = editingPolicy(edital, true, 0);
  assert.equal(closed.vagas_minimas, 1);
  assert.equal(closed.vigencia_minima, edital.data_vencimento);
  assert.ok(closed.campos_bloqueados.valor_bolsa);
  assert.equal(closed.campos_bloqueados.idade_maxima, undefined);
  assert.throws(
    () => assertEditable(edital, { ...edital, valor_bolsa: 901 }, closed),
    /bloqueadas/,
  );
  assert.throws(
    () =>
      assertEditable(
        edital,
        { ...edital, data_vencimento: "2028-12-30" },
        closed,
      ),
    /ampliada/,
  );
  assert.doesNotThrow(() =>
    assertEditable(
      edital,
      { ...edital, data_vencimento: "2029-01-01", idade_maxima: 70 },
      closed,
    ),
  );
  const called = {
    ...edital,
    primeira_convocacao_em: new Date(),
    idade_maxima: null,
  };
  assert.doesNotThrow(() =>
    assertEditable(
      called,
      { ...called, idade_maxima: 70 },
      editingPolicy(called, false, 1),
    ),
  );
  called.idade_maxima = 70 as any;
  assert.throws(
    () =>
      assertEditable(
        called,
        { ...called, idade_maxima: 71 },
        editingPolicy(called, false, 1),
      ),
    /Idade maxima bloqueada/,
  );
  assert.throws(
    () =>
      assertEditable(
        edital,
        { ...edital, inscricoes_fim: "2026-10-30T20:00:00Z" },
        initial,
      ),
    /prazo/,
  );
  const ended = { ...edital, fase: "encerrado" };
  assert.ok(editingPolicy(ended, false, 0).campos_bloqueados.name);
  assert.throws(
    () => assertEditable(ended, ended, editingPolicy(ended, false, 0)),
    /encerrado/,
  );
});
