import test from "node:test";
import assert from "node:assert/strict";
import CreateCarterinhaUseCase from "../use-case/createCarterinha.use-case.js";
import GetCarterinhaUseCase from "../use-case/getCarterinha.use-case.js";
import GetOneCarterinhaUseCase from "../use-case/getOneCarterinha.use-case.js";
import Carterinha from "../../domain/entity/Carteirinha.js";
import { CarterinhaPolicy } from "../../domain/service/carterinhaPolicy.js";
import Municipe from "../../../municipe/domain/entity/Municipe.js";
import AppError from "../../../../core/appError.js";

class FakeMunicipeRepository {
  municipe: Municipe | null = new Municipe("Maria", "123", "2000-01-01", null, "Rua", "Bairro", "Cidade", "SP", "00000", "1", null, 1, "mun-1");

  async getMunicipeById() {
    return this.municipe;
  }
}

class FakeCarterinhaRepository {
  carterinhas: Carterinha[] = [
    new Carterinha(new Date("2026-01-01"), new Date("2028-01-01"), "esporte", null, "mun-1", 1, "cart-1"),
  ];

  async getCarterinhas() {
    return { carterinhas: this.carterinhas, count: this.carterinhas.length };
  }

  async postCarterinhas(carterinha: Carterinha) {
    carterinha.uuid = "cart-new";
    this.carterinhas.push(carterinha);
    return carterinha;
  }

  async getCarterinhaById(id: string) {
    return this.carterinhas.find((carterinha) => carterinha.uuid === id) ?? null;
  }

  async deleteCarterinha() {
    return true;
  }
}

test("CarterinhaPolicy calcula validade de dois anos", () => {
  const policy = new CarterinhaPolicy();
  const validade = policy.calcularValidade(new Date("2026-06-09T00:00:00.000Z"));

  assert.equal(validade.getFullYear(), 2028);
  assert.equal(policy.isValidadeValida(new Date(Date.now() + 60_000)), true);
});

test("CreateCarterinhaUseCase cria carterinha para municipe existente", async () => {
  const municipeRepo = new FakeMunicipeRepository();
  const carterinhaRepo = new FakeCarterinhaRepository();
  const useCase = new CreateCarterinhaUseCase(municipeRepo as any, carterinhaRepo as any);

  const carterinha = await useCase.execute({ origem: "esporte", atividade_uuid: null, municipe_uuid: "mun-1" }, 7);

  assert.equal(carterinha.uuid, "cart-new");
  assert.equal(carterinha.author, 7);
  assert.equal(carterinha.origem, "esporte");
});

test("CreateCarterinhaUseCase rejeita municipe inexistente", async () => {
  const municipeRepo = new FakeMunicipeRepository();
  municipeRepo.municipe = null;
  const useCase = new CreateCarterinhaUseCase(municipeRepo as any, new FakeCarterinhaRepository() as any);

  await assert.rejects(
    () => useCase.execute({ origem: "esporte", atividade_uuid: null, municipe_uuid: "missing" }),
    (error: AppError) => error.code === "MUNICIPE_NOT_FOUND",
  );
});

test("GetCarterinhaUseCase lista e GetOneCarterinhaUseCase rejeita inexistente", async () => {
  const repo = new FakeCarterinhaRepository();
  const getAll = new GetCarterinhaUseCase(repo as any);
  const getOne = new GetOneCarterinhaUseCase(repo as any);

  assert.equal((await getAll.execute({} as any)).count, 1);
  assert.equal((await getOne.execute("cart-1")).uuid, "cart-1");
  await assert.rejects(() => getOne.execute("missing"), (error: AppError) => error.code === "CARTERINHA_NOT_FOUND");
});
