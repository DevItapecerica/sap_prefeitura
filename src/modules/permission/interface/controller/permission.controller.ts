import { FastifyReply, FastifyRequest } from "fastify";
import { QueryParams } from "../../../../core/shared/types/genericTypes.js";
import { makePermission } from "../../factories/makePermission.js";
import {
  CreatePermissionsDto,
  UpdatePermissionsDto,
} from "../../application/dto/permissions.dto.js";

export default class PermissionController {
  static async getPermissions(
    request: FastifyRequest<{ Querystring: QueryParams }>,
    response: FastifyReply,
  ) {
    const service = makePermission(request.log);
    const query = {
      page: request.query.page,
      limit: request.query.limit,
      search: request.query.search,
      order: request.query.order,
    };

    const reponse = await service.getAllPermissions(query);
    response
      .status(200)
      .send({
        message: "Permissões recuperadas com sucesso",
        permission: reponse.permissions,
        count: reponse.count,
        ok: true,
      });
  }

  static async getOnePermission(
    request: FastifyRequest<{ Params: { id: string } }>,
    response: FastifyReply,
  ) {
    const service = makePermission(request.log);
    const id = parseInt(request.params.id);
    const reponse = await service.getOnePermissions(id);
    response
      .status(200)
      .send({ message: "Permissão recuperada com sucesso", permission: reponse, ok: true });
  }

  static async updatePermission(
    request: FastifyRequest<{
      Params: { id: string };
      Body: { permission: UpdatePermissionsDto };
    }>,
    response: FastifyReply,
  ) {
    const service = makePermission(request.log);
    const id = parseInt(request.params.id);
    const data = {
      read: request.body.permission.read,
      write: request.body.permission.write,
      edit: request.body.permission.edit,
      del: request.body.permission.del,
    };
    const reponse = await service.updatePermission(id, data);
    response
      .status(200)
      .send({ message: "Permissão atualizada com sucesso", permission: reponse, ok: true });
  }
}
