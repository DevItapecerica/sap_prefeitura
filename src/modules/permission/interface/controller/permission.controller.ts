import { FastifyReply, FastifyRequest } from "fastify";
import { makeApplicationEventContext } from "../../../../infra/http/fastify/application-event-context.js";
import { makeResourceReadEventPublisher } from "../../../../factories/resource-read-events.factory.js";
import { RESOURCE_READ_EVENTS } from "../../../../core/event/resource-read.events.js";
import { PERMISSION_EVENTS } from "../../application/events/permission.events.js";
import { ListPermissionsDto } from "../../application/dto/list-permissions.dto.js";
import { UpdatePermissionDto } from "../../application/dto/update-permission.dto.js";
import {
  makeGetPermissionByIdUseCase,
  makeListPermissionsUseCase,
  makePermissionEventPublisher,
  makeUpdatePermissionUseCase,
} from "../../factories/permission.factories.js";

const permissionEventPublisher = makePermissionEventPublisher();
const resourceReadEventPublisher = makeResourceReadEventPublisher();

export default class PermissionController {
  static getPermissions = async (
    request: FastifyRequest<{ Querystring: ListPermissionsDto }>,
    reply: FastifyReply,
  ) => {
    const result = await makeListPermissionsUseCase().execute(request.query);
    await resourceReadEventPublisher.publish(RESOURCE_READ_EVENTS.listed, {
      context: makeApplicationEventContext(request),
      module: "permission",
      resourceType: "permission",
      filters: request.query,
      returnedCount: result.permissions.length,
    });
    return reply.status(200).send({
      message: "Permissões recuperadas com sucesso",
      permission: result.permissions,
      count: result.count,
      ok: true,
    });
  };

  static getOnePermission = async (
    request: FastifyRequest<{ Params: { id: number } }>,
    reply: FastifyReply,
  ) => {
    const permission = await makeGetPermissionByIdUseCase().execute(
      Number(request.params.id),
    );
    await resourceReadEventPublisher.publish(RESOURCE_READ_EVENTS.viewed, {
      context: makeApplicationEventContext(request),
      module: "permission",
      resourceType: "permission",
      resourceId: String(request.params.id),
    });
    return reply.status(200).send({
      message: "Permissão recuperada com sucesso",
      permission,
      ok: true,
    });
  };

  static updatePermission = async (
    request: FastifyRequest<{
      Params: { id: number };
      Body: { permission: UpdatePermissionDto };
    }>,
    reply: FastifyReply,
  ) => {
    const { before, after } = await makeUpdatePermissionUseCase().execute(
      Number(request.params.id),
      request.body.permission,
    );
    await permissionEventPublisher.publish(PERMISSION_EVENTS.updated, {
      context: makeApplicationEventContext(request),
      before,
      after,
    });
    return reply.status(200).send({
      message: "Permissão atualizada com sucesso",
      permission: after,
      ok: true,
    });
  };
}
