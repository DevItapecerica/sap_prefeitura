import { FastifyReply, FastifyRequest } from "fastify";
import { makeApplicationEventContext } from "../../../../infra/http/fastify/application-event-context.js";
import { makeResourceReadEventPublisher } from "../../../../factories/resource-read-events.factory.js";
import { RESOURCE_READ_EVENTS } from "../../../../core/event/resource-read.events.js";
import { SERVICE_EVENTS } from "../../application/events/service.events.js";
import { ListServicesDto } from "../../application/dto/list-services.dto.js";
import { UpdateServiceDto } from "../../application/dto/update-service.dto.js";
import {
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
      visibility: response.visibility,
      ok: true,
    });
  };

  static readonly getVisiblesServices = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => {
    const services = await makeListVisibleServicesUseCase().execute(Number(request.user.id));
    await resourceReadEventPublisher.publish(RESOURCE_READ_EVENTS.listed, {
      context: makeApplicationEventContext(request), module: "service", resourceType: "service",
      filters: {visible: true}, returnedCount: services.length,
    });
    return reply.status(200).send({
      message: "serviços recuperados com sucesso",
      services,
      ok: true,
    });
  };


  static readonly updateService = async (
    request: FastifyRequest<{
      Params: { id: number };
      Body: UpdateServiceDto;
    }>,
    reply: FastifyReply,
  ) => {
    const { before, after } = await makeUpdateServiceUseCase().execute(
      Number(request.params.id),
      request.body.service,
      request.body.visibility,
    );

    await serviceEventPublisher.publish(SERVICE_EVENTS.updated, {
      context: makeApplicationEventContext(request),
      before,
      after,
    });

    return reply.status(204).send();
  };

}
