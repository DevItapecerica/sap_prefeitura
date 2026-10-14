import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { toPagadorCapacity } from "./pagador-capacity.js";

describe("capacidade do pagador", () => {
  it("calcula ativos e disponiveis no edital", () => {
    assert.deepEqual(
      toPagadorCapacity({ uuid: "p1", nome: "Pagador", quantidade: 100 }, 80),
      {
        uuid: "p1",
        nome: "Pagador",
        quantidade: 100,
        ativos: 80,
        disponiveis: 20,
      },
    );
  });

  it("mantem disponibilidade zero quando a ocupacao supera o limite", () => {
    assert.equal(
      toPagadorCapacity({ uuid: "p1", nome: "Pagador", quantidade: 5 }, 6)
        .disponiveis,
      0,
    );
  });

  it("retorna toda a capacidade quando nao ha vinculos ativos", () => {
    assert.equal(
      toPagadorCapacity({ uuid: "p1", nome: "Pagador", quantidade: "8" }, 0)
        .disponiveis,
      8,
    );
  });
});
