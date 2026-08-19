import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import AppError from "../../../../core/appError.js";
import { FtEditalService } from "../use-case/ft-edital.service.js";
import { FtEditalRepository } from "../../domain/repositories/ft-edital.repository.js";
import { FtEditalDto } from "../dto/ft-edital.dto.js";
import { pagador } from "../../../ft-bolsista/application/utils/pagador.js";

class FakeModel {
  public destroyed = false;

  constructor(public data: Record<string, any>) {}

  get(key: string) {
    return this.data[key];
  }

  set(keyOrData: string | Record<string, any>, value?: any) {
    if (typeof keyOrData === "string") {
      this.data[keyOrData] = value;
      return;
    }

    Object.assign(this.data, keyOrData);
  }

  toJSON() {
    return { ...this.data };
  }

  async destroy() {
    this.destroyed = true;
  }
}

class FakeFtEditalRepository implements FtEditalRepository {
  public missingEdital = false;
  public editalInativo = false;
  public missingBolsista = false;
  public bolsistaStatus = "inativo";
  public invalidPagador = false;
  public activeQuantityByPagador = 0;
  public updateCalled = false;
  public destroyCalled = false;
  public vincularBolsistasCalled = false;
  public vinculoStatuses: string[] = [];

  private edital = new FakeModel({
    id: "edital-1",
    name: "Edital 1",
    data_publicacao: new Date("2026-01-01"),
    data_vencimento: new Date("2026-12-31"),
    dia_pagamento: 10,
    valor_bolsa: "1000.00",
    status: "ativo",
  });

  private paymentInfo = new FakeModel({
    pagador_id: pagador[0].id,
    bco: "001",
    ag: "1234",
    dig_ag: "0",
    conta: "123456",
    dig_conta: "1",
  });

  private bolsista = new FakeModel({
    id: "bolsista-1",
    nome: "Maria",
    cpf: "52998224725",
    status: "inativo",
    payment_info: this.paymentInfo.toJSON(),
  });

  async findAll() {
    return [this.edital];
  }

  async findAndCount(query: any = {}) {
    const rows =
      query.search && !String(this.edital.get("name")).includes(query.search)
        ? []
        : [this.edital];

    return { count: rows.length, rows };
  }

  async findById() {
    if (this.missingEdital) return null;
    this.edital.set("status", this.editalInativo ? "inativo" : "ativo");
    return this.edital;
  }

  async create(data: any) {
    return new FakeModel({ id: "created-edital", ...data });
  }

  async update(edital: any, data: any) {
    this.updateCalled = true;
    edital.set(data);
    return edital;
  }

  async destroy(edital: any) {
    this.destroyCalled = true;
    await edital.destroy();
  }

  async findBolsistaById() {
    if (this.missingBolsista) return null;
    this.bolsista.set("status", this.bolsistaStatus);
    this.paymentInfo.set(
      "pagador_id",
      this.invalidPagador ? "pagador-invalido" : pagador[0].id,
    );
    this.bolsista.set("payment_info", this.paymentInfo.toJSON());
    return this.bolsista;
  }

  async countActiveByPagador() {
    return this.activeQuantityByPagador;
  }

  async findAllWithBolsista() {
    return [this.edital];
  }

  async findBolsistasByEdital() {
    return [this.bolsista];
  }

  async countBolsistasByEdital() {
    return 1;
  }

  async findVinculosByBolsistaEdital() {
    return this.vinculoStatuses.map(
      (status, index) =>
        new FakeModel({
          id: `vinculo-${index}`,
          status,
        }),
    );
  }

  async vincularBolsistas(
    _edital: any,
    bolsistas: Array<{ bolsista: any; data_vinculo?: string | Date }>,
  ) {
    this.vincularBolsistasCalled = true;
    assert.equal(bolsistas.length, 1);
    return [new FakeModel({ id: "vinculo-created" })];
  }
}

const validEditalPayload = (): FtEditalDto => ({
  name: "Edital 1",
  data_publicacao: "2026-01-01",
  data_vencimento: "2026-12-31",
  dia_pagamento: 10,
  valor_bolsa: "1000.00",
});

const assertAppError = async (
  action: () => Promise<unknown>,
  statusCode: number,
  messageIncludes: string,
) => {
  await assert.rejects(
    action,
    (error) =>
      error instanceof AppError &&
      error.statusCode === statusCode &&
      error.message.includes(messageIncludes),
  );
};

