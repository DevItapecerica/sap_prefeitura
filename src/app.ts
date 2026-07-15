import { FastifyPluginAsync } from "fastify";

import userModule from "./modules/user/index.js";
import authModule from "./modules/auth/index.js";
import setorModule from "./modules/setor/index.js";
import ServiceModule from "./modules/services/index.js";
import RolesModule from "./modules/roles/index.js";
import PermissionModule from "./modules/permission/index.js";
import { registerAccessControlEvents } from "./modules/acess-controll/events/index.js";
import MunicipeModule from "./modules/municipe/index.js";
import EsporteModule from "./modules/esporte/index.js";
import FtEditalModule from "./modules/ft-edital/index.js";
import FtBolsistaModule from "./modules/ft-bolsista/index.js";
import FtRelatorioModule from "./modules/ft-relatorio/index.js";
import AuditModule from "./modules/audit/index.js";

const App: FastifyPluginAsync = async (fastify) => {
  await fastify.register(AuditModule);
  fastify.log.info("Audit Module Registrado");
  
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

  await fastify.register(FtEditalModule);
  fastify.log.info("FTEdital Module Registrado");

  await fastify.register(FtBolsistaModule);
  fastify.log.info("FTBolsista Module Registrado");

  await fastify.register(FtRelatorioModule);
  fastify.log.info("FTRelatorio Module Registrado");

  await fastify.register(MunicipeModule);
  fastify.log.info("Municipe Module Registrado");


  await fastify.register(EsporteModule);
  fastify.log.info("Esporte Module Registrado");

  await fastify.register(authModule);
  fastify.log.info("Auth Module Registrado");

  fastify.register(registerAccessControlEvents);
  fastify.log.info("Access Control Events Registrado");
};

export default App;
