import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import AppError from "../../../../core/appError.js";
import { pagador } from "../../../ft-bolsista/application/utils/pagador.js";
import { GerarRelatorioFtUseCase } from "../use-case/gerar-relatorio-ft.use-case.js";
import { FtRelatorioPeriodo } from "../dto/ft-relatorio.dto.js";
import { FtRelatorioRepository } from "../../domain/repositories/ft-relatorio.repository.js";
import {
  FtRelatorioBolsista,
  FtRelatorioVinculo,
} from "../../domain/entities/ft-relatorio.entity.js";
import { FtEdital } from "../../../ft-edital/domain/entity/FtEdital.js";
import { FtBolsista } from "../../../ft-bolsista/domain/entity/FtBolsista.js";
import { FtPaymentInfo } from "../../../ft-bolsista/domain/entity/FtPaymentInfo.js";
import { FtBolsistaFalta } from "../../../ft-bolsista/domain/entity/FtBolsistaFalta.js";

class FakeFtRelatorioRepository implements FtRelatorioRepository {
  public missingEdital = false;
  public faltas: FtBolsistaFalta[] = [];
  public vinculos: FtRelatorioVinculo[] = [];
  public lastPeriodo?: FtRelatorioPeriodo;

  private edital = new FtEdital(
    "Edital 1",
    new Date("2026-01-01"),
    new Date("2026-12-31"),
    10,
    "1000.00",
    "ativo",
    "edital-1",
  );

  async findEditalById() {
    return this.missingEdital ? null : this.edital;
  }

  async findBolsistasByEditalPeriodo(
    _id: string,
    periodo: FtRelatorioPeriodo,
  ) {
    this.lastPeriodo = periodo;

    return [
      new FtRelatorioBolsista(
        new FtBolsista(
          "Maria",
          "52998224725",
          "Sede",
          "00000000",
          "0",
          "Rua A",
          "Centro",
          "Cidade",
          "SP",
          null,
          "ativo",
          new FtPaymentInfo(
            "001",
            pagador[0].id,
            "1234",
            "0",
            "123456",
            "1",
          ),
          "bolsista-1",
        ),
        this.faltas.filter(
          (falta) =>
            falta.data_falta >= periodo.data_inicio &&
            falta.data_falta <= periodo.data_fim,
        ),
        this.vinculos,
      ),
    ];
  }

  async findBolsistasFaltasByEditalMes(
    id: string,
    periodo: FtRelatorioPeriodo,
  ) {
    return this.findBolsistasByEditalPeriodo(id, periodo);
  }
}

const falta = (dataFalta: string) =>
  new FtBolsistaFalta("bolsista-1", "edital-1", dataFalta);

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

describe("GerarRelatorioFtUseCase", () => {
  let repository: FakeFtRelatorioRepository;
  let useCase: GerarRelatorioFtUseCase;

  beforeEach(() => {
    repository = new FakeFtRelatorioRepository();
    useCase = new GerarRelatorioFtUseCase(repository);
  });

  it("gera relatorio csv agrupado por pagador", async () => {
    const response = await useCase.execute("edital-1", {
      data_inicio: "2026-06-01",
      data_fim: "2026-06-30",
    });

    assert.equal(response.fileName, "relatorio.csv");
    assert.match(response.csv, /Local de pagamento: Secretaria de Esporte e Lazer/);
    assert.match(response.csv, /Maria/);
  });

  it("desconta faltas proporcionais considerando somente dias uteis", async () => {
    repository.faltas = [
      falta("2026-06-01"),
      falta("2026-06-01"),
      falta("2026-06-06"),
      falta("2026-06-08"),
    ];

    const response = await useCase.execute("edital-1", {
      data_inicio: "2026-06-01",
      data_fim: "2026-06-30",
    });

    assert.match(response.csv, /dias_uteis;faltas;valor_bruto;desconto;valor_liquido/);
    assert.match(response.csv, /22;2;1000.00;90.91;909.09/);
    assert.match(response.csv, /Total do valor geral:;909.09/);
  });

  it("desconta dias fora da janela do vinculo mantendo valor bruto cheio", async () => {
    repository.faltas = [falta("2026-06-10"), falta("2026-06-22")];
    repository.vinculos = [
      new FtRelatorioVinculo(
        "concluido",
        "2026-06-08",
        "2027-06-08",
        null,
        "2026-06-19",
      ),
    ];

    const response = await useCase.execute("edital-1", {
      data_inicio: "2026-06-01",
      data_fim: "2026-06-30",
    });

    assert.match(response.csv, /dias_uteis;faltas;valor_bruto;desconto;valor_liquido/);
    assert.match(response.csv, /10;1;1000.00;590.91;409.09/);
    assert.match(response.csv, /Total do valor geral:;409.09/);
  });

  it("rejeita periodo parcial no relatorio", async () => {
    await assertAppError(
      () => useCase.execute("edital-1", { data_inicio: "2026-06-01" }),
      400,
      "data_inicio e data_fim",
    );
  });

  it("rejeita pagamento antes da publicacao do edital", async () => {
    await assertAppError(
      () =>
        useCase.execute("edital-1", {
          data_inicio: "2025-12-01",
          data_fim: "2025-12-31",
        }),
      400,
      "fora do periodo do edital",
    );
  });

  it("rejeita pagamento depois do vencimento do edital", async () => {
    await assertAppError(
      () =>
        useCase.execute("edital-1", {
          data_inicio: "2027-01-01",
          data_fim: "2027-01-31",
        }),
      400,
      "fora do periodo do edital",
    );
  });

  it("usa mes atual quando periodo nao vem na query", async () => {
    await useCase.execute("edital-1");

    const now = new Date();
    const firstDay = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1))
      .toISOString()
      .slice(0, 10);
    const lastDay = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0))
      .toISOString()
      .slice(0, 10);

    assert.deepEqual(repository.lastPeriodo, {
      data_inicio: firstDay,
      data_fim: lastDay,
    });
  });

  it("rejeita edital inexistente", async () => {
    repository.missingEdital = true;

    await assertAppError(
      () => useCase.execute("edital-1"),
      404,
      "Edital not found",
    );
  });
});
