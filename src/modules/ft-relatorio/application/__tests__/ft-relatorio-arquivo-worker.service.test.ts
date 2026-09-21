import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
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
  async findExpired() { return []; }
  async markDeleted() {}
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
