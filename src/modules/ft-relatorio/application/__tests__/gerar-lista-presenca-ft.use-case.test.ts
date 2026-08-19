import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import AppError from "../../../../core/appError.js";
import { pagador } from "../../../ft-bolsista/application/utils/pagador.js";
import { FtBolsista } from "../../../ft-bolsista/domain/entity/FtBolsista.js";
import { FtBolsistaFalta } from "../../../ft-bolsista/domain/entity/FtBolsistaFalta.js";
import { FtPaymentInfo } from "../../../ft-bolsista/domain/entity/FtPaymentInfo.js";
import { FtEdital } from "../../../ft-edital/domain/entity/FtEdital.js";
import { FtRelatorioPeriodo } from "../dto/ft-relatorio.dto.js";
import { GerarListaPresencaFtUseCase } from "../use-case/gerar-lista-presenca-ft.use-case.js";
import {
  FtRelatorioBolsista,
  FtRelatorioVinculo,
} from "../../domain/entities/ft-relatorio.entity.js";
import { FtRelatorioRepository } from "../../domain/repositories/ft-relatorio.repository.js";
import { FtRelatorioPeriodoService } from "../../domain/services/ft-relatorio-periodo.service.js";

const FIXED_NOW = new Date("2026-06-15T12:00:00.000Z");

class FakeFtRelatorioRepository implements FtRelatorioRepository {
  public missingEdital = false;
  public faltasMaria: FtBolsistaFalta[] = [];
  public vinculosMaria: FtRelatorioVinculo[] = [];
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

  async findBolsistasByEditalPeriodo() {
    return [];
  }

  async findBolsistasFaltasByEditalMes(
    _id: string,
    periodo: FtRelatorioPeriodo,
  ) {
    this.lastPeriodo = periodo;

    return [
      this.relatorioBolsista(
        "bolsista-1",
        "Maria",
        "52998224725",
        this.faltasMaria.filter(
          (falta) =>
            falta.data_falta >= periodo.data_inicio &&
            falta.data_falta <= periodo.data_fim,
        ),
        this.vinculosMaria,
      ),
      this.relatorioBolsista("bolsista-2", "Joao", "12345678900", []),
    ];
  }

  private relatorioBolsista(
    id: string,
    nome: string,
    cpf: string,
    faltas: FtBolsistaFalta[],
    vinculos: FtRelatorioVinculo[] = [],
  ) {
    return new FtRelatorioBolsista(
      new FtBolsista(
        nome,
        cpf,
        "Sede",
        "00000000",
        "0",
        "Rua A",
        "Centro",
        "Cidade",
        "SP",
        null,
        "ativo",
        new FtPaymentInfo("001", pagador[0].id, "1234", "0", "123456", "1"),
        id,
      ),
      faltas,
      vinculos,
    );
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

describe("GerarListaPresencaFtUseCase", () => {
  let repository: FakeFtRelatorioRepository;
  let useCase: GerarListaPresencaFtUseCase;

  beforeEach(() => {
    repository = new FakeFtRelatorioRepository();
    useCase = new GerarListaPresencaFtUseCase(
      repository,
      new FtRelatorioPeriodoService(() => FIXED_NOW),
    );
  });

  it("gera csv mensal com fim de semana vazio, F nas faltas, P nas presencas e totais", async () => {
    repository.faltasMaria = [
      falta("2026-02-02"),
      falta("2026-02-15"),
      falta("2026-03-01"),
    ];

    const response = await useCase.execute("edital-1", { mes: "2026-02" });

    assert.equal(response.fileName, "lista-presenca-2026-02.csv");
    assert.match(response.csv, /Lista de presenca/);
    assert.match(response.csv, /id_bolsista;nome;cpf;status;01\/02;02\/02;03\/02/);
    assert.match(response.csv, /total_presencas;total_faltas/);
    assert.match(response.csv, /27\/02;28\/02/);
    assert.match(response.csv, /bolsista-1;Maria;52998224725;ativo;;F;P/);
    assert.match(response.csv, /P;;;P/);
    assert.match(response.csv, /P;;19;1/);
    assert.match(response.csv, /bolsista-2;Joao;12345678900;ativo;;P;P/);
    assert.match(response.csv, /P;;20;0/);
  });

  it("deixa vazio fora da janela operacional dos vinculos", async () => {
    repository.faltasMaria = [falta("2026-02-04"), falta("2026-02-12")];
    repository.vinculosMaria = [
      new FtRelatorioVinculo(
        "cancelado",
        "2026-02-03",
        "2027-02-03",
        "2026-02-05",
      ),
      new FtRelatorioVinculo(
        "expirado",
        "2026-02-10",
        "2026-02-12",
        null,
        null,
        "2026-02-12",
      ),
    ];

    const response = await useCase.execute("edital-1", { mes: "2026-02" });
    const mariaRow = response.csv
      .split("\n")
      .find((row) => row.startsWith("bolsista-1;Maria"));

    assert.ok(mariaRow);
    assert.match(
      mariaRow,
      /bolsista-1;Maria;52998224725;ativo;;;P;F;P;;;;;P;P;F/,
    );
    assert.match(mariaRow, /;4;2$/);
  });

  it("usa mes atual quando query nao informa mes", async () => {
    await useCase.execute("edital-1");

    assert.deepEqual(repository.lastPeriodo, {
      data_inicio: "2026-06-01",
      data_fim: "2026-06-30",
    });
  });

  it("rejeita mes invalido", async () => {
    await assertAppError(
      () => useCase.execute("edital-1", { mes: "2026-00" }),
      400,
      "YYYY-MM",
    );
  });

  it("rejeita mes futuro", async () => {
    await assertAppError(
      () => useCase.execute("edital-1", { mes: "2026-07" }),
      400,
      "mes futuro",
    );
  });

  it("rejeita edital inexistente", async () => {
    repository.missingEdital = true;

    await assertAppError(
      () => useCase.execute("edital-1", { mes: "2026-02" }),
      404,
      "Edital not found",
    );
  });
});
