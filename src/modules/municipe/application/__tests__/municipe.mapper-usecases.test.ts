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
import { normalizeMunicipeQuery } from "../dto/municipe-query.dto.js";
import { MunicipeIdentityConflictError } from "../../domain/errors/municipe-identity-conflict.error.js";
import { IAesCrypt } from "../../../../core/security/aes/AesCrypt.interface.js";
import { ISha256Crypt } from "../../../../core/security/sha256/sha256.interface.js";
import { QueryParams } from "../../../../core/types/genericTypes.js";
import IMunicipeRepository from "../../domain/repositories/Municipe.repository.js";
import { updateMunicipeDto } from "../dto/municipe.dto.js";

const aes: IAesCrypt = {
  encrypt: async (value: string) => `enc:${value}`,
  decrypt: async (value: string) => value.replace(/^enc:/, ""),
};

const sha: ISha256Crypt = {
  encrypt: async (value: string) => `hash:${value}`,
  compare: async (value: string, hash: string) => `hash:${value}` === hash,
};

class FakeMunicipeRepository implements IMunicipeRepository {
  municipe: Municipe | null = null;
  createdHash: { cpfHash?: string; cepHash?: string } = {};
  updatedHash: { cepHash?: string } = {};
  lastQuery: QueryParams | null = null;
  identityConflict = false;

  async getMunicipeByCpf() {
    return null;
  }

  async createMunicipe(municipe: Municipe, cpfHash: string, cepHash: string) {
    if (this.identityConflict) throw new MunicipeIdentityConflictError();
    this.createdHash = { cpfHash, cepHash };
    this.municipe = municipe;
    return municipe;
  }

  async updateMunicipe(_uuid: string, municipe: Partial<Municipe>, cepHash?: string) {
    if (!(municipe instanceof Municipe)) throw new Error("Fake repository expects a Municipe entity");
    this.updatedHash = { cepHash };
    this.municipe = municipe;
    return municipe;
  }

  async getMunicipeById() {
    return this.municipe;
  }

  async getMunicipe(query: QueryParams) {
    this.lastQuery = query;
    return { municipe: this.municipe ? [this.municipe] : [], count: this.municipe ? 1 : 0 };
  }

  async deleteMunicipe() {
    const existed = Boolean(this.municipe);
    this.municipe = null;
    return existed;
  }
}

function makeMunicipe() {
  return new Municipe("Maria Silva", "52998224725", "2000-06-09", "11999999999", "Rua A", "Centro", "Cidade", "SP", "06850000", "10", "Fundos", 1, "mun-1");
}

test("MunicipePolicy valida CPF, CEP e nascimento e normaliza documentos", () => {
  assert.equal(MunicipePolicy.normalizeCpf("529.982.247-25"), "52998224725");
  assert.equal(MunicipePolicy.cpfIsValid("529.982.247-25"), true);
  assert.equal(MunicipePolicy.cpfIsValid("111.111.111-11"), false);
  assert.equal(MunicipePolicy.cpfIsValid("52998224724"), false);
  assert.equal(MunicipePolicy.normalizeCep("06850-000"), "06850000");
  assert.equal(MunicipePolicy.cepIsValid("06850-000"), true);
  assert.equal(MunicipePolicy.cepIsValid("0685"), false);
  assert.equal(MunicipePolicy.birthDateIsValid("2000-02-29"), true);
  assert.equal(MunicipePolicy.birthDateIsValid("2001-02-29"), false);
  assert.equal(MunicipePolicy.birthDateIsValid("2999-01-01"), false);
});

test("MunicipeMapper criptografa persistencia e descriptografa dominio", async () => {
  const mapper = new MunicipeMapper(aes, sha);
  const persistence = await mapper.toPersistence(makeMunicipe());
  const domain = await mapper.toDomain(persistence.municipe);

  assert.equal(persistence.municipe.cpf, "enc:52998224725");
  assert.equal(persistence.cpfHash, "hash:52998224725");
  assert.equal(domain.cpf, "52998224725");
});

test("MunicipePresentation mascara dados sensiveis", () => {
  const masked = MunicipePresentation.Masked(makeMunicipe());

  assert.equal(masked.nome, "Maria ***");
  assert.equal(masked.cpf, "********725");
  assert.equal(masked.nascimento, 2000);
});

test("createMunicipeUseCase cria com hashes e getMunicipeByIdUseCase descriptografa", async () => {
  const repo = new FakeMunicipeRepository();
  const createUseCase = new createMunicipeUseCase(repo, aes, sha);

  const created = await createUseCase.execute(makeMunicipe(), "author-1");

  assert.equal(created.cpf, "52998224725");
  assert.equal(repo.createdHash.cpfHash, "hash:52998224725");

  const getUseCase = new getMunicipeByIdUseCase(repo, aes, sha);
  assert.equal((await getUseCase.execute("mun-1")).cpf, "52998224725");
});

