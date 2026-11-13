import assert from "node:assert/strict";
import test from "node:test";
import type { PayrollClosure } from "../../domain/repositories/payroll-unit-of-work.js";
import type { Holerite } from "../../domain/entities/holerite.js";
import type { FtRelatorioArquivoDto } from "../../domain/entities/ft-relatorio-arquivo.entity.js";
import { GerarHoleriteUseCase } from "../use-case/gerar-holerite.use-case.js";
import { HoleritesLoteService } from "../use-case/holerites-lote.service.js";
import { FtRelatorioArquivoService } from "../use-case/ft-relatorio-arquivo.service.js";
import { FtRelatorioArquivoWorkerService } from "../use-case/ft-relatorio-arquivo-worker.service.js";
import type { FtRelatorioArquivoRepository } from "../../domain/repositories/ft-relatorio-arquivo.repository.js";
import type { ReportArchiveStorage } from "../ports/report-archive.storage.js";
import { FtEdital } from "../../../ft-edital/domain/entity/FtEdital.js";

const personId = "3739d774-6de0-4f48-8dda-1b43414b70ef";
export function fixture(): PayrollClosure {
  const row = {
    bolsista_id: personId,
    nome: 'José; "Silva"',
    cpf: "01234567890",
    local: "Sede",
    vencimento: "2026-12-31",
    dias_uteis: 20,
    faltas: 1,
    valor_bruto: 1000,
    desconto: 99.99,
    valor_liquido: 900.01,
    pagador: "Secretaria histórica",
    data_pagamento: "30112026",
    alertas: [],
    bco: "001",
    conta: "SEGREDO_BANCARIO",
  };
  return {
    id: "folha",
    edital_id: "edital",
    mes: "2026-11",
    versao: "a".repeat(64),
    fechado_por: "1",
    fechado_em: new Date(),
    snapshot: {
      edital_nome: "Edital histórico",
      rows: [row],
      count: 1,
      resumo: {
        participantes: 1,
        pagamentos: 1,
        valor_liquido: 900.01,
        com_alertas: 0,
      },
      versao: "a".repeat(64),
      periodo: { data_inicio: "2026-11-01", data_fim: "2026-11-30" },
      data_pagamento: "30112026",
      fileName: "pagamento.csv",
      csv: "CSV preservado",
      type: "text/csv",
      returnedCount: 1,
    },
  };
}
const pdf = {
  file: Buffer.from("%PDF-test"),
  contentType: "application/pdf",
  contentDisposition: "attachment",
};
const jobFixture = (): FtRelatorioArquivoDto => ({
  id: "job",
  nome_arquivo: "holerites.zip",
  tipo: "holerites",
  status: "aguardando",
  edital_id: "edital",
  mes: "2026-11",
  solicitado_por: 1,
  total_bolsistas: 0,
  total_gerados: 0,
  total_falhas: 0,
  tentativas: 0,
});
test("holerite uses only the closed snapshot, masks CPF, preserves legacy values and all payer lines", async () => {
  const closed = fixture();
  closed.snapshot.rows.push({
    ...closed.snapshot.rows[0]!,
    pagador: "Outro pagador",
    valor_bruto: 0,
    desconto: 0,
    valor_liquido: 0,
  });
  const before = structuredClone(closed);
  let payload: Holerite | undefined;
  const useCase = new GerarHoleriteUseCase(
    { closure: async () => closed },
    {
      execute: async (data) => {
        payload = data;
        return pdf;
      },
    },
  );
  assert.equal(await useCase.execute(personId, "edital", "2026-11"), pdf);
  assert.ok(payload);
  assert.equal(payload.pessoa.cpf, "***.345.678-**");
  assert.equal(payload.edital, "Edital histórico");
  assert.equal(payload.demonstrativos.length, 2);
  assert.equal(payload.demonstrativos[0]!.liquido_centavos, 90001);
  assert.equal(payload.demonstrativos[0]!.descontos[0]!.centavos, 9999);
  assert.match(
    payload.demonstrativos[0]!.descontos[0]!.descricao,
    /detalhamento não registrado/,
  );
  assert.ok(!JSON.stringify(payload).includes("SEGREDO_BANCARIO"));
  assert.deepEqual(closed, before);
});
test("holerite preserves itemized deductions and supports legacy edital identity without current financial queries", async () => {
  const closed = fixture();
  delete closed.snapshot.edital_nome;
  closed.snapshot.rows[0]!.descontos_detalhados = [
    { descricao: "Faltas", referencia: "1 dia", centavos: 9999 },
  ];
  const useCase = new GerarHoleriteUseCase(
    { closure: async () => closed },
    {
      execute: async (data) => {
        assert.equal(data.edital, "edital");
        assert.deepEqual(
          data.demonstrativos[0]!.descontos,
          closed.snapshot.rows[0]!.descontos_detalhados,
        );
        return pdf;
      },
    },
  );
  await useCase.execute(personId, "edital", "2026-11");
});
test("holerite rejects open, absent person and malformed month before rendering", async () => {
  let calls = 0;
  const renderer = {
    execute: async () => {
      calls++;
      return pdf;
    },
  };
  const open = new GerarHoleriteUseCase(
    { closure: async () => null },
    renderer,
  );
  await assert.rejects(
    open.execute(personId, "edital", "2026-11"),
    /Feche a folha/,
  );
  await assert.rejects(open.execute(personId, "edital", "2026-13"), /mês/);
  const closed = new GerarHoleriteUseCase(
    { closure: async () => fixture() },
    renderer,
  );
  await assert.rejects(
    closed.execute("outra-pessoa", "edital", "2026-11"),
    /não consta/,
  );
  assert.equal(calls, 0);
});

