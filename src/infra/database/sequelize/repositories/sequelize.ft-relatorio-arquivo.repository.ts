import { Op } from "sequelize";
import db from "../index.js";
import { FtRelatorioArquivoRepository } from "../../../../modules/ft-relatorio/domain/repositories/ft-relatorio-arquivo.repository.js";

export class SequelizeFtRelatorioArquivoRepository implements FtRelatorioArquivoRepository {
  private model = db.FtRelatorioArquivo;
  private plain(row: any): any { return row?.toJSON?.() ?? row; }

  async create(data: any) { return this.plain(await this.model.create(data)); }
  async findById(id: string) {
    const row = await this.model.findByPk(id, {
      include: [
        { model: db.Edital, as: "edital", attributes: ["id", "name"] },
        { model: db.UserModel, as: "solicitante", attributes: ["id", "name"] },
      ],
    });
    return row ? this.plain(row) : null;
  }
  async list(page: number, limit: number) {
    const result = await this.model.findAndCountAll({
      where: { status: { [Op.ne]: "excluido" } },
      include: [
        { model: db.Edital, as: "edital", attributes: ["id", "name"] },
        { model: db.UserModel, as: "solicitante", attributes: ["id", "name"] },
      ],
      order: [["createdAt", "DESC"]], limit, offset: page * limit,
    });
    return { rows: result.rows.map((row: any) => this.plain(row)), count: result.count };
  }
  async claimNext(now: Date, staleBefore: Date) {
    await this.model.update(
      { status: "aguardando", mensagem_erro: "Recuperado apos interrupcao" },
      { where: { status: "processando", iniciado_em: { [Op.lt]: staleBefore } } },
    );
    const rows = await this.model.findAll({ where: { status: "aguardando" }, order: [["createdAt", "ASC"]], limit: 10 });
    for (const row of rows) {
      const [changed] = await this.model.update(
        { status: "processando", iniciado_em: now, tentativas: Number(row.get("tentativas")) + 1, mensagem_erro: null },
        { where: { id: row.get("id"), status: "aguardando" } },
      );
      if (changed === 1) return this.findById(String(row.get("id")));
    }
    return null;
  }
  async complete(id: string, data: any) { await this.model.update({ ...data, status: "concluido", concluido_em: new Date(), mensagem_erro: null }, { where: { id, status: "processando" } }); }
  async progress(id: string, total: number, generated: number, failed: number) { await this.model.update({ total_bolsistas: total, total_gerados: generated, total_falhas: failed }, { where: { id, status: "processando" } }); }
  async fail(id: string, message: string) { await this.model.update({ status: "erro", mensagem_erro: message.slice(0, 4000) }, { where: { id } }); }
  async retry(id: string) {
    const [count] = await this.model.update({ status: "aguardando", caminho_arquivo: null, tamanho_bytes: null, total_bolsistas: 0, total_gerados: 0, total_falhas: 0, mensagem_erro: null, iniciado_em: null, concluido_em: null, download_iniciado_em: null }, { where: { id, status: "erro" } });
    return count === 1;
  }
  async reserveDownload(id: string, now: Date) {
    await this.model.update(
      { download_iniciado_em: null },
      { where: { id, status: "concluido", download_iniciado_em: { [Op.lt]: new Date(now.getTime() - 30 * 60_000) } } },
    );
    const [count] = await this.model.update({ download_iniciado_em: now }, { where: { id, status: "concluido", download_iniciado_em: null } });
    return count === 1;
  }
  async releaseDownload(id: string) { await this.model.update({ download_iniciado_em: null }, { where: { id, status: "concluido" } }); }
  async markDeleted(id: string, now: Date) { await this.model.update({ status: "excluido", caminho_arquivo: null, baixado_em: now, excluido_em: now, download_iniciado_em: null }, { where: { id } }); }
  async findExpired(cutoff: Date) {
    const rows = await this.model.findAll({ where: { status: "concluido", concluido_em: { [Op.lt]: cutoff } } });
    return rows.map((row: any) => this.plain(row));
  }
  async countPending() { return this.model.count({ where: { status: { [Op.in]: ["aguardando", "processando"] } } }); }
}
