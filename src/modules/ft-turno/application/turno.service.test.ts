import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { TurnoService } from "./turno.service.js";
import { calcularIdadeNaData, ensureBolsistaElegivelPorIdade } from "../../ft-edital/domain/services/ft-idade-policy.service.js";

class Model {
  destroyed = false;
  constructor(public data: any) {}
  get(key: string) { return this.data[key]; }
  toJSON() { return { ...this.data }; }
  async update(input: any) { Object.assign(this.data, input); return this; }
  async destroy() { this.destroyed = true; }
}

class Repository {
  rows: Model[] = [];
  async list() { return { count: this.rows.length, rows: this.rows }; }
  async findById(uuid: string) { return this.rows.find((item) => item.get("uuid") === uuid) ?? null; }
  async findByName(nome: string) { return this.rows.find((item) => item.get("nome").toLowerCase() === nome.toLowerCase()) ?? null; }
  async create(input: any) { const row = new Model({ uuid: `t${this.rows.length + 1}`, ...input }); this.rows.push(row); return row; }
  async update(instance: Model, input: any) { return instance.update(input); }
  async softDelete(instance: Model) { await instance.destroy(); }
}

describe("TurnoService", () => {
  it("normaliza, lista, atualiza e exclui turno", async () => {
    const repository = new Repository();
    const service = new TurnoService(repository as any);
    const created = await service.create({ nome: "  Manhã  ", hora_inicio: "08:00:00", hora_fim: "14:00" });
    assert.equal(created.get("nome"), "Manhã");
    assert.equal(created.get("hora_inicio"), "08:00");
    assert.equal((await service.list({})).count, 1);
    const { after } = await service.update("t1", { nome: "Tarde", hora_inicio: "13:00", hora_fim: "18:00" });
    assert.equal(after.get("nome"), "Tarde");
    await service.delete("t1");
    assert.equal(created.destroyed, true);
  });

  it("rejeita nome, horario, duplicidade e recurso ausente", async () => {
    const repository = new Repository();
    const service = new TurnoService(repository as any);
    await assert.rejects(() => service.create({ nome: "", hora_inicio: "08:00", hora_fim: "14:00" }), (error: any) => error.statusCode === 400);
    await assert.rejects(() => service.create({ nome: "Manhã", hora_inicio: "25:00", hora_fim: "14:00" }), (error: any) => error.statusCode === 400);
    await assert.rejects(() => service.create({ nome: "Manhã", hora_inicio: "08:00", hora_fim: "08:00" }), (error: any) => error.statusCode === 400);
    await service.create({ nome: "Manhã", hora_inicio: "08:00", hora_fim: "14:00" });
    await assert.rejects(() => service.create({ nome: "manhã", hora_inicio: "09:00", hora_fim: "15:00" }), (error: any) => error.statusCode === 409);
    await service.create({ nome: "Tarde", hora_inicio: "13:00", hora_fim: "18:00" });
    await assert.rejects(() => service.update("t2", { nome: "Manhã", hora_inicio: "13:00", hora_fim: "18:00" }), (error: any) => error.statusCode === 409);
    await assert.rejects(() => service.get("missing"), (error: any) => error.statusCode === 404);
  });
});

describe("politica de idade do vinculo", () => {
  it("calcula idade completa e permite ate 65 anos", () => {
    assert.equal(calcularIdadeNaData("1961-10-16", "2026-10-15"), 64);
    assert.equal(calcularIdadeNaData("1961-10-15", "2026-10-15"), 65);
    assert.doesNotThrow(() => ensureBolsistaElegivelPorIdade({ municipe: { nascimento: "1961-10-15" } }, "2026-10-15"));
  });

  it("rejeita idade superior, nascimento ausente e data invalida", () => {
    assert.throws(() => ensureBolsistaElegivelPorIdade({ municipe: { nascimento: "1960-10-15" } }, "2026-10-15"), (error: any) => error.statusCode === 403);
    assert.throws(() => ensureBolsistaElegivelPorIdade({ municipe: {} }, "2026-10-15"), (error: any) => error.statusCode === 422);
    assert.throws(() => calcularIdadeNaData("invalida", "2026-10-15"), (error: any) => error.statusCode === 422);
  });
});
