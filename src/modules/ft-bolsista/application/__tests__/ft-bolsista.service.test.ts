import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import AppError from "../../../../core/appError.js";
import { FtBolsistaService } from "../use-case/ft-bolsista.service.js";
import { isValidCpf } from "../utils/cpf.js";
import {
  pagador,
  verifyPagador,
  verifyQuantityPagador,
} from "../utils/pagador.js";
import { FtBolsistaRepository } from "../../domain/repositories/ft-bolsista.repository.js";
import { FtBolsistaDto } from "../dto/ft-bolsista.dto.js";

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

class FakeFtBolsistaRepository implements FtBolsistaRepository {
  public duplicatedCpf = false;
  public missingBolsista = false;
  public missingEdital = false;
  public missingVinculo = false;
  public inactiveBolsista = false;
  public activeQuantityByPagador = 0;
  public createWithPaymentInfoCalled = false;
  public updateWithPaymentInfoCalled = false;
  public cancelVinculoCalled = false;
  public prorrogateVinculosCalled = false;
  public destroyBolsistaCalled = false;
  public destroyFaltaCalled = false;
  public createFaltaPayload: any = null;

  private paymentInfo = new FakeModel({
    id: "payment-1",
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
    payment_info: this.paymentInfo,
  });

  private edital = new FakeModel({
    id: "edital-1",
    status: "ativo",
  });

  private vinculo = new FakeModel({
    id: "vinculo-1",
    bolsista_id: "bolsista-1",
    edital_id: "edital-1",
    status: "ativo",
    expire_at: "2026-06-09",
  });

  async findById() {
    if (this.missingBolsista) return null;
    this.bolsista.set("status", this.inactiveBolsista ? "inativo" : "ativo");
    return this.bolsista;
  }

  async findByCpf() {
    return this.duplicatedCpf ? this.bolsista : null;
  }

  async create(data: any) {
    return new FakeModel({ id: "created-bolsista", ...data });
  }

  async createPaymentInfo(data: any) {
    return new FakeModel({ id: "created-payment", ...data });
  }

  async createWithPaymentInfo(bolsistaData: any, paymentInfoData: any) {
    this.createWithPaymentInfoCalled = true;
    return {
      bolsista: new FakeModel({ id: "created-bolsista", ...bolsistaData }),
      paymentInfo: new FakeModel({ id: "created-payment", ...paymentInfoData }),
    };
  }

  async updateWithPaymentInfo(
    bolsista: any,
    bolsistaData: any,
    paymentInfo: any,
    paymentInfoData: any,
  ) {
    this.updateWithPaymentInfoCalled = true;
    bolsista.set(bolsistaData);
    paymentInfo.set(paymentInfoData);
    return bolsista;
  }

  async findAndCount() {
    return { count: 1, rows: [this.bolsista] };
  }

  async countActiveByPagador() {
    return this.activeQuantityByPagador;
  }

  async findToExpire() {
    return { count: 1, rows: [this.bolsista] };
  }

  async findByEditalId() {
    return [this.bolsista];
  }

  async findEditalById() {
    return this.missingEdital ? null : this.edital;
  }

  async findVinculo() {
    return this.missingVinculo ? null : this.vinculo;
  }

  async destroyBolsista(bolsista: any) {
    this.destroyBolsistaCalled = true;
    await bolsista.destroy();
  }

  async cancelVinculo() {
    this.cancelVinculoCalled = true;
  }

  async prorrogateVinculos(vinculos: any[]) {
    this.prorrogateVinculosCalled = true;
    assert.equal(vinculos.length, 1);
  }

  async createFalta(data: any) {
    this.createFaltaPayload = data;
    return new FakeModel({ id: "falta-1", ...data });
  }

  async findFaltaById() {
    return new FakeModel({ id: "falta-1", bolsista_id: "bolsista-1" });
  }

  async destroyFalta(falta: any) {
    this.destroyFaltaCalled = true;
    await falta.destroy();
  }

  async findAndCountFaltasByBolsista() {
    return {
      count: 1,
      rows: [new FakeModel({ id: "falta-1", bolsista_id: "bolsista-1" })],
    };
  }
}