describe("FtEditalService", () => {
  let repository: FakeFtEditalRepository;
  let service: FtEditalService;

  beforeEach(() => {
    repository = new FakeFtEditalRepository();
    service = new FtEditalService(repository);
  });

  it("cria edital valido", async () => {
    const response = await service.createEdital(validEditalPayload());

    assert.equal(response.get("name"), "Edital 1");
  });

  it("lista editais com busca e total", async () => {
    const response = await service.allEdital({ search: "Edital" });

    assert.equal(response.count, 1);
    assert.equal(response.edital.length, 1);
  });

  it("atualiza edital valido", async () => {
    const response = await service.updateEdital("edital-1", validEditalPayload());

    assert.equal(repository.updateCalled, true);
    assert.equal(response.get("name"), "Edital 1");
  });

  it("rejeita payload de edital incompleto", async () => {
    const payload = validEditalPayload();
    payload.name = "";

    await assertAppError(
      () => service.createEdital(payload),
      400,
      "Dados do edital incompletos",
    );
  });

  it("rejeita datas invalidas", async () => {
    const payload = validEditalPayload();
    payload.data_publicacao = "data-ruim";

    await assertAppError(
      () => service.createEdital(payload),
      400,
      "Datas do edital invalidas",
    );
  });

  it("rejeita dia de pagamento invalido", async () => {
    const payload = validEditalPayload();
    payload.dia_pagamento = 40;

    await assertAppError(
      () => service.createEdital(payload),
      400,
      "Dia de pagamento",
    );
  });

  it("rejeita valor da bolsa invalido", async () => {
    const payload = validEditalPayload();
    payload.valor_bolsa = "0";

    await assertAppError(
      () => service.createEdital(payload),
      400,
      "Valor da bolsa",
    );
  });

  it("remove edital existente e rejeita inexistente", async () => {
    await service.deleteEdital("edital-1");
    assert.equal(repository.destroyCalled, true);

    repository.missingEdital = true;
    await assertAppError(
      () => service.deleteEdital("edital-1"),
      404,
      "Edital not found",
    );
  });

  it("vincula bolsistas validos", async () => {
    await service.vincularBolsista("edital-1", ["bolsista-1"], "2026-06-09");

    assert.equal(repository.vincularBolsistasCalled, true);
  });

  it("permite novo vinculo quando historico do par esta cancelado", async () => {
    repository.vinculoStatuses = ["cancelado"];

    await service.vincularBolsista("edital-1", ["bolsista-1"], "2026-06-09");

    assert.equal(repository.vincularBolsistasCalled, true);
  });

  for (const status of ["ativo", "inativo", "concluido", "expirado"]) {
    it(`rejeita novo vinculo quando historico do par esta ${status}`, async () => {
      repository.vinculoStatuses = [status];

      await assertAppError(
        () => service.vincularBolsista("edital-1", ["bolsista-1"], "2026-06-09"),
        403,
        "Bolsista ja vinculado a este edital",
      );

      assert.equal(repository.vincularBolsistasCalled, false);
    });
  }

  it("rejeita edital inativo ao vincular", async () => {
    repository.editalInativo = true;

    await assertAppError(
      () => service.vincularBolsista("edital-1", ["bolsista-1"], undefined),
      400,
      "Edital inativo",
    );
  });

  it("rejeita bolsista inexistente ao vincular", async () => {
    repository.missingBolsista = true;

    await assertAppError(
      () => service.vincularBolsista("edital-1", ["bolsista-1"], undefined),
      404,
      "Bolsista not found",
    );
  });

  it("rejeita bolsista ativo ou pendente ao vincular", async () => {
    repository.bolsistaStatus = "ativo";
    await assertAppError(
      () => service.vincularBolsista("edital-1", ["bolsista-1"], undefined),
      403,
      "Bolsista com documentos pendentes",
    );

    repository.bolsistaStatus = "pendente";
    await assertAppError(
      () => service.vincularBolsista("edital-1", ["bolsista-1"], undefined),
      403,
      "Bolsista com documentos pendentes",
    );
  });

  it("rejeita pagador invalido ao vincular", async () => {
    repository.invalidPagador = true;

    await assertAppError(
      () => service.vincularBolsista("edital-1", ["bolsista-1"], undefined),
      403,
      "Pagador nao encontrado",
    );
  });

});
