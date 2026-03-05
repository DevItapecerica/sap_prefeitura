import { FastifyPluginAsync } from "fastify";

import userModule from "./modules/user/index.js"
import authModule from "./modules/auth/index.js";

const App: FastifyPluginAsync = async (fastify, opts) => {
    fastify.register(userModule, opts);
    fastify.log.info("User Module Registrado");

    fastify.register(authModule)
    fastify.log.info("Auth Module Registrado");
};

export default App;