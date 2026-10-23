import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import AppError from "../../../../core/appError.js";
import { FtEditalService } from "../use-case/ft-edital.service.js";
import FtEditalVincularBolsistaUseCase from "../use-case/ft-edital.vincularBolsista.usecase.js";
import FtEditalAtualizarVinculoUseCase from "../use-case/ft-edital.atualizarVinculo.usecase.js";
import { FtEditalRepository } from "../../domain/repositories/ft-edital.repository.js";
import { FtEditalDto } from "../dto/ft-edital.dto.js";
import { FtVinculoPolicyService } from "../../domain/services/ft-vinculo-policy.service.js";
const PAGADOR_ID = "9d0f3aa1-1143-48d2-9cc2-45d38998fe36";
const TURNO_ID = "6a9a904b-13d8-448d-b939-e8542afec428";

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
  public updateActiveVinculoCalled = false;
  public missingActiveVinculo = false;
  public updatedVinculoPayload: any = null;
  public vinculosPayload: Array<{
    bolsista: any;
    local: string;
    pagador_id: string;
    turno_id: string;
    data_vinculo?: string | Date;
    expire_at?: string | Date;
  }> = [];
  public vinculoStatuses: string[] = [];

  private edital = new FakeModel({
    id: "edital-1",
    name: "Edital 1",
    idade_maxima: 65, permitir_retorno: true, permitir_participacao_anterior: true,
    data_publicacao: new Date("2026-01-01"),
    data_vencimento: new Date("2026-12-31"),
    dia_pagamento: 10,
    valor_bolsa: "1000.00",
    status: "ativo",
  });

  private paymentInfo = new FakeModel({
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
    municipe: { nascimento: "1990-05-10" },
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
    this.bolsista.set("payment_info", this.paymentInfo.toJSON());
    return this.bolsista;
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

  async findActiveVinculoByBolsista() {
    return this.bolsistaStatus === "ativo"
      ? new FakeModel({ id: "vinculo-ativo", status: "ativo" })
      : null;
  }

  async vincularBolsistas(
    _edital: any,
    bolsistas: Array<{
      bolsista: any;
      local: string;
      pagador_id: string;
      turno_id: string;
      data_vinculo?: string | Date;
      expire_at?: string | Date;
    }>,
  ) {
    this.vincularBolsistasCalled = true;
    if (this.invalidPagador) throw new AppError("Pagador inexistente ou excluido", 400, "FT_MS");
    this.vinculosPayload = bolsistas;
    return bolsistas.map((_, index) => new FakeModel({ id: `vinculo-created-${index}` }));
  }

  async updateActiveVinculo(_editalId: string, _bolsistaId: string, data: any) {
    this.updateActiveVinculoCalled = true;
    this.updatedVinculoPayload = data;
    if (this.missingActiveVinculo) return null;
    return {
      before: { id: "v1", local: "Antigo", pagador_id: PAGADOR_ID, status: "ativo" },
      after: { id: "v1", ...data, status: "ativo" },
    };
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
  let vincularBolsista: FtEditalVincularBolsistaUseCase;
  let atualizarVinculo: FtEditalAtualizarVinculoUseCase;

  beforeEach(() => {
    repository = new FakeFtEditalRepository();
    service = new FtEditalService(repository);
    vincularBolsista = new FtEditalVincularBolsistaUseCase(repository);
    atualizarVinculo = new FtEditalAtualizarVinculoUseCase(repository);
  });

  it("cria edital valido", async () => {
    const response = await service.createEdital(validEditalPayload());

    assert.equal(response.get("name"), "Edital 1");
  });

  it("atualiza local e pagador do vinculo ativo", async () => {
    const result = await atualizarVinculo.execute("edital-1", "bolsista-1", {
      local: "  Nova Secretaria  ",
      pagador_id: PAGADOR_ID,
      turno_id: TURNO_ID,
    });
    assert.equal(repository.updateActiveVinculoCalled, true);
    assert.deepEqual(repository.updatedVinculoPayload, { local: "Nova Secretaria", pagador_id: PAGADOR_ID, turno_id: TURNO_ID });
    assert.equal(result.after.local, "Nova Secretaria");
  });

  it("rejeita atualizacao sem local ou sem vinculo ativo", async () => {
    await assertAppError(
      () => atualizarVinculo.execute("edital-1", "bolsista-1", { local: " ", pagador_id: PAGADOR_ID, turno_id: TURNO_ID }),
      400,
      "obrigatorios",
    );
    repository.missingActiveVinculo = true;
    await assertAppError(
      () => atualizarVinculo.execute("edital-1", "bolsista-1", { local: "Secretaria", pagador_id: PAGADOR_ID, turno_id: TURNO_ID }),
      404,
      "Vinculo ativo",
    );
  });

  it("rejeita atualizacao de vinculo em edital inativo", async () => {
    repository.editalInativo = true;
    await assertAppError(
      () => atualizarVinculo.execute("edital-1", "bolsista-1", { local: "Secretaria", pagador_id: PAGADOR_ID, turno_id: TURNO_ID }),
      400,
      "Edital inativo",
    );
    assert.equal(repository.updateActiveVinculoCalled, false);
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
    await vincularBolsista.execute("edital-1", [{ bolsista_id: "bolsista-1", local: "Secretaria", pagador_id: PAGADOR_ID, turno_id: TURNO_ID }], "2026-06-09");

    assert.equal(repository.vincularBolsistasCalled, true);
    assert.equal(
      new Date(repository.vinculosPayload[0].expire_at!).toISOString(),
      "2026-12-09T00:00:00.000Z",
    );
  });

  it("mantem pagadores diferentes no mesmo lote", async () => {
    await vincularBolsista.execute("edital-1", [
      { bolsista_id: "bolsista-1", local: "Secretaria", pagador_id: PAGADOR_ID, turno_id: TURNO_ID },
      { bolsista_id: "bolsista-2", local: "CRAS", pagador_id: "e3f162d8-6187-456c-b85d-fc9243dcbce8", turno_id: TURNO_ID },
    ], "2026-06-09");
    assert.deepEqual(repository.vinculosPayload.map((item) => item.pagador_id), [
      PAGADOR_ID,
      "e3f162d8-6187-456c-b85d-fc9243dcbce8",
    ]);
  });

  it("exige pagador em cada item do lote", async () => {
    await assertAppError(
      () => vincularBolsista.execute("edital-1", [{ bolsista_id: "bolsista-1", local: "Secretaria", pagador_id: "", turno_id: TURNO_ID }], "2026-06-09"),
      400,
      "pagador",
    );
  });

  it("rejeita novo vinculo quando o par ainda esta ativo", async () => {
    repository.vinculoStatuses = ["ativo"];

    await assertAppError(
      () => vincularBolsista.execute("edital-1", [{ bolsista_id: "bolsista-1", local: "Secretaria", pagador_id: PAGADOR_ID, turno_id: TURNO_ID }], "2026-06-09"),
      409,
      "Pessoa ja convocada ou ativa",
    );

    assert.equal(repository.vincularBolsistasCalled, false);
  });

  it('permite historico sem ativacao anterior', () => {
    const policy = new FtVinculoPolicyService();
    for (const status of ['inativo', 'cancelado', 'concluido', 'expirado']) assert.doesNotThrow(() => policy.ensureCanCreateVinculo([{ status }], '2026-06-30', { id: 'e1' }));
  });
  it('bloqueia historico ativo conforme politica central', () => {
    assert.throws(() => new FtVinculoPolicyService().ensureCanCreateVinculo([{ status: 'ativo' }], '2026-06-30', { id: 'e1' }), /ja convocada ou ativa/);
  });
  it('considera historico excluido logicamente ao proibir participacao anterior', () => {
    assert.throws(() => new FtVinculoPolicyService().ensureCanCreateVinculo([{ edital_id: 'e2', status: 'cancelado', ativado_em: '2026-01-01', deletedAt: '2026-02-01' }], '2026-06-30', { id: 'e1', permitir_participacao_anterior: false }), /anteriormente/);
  });
  it('bloqueia retorno no mesmo mes do encerramento', () => {
    for (const end of [{ canceled_at: '2026-06-15' }, { concluded_at: '2026-06-15' }, { expired_at: '2026-06-15' }, { expire_at: '2026-06-15' }]) assert.throws(() => new FtVinculoPolicyService().ensureCanCreateVinculo([{ edital_id: 'e1', status: 'cancelado', ativado_em: '2026-01-01', ...end }], '2026-06-30', { id: 'e1', permitir_retorno: true }), /mes seguinte/);
  });
  it('permite retorno no primeiro dia do mes seguinte', () => {
    assert.doesNotThrow(() => new FtVinculoPolicyService().ensureCanCreateVinculo([{ edital_id: 'e1', status: 'cancelado', ativado_em: '2026-01-01', canceled_at: '2026-06-30' }], '2026-07-01', { id: 'e1', permitir_retorno: true }));
  });
  it('permite nova tentativa no mesmo mes quando nao houve ativacao', () => {
    assert.doesNotThrow(() => new FtVinculoPolicyService().ensureCanCreateVinculo([{ edital_id: 'e1', status: 'cancelado', canceled_at: '2026-06-15' }], '2026-06-20', { id: 'e1', permitir_retorno: false }));
  });

  it("rejeita edital inativo ao vincular", async () => {
    repository.editalInativo = true;

    await assertAppError(
      () => vincularBolsista.execute("edital-1", [{ bolsista_id: "bolsista-1", local: "Secretaria", pagador_id: PAGADOR_ID, turno_id: TURNO_ID }], "2026-06-09"),
      400,
      "Edital inativo",
    );
  });

  it("rejeita bolsista inexistente ao vincular", async () => {
    repository.missingBolsista = true;

    await assertAppError(
      () => vincularBolsista.execute("edital-1", [{ bolsista_id: "bolsista-1", local: "Secretaria", pagador_id: PAGADOR_ID, turno_id: TURNO_ID }], "2026-06-09"),
      404,
      "Bolsista not found",
    );
  });

  it("rejeita bolsista que ja possui vinculo ativo", async () => {
    repository.bolsistaStatus = "ativo";
    await assertAppError(
      () => vincularBolsista.execute("edital-1", [{ bolsista_id: "bolsista-1", local: "Secretaria", pagador_id: PAGADOR_ID, turno_id: TURNO_ID }], "2026-06-09"),
      403,
      "Bolsista ja ativo em outro edital",
    );
  });

  it("rejeita pagador invalido ao vincular", async () => {
    repository.invalidPagador = true;

    await assertAppError(
      () => vincularBolsista.execute("edital-1", [{ bolsista_id: "bolsista-1", local: "Secretaria", pagador_id: PAGADOR_ID, turno_id: TURNO_ID }], "2026-06-09"),
      400,
      "Pagador inexistente",
    );
  });

});
