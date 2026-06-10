import test from "node:test";
import assert from "node:assert/strict";
import AtletaService from "../use-case/atleta.service.js";
import Atleta from "../../domain/entity/Atleta.js";
import Municipe from "../../../municipe/domain/entity/Municipe.js";
import Carterinha from "../../../carterinhas/domain/entity/Carteirinha.js";
import AppError from "../../../../core/appError.js";

class FakeAtletaRepository {
  atletas = new Map<string, Atleta>();
  activeByMunicipe: Atleta | null = null;

  async createAtleta(atleta: Atleta) {
    atleta.uuid = "atl-1";
    this.atletas.set("atl-1", atleta);
    return atleta;
  }

  async findAllAtletas() {
    return { atletas: [...this.atletas.values()], count: this.atletas.size };
  }

  async findOneAtleta(uuid: string) {
    return this.atletas.get(uuid) ?? null;
  }

  async findActiveByMunicipe() {
    return this.activeByMunicipe;
  }

  async updateAtleta(uuid: string, data: any) {
    const atleta = this.atletas.get(uuid);
    if (!atleta) return null;
    Object.assign(atleta, data);
    return atleta;
  }

  async deleteAtleta(uuid: string) {
    return this.atletas.delete(uuid);
  }
}

class FakeMunicipeRepository {
  municipe: Municipe | null = new Municipe("Maria", "123", "2000-01-01", null, "Rua", "Bairro", "Cidade", "SP", "00000", "1", null, 1, "mun-1");

  async getMunicipeById() {
    return this.municipe;
  }
}

class FakeCarterinhaRepository {
  created: Carterinha | null = null;
  query: any = null;
  queryByMunicipe: any = null;
  carterinhas: Carterinha[] = [
    new Carterinha(new Date("2026-01-01"), new Date("2028-01-01"), "esporte", null, "mun-1", 1, "cart-1"),
  ];

  async getCarterinhas(query: any) {
    this.query = query;
    return { carterinhas: this.carterinhas, count: this.carterinhas.length };
  }

  async getCarterinhasByMunicipe(query: any) {
    this.queryByMunicipe = query;
    return { carterinhas: this.carterinhas, count: this.carterinhas.length };
  }

  async postCarterinhas(carterinha: Carterinha) {
    this.created = carterinha;
    carterinha.uuid = "cart-1";
    return carterinha;
  }
}

function makeService() {
  const atletaRepo = new FakeAtletaRepository();
  const municipeRepo = new FakeMunicipeRepository();
  const carterinhaRepo = new FakeCarterinhaRepository();
  return {
    atletaRepo,
    municipeRepo,
    carterinhaRepo,
    service: new AtletaService(atletaRepo as any, municipeRepo as any, carterinhaRepo as any),
  };
}

test("AtletaService cria atleta e rejeita municipe inexistente ou ativo duplicado", async () => {
  const { service, municipeRepo, atletaRepo } = makeService();

  const atleta = await service.createAtleta({ municipe_uuid: "mun-1", ativo: true }, 1);
  assert.equal(atleta.uuid, "atl-1");

  municipeRepo.municipe = null;
  await assert.rejects(() => service.createAtleta({ municipe_uuid: "missing", ativo: true }, 1), (error: AppError) => error.code === "MUNICIPE_NOT_FOUND");

  municipeRepo.municipe = new Municipe("Maria", "123", "2000-01-01", null, "Rua", "Bairro", "Cidade", "SP", "00000", "1", null, 1, "mun-1");
  atletaRepo.activeByMunicipe = new Atleta("mun-1", true, 1, "atl-active");
  await assert.rejects(() => service.createAtleta({ municipe_uuid: "mun-1", ativo: true }, 1), (error: AppError) => error.code === "ATLETA_ALREADY_EXISTS");
});

test("AtletaService busca, atualiza, remove e cria carterinha", async () => {
  const { service } = makeService();
  await service.createAtleta({ municipe_uuid: "mun-1", ativo: true }, 1);

  assert.equal((await service.findAllAtletas()).count, 1);
  assert.equal((await service.findOneAtleta("atl-1")).municipe_uuid, "mun-1");
  assert.equal((await service.updateAtleta("atl-1", { ativo: false })).ativo, false);
  assert.equal((await service.createCarteirinha("atl-1", 9)).origem, "esporte");
  assert.equal(await service.deleteAtleta("atl-1"), true);
  await assert.rejects(() => service.findOneAtleta("atl-1"), (error: AppError) => error.code === "ATLETA_NOT_FOUND");
});

test("AtletaService lista somente carteirinhas de esporte", async () => {
  const { service, carterinhaRepo } = makeService();

  const response = await service.findCarteirinhasEsporte({
    origem: "biblioteca",
    limit: 10,
  } as any);

  assert.equal(response.count, 1);
  assert.equal(carterinhaRepo.query.origem, "esporte");
  assert.equal(carterinhaRepo.query.limit, 10);
});

test("AtletaService lista carteirinhas pelo municipe do atleta", async () => {
  const { service, carterinhaRepo } = makeService();
  await service.createAtleta({ municipe_uuid: "mun-1", ativo: true }, 1);

  const response = await service.findCarteirinhasByAtleta("atl-1", {
    origem: "biblioteca",
    limit: 10,
  } as any);

  assert.equal(response.count, 1);
  assert.equal(carterinhaRepo.queryByMunicipe.municipe_uuid, "mun-1");
  assert.equal(carterinhaRepo.queryByMunicipe.origem, "esporte");
  assert.equal(carterinhaRepo.queryByMunicipe.limit, 10);
  await assert.rejects(() => service.findCarteirinhasByAtleta("missing"), (error: AppError) => error.code === "ATLETA_NOT_FOUND");
});
