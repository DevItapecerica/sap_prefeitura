import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import AppError from "../../../../core/appError.js";
import { pagador } from "../../../ft-bolsista/application/utils/pagador.js";
import { FtBolsista } from "../../../ft-bolsista/domain/entity/FtBolsista.js";
import { FtBolsistaFalta } from "../../../ft-bolsista/domain/entity/FtBolsistaFalta.js";
import { FtPaymentInfo } from "../../../ft-bolsista/domain/entity/FtPaymentInfo.js";
import { FtEdital } from "../../../ft-edital/domain/entity/FtEdital.js";
import { FtRelatorioPeriodo } from "../dto/ft-relatorio.dto.js";
import { GerarRelatorioFaltasFtUseCase } from "../use-case/gerar-relatorio-faltas-ft.use-case.js";
import { FtRelatorioBolsista } from "../../domain/entities/ft-relatorio.entity.js";
import { FtRelatorioRepository } from "../../domain/repositories/ft-relatorio.repository.js";
import { FtRelatorioPeriodoService } from "../../domain/services/ft-relatorio-periodo.service.js";

const FIXED_NOW = new Date("2026-06-15T12:00:00.000Z");

class FakeFtRelatorioRepository implements FtRelatorioRepository {
  public missingEdital = false;
  public faltasMaria: FtBolsistaFalta[] = [];
  public faltasJoao: FtBolsistaFalta[] = [];
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
        this.filtrarPeriodo(this.faltasMaria, periodo),
      ),
      this.relatorioBolsista(
        "bolsista-2",
        "Joao",
        "12345678900",
        this.filtrarPeriodo(this.faltasJoao, periodo),
      ),
    ];
  }

  private relatorioBolsista(
    id: string,
    nome: string,
    cpf: string,
    faltas: FtBolsistaFalta[],
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
    );
  }

  private filtrarPeriodo(
    faltas: FtBolsistaFalta[],
    periodo: FtRelatorioPeriodo,
  ) {
    return faltas.filter(
      (falta) =>
        falta.data_falta >= periodo.data_inicio &&
        falta.data_falta <= periodo.data_fim,
    );
  }
}

const falta = (dataFalta: string, observacao?: string | null) =>
  new FtBolsistaFalta("bolsista-1", "edital-1", dataFalta, observacao);

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

describe("GerarRelatorioFaltasFtUseCase", () => {
  let repository: FakeFtRelatorioRepository;
  let useCase: GerarRelatorioFaltasFtUseCase;

  beforeEach(() => {
    repository = new FakeFtRelatorioRepository();
    useCase = new GerarRelatorioFaltasFtUseCase(
      repository,
      new FtRelatorioPeriodoService(() => FIXED_NOW),
    );
  });

  it("gera csv mensal com resumo e detalhes de faltas", async () => {
    repository.faltasMaria = [
      falta("2026-06-01", "Ausencia justificada"),
      falta("2026-06-15", null),
      falta("2026-07-01", "Fora do mes"),
    ];

    const response = await useCase.execute("edital-1", { mes: "2026-06" });

    assert.equal(response.fileName, "relatorio-faltas-2026-06.csv");
    assert.match(response.csv, /Relatorio de faltas/);
    assert.match(response.csv, /id_bolsista;nome;cpf;status;total_faltas;datas_faltas;observacoes/);
    assert.match(response.csv, /bolsista-1;Maria;52998224725;ativo;2;01\/06\/2026, 15\/06\/2026;Ausencia justificada/);
    assert.match(response.csv, /bolsista-2;Joao;12345678900;ativo;0;;/);
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
      () => useCase.execute("edital-1", { mes: "2026-13" }),
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
      () => useCase.execute("edital-1", { mes: "2026-06" }),
      404,
      "Edital not found",
    );
  });
});
