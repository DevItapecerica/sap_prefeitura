import { FastifyReply, FastifyRequest } from "fastify";
import { makeApplicationEventContext } from "../../../../infra/http/fastify/application-event-context.js";
import { makeResourceReadEventPublisher } from "../../../../factories/resource-read-events.factory.js";
import { RESOURCE_READ_EVENTS } from "../../../../core/event/resource-read.events.js";
import { SERVICE_EVENTS } from "../../application/events/service.events.js";
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
const resourceReadEventPublisher = makeResourceReadEventPublisher();

export default class ServicesController {
  static readonly getService = async (
    request: FastifyRequest<{ Querystring: ListServicesDto }>,
    reply: FastifyReply,
  ) => {
    const response = await makeListServicesUseCase().execute(request.query);
    await resourceReadEventPublisher.publish(RESOURCE_READ_EVENTS.listed, {
      context: makeApplicationEventContext(request),
      module: "service",
      resourceType: "service",
      filters: request.query,
      returnedCount: response.services.length,
    });
    return reply.status(200).send({
      message: "serviços recuperados com sucesso",
      services: response.services,
      count: response.count,
      ok: true,
    });
  };

  static readonly getOneService = async (
    request: FastifyRequest<{ Params: { id: number } }>,
    reply: FastifyReply,
  ) => {
    const response = await makeGetServiceByIdUseCase().execute(
      Number(request.params.id),
    );
    await resourceReadEventPublisher.publish(RESOURCE_READ_EVENTS.viewed, {
      context: makeApplicationEventContext(request),
      module: "service",
      resourceType: "service",
      resourceId: String(request.params.id),
    });
    return reply.status(200).send({
      message: "serviços recuperados com sucesso",
      services: response.services,
      permissions: response.permissions,
      visibility: response.visibility,
      ok: true,
    });
  };

  static readonly getVisiblesServices = async (
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
    await resourceReadEventPublisher.publish(RESOURCE_READ_EVENTS.listed, {
      context: makeApplicationEventContext(request),
      module: "service",
      resourceType: "service",
      filters: {
        setorId: user.setor_id,
        roleId: user.role_id,
        visible: true,
      },
      returnedCount: services.length,
    });
    return reply.status(200).send({
      message: "serviços recuperados com sucesso",
      services,
      ok: true,
    });
  };

  static readonly createService = async (
    request: FastifyRequest<{ Body: { service: CreateServiceDto } }>,
    reply: FastifyReply,
  ) => {
    const service = await makeCreateServiceUseCase().execute(
      request.body.service,
    );

    await serviceEventPublisher.publish(SERVICE_EVENTS.created, {
      context: makeApplicationEventContext(request),
      service,
    });

    return reply.status(201).send({ service, ok: true });
  };

  static readonly updateService = async (
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

    await serviceEventPublisher.publish(SERVICE_EVENTS.updated, {
      context: makeApplicationEventContext(request),
      before,
      after,
    });

    return reply.status(204).send();
  };

  static readonly deleteService = async (
    request: FastifyRequest<{ Params: { id: number } }>,
    reply: FastifyReply,
  ) => {
    const { before } = await makeDeleteServiceUseCase().execute(
      Number(request.params.id),
    );

    await serviceEventPublisher.publish(SERVICE_EVENTS.deleted, {
      context: makeApplicationEventContext(request),
      before,
    });

    return reply.status(204).send();
  };
}
