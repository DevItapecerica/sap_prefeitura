import { FastifyReply, FastifyRequest } from "fastify";
import { ApplicationEventContext } from "../../../../core/event/application-event.js";
import { CreateServiceDto } from "../../application/dto/create-service.dto.js";
import { ListServicesDto } from "../../application/dto/list-services.dto.js";
import { ServicePermissionDto } from "../../application/dto/service-permission.dto.js";
import { ServiceVisibilityDto } from "../../application/dto/service-visibility.dto.js";
import { UpdateServiceDto } from "../../application/dto/update-service.dto.js";
import { makeCreateServiceUseCase } from "../../factories/make-create-service-use-case.factory.js";
import { makeDeleteServiceUseCase } from "../../factories/make-delete-service-use-case.factory.js";
import { makeGetServiceByIdUseCase } from "../../factories/make-get-service-by-id-use-case.factory.js";
import { makeListServicesUseCase } from "../../factories/make-list-services-use-case.factory.js";
import { makeListVisibleServicesUseCase } from "../../factories/make-list-visible-services-use-case.factory.js";
import { makeServiceEventPublisher } from "../../factories/make-service-event-publisher.factory.js";
import { makeUpdateServiceUseCase } from "../../factories/make-update-service-use-case.factory.js";

const eventContext = (request: FastifyRequest): ApplicationEventContext => ({
  correlationId: request.id,
  actor: {
    id: request.user.id,
    name: request.user.name,
    roleId: request.user.role_id,
    setorId: request.user.setor_id,
  },
  origin: {
    type: "HTTP",
    ip: request.ip,
    method: request.method,
    route: request.routeOptions.url ?? request.url.split("?")[0],
  },
});

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
      context: eventContext(request),
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
      context: eventContext(request),
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
      context: eventContext(request),
      before,
    });

    return reply.status(204).send();
  };
}
