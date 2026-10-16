import assert from "node:assert/strict";
import test from "node:test";
import { buildLegacyEditaisFromVinculos, selectCurrentVinculo } from "./ft-vinculo-period.service.js";

const link = (data: Record<string, unknown>) => ({
  id: "v1",
  edital_id: "e1",
  status: "expirado",
  data_vinculo: "2026-01-01",
  createdAt: "2026-01-01T00:00:00.000Z",
  ...data,
});

test("vinculo ativo tem prioridade sobre expirado ou cancelado mais recente", () => {
  const ativo = link({ id: "ativo", status: "ativo", data_vinculo: "2026-01-01" });
  assert.equal(selectCurrentVinculo([
    ativo,
    link({ id: "expirado", data_vinculo: "2026-10-01" }),
    link({ id: "cancelado", status: "cancelado", data_vinculo: "2026-11-01" }),
  ]).id, "ativo");
});

test("entre ativos escolhe o de data de vinculo mais recente", () => {
  assert.equal(selectCurrentVinculo([
    link({ id: "antigo", status: "ativo", data_vinculo: "2026-01-01" }),
    link({ id: "recente", status: "ativo", data_vinculo: "2026-06-01" }),
  ]).id, "recente");
});

test("sem ativo escolhe o historico mais recente e nao remove repeticoes", () => {
  const vinculos = [
    link({ id: "antigo", status: "cancelado", data_vinculo: "2026-01-01" }),
    link({ id: "recente", status: "expirado", data_vinculo: "2026-06-01" }),
  ];
  assert.equal(selectCurrentVinculo(vinculos).id, "recente");
  assert.equal(vinculos.length, 2);
  assert.equal(selectCurrentVinculo([]), null);
});

test("desempata pela criacao mais recente quando a data do vinculo e igual", () => {
  assert.equal(selectCurrentVinculo([
    link({ id: "primeiro", data_vinculo: "2026-06-01", createdAt: "2026-06-01T08:00:00.000Z" }),
    link({ id: "ultimo", data_vinculo: "2026-06-01", createdAt: "2026-06-01T09:00:00.000Z" }),
  ]).id, "ultimo");
});

test("aceita modelos, ignora valores vazios e usa o id como ultimo desempate", () => {
  const model = {
    toJSON: () => link({ id: "z", data_vinculo: "2026-06-01", createdAt: undefined }),
  };
  assert.equal(selectCurrentVinculo([
    null,
    link({ id: "a", data_vinculo: "2026-06-01", createdAt: undefined }),
    model,
  ]).id, "z");
  assert.doesNotThrow(() => selectCurrentVinculo([
    link({ id: undefined, data_vinculo: "2026-06-01", createdAt: undefined }),
    link({ id: undefined, data_vinculo: "2026-06-01", createdAt: undefined }),
  ]));
});

test("reconstroi um edital legado por edital sem perder os vinculos originais", () => {
  const vinculos = [
    link({ id: "expirado", edital_id: "e1", status: "expirado", data_vinculo: "2026-09-01", edital: { id: "e1", name: "Edital 1" } }),
    link({ id: "ativo", edital_id: "e1", status: "ativo", data_vinculo: "2026-01-01", edital: { id: "e1", name: "Edital 1" } }),
    link({ id: "outro", edital_id: "e2", status: "cancelado", edital: { id: "e2", name: "Edital 2" } }),
  ];

  const editais = buildLegacyEditaisFromVinculos(vinculos);

  assert.equal(editais.length, 2);
  assert.equal(editais[0].BolsistasEdital.id, "ativo");
  assert.equal(editais[0].BolsistasEdital.edital, undefined);
  assert.equal(editais[1].id, "e2");
  assert.equal(vinculos.length, 3);
});

test("ignora vinculos sem edital e cria compatibilidade mesmo sem objeto aninhado", () => {
  const editais = buildLegacyEditaisFromVinculos([
    link({ id: "sem-edital", edital_id: undefined }),
    link({ id: "valido", edital_id: "e1", edital: undefined }),
  ]);
  assert.deepEqual(editais.map((edital) => edital.id), ["e1"]);
});
