import { FastifyReply, FastifyRequest } from "fastify";
import GetCarterinhaUseCase from "../../application/use-case/getCarterinha.use-case.js";
import { QueryCarterinhasDto } from "../../application/dto/queryCarterinhas.dto.js";
import { SequelizeCarterinhaRepository } from "../../../../infra/database/sequelize/repositories/sequelize.carterinha.repository.js";
import CreateCarterinhaUseCase from "../../application/use-case/createCarterinha.use-case.js";
import { SequelizeMunicipeRepository } from "../../../../infra/database/sequelize/repositories/sequelize.municipe.repository.js";
import { SequelizeSetorRepository } from "../../../../infra/database/sequelize/repositories/sequelize.setor.repository.js";
import { PostCarterinhaDto } from "../../application/dto/carterinha.dto.js";
import GetOneCarterinhaUseCase from "../../application/use-case/getOneCarterinha.use-case.js";

export class CarterinhasController {
    static getCarterinhas = async (request: FastifyRequest<{Querystring: QueryCarterinhasDto}>, reply: FastifyReply) => {
        const useCase = new GetCarterinhaUseCase( new SequelizeCarterinhaRepository() ); 
        
        const response = await useCase.execute(request.query);
        return reply.status(200).send({message: "Retrivied sucessfully", data: response.carterinhas || [], count: response.count, ok: true});
    }

    static getOneCarterinha = async (request: FastifyRequest<{Params: {uuid: number | string}}>, reply: FastifyReply) => {
        const useCase = new GetOneCarterinhaUseCase( new SequelizeCarterinhaRepository() ); 

        const uuid = request.params.uuid;
        
        const response = await useCase.execute(uuid);
        return reply.status(200).send({message: "Retrivied sucessfully", data: response, ok: true});
    }

    static postCarterinha = async (request: FastifyRequest<{Body: PostCarterinhaDto}>, reply: FastifyReply) => {
        const useCase = new CreateCarterinhaUseCase( new SequelizeMunicipeRepository(), new SequelizeSetorRepository(), new SequelizeCarterinhaRepository() ); 

        const payload = {
            municipe_uuid: request.body.municipe_uuid,
            setor_uuid: request.body.setor_uuid,
            atividade_uuid: request.body.atividade_uuid,
        }

        const response = await useCase.execute(payload);
        
        return reply.status(201).send({message: "Created sucessfully", data: response, ok: true});

    }
}
