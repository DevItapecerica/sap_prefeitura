import { FastifyReply, FastifyRequest } from "fastify";
import { makeApplicationEventContext } from "../../../../infra/http/fastify/application-event-context.js";
import { makeResourceReadEventPublisher } from "../../../../factories/resource-read-events.factory.js";
import { RESOURCE_READ_EVENTS } from "../../../../core/event/resource-read.events.js";
import { ROLE_EVENTS } from "../../application/events/role.events.js";
import { CreateRoleDto } from "../../application/dto/create-role.dto.js";
import { ListRolesDto } from "../../application/dto/list-roles.dto.js";
import { UpdateRoleDto } from "../../application/dto/update-role.dto.js";
import {
  makeCreateRoleUseCase,
  makeDeleteRoleUseCase,
  makeGetRoleByIdUseCase,
  makeListRolesUseCase,
  makeRoleEventPublisher,
  makeUpdateRoleUseCase,
} from "../../factories/role.factories.js";

const roleEventPublisher = makeRoleEventPublisher();
const resourceReadEventPublisher = makeResourceReadEventPublisher();

export default class RolesController {
  static createRole = async (
    request: FastifyRequest<{ Body: { role: CreateRoleDto } }>,
    reply: FastifyReply,
  ) => {
    const role = await makeCreateRoleUseCase().execute(request.body.role);
    await roleEventPublisher.publish(ROLE_EVENTS.created, {
      context: makeApplicationEventContext(request),
      role,
    });
    return reply.status(201).send({
      message: "Role created successfully",
      role,
      ok: true,
    });
  };

  static getRoles = async (
    request: FastifyRequest<{ Querystring: ListRolesDto }>,
    reply: FastifyReply,
  ) => {
    const result = await makeListRolesUseCase().execute(request.query);
    await resourceReadEventPublisher.publish(RESOURCE_READ_EVENTS.listed, {
      context: makeApplicationEventContext(request),
      module: "role",
      resourceType: "role",
      filters: request.query,
      returnedCount: result.roles.length,
    });
    return reply.status(200).send({
      message: "Roles found successfully",
      roles: result.roles,
      count: result.count,
      ok: true,
    });
  };

  static getRoleById = async (
    request: FastifyRequest<{ Params: { id: number } }>,
    reply: FastifyReply,
  ) => {
    const role = await makeGetRoleByIdUseCase().execute(Number(request.params.id));
    await resourceReadEventPublisher.publish(RESOURCE_READ_EVENTS.viewed, {
      context: makeApplicationEventContext(request),
      module: "role",
      resourceType: "role",
      resourceId: String(request.params.id),
    });
    return reply.status(200).send({
      message: "Role found successfully",
      role,
      ok: true,
    });
  };

  static readonly updateRole = async (
    request: FastifyRequest<{
      Params: { id: number };
      Body: { role: UpdateRoleDto };
    }>,
    reply: FastifyReply,
  ) => {
    const { before, after } = await makeUpdateRoleUseCase().execute(
      Number(request.params.id),
      request.body.role,
    );
    await roleEventPublisher.publish(ROLE_EVENTS.updated, {
      context: makeApplicationEventContext(request),
      before,
      after,
    });
    return reply.status(200).send({
      message: "Role updated successfully",
      role: after,
      ok: true,
    });
  };

  static readonly deleteRole = async (
    request: FastifyRequest<{ Params: { id: number } }>,
    reply: FastifyReply,
  ) => {
    const { before } = await makeDeleteRoleUseCase().execute(
      Number(request.params.id),
    );
    await roleEventPublisher.publish(ROLE_EVENTS.deleted, {
      context: makeApplicationEventContext(request),
      before,
    });
    return reply.status(200).send({
      message: "Role deleted successfully",
      ok: true,
    });
  };
}
