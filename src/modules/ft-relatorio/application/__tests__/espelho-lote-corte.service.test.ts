import assert from "node:assert/strict";
import test from "node:test";
import { FtRelatorioArquivoWorkerService } from "../use-case/ft-relatorio-arquivo-worker.service.js";
import { FtRelatorioBolsista } from "../../domain/entities/ft-relatorio.entity.js";
import { FtBolsista } from "../../../ft-bolsista/domain/entity/FtBolsista.js";
import type { FtRelatorioArquivoDto } from "../../domain/entities/ft-relatorio-arquivo.entity.js";
import type { ReportArchiveStorage } from "../ports/report-archive.storage.js";
import type { EspelhoPontoEmissionContext } from "../../../ft-bolsista/application/dto/espelho-ponto-emission.js";

type FilesPort = ConstructorParameters<
  typeof FtRelatorioArquivoWorkerService
>[0];
class Files implements FilesPort {
  job: FtRelatorioArquivoDto = {
    id: "job",
    nome_arquivo: "reports.zip",
    tipo: "espelhos_ponto",
    status: "aguardando",
    edital_id: "edital",
    mes: "2026-11",
    solicitado_por: 1,
    total_bolsistas: 0,
    total_gerados: 0,
    total_falhas: 0,
    tentativas: 0,
  };
  message = "";
  async claimNext() {
    if (this.job.status !== "aguardando") return null;
    this.job.status = "processando";
    return this.job;
  }
  async countPending() {
    return 0;
  }
  async progress() {}
  async complete(_id: string, data: Partial<FtRelatorioArquivoDto>) {
    Object.assign(this.job, data, { status: "concluido" });
  }
  async fail(_id: string, message: string) {
    this.message = message;
    this.job.status = "erro";
  }
  async findExpired() {
    return [];
  }
  async markDeleted() {}
}
function fixture() {
  const files = new Files(),
    periods: Array<{ data_inicio: string; data_fim: string }> = [];
  let aborted = 0;
  const storage: ReportArchiveStorage = {
    create: async () => ({
      append: () => {},
      finish: async () => ({ path: "reports.zip", size: 10 }),
      abort: async () => {
        aborted++;
      },
    }),
    open: async () => {
      throw new Error("not used");
    },
    remove: async () => {},
    purgeTemporary: async () => {},
  };
  const reports = {
    findBolsistasFaltasByEditalMes: async (
      _id: string,
      period: { data_inicio: string; data_fim: string },
    ) => {
      periods.push(period);
      return Array.from(
        { length: 9 },
        (_, index) =>
          new FtRelatorioBolsista(
            new FtBolsista(
              `citizen-${index}`,
              { nome: `Pessoa ${index}` },
              undefined,
              `person-${index}`,
            ),
          ),
      );
    },
  };
  return { files, reports, periods, storage, aborted: () => aborted };
}
test("batch selection and all PDFs share the start reference even across midnight and concurrent chunks", async () => {
  const data = fixture(),
    start = new Date("2026-11-14T02:59:59.999Z");
  const references: string[] = [];
  const pdf = {
    execute: async (
      _id: string,
      _edital: string,
      _mes: string,
      requestId?: string,
      context?: EspelhoPontoEmissionContext,
    ) => {
      assert.equal(requestId, undefined);
      assert.ok(context);
      references.push(context.referenceDate.toISOString());
      start.setTime(new Date("2026-11-14T03:01:00Z").getTime());
      return { file: Buffer.from("%PDF") };
    },
  };
  await new FtRelatorioArquivoWorkerService(
    data.files,
    data.reports,
    pdf,
    data.storage,
  ).run(start);
  assert.deepEqual(data.periods, [
    { data_inicio: "2026-11-01", data_fim: "2026-11-13" },
  ]);
  assert.equal(references.length, 9);
  assert.ok(
    references.every((reference) => reference === "2026-11-14T02:59:59.999Z"),
  );
  assert.equal(data.files.job.total_gerados, 9);
});
test("retry takes a new reference without reusing the failed attempt cutoff", async () => {
  const data = fixture(),
    references: string[] = [];
  let fail = true;
  const pdf = {
    execute: async (
      _id: string,
      _edital: string,
      _mes: string,
      _request?: string,
      context?: EspelhoPontoEmissionContext,
    ) => {
      assert.ok(context);
      references.push(context.referenceDate.toISOString());
      if (fail) throw new Error("PDF unavailable");
      return { file: Buffer.from("%PDF") };
    },
  };
  const worker = new FtRelatorioArquivoWorkerService(
    data.files,
    data.reports,
    pdf,
    data.storage,
  );
  await worker.run(new Date("2026-11-13T12:00:00Z"));
  assert.equal(data.files.job.status, "erro");
  assert.equal(data.aborted(), 1);
  fail = false;
  data.files.job.status = "aguardando";
  await worker.run(new Date("2026-11-14T12:00:00Z"));
  assert.deepEqual(
    data.periods.map((period) => period.data_fim),
    ["2026-11-13", "2026-11-14"],
  );
  assert.ok(
    references
      .slice(9)
      .every((reference) => reference === "2026-11-14T12:00:00.000Z"),
  );
  assert.equal(data.files.job.status, "concluido");
});
test("attendance sheets retain the full month and receive no timesheet cutoff context", async () => {
  const data = fixture();
  data.files.job.tipo = "folhas_presenca";
  const pdf = {
    execute: async (...args: unknown[]) => {
      assert.equal(args.length, 3);
      return { file: Buffer.from("%PDF") };
    },
  };
  await new FtRelatorioArquivoWorkerService(
    data.files,
    data.reports,
    pdf,
    data.storage,
    pdf,
  ).run(new Date("2026-11-13T12:00:00Z"));
  assert.equal(data.periods[0].data_fim, "2026-11-30");
  assert.equal(data.files.job.total_gerados, 9);
});
test("future queued timesheets fail before querying people or generating PDFs", async () => {
  const data = fixture();
  data.files.job.mes = "2026-12";
  const pdf = {
    execute: async () => {
      throw new Error("must not render");
    },
  };
  await new FtRelatorioArquivoWorkerService(
    data.files,
    data.reports,
    pdf,
    data.storage,
  ).run(new Date("2026-11-13T12:00:00Z"));
  assert.equal(data.periods.length, 0);
  assert.equal(data.files.job.status, "erro");
  assert.match(data.files.message, /mês futuro/);
});
