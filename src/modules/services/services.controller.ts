import { FastifyReply, FastifyRequest } from "fastify";
import { SequelizeServicesRepository } from "../../infra/database/sequelize/repositories/sequelize.services.repository.js";
import ServicesService from "./services.service.js";
import { CreateServicesDto, UpdateServicesDto } from "./dto/services.dto.js";
import { QueryParams } from "../../core/shared/types/genericTypes.js";

export default class ServicesController {
  private static service = new ServicesService(
    new SequelizeServicesRepository(),
  );

  static getService = async (
    request: FastifyRequest<{ Querystring: QueryParams }>,
    reply: FastifyReply,
  ) => {
    const query = {
      page: request.query.page,
      limit: request.query.limit,
      search: request.query.search,
      order: request.query.order
    };

    const response = await this.service.getAll(query);

    return reply
      .status(200)
      .send({ services: response.services, count: response.count, ok: true });
  };

  static getOneService = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) => {
    const id = parseInt(request.params.id);
    const servicesResponse = await this.service.getOne(id);
    return reply.status(200).send({ service: servicesResponse, ok: true });
  };

  static createService = async (
    request: FastifyRequest<{ Body: { service: CreateServicesDto } }>,
    reply: FastifyReply,
  ) => {
    const service = await this.service.create(request.body.service);
    return reply.status(201).send({ service, ok: true });
  };

  static updateService = async (
    request: FastifyRequest<{
      Params: { id: string };
      Body: { service: UpdateServicesDto };
    }>,
    reply: FastifyReply,
  ) => {
    const id = parseInt(request.params.id);
    await this.service.update(id, request.body.service);
    reply.status(204).send();
  };

  static deleteService = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) => {
    const id = parseInt(request.params.id);

    if (id <= 3) {
      throw {
        code: 403,
        ok: false,
        api: "Services",
        message: "Não é possível deletar esse serviço",
      };
    }

    const deletedCount = await this.service.deleteOne(id);

    if (!deletedCount) {
      throw {
        code: 404,
        ok: false,
        api: "Services",
        message: "Serviço não encontrado",
      };
    }

    reply.status(204).send();
  };
}
