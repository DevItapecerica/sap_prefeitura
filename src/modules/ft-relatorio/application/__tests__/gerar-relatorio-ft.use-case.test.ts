import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import AppError from "../../../../core/appError.js";
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
        ag: "1234",
        dig_ag: "0",
        conta: "123456",
        dig_conta: "1",
      },
    },
    faltas: [] as Array<{ data_falta: string }>,
    vinculos: [
      {
        status: "ativo",
        data_vinculo: "2026-01-01",
        expire_at: "2026-12-31",
        local: "Sede",
        pagador_id: "9d0f3aa1-1143-48d2-9cc2-45d38998fe36",
        pagador: {
          uuid: "9d0f3aa1-1143-48d2-9cc2-45d38998fe36",
          nome: "Secretaria de Esporte e Lazer",
          quantidade: 12,
        },
      },
    ] as Array<Record<string, any>>,
  };
  lastPeriodo?: FtRelatorioPeriodo;

  async findEditalById() {
    return this.data.edital;
  }

  async findBolsistasByEditalPeriodo(_id: string, periodo: FtRelatorioPeriodo) {
    this.lastPeriodo = periodo;
    return [
      {
        bolsista: this.data.bolsista,
        faltas: this.data.faltas.filter(
          ({ data_falta }) =>
            data_falta >= periodo.data_inicio && data_falta <= periodo.data_fim,
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

  it("gera CSV de nove campos sem cabeçalhos, grupos ou totais", async () => {
    const response = await useCase.calculate("edital-1", {
      data_inicio: "2026-06-01",
      data_fim: "2026-06-30",
    });

    assert.equal(response.fileName, "relatorio.csv");
    assert.equal(response.csv, "001;1234;0;123456;1;Maria;100000;10062026;52998224725");
  });

  it("preserva o pagamento integral quando há faltas informativas", async () => {
    repository.data.faltas = [
      "2026-06-01",
      "2026-06-01",
      "2026-06-06",
      "2026-06-08",
    ].map((data_falta) => ({ data_falta }));

    const response = await useCase.calculate("edital-1", {
      data_inicio: "2026-06-01",
      data_fim: "2026-06-30",
    });

    assert.equal(response.csv, "001;1234;0;123456;1;Maria;100000;10062026;52998224725");
  });

  it("desconta apenas dias fora da janela do vínculo", async () => {
    repository.data.faltas = ["2026-06-10", "2026-06-22"].map((data_falta) => ({
      data_falta,
    }));
    repository.data.vinculos = [
      {
        status: "concluido",
        data_vinculo: "2026-06-08",
        expire_at: "2027-06-08",
        concluded_at: "2026-06-19",
      },
    ];

    const response = await useCase.calculate("edital-1", {
      data_inicio: "2026-06-01",
      data_fim: "2026-06-30",
    });

    assert.equal(response.csv, "001;1234;0;123456;1;Maria;45455;10062026;52998224725");
  });

  it("rejeita período parcial", async () => {
    await assert.rejects(
      () => useCase.calculate("edital-1", { data_inicio: "2026-06-01" }),
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
        () => useCase.calculate("edital-1", periodo),
        (error) =>
          error instanceof AppError &&
          error.statusCode === 400 &&
          error.message.includes("fora do periodo do edital"),
      );
    }
  });

  it("usa o mês atual quando o período não é informado", async () => {
    await useCase.calculate("edital-1");
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
      () => useCase.calculate("edital-1"),
      (error) =>
        error instanceof AppError &&
        error.statusCode === 404 &&
        error.message.includes("Edital not found"),
    );
  });
});


