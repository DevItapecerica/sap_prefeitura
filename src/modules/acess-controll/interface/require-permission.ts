import type { FastifyRequest } from "fastify";
import type { PermissionAuthorizer } from "../application/authorization.usecase.js";

declare module "fastify" {
  interface FastifyInstance { permissionAuthorizer?: PermissionAuthorizer }
}
export type PermissionGuard = ((request: FastifyRequest<any>) => Promise<void>) & { permission: { module: string; action: string } };
export const requirePermission = (module: string) => (action: string): PermissionGuard => {
  const guard = async (request: FastifyRequest<any>) => {
    const authorizer = request.server.permissionAuthorizer ??
      (await import("../factories/makeAuthorization.js")).authorizationFactory(request.log);
    try {
      await authorizer.authorize(Number(request.user.id), module, action);
    } catch (error) {
      if ((error as {statusCode?: number}).statusCode === 500)
        request.log.error({ module, action }, "Invalid permission configuration");
      throw error;
    }
  };
  return Object.assign(guard, {permission: {module, action}}) as PermissionGuard;
};
