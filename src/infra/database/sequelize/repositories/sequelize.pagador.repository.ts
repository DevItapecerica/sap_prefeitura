import { fn, col, Op, where } from "sequelize";
import { PagadorCapacity, PagadorInput, PagadorQuery } from "../../../../modules/ft-pagador/domain/pagador.js";
import { PagadorRepository } from "../../../../modules/ft-pagador/domain/pagador.repository.js";
import { toPagadorCapacity } from "../../../../modules/ft-pagador/domain/pagador-capacity.js";
import db from "../index.js";

export class SequelizePagadorRepository implements PagadorRepository {
  list(query: PagadorQuery) {
    const page = Math.max(0, Number(query.page ?? 0));
    const limit = Math.min(100, Math.max(1, Number(query.limit ?? 10)));
    return db.Pagador.findAndCountAll({
      where: query.search ? { nome: { [Op.like]: `%${String(query.search).trim()}%` } } : undefined,
      order: [["nome", "ASC"]],
      offset: page * limit,
      limit,
    });
  }

  findById(uuid: string, includeDeleted = false) {
    return db.Pagador.findByPk(uuid, { paranoid: !includeDeleted });
  }

  findByName(nome: string) {
    return db.Pagador.findOne({
      where: where(fn("LOWER", col("nome")), nome.toLocaleLowerCase("pt-BR")),
      paranoid: false,
    });
  }

  create(input: PagadorInput) { return db.Pagador.create(input); }

  async update(instance: any, input: PagadorInput) {
    await instance.update(input);
    return instance;
  }

  async softDelete(instance: any) { await instance.destroy(); }

  async maxActiveOccupation(uuid: string) {
    const rows = await db.BolsistasEdital.findAll({
      attributes: ["edital_id", [fn("COUNT", col("id")), "ocupacao"]],
      where: { pagador_id: uuid, status: "ativo" },
      group: ["edital_id"],
      raw: true,
    });
    return Math.max(0, ...rows.map((row: any) => Number(row.ocupacao)));
  }

  async listCapacityByEdital(editalId: string): Promise<PagadorCapacity[] | null> {
    const edital = await db.Edital.findByPk(editalId);
    if (!edital) return null;

    const [pagadores, ocupacoes] = await Promise.all([
      db.Pagador.findAll({ order: [["nome", "ASC"]] }),
      db.BolsistasEdital.findAll({
        attributes: ["pagador_id", [fn("COUNT", col("id")), "ativos"]],
        where: {
          edital_id: editalId,
          status: "ativo",
          pagador_id: { [Op.ne]: null },
        },
        group: ["pagador_id"],
        raw: true,
      }),
    ]);
    const ativosPorPagador = new Map<string, number>(
      ocupacoes.map((item: any) => [String(item.pagador_id), Number(item.ativos)] as [string, number]),
    );

    return pagadores.map((pagador: any) => {
      const plain = pagador.toJSON();
      const ativos = ativosPorPagador.get(String(plain.uuid)) ?? 0;
      return toPagadorCapacity(plain, ativos);
    });
  }
}
