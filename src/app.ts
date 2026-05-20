import { FastifyPluginAsync } from "fastify";

import userModule from "./modules/user/index.js";
import authModule from "./modules/auth/index.js";
import setorModule from "./modules/setor/index.js";
import ServiceModule from "./modules/services/index.js";
import RolesModule from "./modules/roles/index.js";
import PermissionModule from "./modules/permission/index.js";
import { registerAccessControlEvents } from "./modules/acess-controll/events/index.js";
import { frenteDeTrabalhoModule } from "./modules/frente-de-trabalho/index.js";
import CarterinhasModule from "./modules/carterinhas/index.js";
import MunicipeModule from "./modules/municipe/index.js";
import chamadosModule from "./modules/chamados/index.js";

const App: FastifyPluginAsync = async (fastify) => {
  await fastify.register(userModule);
  fastify.log.info("User Module Registrado");

  await fastify.register(setorModule);
  fastify.log.info("Setor Module Registrado");

  await fastify.register(ServiceModule);
  fastify.log.info("Service Module Registrado");

  await fastify.register(RolesModule);
  fastify.log.info("Roles Module Registrado");

  await fastify.register(PermissionModule);
  fastify.log.info("Permission Module Registrado");

  await fastify.register(frenteDeTrabalhoModule);
  fastify.log.info("Frente de Trabalho Module Registrado");

  await fastify.register(MunicipeModule);
  fastify.log.info("Municipe Module Registrado");

  await fastify.register(CarterinhasModule);
  fastify.log.info("Carteirinhas Module Registrado");

  await fastify.register(chamadosModule);
  fastify.log.info("Chamados Module Registrado");

  await fastify.register(authModule);
  fastify.log.info("Auth Module Registrado");

  fastify.register(registerAccessControlEvents)
  fastify.log.info("Access Control Events Registrado");
};

export default App;
