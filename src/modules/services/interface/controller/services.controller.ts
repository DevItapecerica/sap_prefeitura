import { FastifyReply, FastifyRequest } from "fastify";
import { makeApplicationEventContext } from "../../../../infra/http/fastify/application-event-context.js";
import { CreateServiceDto } from "../../application/dto/create-service.dto.js";
import { ListServicesDto } from "../../application/dto/list-services.dto.js";
import { ServicePermissionDto } from "../../application/dto/service-permission.dto.js";
import { ServiceVisibilityDto } from "../../application/dto/service-visibility.dto.js";
import { UpdateServiceDto } from "../../application/dto/update-service.dto.js";
import {
  makeCreateServiceUseCase,
  makeDeleteServiceUseCase,
  makeGetServiceByIdUseCase,
  makeListServicesUseCase,
  makeListVisibleServicesUseCase,
  makeServiceEventPublisher,
  makeUpdateServiceUseCase,
} from "../../factories/service.factories.js";

const serviceEventPublisher = makeServiceEventPublisher();

export default class ServicesController {
  static getService = async (
    request: FastifyRequest<{ Querystring: ListServicesDto }>,
    reply: FastifyReply,
  ) => {
    const response = await makeListServicesUseCase().execute(request.query);
    return reply.status(200).send({
      message: "serviços recuperados com sucesso",
      services: response.services,
      count: response.count,
      ok: true,
    });
  };

  static getOneService = async (
    request: FastifyRequest<{ Params: { id: number } }>,
    reply: FastifyReply,
  ) => {
    const response = await makeGetServiceByIdUseCase().execute(
      Number(request.params.id),
    );
    return reply.status(200).send({
      message: "serviços recuperados com sucesso",
      services: response.services,
      permissions: response.permissions,
      visibility: response.visibility,
      ok: true,
    });
  };

  static getVisiblesServices = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => {
    const user = request.user;
    if (user.setor_id === null) {
      return reply.status(403).send({
        message: "Usuário sem setor associado",
        ok: false,
      });
    }

    const services = await makeListVisibleServicesUseCase().execute(
      user.setor_id,
      user.role_id,
    );
    return reply.status(200).send({
      message: "serviços recuperados com sucesso",
      services,
      ok: true,
    });
  };

  static createService = async (
    request: FastifyRequest<{ Body: { service: CreateServiceDto } }>,
    reply: FastifyReply,
  ) => {
    const service = await makeCreateServiceUseCase().execute(
      request.body.service,
    );

    await serviceEventPublisher.publishCreated({
      context: makeApplicationEventContext(request),
      service,
    });

    return reply.status(201).send({ service, ok: true });
  };

  static updateService = async (
    request: FastifyRequest<{
      Params: { id: number };
      Body: {
        service: UpdateServiceDto;
        permissions?: ServicePermissionDto[];
        visibility?: ServiceVisibilityDto[];
      };
    }>,
    reply: FastifyReply,
  ) => {
    const { before, after } = await makeUpdateServiceUseCase().execute(
      Number(request.params.id),
      request.body.service,
      request.body.permissions,
      request.body.visibility,
    );

    await serviceEventPublisher.publishUpdated({
      context: makeApplicationEventContext(request),
      before,
      after,
    });

    return reply.status(204).send();
  };

  static deleteService = async (
    request: FastifyRequest<{ Params: { id: number } }>,
    reply: FastifyReply,
  ) => {
    const { before } = await makeDeleteServiceUseCase().execute(
      Number(request.params.id),
    );

    await serviceEventPublisher.publishDeleted({
      context: makeApplicationEventContext(request),
      before,
    });

    return reply.status(204).send();
  };
}
