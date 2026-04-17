import { FastifyReply, FastifyRequest } from "fastify";
import { CreateServicesDto, UpdateServicesDto } from "./dto/services.dto.js";
import { QueryParams } from "../../../../core/shared/types/genericTypes.js";
import { makePermission } from "../../factories/makePermission.js";

export default class ServicesController {
  static getService = async (
    request: FastifyRequest<{ Querystring: QueryParams }>,
    reply: FastifyReply,
  ) => {
    const service = makePermission(request.log)
    const query = request.query;
    const response = await service.getAll(query);

    return reply
      .status(200)
      .send({ services: response.services, count: response.count, ok: true });
  };

  static getOneService = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) => {
    const id = parseInt(request.params.id);
    const servicesResponse = await service.getOne(id);
    return reply.status(200).send({ service: servicesResponse, ok: true });
  };

  static createService = async (
    request: FastifyRequest<{ Body: { service: CreateServicesDto } }>,
    reply: FastifyReply,
  ) => {
    const service = await service.create(request.body.service);
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
    await service.update(id, request.body.service);
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

    const deletedCount = await service.deleteOne(id);

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
