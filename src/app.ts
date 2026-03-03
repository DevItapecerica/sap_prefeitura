import { FastifyPluginAsync } from "fastify";

import userModule from "./modules/user/index.js"

const App: FastifyPluginAsync = async (fastify, opts) => {
    fastify.register(userModule, opts);
};

export default App;