test("updateMunicipeUseCase normaliza CEP e preserva a identidade", async () => {
  const repo = new FakeMunicipeRepository();
  const mapper = new MunicipeMapper(aes, sha);
  const persisted = await mapper.toPersistence(makeMunicipe());
  repo.municipe = persisted.municipe;
  const useCase = new updateMunicipeUseCase(repo, aes, sha);

  const updated = await useCase.execute("mun-1", {
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

  assert.equal(repo.updatedHash.cepHash, "hash:06851000");
  assert.equal(repo.municipe?.cpf, "enc:52998224725");
  assert.equal(repo.municipe?.cep, "enc:06851000");
  assert.equal(updated.cpf, "52998224725");
  assert.equal(updated.cep, "06851000");
});

test("updateMunicipeUseCase aceita update parcial sem recalcular hashes ausentes", async () => {
  const repo = new FakeMunicipeRepository();
  const mapper = new MunicipeMapper(aes, sha);
  const persisted = await mapper.toPersistence(makeMunicipe());
  repo.municipe = persisted.municipe;
  const useCase = new updateMunicipeUseCase(repo, aes, sha);

  const updated = await useCase.execute("mun-1", {
    telefone: null,
    complemento: null,
  }, "author-2");

  assert.equal(repo.updatedHash.cepHash, undefined);
  assert.equal(updated.cpf, "52998224725");
  assert.equal(updated.cep, "06850000");
  assert.equal(updated.telefone, null);
  assert.equal(updated.complemento, null);
});

test("getMunicipeUseCase envia hash para busca por CPF ou CEP", async () => {
  const repo = new FakeMunicipeRepository();
  const mapper = new MunicipeMapper(aes, sha);
  const persisted = await mapper.toPersistence(makeMunicipe());
  repo.municipe = persisted.municipe;
  const useCase = new getMunicipeUseCase(repo, aes, sha);

  await useCase.execute({ search: "529.982.247-25" });
  assert.equal(repo.lastQuery?.searchHash, "hash:52998224725");

  await useCase.execute({ search: "06850-000" });
  assert.equal(repo.lastQuery?.searchHash, "hash:06850000");
});

test("getMunicipeByIdUseCase rejeita municipe inexistente", async () => {
  const useCase = new getMunicipeByIdUseCase(new FakeMunicipeRepository(), aes, sha);

  await assert.rejects(() => useCase.execute("missing"), (error: AppError) => error.code === "MUNICIPE_NOT_FOUND");
});

test("createMunicipeUseCase rejeita CPF, CEP e nascimento invalidos", async () => {
  const useCase = new createMunicipeUseCase(new FakeMunicipeRepository(), aes, sha);
  const base = makeMunicipe();

  await assert.rejects(
    () => useCase.execute({ ...base, cpf: "11111111111" }, "author-1"),
    (error: AppError) => error.code === "INVALID_CPF",
  );
  await assert.rejects(
    () => useCase.execute({ ...base, cep: "123" }, "author-1"),
    (error: AppError) => error.code === "INVALID_CEP",
  );
  await assert.rejects(
    () => useCase.execute({ ...base, nascimento: "2099-01-01" }, "author-1"),
    (error: AppError) => error.code === "INVALID_BIRTH_DATE",
  );
});

test("consulta de municipes limita paginacao e ordenacao a valores seguros", () => {
  assert.deepEqual(normalizeMunicipeQuery({ search: "  Maria  ", page: 0, limit: 25, order: "createdAt:desc" }), {
    search: "Maria",
    page: 0,
    limit: 25,
    order: "createdAt:desc",
  });
  assert.throws(() => normalizeMunicipeQuery({ page: -1 }), (error: AppError) => error.code === "INVALID_PAGE");
  assert.throws(() => normalizeMunicipeQuery({ limit: 101 }), (error: AppError) => error.code === "INVALID_LIMIT");
  assert.throws(
    () => normalizeMunicipeQuery({ order: "cpfHash:desc" }),
    (error: AppError) => error.code === "INVALID_ORDER",
  );
});

test("updateMunicipeUseCase impede alterar nome ou CPF mesmo fora da rota HTTP", async () => {
  const repo = new FakeMunicipeRepository();
  const mapper = new MunicipeMapper(aes, sha);
  repo.municipe = (await mapper.toPersistence(makeMunicipe())).municipe;
  const useCase = new updateMunicipeUseCase(repo, aes, sha);

  await assert.rejects(
    () => useCase.execute("mun-1", { cpf: "11144477735" } as unknown as updateMunicipeDto, "author-2"),
    (error: AppError) => error.code === "IMMUTABLE_IDENTITY",
  );
  await assert.rejects(
    () => useCase.execute("mun-1", { nome: "Outro Nome" } as unknown as updateMunicipeDto, "author-2"),
    (error: AppError) => error.code === "IMMUTABLE_IDENTITY",
  );
});

test("createMunicipeUseCase traduz conflito concorrente de identidade", async () => {
  const repo = new FakeMunicipeRepository();
  repo.identityConflict = true;
  const useCase = new createMunicipeUseCase(repo, aes, sha);

  await assert.rejects(
    () => useCase.execute(makeMunicipe(), "author-1"),
    (error: AppError) => error.statusCode === 409 && error.code === "MUNICIPE_ALREADY_EXISTS",
  );
});
