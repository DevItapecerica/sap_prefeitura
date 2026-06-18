import test from "node:test";
import assert from "node:assert/strict";
import CreateCarterinhaUseCase from "../use-case/createCarterinha.use-case.js";
import GetCarterinhaUseCase from "../use-case/getCarterinha.use-case.js";
import GetCarterinhasByMunicipeUseCase from "../use-case/getCarterinhasByMunicipe.use-case.js";
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
  queryByMunicipe: any = null;
  carterinhas: Carterinha[] = [
    new Carterinha(new Date("2026-01-01"), new Date("2028-01-01"), "esporte", null, "mun-1", 1, "cart-1"),
  ];

  async getCarterinhas() {
    return { carterinhas: this.carterinhas, count: this.carterinhas.length };
  }

  async getCarterinhasByMunicipe(query: any) {
    this.queryByMunicipe = query;
    const carterinhas = this.carterinhas.filter((carterinha) => {
      if (carterinha.municipe_uuid !== query.municipe_uuid) return false;
      if (query.origem && carterinha.origem !== query.origem) return false;
      if (query.servico && carterinha.atividade !== query.servico) return false;
      return true;
    });

    return { carterinhas, count: carterinhas.length };
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

class FakeCreateCarterinhaPdfUseCase {
  payload: any = null;

  async execute(payload: any) {
    this.payload = payload;
  }
}

const fakeAes = {
  decrypt: async (value: string) => value.replace(/^enc:/, ""),
};

const fakeSha = {
  encrypt: async (value: string) => `hash:${value}`,
};

test("CarterinhaPolicy calcula validade de dois anos", () => {
  const policy = new CarterinhaPolicy();
  const validade = policy.calcularValidade(new Date("2026-06-09T00:00:00.000Z"));

  assert.equal(validade.getFullYear(), 2028);
  assert.equal(policy.isValidadeValida(new Date(Date.now() + 60_000)), true);
});

test("CreateCarterinhaUseCase cria carterinha para municipe existente", async () => {
  const municipeRepo = new FakeMunicipeRepository();
  municipeRepo.municipe = new Municipe(
    "Maria",
    "enc:12345678900",
    "enc:2000-01-01",
    "enc:11999999999",
    "enc:Rua",
    "enc:Bairro",
    "enc:Cidade",
    "enc:SP",
    "enc:06850000",
    "enc:1",
    null,
    1,
    "mun-1",
  );
  const carterinhaRepo = new FakeCarterinhaRepository();
  const pdfUseCase = new FakeCreateCarterinhaPdfUseCase();
  const useCase = new CreateCarterinhaUseCase(
    municipeRepo as any,
    carterinhaRepo as any,
    pdfUseCase as any,
    fakeAes as any,
    fakeSha as any,
  );

  const carterinha = await useCase.execute({ origem: "esporte", atividade: "Futebol", municipe_uuid: "mun-1" }, 7);

  assert.equal(carterinha.uuid, "cart-new");
  assert.equal(carterinha.author, 7);
  assert.equal(carterinha.origem, "esporte");
  assert.equal(pdfUseCase.payload.modelType, "esporte");
  assert.equal(pdfUseCase.payload.entityData.identidade, "12345678900");
  assert.equal(pdfUseCase.payload.entityData.endereco, "Rua");
  assert.equal(pdfUseCase.payload.entityData.modalidade, "Futebol");
});

test("CreateCarterinhaUseCase rejeita municipe inexistente", async () => {
  const municipeRepo = new FakeMunicipeRepository();
  municipeRepo.municipe = null;
  const useCase = new CreateCarterinhaUseCase(municipeRepo as any, new FakeCarterinhaRepository() as any);

  await assert.rejects(
    () => useCase.execute({ origem: "esporte", atividade: null, municipe_uuid: "missing" }, 7),
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

test("GetCarterinhasByMunicipeUseCase lista por municipe e aceita origem opcional", async () => {
  const repo = new FakeCarterinhaRepository();
  repo.carterinhas.push(
    new Carterinha(new Date("2026-02-01"), new Date("2028-02-01"), "biblioteca", null, "mun-1", 1, "cart-2"),
    new Carterinha(new Date("2026-03-01"), new Date("2028-03-01"), "esporte", null, "mun-2", 1, "cart-3"),
  );
  const useCase = new GetCarterinhasByMunicipeUseCase(repo as any);

  assert.equal((await useCase.execute({ municipe_uuid: "mun-1" })).count, 2);
  assert.equal((await useCase.execute({ municipe_uuid: "mun-1", origem: "esporte" })).count, 1);
  assert.equal(repo.queryByMunicipe.municipe_uuid, "mun-1");
});
