import { randomUUID } from "node:crypto";
import { basename, resolve } from "node:path";
import { createReadStream } from "node:fs";
import { stat, unlink } from "node:fs/promises";
import { FT_REPORT_ARCHIVE_DIR } from "../../../../core/env.js";
import { eventBus } from "../../../../core/event/index.js";
import { ftError } from "../../../ft-bolsista/application/utils/ft-error.js";
import { FtRelatorioArquivoRepository } from "../../domain/repositories/ft-relatorio-arquivo.repository.js";
import { FtRelatorioRepository } from "../../domain/repositories/ft-relatorio.repository.js";
import { FtRelatorioPeriodoService } from "../../domain/services/ft-relatorio-periodo.service.js";

export class FtRelatorioArquivoService {
  constructor(
    private readonly files: FtRelatorioArquivoRepository,
    private readonly reports: FtRelatorioRepository,
    private readonly period = new FtRelatorioPeriodoService(),
  ) {}

  async request(editalId: string, mes: string, userId: number) {
    this.period.resolveMonth({ mes });
    const edital = await this.reports.findEditalById(editalId);
    if (!edital) throw ftError(404, "Edital not found");
    const id = randomUUID();
    const name = `espelhos-ponto-${this.slug(edital.name || editalId)}-${mes}.zip`;
    const created = await this.files.create({ id, nome_arquivo: name, status: "aguardando", edital_id: editalId, mes, solicitado_por: userId, total_bolsistas: 0, total_gerados: 0, total_falhas: 0, tentativas: 0 });
    await eventBus.emit("FT_REPORT_BATCH_AVAILABLE", { id });
    return this.present(created);
  }

  async list(pageValue: unknown, limitValue: unknown) {
    const page = Math.max(Number(pageValue) || 0, 0);
    const limit = Math.min(Math.max(Number(limitValue) || 10, 1), 100);
    const result = await this.files.list(page, limit);
    return { arquivos: result.rows.map((row) => this.present(row)), count: result.count, page, limit };
  }

  async retry(id: string) {
    const current = await this.files.findById(id);
    if (!current) throw ftError(404, "Arquivo not found");
    if (current.status === "excluido") throw ftError(410, "Arquivo excluido");
    if (!(await this.files.retry(id))) throw ftError(409, "Somente arquivos com erro podem ser reenviados");
    await eventBus.emit("FT_REPORT_BATCH_AVAILABLE", { id });
    return this.present((await this.files.findById(id))!);
  }

  async openDownload(id: string) {
    const current = await this.files.findById(id);
    if (!current) throw ftError(404, "Arquivo not found");
    if (current.status === "excluido") throw ftError(410, "Arquivo excluido");
    if (current.status !== "concluido" || !current.caminho_arquivo) throw ftError(409, "Arquivo ainda nao esta disponivel");
    if (!(await this.files.reserveDownload(id, new Date()))) throw ftError(409, "Download ja iniciado");
    const absolute = resolve(current.caminho_arquivo);
    const root = resolve(FT_REPORT_ARCHIVE_DIR);
    if (!absolute.startsWith(`${root}${process.platform === "win32" ? "\\" : "/"}`)) {
      await this.files.releaseDownload(id);
      throw ftError(500, "Caminho de arquivo invalido");
    }
    try {
      const metadata = await stat(absolute);
      return { record: current, path: absolute, size: metadata.size, stream: createReadStream(absolute) };
    } catch {
      await this.files.releaseDownload(id);
      throw ftError(410, "Arquivo nao esta mais disponivel");
    }
  }

  async finishDownload(id: string, path: string) {
    await unlink(path).catch(() => undefined);
    await this.files.markDeleted(id, new Date());
  }
  releaseDownload(id: string) { return this.files.releaseDownload(id); }

  private present(row: any) {
    const { caminho_arquivo: _path, ...safe } = row;
    return safe;
  }
  private slug(value: string) { return basename(String(value)).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "edital"; }
}
