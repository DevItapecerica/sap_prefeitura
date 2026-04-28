import { FastifyReply, FastifyRequest } from "fastify";
import { QueryParams } from "../../../../core/shared/types/genericTypes.js";
import { SequelizeMunicipeRepository } from "../../../../infra/database/sequelize/repositories/sequelize.municipe.repository.js";
import getMunicipeUseCase from "../../application/usecase/getMunicipe.use-case.js";

export default class municipeController {

    static async getMunicipe(request: FastifyRequest<{Querystring: QueryParams}>, reply: FastifyReply) {
        const query = {
            page: request.query.page,
            limit: request.query.limit,
            search: request.query.search,
            order: request.query.order
        };

        const useCase = new getMunicipeUseCase(new SequelizeMunicipeRepository)

        const response = await useCase.execute(query)
            
        return reply.status(200).send({message: "Retrivied sucessfully", municipe: response.municipe, count: response.count, ok: true})

    }
}