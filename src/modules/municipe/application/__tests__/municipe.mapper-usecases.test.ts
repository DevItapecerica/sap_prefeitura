import test from "node:test";
import assert from "node:assert/strict";
import Municipe from "../../domain/entity/Municipe.js";
import { MunicipeMapper } from "../mapper/municipe.mapper.js";
import MunicipePresentation from "../../interface/presentation/municipe.masked.presentation.js";
import createMunicipeUseCase from "../usecase/createMunicipe.use-case.js";
import getMunicipeUseCase from "../usecase/getMunicipe.use-case.js";
import getMunicipeByIdUseCase from "../usecase/getMunicipeById.use-case.js";
import updateMunicipeUseCase from "../usecase/updateMunicipe.use-case.js";
import MunicipePolicy from "../../domain/service/municipePolicy.service.js";
import AppError from "../../../../core/appError.js";

const aes = {
  encrypt: async (value: string) => `enc:${value}`,
  decrypt: async (value: string) => value.replace(/^enc:/, ""),
};

const sha = {
  encrypt: async (value: string) => `hash:${value}`,
  compare: async (value: string, hash: string) => `hash:${value}` === hash,
};

class FakeMunicipeRepository {
  municipe: Municipe | null = null;
  createdHash: { cpfHash?: string; cepHash?: string } = {};
  updatedHash: { cpfHash?: string; cepHash?: string } = {};
  lastQuery: any = null;

  async getMunicipeByCpf() {
    return null;
  }

  async createMunicipe(municipe: Municipe, cpfHash: string, cepHash: string) {
    this.createdHash = { cpfHash, cepHash };
    this.municipe = municipe;
    return municipe;
  }

  async updateMunicipe(_uuid: string, municipe: Municipe, cpfHash?: string, cepHash?: string) {
    this.updatedHash = { cpfHash, cepHash };
    this.municipe = municipe;
    return municipe;
  }

  async getMunicipeById() {
    return this.municipe;
  }

  async getMunicipe(query: any) {
    this.lastQuery = query;
    return { municipe: this.municipe ? [this.municipe] : [], count: this.municipe ? 1 : 0 };
  }
}

function makeMunicipe() {
  return new Municipe("Maria Silva", "12345678900", "2000-06-09", "11999999999", "Rua A", "Centro", "Cidade", "SP", "06850000", "10", null, 1, "mun-1");
}

test("MunicipePolicyService mantem comportamento atual de CPF", () => {
  assert.equal(MunicipePolicy.cpfIsValid("qualquer-coisa"), true);
});

test("MunicipeMapper criptografa persistencia e descriptografa dominio", async () => {
  const mapper = new MunicipeMapper(aes as any, sha as any);
  const persistence = await mapper.toPersistence(makeMunicipe());
  const domain = await mapper.toDomain(persistence.municipe);

  assert.equal(persistence.municipe.cpf, "enc:12345678900");
  assert.equal(persistence.cpfHash, "hash:12345678900");
  assert.equal(domain.cpf, "12345678900");
});

test("MunicipePresentation mascara dados sensiveis", () => {
  const masked = MunicipePresentation.Masked(makeMunicipe());

  assert.equal(masked.nome, "Maria ***");
  assert.equal(masked.cpf, "********900");
  assert.equal(masked.nascimento, 2000);
});

test("createMunicipeUseCase cria com hashes e getMunicipeByIdUseCase descriptografa", async () => {
  const repo = new FakeMunicipeRepository();
  const createUseCase = new createMunicipeUseCase(repo as any, aes as any, sha as any);

  const created = await createUseCase.execute(makeMunicipe() as any, "author-1");

  assert.equal(created.cpf, "12345678900");
  assert.equal(repo.createdHash.cpfHash, "hash:12345678900");

  const getUseCase = new getMunicipeByIdUseCase(repo as any, aes as any, sha as any);
  assert.equal((await getUseCase.execute("mun-1")).cpf, "12345678900");
});

test("updateMunicipeUseCase atualiza hashes de CPF e CEP junto com dados criptografados", async () => {
  const repo = new FakeMunicipeRepository();
  const mapper = new MunicipeMapper(aes as any, sha as any);
  const persisted = await mapper.toPersistence(makeMunicipe());
  repo.municipe = persisted.municipe;
  const useCase = new updateMunicipeUseCase(repo as any, aes as any, sha as any);

  const updated = await useCase.execute("mun-1", {
    cpf: "98765432100",
    nascimento: "2001-07-10",
    telefone: "11888888888",
    rua: "Rua B",
    bairro: "Centro",
    cidade: "Cidade",
    uf: "SP",
    cep: "06851000",
    numero: "20",
    complemento: null,
  }, "author-2");

  assert.equal(repo.updatedHash.cpfHash, "hash:98765432100");
  assert.equal(repo.updatedHash.cepHash, "hash:06851000");
  assert.equal(repo.municipe?.cpf, "enc:98765432100");
  assert.equal(repo.municipe?.cep, "enc:06851000");
  assert.equal(updated.cpf, "98765432100");
  assert.equal(updated.cep, "06851000");
});

test("updateMunicipeUseCase aceita update parcial sem recalcular hashes ausentes", async () => {
  const repo = new FakeMunicipeRepository();
  const mapper = new MunicipeMapper(aes as any, sha as any);
  const persisted = await mapper.toPersistence(makeMunicipe());
  repo.municipe = persisted.municipe;
  const useCase = new updateMunicipeUseCase(repo as any, aes as any, sha as any);

  const updated = await useCase.execute("mun-1", {
    telefone: "11777777777",
  }, "author-2");

  assert.equal(repo.updatedHash.cpfHash, undefined);
  assert.equal(repo.updatedHash.cepHash, undefined);
  assert.equal(updated.cpf, "12345678900");
  assert.equal(updated.cep, "06850000");
  assert.equal(updated.telefone, "11777777777");
});

test("getMunicipeUseCase envia hash para busca por CPF ou CEP", async () => {
  const repo = new FakeMunicipeRepository();
  const mapper = new MunicipeMapper(aes as any, sha as any);
  const persisted = await mapper.toPersistence(makeMunicipe());
  repo.municipe = persisted.municipe;
  const useCase = new getMunicipeUseCase(repo as any, aes as any, sha as any);

  await useCase.execute({ search: "123.456.789-00" });
  assert.equal(repo.lastQuery.searchHash, "hash:12345678900");

  await useCase.execute({ search: "06850-000" });
  assert.equal(repo.lastQuery.searchHash, "hash:06850000");
});

test("getMunicipeByIdUseCase rejeita municipe inexistente", async () => {
  const useCase = new getMunicipeByIdUseCase(new FakeMunicipeRepository() as any, aes as any, sha as any);

  await assert.rejects(() => useCase.execute("missing"), (error: AppError) => error.code === "MUNICIPE_NOT_FOUND");
});
