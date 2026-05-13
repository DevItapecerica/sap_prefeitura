import db from "../index.js";
// import { Op } from "sequelize";
import { IEditalRepository } from "../../../../modules/ft-edital/domain/repository/IEditalRepository.js";

export class SequelizeEditalRepository implements IEditalRepository {
  private model = db.EditalModel;

  async findAll(): Promise<{
    carterinhas: any[];
    count: number;
  }> {
    // const { page, limit,  setor, servico, order } = query;
    // const queryOrder = order ? order.split(":") : ["uuid", "desc"];

    // const offset = limit ? Number(page) * Number(limit) : undefined;

    // const where = {
    //   [Op.or]: [
    //     { setor_uuid: { [Op.like]: `%${setor ? setor : ""}%` } },
    //     { atividade_uuid: { [Op.like]: `%${servico ? servico: ""}%` } },
    //   ],
    // };

    // const queryData = {
    //   offset,
    //   where,
    //   limit: limit,
    //   order: [[queryOrder[0], queryOrder[1]]],
    // };

    const edital = await this.model
      .findAll
      // queryData
      ();
    return {
      carterinhas: edital.map(
        (carterinha: any) =>
          // this.toEntity(carterinha),
          edital,
      ),
      count: edital.length,
    };
  }

  async save(edital: any): Promise<any> {
    const newEdital = await this.model.create(edital);

    // return this.toEntity(newany);
    return newEdital;
  }

  async findById(id: number | string): Promise<any | null> {
    const edital = await this.model.findByPk(id);
    // return carterinha ? this.toEntity(carterinha) : null;
    return edital ? edital : null;
  }

  async update(id: number | string, edital: any): Promise<any> {
    const isEdital = await this.model.findByPk(id);

    if (!isEdital) return null;

    isEdital.update(edital);
    // return this.toEntity(isEdital);
    return isEdital;
  }

  async delete(id: number | string): Promise<boolean> {
    const isEdital = await this.model.findByPk(id);
    if (!isEdital) return false;
    await isEdital.destroy();
    return true;
  }

  // // 🔥 mapper (ESSENCIAL)
  // private toEntity(data: any): any {
  //   return new Edital(
  //     data.emissao,
  //     data.validade,
  //     data.setor_uuid,
  //     data.atividade_uuid,
  //     data.municipe_uuid,
  //     data.author,

  //     data.uuid,
  //     data.createdAt,
  //     data.updatedAt,
  //     data.deletedAt,
  //   );
  // }
}
