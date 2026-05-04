import { FastifyReply, FastifyRequest } from "fastify";
import { CreateSetorDto, DeleteSetorDto, FindOneSetorDto, UpdateSetorDto } from "../../application/dto/setor.dto.js";
import setorFactory from "../../factories/setor.factory.js";
import { QueryParams } from "../../../../core/types/genericTypes.js";

export default class SetorController {
  static getSetores = async (request: FastifyRequest<{ Querystring: QueryParams }>, reply: FastifyReply) => {

    const query = {
      page: request.query.page,
      limit: request.query.limit,
      search: request.query.search,
      order: request.query.order
    };

      const service = setorFactory(request.log);
      const setores = await service.findAllSetor(query);
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

      const response = await service.updateSetor(id, setor);

      reply.status(200).send({message: "Setor atualizado com sucesso", setor: response, ok: true}); // importante: precisa chamar .send()

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