const validBolsistaPayload = (): FtBolsistaDto => ({
  nome: "Maria Silva",
  cpf: "52998224725",
  telefone: "11999999999",
  local: "Secretaria",
  cep: "12345678",
  numero: "10",
  logradouro: "Rua A",
  bairro: "Centro",
  cidade: "Cidade",
  uf: "SP",
  payment_info: {
    bco: "001",
    ag: "1234",
    dig_ag: "0",
    conta: "123456",
    dig_conta: "1",
    pagador_id: pagador[0].id,
  },
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

describe("ft-bolsista utils", () => {
  it("valida CPF", () => {
    assert.equal(isValidCpf("529.982.247-25"), true);
    assert.equal(isValidCpf("111.111.111-11"), false);
    assert.equal(isValidCpf("123"), false);
  });

  it("valida pagador existente", () => {
    assert.equal(verifyPagador(pagador[0].id).id, pagador[0].id);
    assert.throws(() => verifyPagador("invalido"), AppError);
  });

  it("valida limite de pagador", () => {
    assert.doesNotThrow(() => verifyQuantityPagador(2, 1));
    assert.throws(() => verifyQuantityPagador(2, 2), AppError);
  });
});

describe("FtBolsistaService", () => {
  let repository: FakeFtBolsistaRepository;
  let service: FtBolsistaService;

  beforeEach(() => {
    repository = new FakeFtBolsistaRepository();
    service = new FtBolsistaService(repository);
  });

  it("cria bolsista valido com dados bancarios", async () => {
    const response = await service.saveBolsista(validBolsistaPayload());

    assert.equal(repository.createWithPaymentInfoCalled, true);
    assert.equal(response.ok, true);
    assert.equal(response.payment_info.pagador_id, pagador[0].id);
  });

  it("rejeita CPF invalido", async () => {
    const payload = validBolsistaPayload();
    payload.cpf = "123";

    await assertAppError(() => service.saveBolsista(payload), 400, "CPF invalido");
    assert.equal(repository.createWithPaymentInfoCalled, false);
  });

  it("rejeita dados pessoais incompletos", async () => {
    const payload = validBolsistaPayload();
    payload.nome = "";

    await assertAppError(
      () => service.saveBolsista(payload),
      400,
      "Dados do bolsista incompletos",
    );
  });

  it("rejeita dados bancarios incompletos", async () => {
    const payload = validBolsistaPayload();
    payload.payment_info.conta = "";

    await assertAppError(
      () => service.saveBolsista(payload),
      400,
      "Dados bancarios incompletos",
    );
  });

  it("rejeita CPF duplicado", async () => {
    repository.duplicatedCpf = true;

    await assertAppError(
      () => service.saveBolsista(validBolsistaPayload()),
      403,
      "Bolsista already exists",
    );
  });

  it("atualiza bolsista usando repository transacional", async () => {
    const response = await service.saveBolsista(validBolsistaPayload(), "bolsista-1");

    assert.equal(repository.updateWithPaymentInfoCalled, true);
    assert.equal(response.get("nome"), "Maria Silva");
  });

  it("prorroga vinculos validos", async () => {
    await service.prorrogate([
      { bolsista_id: "bolsista-1", edital_id: "edital-1" },
    ]);

    assert.equal(repository.prorrogateVinculosCalled, true);
  });

  it("rejeita prorrogacao sem lista", async () => {
    await assertAppError(
      () => service.prorrogate([]),
      400,
      "Lista de bolsistas e obrigatoria",
    );
  });

  it("rejeita prorrogacao sem vinculo", async () => {
    repository.missingVinculo = true;

    await assertAppError(
      () =>
        service.prorrogate([
          { bolsista_id: "bolsista-1", edital_id: "edital-1" },
        ]),
      404,
      "Vinculo not found",
    );
  });

  it("rejeita prorrogacao de bolsista inativo", async () => {
    repository.inactiveBolsista = true;

    await assertAppError(
      () =>
        service.prorrogate([
          { bolsista_id: "bolsista-1", edital_id: "edital-1" },
        ]),
      404,
      "Bolsista not found",
    );
  });

  it("cancela vinculo valido", async () => {
    await service.cancelBolsistaEdital("bolsista-1", "edital-1");

    assert.equal(repository.cancelVinculoCalled, true);
  });

  it("lanca falta valida", async () => {
    const response = await service.createFalta("bolsista-1", {
      edital_id: "edital-1",
      data_falta: "2026-06-09",
      observacao: "Ausente",
    });

    assert.equal(response.ok, true);
    assert.equal(repository.createFaltaPayload.bolsista_id, "bolsista-1");
  });

  it("rejeita falta com data invalida", async () => {
    await assertAppError(
      () =>
        service.createFalta("bolsista-1", {
          edital_id: "edital-1",
          data_falta: "data-ruim",
        }),
      400,
      "Data da falta invalida",
    );
  });

  it("lista e remove faltas", async () => {
    const list = await service.listFaltas("bolsista-1");
    const removed = await service.deleteFalta("bolsista-1", "falta-1");

    assert.equal(list.count, 1);
    assert.equal(removed.ok, true);
    assert.equal(repository.destroyFaltaCalled, true);
  });
});
