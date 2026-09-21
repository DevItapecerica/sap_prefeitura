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
  async findFaltasByBolsistaPeriodo() { return []; }
  public duplicatedCpf = false;
  public missingBolsista = false;
  public missingEdital = false;
  public missingVinculo = false;
  public inactiveBolsista = false;
  public inactiveEdital = false;
  public vinculoStatus = "ativo";
  public vinculoDataVinculo = "2026-06-01";
  public vinculoExpireAt: string | null = "2026-06-30";
  public existingFalta = false;
  public activeQuantityByPagador = 0;
  public createWithPaymentInfoCalled = false;
  public updateWithPaymentInfoCalled = false;
  public cancelVinculoCalled = false;
  public cancelVinculoObservacao: string | null = null;
  public prorrogateVinculosCalled = false;
  public destroyBolsistaCalled = false;
  public destroyFaltaCalled = false;
  public createFaltaPayload: any = null;
  public historicoCalled = false;

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
    data_vinculo: "2026-06-01",
    expire_at: "2026-06-30",
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

  async findAndCountVinculoCandidates() {
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

  async findHistoricoByBolsistaId() {
    this.historicoCalled = true;

    return [
      new FakeModel({
        id: "vinculo-1",
        status: "ativo",
        data_vinculo: "2026-06-01",
        expire_at: "2027-06-01",
        canceled_at: null,
        concluded_at: null,
        expired_at: null,
        prorrogated: false,
        edital: {
          id: "edital-1",
          name: "Edital 1",
        },
      }),
      new FakeModel({
        id: "vinculo-2",
        status: "cancelado",
        data_vinculo: "2025-01-01",
        expire_at: "2026-01-01",
        canceled_at: "2025-06-01",
        observacao: "Solicitacao do bolsista",
        concluded_at: null,
        expired_at: null,
        prorrogated: true,
        edital: {
          id: "edital-2",
          name: "Edital 2",
        },
      }),
    ];
  }

  async findEditalById() {
    this.edital.set("status", this.inactiveEdital ? "inativo" : "ativo");
    return this.missingEdital ? null : this.edital;
  }

  async findVinculo() {
    this.vinculo.set("status", this.vinculoStatus);
    this.vinculo.set("data_vinculo", this.vinculoDataVinculo);
    this.vinculo.set("expire_at", this.vinculoExpireAt);
    return this.missingVinculo ? null : this.vinculo;
  }

  async destroyBolsista(bolsista: any) {
    this.destroyBolsistaCalled = true;
    await bolsista.destroy();
  }

  async cancelVinculo(_bolsista: any, vinculo: any, observacao: string) {
    this.cancelVinculoCalled = true;
    this.cancelVinculoObservacao = observacao;
    vinculo.set({ status: "cancelado", observacao });
  }

  async prorrogateVinculos(vinculos: any[]) {
    this.prorrogateVinculosCalled = true;
    assert.equal(vinculos.length, 1);
  }

  async createFalta(data: any) {
    this.createFaltaPayload = data;
    return new FakeModel({ id: "falta-1", ...data });
  }

  async findFaltaByBolsistaEditalData() {
    return this.existingFalta
      ? new FakeModel({
          id: "falta-existente",
          bolsista_id: "bolsista-1",
          edital_id: "edital-1",
          data_falta: "2026-06-09",
        })
      : null;
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

  it("rejeita prorrogacao em edital inativo", async () => {
    repository.inactiveEdital = true;

    await assertAppError(
      () =>
        service.prorrogate([
          { bolsista_id: "bolsista-1", edital_id: "edital-1" },
        ]),
      400,
      "Edital inativo",
    );

    assert.equal(repository.prorrogateVinculosCalled, false);
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
    const response = await service.cancelBolsistaEdital(
      "bolsista-1",
      "edital-1",
      { observacao: "  Solicitacao do bolsista  " },
    );

    assert.equal(repository.cancelVinculoCalled, true);
    assert.equal(repository.cancelVinculoObservacao, "Solicitacao do bolsista");
    assert.equal(response.after.vinculo.observacao, "Solicitacao do bolsista");
  });

  for (const observacao of [undefined, "", "   "]) {
    it(`rejeita cancelamento com observacao invalida: ${String(observacao)}`, async () => {
      await assertAppError(
        () => service.cancelBolsistaEdital(
          "bolsista-1",
          "edital-1",
          { observacao } as any,
        ),
        400,
        "Observacao e obrigatoria",
      );

      assert.equal(repository.cancelVinculoCalled, false);
    });
  }

  it("rejeita cancelamento em edital inativo", async () => {
    repository.inactiveEdital = true;

    await assertAppError(
      () => service.cancelBolsistaEdital(
        "bolsista-1",
        "edital-1",
        { observacao: "Cancelamento" },
      ),
      400,
      "Edital inativo",
    );

    assert.equal(repository.cancelVinculoCalled, false);
  });

  it("rejeita cancelamento de vinculo inativo", async () => {
    repository.vinculoStatus = "inativo";

    await assertAppError(
      () => service.cancelBolsistaEdital(
        "bolsista-1",
        "edital-1",
        { observacao: "Cancelamento" },
      ),
      400,
      "Bolsista inativo neste edital",
    );

    assert.equal(repository.cancelVinculoCalled, false);
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

  it("rejeita falta duplicada", async () => {
    repository.existingFalta = true;

    await assertAppError(
      () =>
        service.createFalta("bolsista-1", {
          edital_id: "edital-1",
          data_falta: "2026-06-09",
        }),
      400,
      "Falta ja lancada para esta data",
    );

    assert.equal(repository.createFaltaPayload, null);
  });

  it("lista bolsistas elegiveis para vinculo", async () => {
    const response = await service.getBolsistasParaVinculo({ search: "Maria" });

    assert.equal(response.ok, true);
    assert.equal(response.count, 1);
    assert.equal(response.bolsistas.length, 1);
  });

  it("lista historico de vinculos do bolsista", async () => {
    const response = await service.getHistoricoBolsista("bolsista-1");

    assert.equal(response.ok, true);
    assert.equal(repository.historicoCalled, true);
    assert.equal(response.historico.length, 2);
    assert.equal(response.historico[0].get("status"), "ativo");
    assert.equal(response.historico[1].get("status"), "cancelado");
    assert.equal(
      response.historico[1].get("observacao"),
      "Solicitacao do bolsista",
    );
  });

  it("rejeita historico de bolsista inexistente", async () => {
    repository.missingBolsista = true;

    await assertAppError(
      () => service.getHistoricoBolsista("bolsista-1"),
      404,
      "Bolsista not found",
    );

    assert.equal(repository.historicoCalled, false);
  });

  it("rejeita falta em edital inativo", async () => {
    repository.inactiveEdital = true;

    await assertAppError(
      () =>
        service.createFalta("bolsista-1", {
          edital_id: "edital-1",
          data_falta: "2026-06-09",
        }),
      400,
      "Edital inativo",
    );

    assert.equal(repository.createFaltaPayload, null);
  });

  it("rejeita falta sem vinculo entre bolsista e edital", async () => {
    repository.missingVinculo = true;

    await assertAppError(
      () =>
        service.createFalta("bolsista-1", {
          edital_id: "edital-1",
          data_falta: "2026-06-09",
        }),
      404,
      "Vinculo entre bolsista e edital nao encontrado",
    );

    assert.equal(repository.createFaltaPayload, null);
  });

  for (const status of ["inativo", "cancelado", "concluido", "expirado"]) {
    it(`rejeita falta com vinculo ${status}`, async () => {
      repository.vinculoStatus = status;

      await assertAppError(
        () =>
          service.createFalta("bolsista-1", {
            edital_id: "edital-1",
            data_falta: "2026-06-09",
          }),
        400,
        "Bolsista inativo neste edital",
      );

      assert.equal(repository.createFaltaPayload, null);
    });
  }

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

  it("rejeita falta futura", async () => {
    await assertAppError(
      () =>
        service.createFalta("bolsista-1", {
          edital_id: "edital-1",
          data_falta: "2999-01-01",
        }),
      400,
      "Data da falta nao pode ser futura",
    );
  });

  it("rejeita falta antes do inicio do vinculo", async () => {
    await assertAppError(
      () =>
        service.createFalta("bolsista-1", {
          edital_id: "edital-1",
          data_falta: "2026-05-31",
        }),
      400,
      "Data da falta fora do periodo do vinculo",
    );
  });

  it("rejeita falta depois do fim do vinculo", async () => {
    repository.vinculoExpireAt = "2026-06-08";

    await assertAppError(
      () =>
        service.createFalta("bolsista-1", {
          edital_id: "edital-1",
          data_falta: "2026-06-09",
        }),
      400,
      "Data da falta fora do periodo do vinculo",
    );
  });

  it("permite falta sem data final do vinculo", async () => {
    repository.vinculoExpireAt = null;

    const response = await service.createFalta("bolsista-1", {
      edital_id: "edital-1",
      data_falta: "2026-06-09",
    });

    assert.equal(response.ok, true);
  });

  it("lista e remove faltas", async () => {
    const list = await service.listFaltas("bolsista-1");
    const removed = await service.deleteFalta("bolsista-1", "falta-1");

    assert.equal(list.count, 1);
    assert.equal(removed.ok, true);
    assert.equal(repository.destroyFaltaCalled, true);
  });
});
