import { fileNameSlug } from "../../../../core/utils/file-name-slug.js";
import {
  ReportArchiveError,
  type ReportArchiveStorage,
  type ReportBatchEvents,
} from "../ports/report-archive.storage.js";
import type { EventPublisher } from "../../../../core/event/event-contracts.js";
import type { FtRelatorioArquivoDto } from "../../domain/entities/ft-relatorio-arquivo.entity.js";
import { mapPeaadRuleError } from "../../../ft-bolsista/application/utils/map-peaad-rule-error.js";
import { randomUUID } from "node:crypto";
import { basename } from "node:path";
import { ftError } from "../../../ft-bolsista/application/utils/ft-error.js";
import { FtRelatorioArquivoRepository } from "../../domain/repositories/ft-relatorio-arquivo.repository.js";
import { FtRelatorioRepository } from "../../domain/repositories/ft-relatorio.repository.js";
import { FtRelatorioPeriodoService } from "../../domain/services/ft-relatorio-periodo.service.js";
import { FtRelatorioArquivoTipo } from "../../domain/entities/ft-relatorio-arquivo.entity.js";
import { EspelhoPontoPeriodoPolicy } from "../../../ft-bolsista/domain/services/espelho-ponto-periodo.policy.js";

export class FtRelatorioArquivoService {
  constructor(
    private readonly files: FtRelatorioArquivoRepository,
    private readonly reports: FtRelatorioRepository,
    private readonly storage: ReportArchiveStorage,
    private readonly events: EventPublisher<ReportBatchEvents>,
    private readonly period = new FtRelatorioPeriodoService(),
    private readonly clock = () => new Date(),
    private readonly timesheetPeriod = new EspelhoPontoPeriodoPolicy(),
  ) {}

  async request(
    editalId: string,
    mes: string,
    userId: number,
    tipo: FtRelatorioArquivoTipo = "espelhos_ponto",
  ) {
    try {
      if (tipo === "folhas_presenca") this.period.resolveMonth({ mes });
      else this.timesheetPeriod.resolve(mes, this.clock());
      const edital = await this.reports.findEditalById(editalId);
      if (!edital) throw ftError(404, "Edital not found");
      const id = randomUUID();
      const prefix =
        tipo === "folhas_presenca" ? "folhas-presenca" : "espelhos-ponto";
      const name = `${prefix}-${this.slug(edital.name || editalId)}-${mes}.zip`;
      const created = await this.files.create({
        id,
        nome_arquivo: name,
        tipo,
        status: "aguardando",
        edital_id: editalId,
        mes,
        solicitado_por: userId,
        total_bolsistas: 0,
        total_gerados: 0,
        total_falhas: 0,
        tentativas: 0,
      });
      await this.events.publish("FT_REPORT_BATCH_AVAILABLE", { id });
      return this.present(created);
    } catch (error) {
      throw mapPeaadRuleError(error);
    }
  }

  async list(pageValue: unknown, limitValue: unknown, editalId?: string) {
    try {
      const page = Math.max(Number(pageValue) || 0, 0);
      const limit = Math.min(Math.max(Number(limitValue) || 10, 1), 100);
      const result = await this.files.list(page, limit, editalId);
      return {
        arquivos: result.rows.map((row) => this.present(row)),
        count: result.count,
        page,
        limit,
      };
    } catch (error) {
      throw mapPeaadRuleError(error);
    }
  }

  async retry(id: string) {
    try {
      const current = await this.files.findById(id);
      if (!current) throw ftError(404, "Arquivo not found");
      if (current.status === "excluido") throw ftError(410, "Arquivo excluido");
      if (!(await this.files.retry(id)))
        throw ftError(409, "Somente arquivos com erro podem ser reenviados");
      await this.events.publish("FT_REPORT_BATCH_AVAILABLE", { id });
      return this.present((await this.files.findById(id))!);
    } catch (error) {
      throw mapPeaadRuleError(error);
    }
  }

  async openDownload(id: string) {
    try {
      const current = await this.files.findById(id);
      if (!current) throw ftError(404, "Arquivo not found");
      if (current.status === "excluido") throw ftError(410, "Arquivo excluido");
      if (current.status !== "concluido" || !current.caminho_arquivo)
        throw ftError(409, "Arquivo ainda nao esta disponivel");
      if (!(await this.files.reserveDownload(id, new Date())))
        throw ftError(409, "Download ja iniciado");
      try {
        return {
          record: current,
          ...(await this.storage.open(current.caminho_arquivo)),
        };
      } catch (error) {
        await this.files.releaseDownload(id);
        if (
          error instanceof ReportArchiveError &&
          error.code === "INVALID_PATH"
        )
          throw ftError(500, "Caminho de arquivo invalido");
        throw ftError(410, "Arquivo nao esta mais disponivel");
      }
    } catch (error) {
      throw mapPeaadRuleError(error);
    }
  }

  async finishDownload(id: string, path: string) {
    try {
      await this.storage.remove(path);
      await this.files.markDeleted(id, new Date());
    } catch (error) {
      throw mapPeaadRuleError(error);
    }
  }
  releaseDownload(id: string) {
    return this.files.releaseDownload(id);
  }

  private present(row: FtRelatorioArquivoDto) {
    const { caminho_arquivo: _path, ...safe } = row;
    return safe;
  }
  private slug(value: string) {
    return fileNameSlug(basename(String(value)), "edital");
  }
}
