import { FastifyRequest } from "fastify";
import { ApplicationEventContext } from "../../../core/event/application-event.js";

export const makeApplicationEventContext = (
  request: FastifyRequest,
): ApplicationEventContext => ({
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
