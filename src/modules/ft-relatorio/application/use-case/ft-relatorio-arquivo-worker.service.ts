import { createWriteStream } from "node:fs";
import { mkdir, readdir, rename, stat, unlink } from "node:fs/promises";
import { join, resolve } from "node:path";
import { ZipArchive } from "archiver";
import { FT_REPORT_ARCHIVE_DIR } from "../../../../core/env.js";
import { FtRelatorioArquivoRepository } from "../../domain/repositories/ft-relatorio-arquivo.repository.js";
import { FtRelatorioRepository } from "../../domain/repositories/ft-relatorio.repository.js";

type PdfGenerator = { execute(bolsistaId: string, editalId: string, mes: string): Promise<{ file: Buffer }> };

export class FtRelatorioArquivoWorkerService {
  constructor(private readonly files: FtRelatorioArquivoRepository, private readonly reports: FtRelatorioRepository, private readonly pdf: PdfGenerator, private readonly archiveDir = FT_REPORT_ARCHIVE_DIR) {}

  async run(now = new Date()) {
    const stale = new Date(now.getTime() - 30 * 60_000);
    const job = await this.files.claimNext(now, stale);
    if (!job) return { processed: 0, backlog: await this.files.countPending() };
    try { await this.process(job); } catch (error) {
      await this.files.fail(job.id, this.safeError(error));
    }
    return { processed: 1, backlog: await this.files.countPending() };
  }

  async purge(now = new Date()) {
    const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60_000);
    const expired = await this.files.findExpired(cutoff);
    for (const row of expired) {
      if (row.caminho_arquivo) await unlink(row.caminho_arquivo).catch(() => undefined);
      await this.files.markDeleted(row.id, now);
    }
    const root = resolve(this.archiveDir);
    await mkdir(root, { recursive: true });
    for (const name of await readdir(root)) {
      if (!name.endsWith(".tmp")) continue;
      const path = join(root, name);
      const metadata = await stat(path).catch(() => null);
      if (metadata && metadata.mtime < cutoff) await unlink(path).catch(() => undefined);
    }
    return expired.length;
  }

  private async process(job: any) {
    const period = { data_inicio: `${job.mes}-01`, data_fim: this.monthEnd(job.mes) };
    const people = await this.reports.findBolsistasFaltasByEditalMes(job.edital_id, period);
    if (people.length === 0) throw new Error("Nenhum bolsista vinculado ao edital no mes selecionado");
    await this.files.progress(job.id, people.length, 0, 0);
    const root = resolve(this.archiveDir);
    await mkdir(root, { recursive: true });
    const temporary = join(root, `${job.id}.tmp`);
    const finalPath = join(root, `${job.id}.zip`);
    const output = createWriteStream(temporary, { flags: "wx" });
    const archive = new ZipArchive({ zlib: { level: 9 } });
    const completed = new Promise<void>((accept, reject) => { output.on("close", accept); output.on("error", reject); archive.on("error", reject); });
    archive.pipe(output);
    let generated = 0;
    const failures: Array<{ id: string; nome: string; erro: string }> = [];
    try {
      for (let index = 0; index < people.length; index += 4) {
        const chunk = people.slice(index, index + 4);
        const results = await Promise.all(chunk.map(async (item) => {
          const person: any = item.bolsista;
          try { return { person, pdf: await this.pdf.execute(String(person.id), job.edital_id, job.mes) }; }
          catch (error) { return { person, error: error instanceof Error ? error.message : String(error) }; }
        }));
        for (const result of results) {
          if (result.pdf) { archive.append(result.pdf.file, { name: `${this.slug(result.person.nome)}-${String(result.person.id).slice(0, 8)}.pdf` }); generated += 1; }
          else failures.push({ id: String(result.person.id), nome: String(result.person.nome || ""), erro: String(result.error) });
        }
        await this.files.progress(job.id, people.length, generated, failures.length);
      }
      if (generated === 0) throw new Error("Nenhum PDF foi gerado");
      if (failures.length) archive.append(this.failureCsv(failures), { name: "falhas.csv" });
      await archive.finalize();
      await completed;
      await rename(temporary, finalPath);
      const metadata = await stat(finalPath);
      await this.files.complete(job.id, { caminho_arquivo: finalPath, tamanho_bytes: metadata.size, total_bolsistas: people.length, total_gerados: generated, total_falhas: failures.length });
    } catch (error) {
      archive.abort();
      output.destroy();
      await unlink(temporary).catch(() => undefined);
      throw error;
    }
  }

  private failureCsv(rows: Array<{ id: string; nome: string; erro: string }>) { return ["id_bolsista;nome;erro", ...rows.map((r) => [r.id, r.nome, r.erro].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";"))].join("\n"); }
  private safeError(error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (/Nenhum bolsista|Nenhum PDF/.test(message)) return message;
    if (/PDF service unavailable/i.test(message)) return "O servico de PDF esta indisponivel";
    return "Falha ao gerar o arquivo de relatorios";
  }
  private slug(value: string) { return String(value || "bolsista").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "bolsista"; }
  private monthEnd(month: string) { const [year, value] = month.split("-").map(Number); return `${month}-${String(new Date(Date.UTC(year!, value!, 0)).getUTCDate()).padStart(2, "0")}`; }
}
