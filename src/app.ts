import { FastifyPluginAsync } from "fastify";

import userModule from "./modules/user/index.js"

const App: FastifyPluginAsync = async (fastify, opts) => {
    fastify.register(userModule, opts);
    fastify.log.info("User Module Registrado");
};

export default App;