import { FastifyReply, FastifyRequest } from "fastify";
import { makeApplicationEventContext } from "../../../../infra/http/fastify/application-event-context.js";
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

export default class RolesController {
  static createRole = async (
    request: FastifyRequest<{ Body: { role: CreateRoleDto } }>,
    reply: FastifyReply,
  ) => {
    const role = await makeCreateRoleUseCase().execute(request.body.role);
    await roleEventPublisher.publishCreated({
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
    return reply.status(200).send({
      message: "Role found successfully",
      role,
      ok: true,
    });
  };

  static updateRole = async (
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
    await roleEventPublisher.publishUpdated({
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

  static deleteRole = async (
    request: FastifyRequest<{ Params: { id: number } }>,
    reply: FastifyReply,
  ) => {
    const { before } = await makeDeleteRoleUseCase().execute(
      Number(request.params.id),
    );
    await roleEventPublisher.publishDeleted({
      context: makeApplicationEventContext(request),
      before,
    });
    return reply.status(200).send({
      message: "Role deleted successfully",
      ok: true,
    });
  };
}
