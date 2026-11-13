import { fileNameSlug } from "../../../../core/utils/file-name-slug.js";
import type { ReportArchiveStorage } from "../ports/report-archive.storage.js";
import type { FtRelatorioArquivoDto } from "../../domain/entities/ft-relatorio-arquivo.entity.js";
import { mapPeaadRuleError } from "../../../ft-bolsista/application/utils/map-peaad-rule-error.js";
import { FtRelatorioArquivoRepository } from "../../domain/repositories/ft-relatorio-arquivo.repository.js";
import { FtRelatorioRepository } from "../../domain/repositories/ft-relatorio.repository.js";
import { EspelhoPontoPeriodoPolicy } from "../../../ft-bolsista/domain/services/espelho-ponto-periodo.policy.js";
import { PeaadRuleError } from "../../../ft-bolsista/domain/errors/peaad-rule.error.js";
import type { EspelhoPontoEmissionContext } from "../../../ft-bolsista/application/dto/espelho-ponto-emission.js";
import type { HoleritesLoteService } from "./holerites-lote.service.js";

type PdfGenerator = {
  execute(
    bolsistaId: string,
    editalId: string,
    mes: string,
    requestId?: string,
    context?: EspelhoPontoEmissionContext,
  ): Promise<{ file: Buffer }>;
};

export class FtRelatorioArquivoWorkerService {
  constructor(
    private readonly files: Pick<
      FtRelatorioArquivoRepository,
      | "claimNext"
      | "countPending"
      | "progress"
      | "complete"
      | "fail"
      | "findExpired"
      | "markDeleted"
    >,
    private readonly reports: Pick<
      FtRelatorioRepository,
      "findBolsistasFaltasByEditalMes"
    >,
    private readonly espelhoPdf: PdfGenerator,
    private readonly storage: ReportArchiveStorage,
    private readonly folhaPresencaPdf: PdfGenerator = espelhoPdf,
    private readonly timesheetPeriod = new EspelhoPontoPeriodoPolicy(),
    private readonly holerites?: Pick<HoleritesLoteService, "process">,
  ) {}

  async run(now = new Date()) {
    const referenceDate = new Date(now.getTime());
    try {
      const stale = new Date(now.getTime() - 30 * 60_000);
      const job = await this.files.claimNext(now, stale);
      if (!job)
        return { processed: 0, backlog: await this.files.countPending() };
      try {
        await this.process(job, referenceDate);
      } catch (error) {
        await this.files.fail(job.id, this.safeError(error));
      }
      return { processed: 1, backlog: await this.files.countPending() };
    } catch (error) {
      throw mapPeaadRuleError(error);
    }
  }

  async purge(now = new Date()) {
    try {
      const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60_000);
      const expired = await this.files.findExpired(cutoff);
      for (const row of expired) {
        if (row.caminho_arquivo) await this.storage.remove(row.caminho_arquivo);
        await this.files.markDeleted(row.id, now);
      }
      await this.storage.purgeTemporary(cutoff);
      return expired.length;
    } catch (error) {
      throw mapPeaadRuleError(error);
    }
  }

  private async peopleForJob(job: FtRelatorioArquivoDto, referenceDate: Date) {
    const monthly = {
      data_inicio: `${job.mes}-01`,
      data_fim: this.monthEnd(job.mes),
    };
    const timesheet =
      job.tipo === "folhas_presenca"
        ? null
        : this.timesheetPeriod.resolve(job.mes, referenceDate);
    const period = timesheet
      ? { data_inicio: timesheet.inicio, data_fim: timesheet.fim }
      : monthly;
    const people = (
      await this.reports.findBolsistasFaltasByEditalMes(job.edital_id, period)
    )
      .slice()
      .sort((left, right) =>
        String(left.bolsista?.nome || "").localeCompare(
          String(right.bolsista?.nome || ""),
          "pt-BR",
          { sensitivity: "base" },
        ),
      );
    if (people.length === 0)
      throw new Error("Nenhum bolsista vinculado ao edital no mes selecionado");
    return people;
  }

  private async process(job: FtRelatorioArquivoDto, referenceDate: Date) {
    if (job.tipo === "holerites") {
      if (!this.holerites) throw new Error("Holerite worker unavailable");
      return this.holerites.process(job);
    }
    const people = await this.peopleForJob(job, referenceDate);
    await this.files.progress(job.id, people.length, 0, 0);
    const archive = await this.storage.create(job.id);
    let generated = 0;
    const failures: Array<{ id: string; nome: string; erro: string }> = [];
    const isFolhaPresenca = job.tipo === "folhas_presenca";
    const pdf = isFolhaPresenca ? this.folhaPresencaPdf : this.espelhoPdf;
    try {
      for (let index = 0; index < people.length; index += 4) {
        const chunk = people.slice(index, index + 4);
        const results = await Promise.all(
          chunk.map(async (item) => {
            const person = item.bolsista;
            try {
              return {
                person,
                pdf: isFolhaPresenca
                  ? await pdf.execute(String(person.id), job.edital_id, job.mes)
                  : await pdf.execute(
                      String(person.id),
                      job.edital_id,
                      job.mes,
                      undefined,
                      { referenceDate },
                    ),
              };
            } catch (error) {
              return {
                person,
                error: error instanceof Error ? error.message : String(error),
              };
            }
          }),
        );
        for (const result of results) {
          if (result.pdf) {
            const prefix = isFolhaPresenca ? "folha-presenca-" : "";
            archive.append(
              result.pdf.file,
              `${prefix}${this.slug(result.person.nome)}-${String(result.person.id).slice(0, 8)}.pdf`,
            );
            generated += 1;
          } else
            failures.push({
              id: String(result.person.id),
              nome: String(result.person.nome || ""),
              erro: String(result.error),
            });
        }
        await this.files.progress(
          job.id,
          people.length,
          generated,
          failures.length,
        );
      }
      if (generated === 0) throw new Error("Nenhum PDF foi gerado");
      if (failures.length)
        archive.append(this.failureCsv(failures), "falhas.csv");
      const stored = await archive.finish();
      await this.files.complete(job.id, {
        caminho_arquivo: stored.path,
        tamanho_bytes: stored.size,
        total_bolsistas: people.length,
        total_gerados: generated,
        total_falhas: failures.length,
      });
    } catch (error) {
      await archive.abort();
      throw error;
    }
  }

  private failureCsv(rows: Array<{ id: string; nome: string; erro: string }>) {
    return [
      "id_bolsista;nome;erro",
      ...rows.map((r) =>
        [r.id, r.nome, r.erro]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(";"),
      ),
    ].join("\n");
  }
  private safeError(error: unknown) {
    if (
      error instanceof PeaadRuleError &&
      (error.code === "REPORT_MONTH_FUTURE" ||
        error.code === "REPORT_MONTH_INVALID")
    )
      return error.message;
    const message = error instanceof Error ? error.message : String(error);
    if (/Nenhum bolsista|Nenhum PDF/.test(message)) return message;
    if (/PDF service unavailable/i.test(message))
      return "O servico de PDF esta indisponivel";
    return "Falha ao gerar o arquivo de relatorios";
  }
  private slug(value: string) {
    return fileNameSlug(String(value || "bolsista"), "bolsista");
  }
  private monthEnd(month: string) {
    const [year, value] = month.split("-").map(Number);
    return `${month}-${String(new Date(Date.UTC(year!, value!, 0)).getUTCDate()).padStart(2, "0")}`;
  }
}
