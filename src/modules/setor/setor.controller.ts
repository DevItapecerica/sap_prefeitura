import { FastifyReply, FastifyRequest } from "fastify";
import db from "../../infra/database/sequelize/index.js";
import { CreateSetorDto, DeleteSetorDto, FindOneSetorDto, UpdateSetorDto } from "./dto/setor.dto.js";
import setorFactory from "./setor.factory.js";

export default class SetorController {
  static getSetores = async (request: FastifyRequest, reply: FastifyReply) => {

      const service = setorFactory(request.log);
      const setores = await service.findAllSetor();
      reply.status(200).send({ setores });

  };

  static getOneSetor = async (
    request: FastifyRequest<{ Params: FindOneSetorDto }>,
    reply: FastifyReply,
  ) => {

      const id = request.params.id;
      const service = setorFactory(request.log);
      const setor = await service.findOneSetor(id);
      reply.status(200).send({ setor });

  };

  static postSetor = async (
    request: FastifyRequest<{ Body: { setor: CreateSetorDto } }>,
    reply: FastifyReply,
  ) => {

      const { name, description } = request.body.setor;
      const service = setorFactory(request.log);
      const setor = await service.createSetor({ name, description });
      reply.status(201).send({ setor });

  };

  static updateSetor = async (request: FastifyRequest<{ Params: { id: number }; Body: { setor: UpdateSetorDto } }>, reply: FastifyReply) => {

      const setor = request.body.setor;
      const id = request.params.id;

      const service = setorFactory(request.log);
      await service.updateSetor(id, setor);
      reply.status(204).send(); // importante: precisa chamar .send()

  };

  static deleteSetor = async (request: FastifyRequest<{ Params: DeleteSetorDto }>, reply: FastifyReply) => {
      const id = request.params.id;
      const service = setorFactory(request.log);

      if (id == 1) {
        throw {
          code: 403,
          message: "Não é possível deletar o setor principal",
          ok: false,
          api: "Services",
        };
      }

      const deleted = service.deleteSetor(id);

      if (!deleted) {
        throw {
          code: 404,
          message: "Setor não encontrado",
          ok: false,
          api: "Services",
        };
      }

      reply.status(204).send();

  };
}
