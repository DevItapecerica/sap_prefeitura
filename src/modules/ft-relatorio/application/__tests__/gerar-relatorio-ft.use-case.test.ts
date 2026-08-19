import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import AppError from "../../../../core/appError.js";
import { pagador } from "../../../ft-bolsista/application/utils/pagador.js";
import { GerarRelatorioFtUseCase } from "../use-case/gerar-relatorio-ft.use-case.js";
import { FtRelatorioPeriodo } from "../dto/ft-relatorio.dto.js";
import { FtRelatorioRepository } from "../../domain/repositories/ft-relatorio.repository.js";
import { FtRelatorioBolsista } from "../../domain/entities/ft-relatorio.entity.js";

class FakeFtRelatorioRepository implements FtRelatorioRepository {
  data = {
    edital: {
      id: "edital-1",
      name: "Edital 1",
      data_publicacao: "2026-01-01",
      data_vencimento: "2026-12-31",
      dia_pagamento: 10,
      valor_bolsa: "1000.00",
      status: "ativo",
    },
    bolsista: {
      id: "bolsista-1",
      nome: "Maria",
      cpf: "52998224725",
      local: "Sede",
      status: "ativo",
      payment_info: {
        bco: "001",
        pagador_id: pagador[0].id,
        ag: "1234",
        dig_ag: "0",
        conta: "123456",
        dig_conta: "1",
      },
    },
    faltas: [] as Array<{ data_falta: string }>,
    vinculos: [] as Array<Record<string, string | null>>,
  };
  lastPeriodo?: FtRelatorioPeriodo;

  async findEditalById() {
    return this.data.edital;
  }

  async findBolsistasByEditalPeriodo(
    _id: string,
    periodo: FtRelatorioPeriodo,
  ) {
    this.lastPeriodo = periodo;
    return [
      {
        bolsista: this.data.bolsista,
        faltas: this.data.faltas.filter(
          ({ data_falta }) =>
            data_falta >= periodo.data_inicio &&
            data_falta <= periodo.data_fim,
        ),
        vinculos: this.data.vinculos,
      },
    ] as unknown as FtRelatorioBolsista[];
  }

  async findBolsistasFaltasByEditalMes(
    id: string,
    periodo: FtRelatorioPeriodo,
  ) {
    return this.findBolsistasByEditalPeriodo(id, periodo);
  }
}

describe("GerarRelatorioFtUseCase", () => {
  let repository: FakeFtRelatorioRepository;
  let useCase: GerarRelatorioFtUseCase;

  beforeEach(() => {
    repository = new FakeFtRelatorioRepository();
    useCase = new GerarRelatorioFtUseCase(repository);
  });

  it("gera CSV agrupado pelo pagador", async () => {
    const response = await useCase.execute("edital-1", {
      data_inicio: "2026-06-01",
      data_fim: "2026-06-30",
    });

    assert.equal(response.fileName, "relatorio.csv");
    assert.match(response.csv, /Local de pagamento: Secretaria de Esporte e Lazer/);
    assert.match(response.csv, /Maria/);
  });

  it("informa faltas sem descontá-las do pagamento", async () => {
    repository.data.faltas = [
      "2026-06-01",
      "2026-06-01",
      "2026-06-06",
      "2026-06-08",
    ].map((data_falta) => ({ data_falta }));

    const response = await useCase.execute("edital-1", {
      data_inicio: "2026-06-01",
      data_fim: "2026-06-30",
    });

    assert.match(response.csv, /22;2;1000.00;0.00;1000.00/);
    assert.match(response.csv, /Total do valor geral:;1000.00/);
  });

  it("desconta apenas dias fora da janela do vínculo", async () => {
    repository.data.faltas = ["2026-06-10", "2026-06-22"].map(
      (data_falta) => ({ data_falta }),
    );
    repository.data.vinculos = [
      {
        status: "concluido",
        data_vinculo: "2026-06-08",
        expire_at: "2027-06-08",
        concluded_at: "2026-06-19",
      },
    ];

    const response = await useCase.execute("edital-1", {
      data_inicio: "2026-06-01",
      data_fim: "2026-06-30",
    });

    const valorBruto = Number(repository.data.edital.valor_bolsa);
    const diasUteis = 22;
    const diasTrabalhados = 10;
    const descontoCalculado =
      (diasUteis - diasTrabalhados) *
      (valorBruto / diasUteis);
    const desconto = descontoCalculado.toFixed(2);
    const valorLiquido = (valorBruto - descontoCalculado).toFixed(2);

    assert.match(
      response.csv,
      new RegExp(`10;1;${valorBruto.toFixed(2)};${desconto};${valorLiquido}`),
    );
    assert.match(
      response.csv,
      new RegExp(`Total do valor geral:;${valorLiquido}`),
    );
  });

  it("rejeita período parcial", async () => {
    await assert.rejects(
      () => useCase.execute("edital-1", { data_inicio: "2026-06-01" }),
      (error) =>
        error instanceof AppError &&
        error.statusCode === 400 &&
        error.message.includes("data_inicio e data_fim"),
    );
  });

  it("rejeita período fora da vigência do edital", async () => {
    const periodosInvalidos = [
      { data_inicio: "2025-12-01", data_fim: "2025-12-31" },
      { data_inicio: "2027-01-01", data_fim: "2027-01-31" },
    ];

    for (const periodo of periodosInvalidos) {
      await assert.rejects(
        () => useCase.execute("edital-1", periodo),
        (error) =>
          error instanceof AppError &&
          error.statusCode === 400 &&
          error.message.includes("fora do periodo do edital"),
      );
    }
  });

  it("usa o mês atual quando o período não é informado", async () => {
    await useCase.execute("edital-1");
    const now = new Date();

    assert.deepEqual(repository.lastPeriodo, {
      data_inicio: new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1))
        .toISOString()
        .slice(0, 10),
      data_fim: new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0))
        .toISOString()
        .slice(0, 10),
    });
  });

  it("rejeita edital inexistente", async () => {
    repository.data.edital = null as never;

    await assert.rejects(
      () => useCase.execute("edital-1"),
      (error) =>
        error instanceof AppError &&
        error.statusCode === 404 &&
        error.message.includes("Edital not found"),
    );
  });
});
