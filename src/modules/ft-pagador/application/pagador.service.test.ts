import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import AppError from "../../../core/appError.js";
import { PagadorRepository } from "../domain/pagador.repository.js";
import { PagadorService } from "./pagador.service.js";

class Model {
  constructor(public data: Record<string, any>) {}
  get(key: string) {
    return this.data[key];
  }
  toJSON() {
    return { ...this.data };
  }
}

class FakeRepository implements PagadorRepository {
  items = new Map<string, Model>();
  occupation = 0;
  deleted = false;
  capacities: any[] | null = [];
  async list() {
    return { count: this.items.size, rows: [...this.items.values()] };
  }
  async findById(uuid: string) {
    return this.items.get(uuid) ?? null;
  }
  async findByName(nome: string) {
    return (
      [...this.items.values()].find(
        (item) => item.get("nome").toLowerCase() === nome.toLowerCase(),
      ) ?? null
    );
  }
  async create(input: any) {
    const item = new Model({ uuid: "p1", ...input });
    this.items.set("p1", item);
    return item;
  }
  async update(instance: Model, input: any) {
    Object.assign(instance.data, input);
    return instance;
  }
  async softDelete() {
    this.deleted = true;
  }
  async maxActiveOccupation() {
    return this.occupation;
  }
  async listCapacityByEdital() {
    return this.capacities;
  }
}

const assertError = (action: () => Promise<unknown>, status: number) =>
  assert.rejects(
    action,
    (error) => error instanceof AppError && error.statusCode === status,
  );

describe("PagadorService", () => {
  let repository: FakeRepository;
  let service: PagadorService;
  beforeEach(() => {
    repository = new FakeRepository();
    service = new PagadorService(repository);
  });

  it("normaliza e cria um pagador", async () => {
    const result = await service.create({
      nome: "  Secretaria   A ",
      quantidade: 3,
    });
    assert.equal(result.get("nome"), "Secretaria A");
    assert.equal(result.get("quantidade"), 3);
  });

  it("lista e busca pagadores", async () => {
    await service.create({ nome: "Secretaria A", quantidade: 3 });
    const list = await service.list({ page: 0, limit: 10 });
    assert.equal(list.count, 1);
    assert.equal((await service.get("p1")).get("nome"), "Secretaria A");
    await assertError(() => service.get("inexistente"), 404);
  });

  it("lista capacidade dos pagadores para o edital", async () => {
    repository.capacities = [
      { uuid: "p1", nome: "A", quantidade: 100, ativos: 80, disponiveis: 20 },
    ];
    const result = await service.listCapacityByEdital("e1");
    assert.deepEqual(result, repository.capacities);
  });

  it("rejeita capacidade de edital inexistente", async () => {
    repository.capacities = null;
    await assertError(() => service.listCapacityByEdital("inexistente"), 404);
  });

  it("rejeita nome vazio", async () => {
    await assertError(
      () => service.create({ nome: "   ", quantidade: 1 }),
      400,
    );
    await assertError(() => service.create(undefined as any), 400);
  });

  it("rejeita nome duplicado inclusive no historico", async () => {
    await service.create({ nome: "Secretaria A", quantidade: 3 });
    await assertError(
      () => service.create({ nome: "secretaria a", quantidade: 4 }),
      409,
    );
  });

  it("rejeita quantidade negativa ou fracionaria", async () => {
    await assertError(() => service.create({ nome: "A", quantidade: -1 }), 400);
    await assertError(
      () => service.create({ nome: "A", quantidade: 1.5 }),
      400,
    );
  });

  it("bloqueia reducao abaixo da maior ocupacao ativa", async () => {
    await service.create({ nome: "A", quantidade: 10 });
    repository.occupation = 6;
    await assertError(
      () => service.update("p1", { nome: "A", quantidade: 5 }),
      409,
    );
    const result = await service.update("p1", { nome: "A", quantidade: 6 });
    assert.equal(result.after.get("quantidade"), 6);
  });

  it("rejeita renomeacao para nome de outro pagador", async () => {
    const primeiro = await service.create({ nome: "A", quantidade: 10 });
    repository.items.set(
      "p2",
      new Model({ uuid: "p2", nome: "B", quantidade: 10 }),
    );
    await assertError(
      () => service.update(primeiro.get("uuid"), { nome: "B", quantidade: 10 }),
      409,
    );
  });

  it("permite renomeacao unica mantendo a capacidade valida", async () => {
    await service.create({ nome: "A", quantidade: 0 });
    const result = await service.update("p1", { nome: "C", quantidade: 0 });
    assert.equal(result.after.get("nome"), "C");
  });

  it("faz exclusao logica pelo repositorio", async () => {
    await service.create({ nome: "A", quantidade: 1 });
    const before = await service.delete("p1");
    assert.equal(before.nome, "A");
    assert.equal(repository.deleted, true);
  });
});
