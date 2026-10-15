import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, rm, utimes, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { FtRelatorioArquivoWorkerService } from "../use-case/ft-relatorio-arquivo-worker.service.js";

const person = (id: string) => ({ bolsista: { id, nome: `Pessoa ${id}` }, faltas: [], vinculos: [] });

class FakeFiles {
  job: any = { id: "job-1", status: "aguardando", edital_id: "edital-1", mes: "2026-06", nome_arquivo: "lote.zip", tentativas: 0 };
  completed: any;
  error = "";
  async claimNext() { if (this.job.status !== "aguardando") return null; this.job.status = "processando"; return this.job; }
  async complete(_id: string, data: any) { this.completed = data; this.job.status = "concluido"; }
  async progress() {}
  async fail(_id: string, message: string) { this.error = message; this.job.status = "erro"; }
  async countPending() { return 0; }
  async findExpired(_cutoff?: Date): Promise<any[]> { return []; }
  async markDeleted(_id?: string, _now?: Date) {}
}

test("worker gera ZIP completo limitando a quatro PDFs simultaneos", async () => {
  const directory = await mkdtemp(join(tmpdir(), "ft-report-"));
  const files = new FakeFiles();
  let active = 0;
  let maximum = 0;
  const pdf = { execute: async () => {
    active += 1; maximum = Math.max(maximum, active);
    await new Promise((resolve) => setTimeout(resolve, 5));
    active -= 1;
    return { file: Buffer.from("%PDF teste") };
  } };
  const reports = { findBolsistasFaltasByEditalMes: async () => Array.from({ length: 9 }, (_, index) => person(String(index + 1))) };
  try {
    await new FtRelatorioArquivoWorkerService(files as any, reports as any, pdf, directory).run();
    assert.equal(files.completed.total_bolsistas, 9);
    assert.equal(files.completed.total_gerados, 9);
    assert.equal(files.completed.total_falhas, 0);
    assert.ok(maximum <= 4);
    assert.equal((await readFile(files.completed.caminho_arquivo)).subarray(0, 2).toString(), "PK");
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test("worker conclui ZIP parcial com falhas.csv", async () => {
  const directory = await mkdtemp(join(tmpdir(), "ft-report-"));
  const files = new FakeFiles();
  const reports = { findBolsistasFaltasByEditalMes: async () => [person("1"), person("2")] };
  const pdf = { execute: async (id: string) => {
    if (id === "2") throw new Error("PDF indisponivel");
    return { file: Buffer.from("%PDF teste") };
  } };
  try {
    await new FtRelatorioArquivoWorkerService(files as any, reports as any, pdf, directory).run();
    assert.equal(files.completed.total_gerados, 1);
    assert.equal(files.completed.total_falhas, 1);
    assert.match((await readFile(files.completed.caminho_arquivo)).toString("latin1"), /falhas\.csv/);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test("worker marca erro quando nenhum PDF e gerado", async () => {
  const directory = await mkdtemp(join(tmpdir(), "ft-report-"));
  const files = new FakeFiles();
  const reports = { findBolsistasFaltasByEditalMes: async () => [person("1")] };
  const pdf = { execute: async () => { throw new Error("falha"); } };
  try {
    await new FtRelatorioArquivoWorkerService(files as any, reports as any, pdf, directory).run();
    assert.equal(files.job.status, "erro");
    assert.match(files.error, /Nenhum PDF/);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test("worker usa folhas de presenca e nomeia cada PDF no ZIP", async () => {
  const directory = await mkdtemp(join(tmpdir(), "ft-report-"));
  const files = new FakeFiles();
  files.job.tipo = "folhas_presenca";
  const reports = { findBolsistasFaltasByEditalMes: async () => [person("2"), person("1")] };
  let espelhos = 0;
  let folhas = 0;
  const order: string[] = [];
  const espelhoPdf = { execute: async () => { espelhos += 1; return { file: Buffer.from("%PDF espelho") }; } };
  const folhaPdf = { execute: async (id: string) => { folhas += 1; order.push(id); return { file: Buffer.from("%PDF folha") }; } };
  try {
    await new FtRelatorioArquivoWorkerService(
      files as any,
      reports as any,
      espelhoPdf,
      directory,
      folhaPdf,
    ).run();
    const zip = (await readFile(files.completed.caminho_arquivo)).toString("latin1");
    assert.equal(espelhos, 0);
    assert.equal(folhas, 2);
    assert.deepEqual(order, ["1", "2"]);
    assert.match(zip, /folha-presenca-Pessoa-1-1\.pdf/);
    assert.match(zip, /folha-presenca-Pessoa-2-2\.pdf/);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test("worker remove lotes expirados e temporarios antigos", async () => {
  const directory = await mkdtemp(join(tmpdir(), "ft-report-"));
  const archivePath = join(directory, "expirado.zip");
  const temporaryPath = join(directory, "abandonado.tmp");
  await writeFile(archivePath, "zip");
  await writeFile(temporaryPath, "tmp");
  const oldDate = new Date("2026-05-01T00:00:00.000Z");
  await utimes(temporaryPath, oldDate, oldDate);
  const files = new FakeFiles();
  const deleted: string[] = [];
  files.findExpired = async () => [{ id: "job-old", caminho_arquivo: archivePath }] as any;
  files.markDeleted = async (id?: string) => { if (id) deleted.push(id); };
  const worker = new FtRelatorioArquivoWorkerService(
    files as any,
    {} as any,
    {} as any,
    directory,
  );

  try {
    assert.equal(await worker.purge(new Date("2026-10-15T00:00:00.000Z")), 1);
    assert.deepEqual(deleted, ["job-old"]);
    await assert.rejects(() => readFile(archivePath), /ENOENT/);
    await assert.rejects(() => readFile(temporaryPath), /ENOENT/);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
