import { fileNameSlug } from "../../../../core/utils/file-name-slug.js";
import type { FtRelatorioArquivoDto } from "../../domain/entities/ft-relatorio-arquivo.entity.js";
import type { FtRelatorioArquivoRepository } from "../../domain/repositories/ft-relatorio-arquivo.repository.js";
import type { ReportArchiveStorage } from "../ports/report-archive.storage.js";
import type { GerarHoleriteUseCase } from "./gerar-holerite.use-case.js";
import { ftError } from "../../../ft-bolsista/application/utils/ft-error.js";

export class HoleritesLoteService {
  constructor(
    private readonly holerites: Pick<GerarHoleriteUseCase, "folha" | "render">,
    private readonly files: Pick<
      FtRelatorioArquivoRepository,
      "progress" | "complete"
    >,
    private readonly storage: ReportArchiveStorage,
  ) {}
  async process(job: FtRelatorioArquivoDto) {
    const folha = await this.holerites.folha(job.edital_id, job.mes);
    const people = [
      ...new Map(
        folha.snapshot.rows.map((row) => [row.bolsista_id || row.cpf, row]),
      ).values(),
    ];
    if (!people.length)
      throw ftError(409, "A folha fechada não contém bolsistas.");
    const archive = await this.storage.create(job.id);
    let generated = 0;
    const failures: string[][] = [];
    try {
      await this.files.progress(job.id, people.length, 0, 0);
      for (let offset = 0; offset < people.length; offset += 4) {
        const results = await Promise.all(
          people.slice(offset, offset + 4).map(async (row) => {
            try {
              if (!row.bolsista_id) throw new Error("Missing identity");
              const pdf = await this.holerites.render(
                folha,
                row.bolsista_id,
                job.id,
              );
              return { row, pdf };
            } catch {
              return { row, pdf: null };
            }
          }),
        );
        for (const { row, pdf } of results) {
          if (pdf) {
            archive.append(
              pdf.file,
              `holerite-${fileNameSlug(row.nome, "bolsista")}-${fileNameSlug(row.bolsista_id || "", "sem-id")}.pdf`,
            );
            generated++;
          } else
            failures.push([
              job.edital_id,
              job.mes,
              row.bolsista_id || "",
              row.nome,
              row.bolsista_id
                ? "Não foi possível gerar o PDF. Solicite o holerite individual novamente."
                : "Identificador do bolsista não registrado na folha.",
            ]);
        }
        await this.files.progress(
          job.id,
          people.length,
          generated,
          failures.length,
        );
      }
      if (failures.length)
        archive.append(
          [
            "edital_id;competencia;bolsista_id;nome;motivo",
            ...failures.map((row) =>
              row.map((value) => `"${value.replace(/"/g, '""')}"`).join(";"),
            ),
          ].join("\r\n"),
          "falhas.csv",
        );
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
}