for (const failures of [0, 1, 2])
  test(`batch preserves all snapshot people and emits safe failure CSV (${failures} failures)`, async () => {
    const closed = fixture();
    closed.snapshot.rows.push({
      ...closed.snapshot.rows[0]!,
      bolsista_id: "another-id",
      nome: "José;\nSilva",
    });
    closed.snapshot.rows.push({ ...closed.snapshot.rows[0]! });
    const entries = new Map<string, Buffer | string>();
    let renders = 0;
    let finished: Partial<FtRelatorioArquivoDto> | undefined;
    let aborted = false;
    const service = new HoleritesLoteService(
      {
        folha: async () => closed,
        render: async () => {
          renders++;
          if (renders <= failures)
            throw new Error("SQL password SEGREDO_BANCARIO 01234567890");
          return pdf;
        },
      },
      {
        progress: async () => {},
        complete: async (_id, result) => {
          finished = result;
        },
      },
      {
        create: async () => ({
          append: (content, name) => {
            entries.set(name, content);
          },
          finish: async () => ({ path: "file.zip", size: 10 }),
          abort: async () => {
            aborted = true;
          },
        }),
        open: async () => {
          throw new Error("unused");
        },
        remove: async () => {},
        purgeTemporary: async () => {},
      },
    );
    await service.process(jobFixture());
    assert.equal(renders, 2);
    assert.equal(finished?.total_bolsistas, 2);
    assert.equal(finished?.total_gerados, 2 - failures);
    assert.equal(finished?.total_falhas, failures);
    assert.equal(aborted, false);
    if (failures) {
      const csv = String(entries.get("falhas.csv"));
      assert.match(csv, /^edital_id;competencia;bolsista_id;nome;motivo/);
      assert.match(csv, /José; ""Silva""/);
      assert.ok(!csv.includes("SEGREDO_BANCARIO"));
      assert.ok(!csv.includes("01234567890"));
    } else assert.equal(entries.has("falhas.csv"), false);
  });
test("batch aborts archive on storage failure and refuses empty closed payroll", async () => {
  let aborted = false;
  const closed = fixture();
  const service = new HoleritesLoteService(
    { folha: async () => closed, render: async () => pdf },
    { progress: async () => {}, complete: async () => {} },
    {
      create: async () => ({
        append: () => {},
        finish: async () => {
          throw new Error("Disk full");
        },
        abort: async () => {
          aborted = true;
        },
      }),
      open: async () => {
        throw new Error("unused");
      },
      remove: async () => {},
      purgeTemporary: async () => {},
    },
  );
  const job = jobFixture();
  await assert.rejects(service.process(job), /Disk full/);
  assert.equal(aborted, true);
  closed.snapshot.rows = [];
  await assert.rejects(service.process(job), /não contém/);
});

test("batch request refuses an open or empty snapshot before queueing and list filters precede pagination", async () => {
  let closed: PayrollClosure | null = null;
  let created = 0,
    include: boolean | undefined;
  const job = jobFixture();
  const files: FtRelatorioArquivoRepository = {
    create: async (input) => {
      created++;
      return { ...job, ...input };
    },
    list: async (_page, _limit, _edital, includeHolerites) => {
      include = includeHolerites;
      return { rows: [job], count: 1 };
    },
    findById: async (id) => (id === "job" ? job : null),
    claimNext: async () => job,
    complete: async () => {},
    progress: async () => {},
    fail: async () => {},
    retry: async () => true,
    reserveDownload: async () => true,
    releaseDownload: async () => {},
    markDeleted: async () => {},
    findExpired: async () => [],
    countPending: async () => 1,
  };
  const storage: ReportArchiveStorage = {
    create: async () => {
      throw new Error("unused");
    },
    open: async () => {
      throw new Error("unused");
    },
    remove: async () => {},
    purgeTemporary: async () => {},
  };
  const source = new GerarHoleriteUseCase(
    { closure: async () => closed },
    { execute: async () => pdf },
  );
  const service = new FtRelatorioArquivoService(
    files,
    {
      findEditalById: async () =>
        new FtEdital("Histórico", "2026-01-01", "2026-12-31", 30, 1000),
    },
    storage,
    { publish: async () => {} },
    { holerites: source },
  );
  await assert.rejects(
    service.request("edital", "2026-11", 1, "holerites"),
    /Feche a folha/,
  );
  assert.equal(created, 0);
  closed = fixture();
  closed.snapshot.rows = [];
  await assert.rejects(
    service.request("edital", "2026-11", 1, "holerites"),
    /não contém/,
  );
  closed = fixture();
  assert.equal(
    (await service.request("edital", "2026-11", 1, "holerites")).tipo,
    "holerites",
  );
  assert.equal(created, 1);
  await service.list(0, 20, "edital");
  assert.equal(include, false);
  await service.list(0, 20, "edital", true);
  assert.equal(include, true);
  assert.equal(await service.isHolerite("job"), true);
  await assert.rejects(service.isHolerite("missing"), /not found/);
  let processed = 0;
  const worker = new FtRelatorioArquivoWorkerService(
    files,
    {
      findBolsistasFaltasByEditalMes: async () => {
        throw new Error("Must not read current participants");
      },
    },
    {
      execute: async () => {
        throw new Error("Must not generate time sheets");
      },
    },
    storage,
    undefined,
    undefined,
    {
      process: async () => {
        processed++;
      },
    },
  );
  await worker.run();
  assert.equal(processed, 1);
});
