import test from "node:test";
import assert from "node:assert/strict";
import ModalidadeService from "../use-case/modalidade.service.js";
import Modalidade from "../../domain/entity/Modalidade.js";
import AppError from "../../../../core/appError.js";

class FakeModalidadeRepository {
  modalidades = new Map<string, Modalidade>();
  lastQuery: any = null;
  nextId = 1;

  async createModalidade(modalidade: Modalidade) {
    modalidade.uuid = `mod-${this.nextId++}`;
    this.modalidades.set(modalidade.uuid, modalidade);
    return modalidade;
  }

  async findAllModalidades(query?: any) {
    this.lastQuery = query;
    let modalidades = [...this.modalidades.values()];

    if (query?.search) {
      modalidades = modalidades.filter((modalidade) =>
        modalidade.nome.includes(query.search),
      );
    }

    return { modalidades, count: modalidades.length };
  }

  async findOneModalidade(uuid: string) {
    return this.modalidades.get(uuid) ?? null;
  }

  async findByNome(nome: string) {
    return (
      [...this.modalidades.values()].find(
        (modalidade) => modalidade.nome === nome,
      ) ?? null
    );
  }

  async updateModalidade(uuid: string, data: any) {
    const modalidade = this.modalidades.get(uuid);
    if (!modalidade) return null;
    Object.assign(modalidade, data);
    return modalidade;
  }

  async deleteModalidade(uuid: string) {
    return this.modalidades.delete(uuid);
  }
}

function makeService() {
  const modalidadeRepo = new FakeModalidadeRepository();
  return {
    modalidadeRepo,
    service: new ModalidadeService(modalidadeRepo as any),
  };
}

test("ModalidadeService cria modalidade e normaliza nome", async () => {
  const { service } = makeService();

  const modalidade = await service.createModalidade({ nome: "  Futebol  " });

  assert.equal(modalidade.uuid, "mod-1");
  assert.equal(modalidade.nome, "Futebol");
});

test("ModalidadeService rejeita nome vazio no create e update", async () => {
  const { service } = makeService();

  await assert.rejects(
    () => service.createModalidade({ nome: " " }),
    (error: AppError) => error.code === "MODALIDADE_NOME_REQUIRED",
  );

  await assert.rejects(
    () => service.updateModalidade("mod-1", { nome: "" }),
    (error: AppError) => error.code === "MODALIDADE_NOME_REQUIRED",
  );
});

test("ModalidadeService rejeita nome duplicado", async () => {
  const { service } = makeService();

  await service.createModalidade({ nome: "Futebol" });

  await assert.rejects(
    () => service.createModalidade({ nome: "Futebol" }),
    (error: AppError) => error.code === "MODALIDADE_ALREADY_EXISTS",
  );
});

test("ModalidadeService lista com query, busca por uuid, atualiza e remove", async () => {
  const { service, modalidadeRepo } = makeService();

  await service.createModalidade({ nome: "Futebol" });
  await service.createModalidade({ nome: "Volei" });

  const list = await service.findAllModalidades({
    search: "Fut",
    page: 0,
    limit: 10,
    order: "nome:asc",
  });

  assert.equal(list.count, 1);
  assert.equal(list.modalidades[0].nome, "Futebol");
  assert.equal(modalidadeRepo.lastQuery.order, "nome:asc");
  assert.equal((await service.findOneModalidade("mod-1")).nome, "Futebol");
  assert.equal(
    (await service.updateModalidade("mod-1", { nome: "Futsal" })).nome,
    "Futsal",
  );
  assert.equal(await service.deleteModalidade("mod-1"), true);
});

test("ModalidadeService retorna not found para operacoes em uuid inexistente", async () => {
  const { service } = makeService();

  await assert.rejects(
    () => service.findOneModalidade("missing"),
    (error: AppError) => error.code === "MODALIDADE_NOT_FOUND",
  );

  await assert.rejects(
    () => service.updateModalidade("missing", { nome: "Futebol" }),
    (error: AppError) => error.code === "MODALIDADE_NOT_FOUND",
  );

  await assert.rejects(
    () => service.deleteModalidade("missing"),
    (error: AppError) => error.code === "MODALIDADE_NOT_FOUND",
  );
});
