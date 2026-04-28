import db from "../index.js";
import MunicipeRepository from "../../../../modules/municipe/domain/repositories/Municipe.tepository.js";
import Municipe from "../../../../modules/municipe/domain/entity/Municipe.js";

export class SequelizeMunicipeRepository implements MunicipeRepository  {
  private model = db.MunicipeModel;

  async createMunicipe(municipe: Municipe): Promise<Municipe> {
    const response = await this.model.create(municipe);
    return this.toEntity(response);
  }

  async getMunicipe(query: any): Promise<{ municipe: Municipe[]; count: number }> {
    const municipe = await this.model.findAndCountAll(query);
    return { municipe: municipe.rows.map((municipe: Municipe) => this.toEntity(municipe)), count: municipe.count };
  }

  async getMunicipeById(uuid: string): Promise<Municipe | null> {
    const municipe = await this.model.findByPk(uuid);
    return municipe ? this.toEntity(municipe) : null;
  }

  async getMunicipeByCpf(cpf: string): Promise<Municipe | null> {
    const municipe = await this.model.findOne({ where: { cpf } });
    return municipe ? this.toEntity(municipe) : null;
  }

  async updateMunicipe(uuid: string, municipe: Municipe): Promise<Municipe | null> {
    const response = await this.model.update(municipe, { where: { uuid } });
    return response[0] > 0 ? this.toEntity(municipe) : null;
  }

  async deleteMunicipe(uuid: string): Promise<boolean> {
    const response = await this.model.destroy({ where: { uuid } });
    return response > 0;
  }

  

  // 🔥 mapper (ESSENCIAL)
  private toEntity(data: any): Municipe {
    return new Municipe(
      data.nome,
      data.cpf,
      data.nascimento,
      data.telefone,
      data.rua,
      data.bairro,
      data.cidade,
      data.uf,
      data.cep,
      data.numero,
      data.complemento,
      data.author,

      data.uuid,
      data.createdAt,
      data.updatedAt,
      data.deletedAt,
    );
  }
}
