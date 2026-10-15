import { fn, col, Op, where } from "sequelize";
import { TurnoRepository } from "../../../../modules/ft-turno/domain/turno.repository.js";
import { TurnoInput, TurnoQuery } from "../../../../modules/ft-turno/domain/turno.js";
import db from "../index.js";

export class SequelizeTurnoRepository implements TurnoRepository {
  list(query: TurnoQuery) {
    const page = Math.max(0, Number(query.page ?? 0));
    const limit = Math.min(100, Math.max(1, Number(query.limit ?? 10)));
    return db.Turno.findAndCountAll({
      where: query.search ? { nome: { [Op.like]: `%${String(query.search).trim()}%` } } : undefined,
      order: [["nome", "ASC"]], offset: page * limit, limit,
    });
  }
  findById(uuid: string, includeDeleted = false) { return db.Turno.findByPk(uuid, { paranoid: !includeDeleted }); }
  findByName(nome: string) {
    return db.Turno.findOne({ where: where(fn("LOWER", col("nome")), nome.toLocaleLowerCase("pt-BR")), paranoid: false });
  }
  create(input: TurnoInput) { return db.Turno.create(input); }
  async update(instance: any, input: TurnoInput) { await instance.update(input); return instance; }
  async softDelete(instance: any) { await instance.destroy(); }
}
