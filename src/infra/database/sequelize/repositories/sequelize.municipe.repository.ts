import db from "../index.js";
import MunicipeRepository from "../../../../modules/municipe/domain/repositories/Municipe.repository.js";
import Municipe from "../../../../modules/municipe/domain/entity/Municipe.js";
import { QueryParams } from "../../../../core/types/genericTypes.js";
import { Op } from "sequelize";
import CryptData from "../../../../core/utils/CryptData.js";
import {
  MunicipeDto,
  updateMunicipeDto,
} from "../../../../modules/municipe/application/dto/municipe.dto.js";

export class SequelizeMunicipeRepository implements MunicipeRepository {
  private model = db.MunicipeModel;
  private fieldsToEncrypt = [
    "cpf",
    "nascimento",
    "telefone",
    "rua",
    "bairro",
    "cidade",
    "uf",
    "cep",
    "numero",
    "complemento",
  ];

  async createMunicipe(
    municipe: MunicipeDto,
    author: string,
  ): Promise<Municipe> {
    const crypto = new CryptData();

    const data: Record<string, any> = {};

    for (const [key, value] of Object.entries(municipe)) {
      if (value === null || !this.fieldsToEncrypt.includes(key)) {
        data[key] = value;
      } else if (value !== undefined) {
        data[key] = await crypto.Encryption(String(value));
      }
    }

    data.author = author;
    data.cpfHash = await crypto.staticHash(String(municipe.cpf));
    data.cepHash = await crypto.staticHash(String(municipe.cep));

    const response = await this.model.create(data);

    const decriptedUser = await this.getMunicipeById(response.uuid);

    if (!decriptedUser) return response;

    return decriptedUser;
  }

  async getMunicipe(
    query: QueryParams,
  ): Promise<{ municipe: Municipe[]; count: number }> {
    const cryptData = new CryptData();

    const { page, limit, search, order } = query;
    const queryOrder = order ? order.split(":") : ["uuid", "desc"];
    const searchHash = search
      ? await cryptData.staticHash(String(search))
      : null;

    const offset = limit ? Number(page) * Number(limit) : undefined;

    const where = search
      ? {
          [Op.or]: [
            { nome: { [Op.like]: `%${search}%` } },
            { cepHash: { [Op.like]: `%${searchHash}%` } },
            { cpfHash: { [Op.like]: `%${searchHash}%` } },
          ],
        }
      : {};

    const queryData = {
      offset,
      where,
      limit: limit,
      order: [[queryOrder[0], queryOrder[1]]],
    };

    let municipe = await this.model.findAll(queryData);

    const municipeEntities = await Promise.all(
      municipe.map(async (m: any) => {
        return this.toEntity({
          nome: m.nome,
          cpf: await cryptData.Decryption(m.cpf),
          nascimento: await cryptData.Decryption(m.nascimento),
          telefone: m.telefone ? await cryptData.Decryption(m.telefone) : null,
          rua: await cryptData.Decryption(m.rua),
          bairro: await cryptData.Decryption(m.bairro),
          cidade: await cryptData.Decryption(m.cidade),
          uf: await cryptData.Decryption(m.uf),
          cep: await cryptData.Decryption(m.cep),
          numero: await cryptData.Decryption(m.numero), // se não criptografar
          complemento: m.complemento
            ? await cryptData.Decryption(m.complemento)
            : null,

          author: m.author,
          uuid: m.uuid,
          cpfHash: m.cpfHash,
          cepHash: m.cepHash,
          createdAt: m.createdAt,
          updatedAt: m.updatedAt,
          deletedAt: m.deletedAt,
        });
      }),
    );

    const count = await this.model.count({ where });
    return {
      municipe: municipeEntities,
      count: count,
    };
  }

  async getMunicipeById(uuid: string): Promise<Municipe | null> {
    const municipe = await this.model.findByPk(uuid);
    const cryptData = new CryptData();

    if (!municipe) return null;

    const municipeEntities = this.toEntity({
      nome: municipe.nome,
      cpf: await cryptData.Decryption(municipe.cpf),
      nascimento: await cryptData.Decryption(municipe.nascimento),
      telefone: municipe.telefone
        ? await cryptData.Decryption(municipe.telefone)
        : null,
      rua: await cryptData.Decryption(municipe.rua),
      bairro: await cryptData.Decryption(municipe.bairro),
      cidade: await cryptData.Decryption(municipe.cidade),
      uf: await cryptData.Decryption(municipe.uf),
      cep: await cryptData.Decryption(municipe.cep),
      numero: await cryptData.Decryption(municipe.numero), // se não criptografar
      complemento: municipe.complemento
        ? await cryptData.Decryption(municipe.complemento)
        : null,

      author: municipe.author,
      uuid: municipe.uuid,
      cpfHash: municipe.cpfHash,
      cepHash: municipe.cepHash,
      createdAt: municipe.createdAt,
      updatedAt: municipe.updatedAt,
      deletedAt: municipe.deletedAt,
    });

    return municipeEntities;
  }

  async getMunicipeByCpf(cpf: string): Promise<Municipe | null> {
    const cryptData = new CryptData();

    cpf = await cryptData.staticHash(cpf);

    const municipe = await this.model.findOne({ where: { cpfHash: cpf } });

    if (!municipe) return null;

    const municipeEntities = this.toEntity({
      nome: municipe.nome,
      cpf: await cryptData.Decryption(municipe.cpf),
      nascimento: await cryptData.Decryption(municipe.nascimento),
      telefone: municipe.telefone
        ? await cryptData.Decryption(municipe.telefone)
        : null,
      rua: await cryptData.Decryption(municipe.rua),
      bairro: await cryptData.Decryption(municipe.bairro),
      cidade: await cryptData.Decryption(municipe.cidade),
      uf: await cryptData.Decryption(municipe.uf),
      cep: await cryptData.Decryption(municipe.cep),
      numero: municipe.numero, // se não criptografar
      complemento: municipe.complemento
        ? await cryptData.Decryption(municipe.complemento)
        : null,

      author: municipe.author,
      uuid: municipe.uuid,
      createdAt: municipe.createdAt,
      updatedAt: municipe.updatedAt,
      deletedAt: municipe.deletedAt,
    });

    return municipeEntities;
  }

  async updateMunicipe(
    uuid: string,
    updated: updateMunicipeDto,
  ): Promise<Municipe | null> {
    const crypto = new CryptData();

    const municipe = await this.model.findByPk(uuid);

    if (!municipe) return null;

    const data: Record<string, any> = {};
    const decriptData: Record<string, any> = {};

    for (const [key, value] of Object.entries(updated)) {
      if (value === null || !this.fieldsToEncrypt.includes(key)) {
        decriptData[key] = value;
        data[key] = value;
      } else if (value !== undefined) {
        data[key] = await crypto.Encryption(String(value));
      }

      if (key === "cpf") {
        data.cpfHash = await crypto.staticHash(String(value));
      }

      if (key === "cep") {
        data.cepHash = await crypto.staticHash(String(value));
      }
    }

    await this.model.update(data, { where: { uuid } });

    return await this.getMunicipeById(uuid);
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
      data.cpfHash,
      data.cepHash,
      data.createdAt,
      data.updatedAt,
      data.deletedAt,
    );
  }
}
