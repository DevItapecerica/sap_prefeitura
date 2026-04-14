import { FastifyPluginAsync } from "fastify";

import userModule from "./modules/user/index.js"
import authModule from "./modules/auth/index.js";
import setorModule from "./modules/setor/index.js";

const App: FastifyPluginAsync = async (fastify) => {
    await fastify.register(userModule);
    fastify.log.info("User Module Registrado");

    await fastify.register(setorModule);
    fastify.log.info("Setor Module Registrado");

    await fastify.register(authModule);
    fastify.log.info("Auth Module Registrado");
};

export default App;