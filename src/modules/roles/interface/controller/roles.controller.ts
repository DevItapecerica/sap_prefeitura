import { FastifyReply, FastifyRequest } from "fastify";
import { CreateRoleDto, UpdateRoleDto } from "../../application/dto/roles.dto.js";
import { makeRoles } from "../../factories/makeRoles.js";
import { QueryParams } from "../../../../core/shared/types/genericTypes.js";
import AppError from "../../../../core/appError.js";


export default class RolesController {
  static createRole = async (
    request: FastifyRequest<{ Body: { role: CreateRoleDto } }>,
    reply: FastifyReply,
  ) => {
    const service = makeRoles(request.log);
    const data = request.body.role;

    const response = await service.createRole(data);

    // const { services } = request.body;

    // const role = await db.Roles.create({ name });

    // Cria permissões associadas ao novo role
    // await Promise.all(
    //   services.map((service) =>
    //     db.Permissions.create({
    //       service_id: service.id,
    //       role_id: role.id,
    //       read: false,
    //       write: false,
    //       edit: false,
    //       del: false,
    //     }),
    //   ),
    // );

    reply
      .status(201)
      .send({ message: "Role created successfully", role: response, ok: true });
  };

  // READ: Obter todos os roles
  static getRoles = async (
    request: FastifyRequest<{ Querystring: QueryParams }>,
    reply: FastifyReply,
  ) => {
    const query = {
      page: request.query.page,
      limit: request.query.limit,
      search: request.query.search,
      order: request.query.order
    };

    const service = makeRoles(request.log);

    const response = await service.getAllRoles(query);

    reply.status(200).send({message: "Roles found successfully", roles: response.roles, count: response.count, ok: true });
  };

  // READ: Obter role por ID
  static getRoleById = async (
    request: FastifyRequest<{ Params: { id: number } }>,
    reply: FastifyReply,
  ) => {
    const { id } = request.params;
    const service = makeRoles(request.log);

    const role = await service.getOneRole(id);

    reply.status(200).send({message: "Role found successfully", role, ok: true });
  };

  // UPDATE: Atualizar role
  static updateRole = async (request: FastifyRequest<{ Params: { id: number }, Body: { role: UpdateRoleDto } }>, reply: FastifyReply) => {
    const { id } = request.params;
    const role = request.body.role;

    const service = makeRoles(request.log);

    const response = await service.updateRole(id, role);

    if (!response) {
      throw new AppError("Role not found", 404, "NOT_FOUND");
    }

    reply.status(200).send({ message: "Role updated successfully", role: response, ok: true });
  };

  // DELETE: Deletar role
  static deleteRole = async (request: FastifyRequest<{ Params: { id: number } }>, reply: FastifyReply) => {
    const { id } = request.params;

    const service = makeRoles(request.log);

    await service.deleteOneRole(id);

    reply.status(200).send({ message: "Role deleted successfully", ok: true });
  };
}