describe('payment preview', () => {
  it('uses the same values, paginates rows without reducing totals and rejects stale exports', async () => {
    const repo = new FakeFtRelatorioRepository();
    const useCase = new GerarRelatorioFtUseCase(repo);
    const query = { data_inicio: '2026-06-01', data_fim: '2026-06-30' };
    const preview = await useCase.preview('edital-1', query);
    assert.equal(preview.count, 1);
    assert.deepEqual(preview.resumo, { participantes: 1, pagamentos: 1, valor_liquido: 1000, com_alertas: 0 });
    assert.equal(preview.rows[0]?.valor_liquido, 1000);
    assert.equal(preview.rows[0]?.data_pagamento, '10062026');
    assert.equal((await useCase.calculate('edital-1', { ...query, versao: preview.versao })).csv.split(';')[6], '100000');
    const second = await useCase.preview('edital-1', { ...query, page: 1, limit: 1 });
    assert.equal(second.rows.length, 0);
    assert.deepEqual(second.resumo, preview.resumo);
    assert.equal(second.versao, preview.versao);
    repo.data.bolsista.nome = 'Changed';
    await assert.rejects(useCase.calculate('edital-1', { ...query, versao: preview.versao }), (e: any) => e.statusCode === 409);
    assert.ok((await useCase.calculate('edital-1', query)).csv.includes('Changed'));
  });
  it('reports invalid CPF and bank values but still permits export', async () => {
    const repo = new FakeFtRelatorioRepository();
    repo.data.bolsista.cpf = '';
    repo.data.bolsista.payment_info.conta = '';
    const useCase = new GerarRelatorioFtUseCase(repo);
    const query = { data_inicio: '2026-06-01', data_fim: '2026-06-30' };
    const preview = await useCase.preview('edital-1', query);
    assert.equal(preview.resumo.com_alertas, 1);
    assert.deepEqual(preview.rows[0]?.alertas.map(issue => issue.codigo), ['CPF_INVALIDO', 'PAGAMENTO_CONTA']);
    assert.ok((await useCase.calculate('edital-1', { ...query, versao: preview.versao })).csv);
  });
});


describe('preview totals across payers', () => {
  it('counts a person once and retains separate proportional payments', async () => {
    const repo = new FakeFtRelatorioRepository();
    repo.data.vinculos = [
      { status: 'cancelado', data_vinculo: '2026-06-01', expire_at: '2026-12-31', canceled_at: '2026-06-15', pagador_id: 'payer-a', pagador: { uuid: 'payer-a', nome: 'A' } },
      { status: 'ativo', data_vinculo: '2026-06-16', expire_at: '2026-12-31', pagador_id: 'payer-b', pagador: { uuid: 'payer-b', nome: 'B' } },
    ];
    const useCase = new GerarRelatorioFtUseCase(repo);
    const query = { data_inicio: '2026-06-01', data_fim: '2026-06-30', limit: 1 };
    const preview = await useCase.preview('edital-1', query);
    assert.equal(preview.rows.length, 1);
    assert.equal(preview.count, 2);
    assert.equal(preview.resumo.participantes, 1);
    assert.equal(preview.resumo.pagamentos, 2);
    assert.equal(preview.resumo.valor_liquido, 1000);
    const csv = await useCase.calculate('edital-1', { ...query, versao: preview.versao });
    assert.equal(csv.csv.split('\n').length, 2);
    assert.equal(csv.csv.split('\n').reduce((sum, line) => sum + Number(line.split(';')[6]), 0), 100000);
  });
  it('returns empty preview and zero totals with export allowed', async () => {
    const repo = new FakeFtRelatorioRepository();
    repo.findBolsistasByEditalPeriodo = async () => [];
    const useCase = new GerarRelatorioFtUseCase(repo);
    const query = { data_inicio: '2026-06-01', data_fim: '2026-06-30' };
    const preview = await useCase.preview('edital-1', query);
    assert.equal(preview.count, 0);
    assert.deepEqual(preview.resumo, { participantes: 0, pagamentos: 0, valor_liquido: 0, com_alertas: 0 });
    assert.equal((await useCase.calculate('edital-1', { ...query, versao: preview.versao })).csv, '');
  });
});
