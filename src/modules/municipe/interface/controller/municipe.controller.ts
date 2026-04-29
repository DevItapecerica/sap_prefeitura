import { FastifyReply, FastifyRequest } from "fastify";
import { QueryParams } from "../../../../core/shared/types/genericTypes.js";
import { SequelizeMunicipeRepository } from "../../../../infra/database/sequelize/repositories/sequelize.municipe.repository.js";
import getMunicipeUseCase from "../../application/usecase/getMunicipe.use-case.js";
import MunicipePresentation from "../presentation/municipe.masked.presentation.js";
import Municipe from "../../domain/entity/Municipe.js";
import { MunicipeDto } from "../../application/dto/municipe.dto.js";
import createMunicipeUseCase from "../../application/usecase/createMunicipe.use-case.js";
import getMunicipeByIdUseCase from "../../application/usecase/getMunicipeById.use-case.js";
import updateMunicipeUseCase from "../../application/usecase/updateMunicipe.use-case.js";

export default class municipeController {
  static async getMunicipe(
    request: FastifyRequest<{ Querystring: QueryParams }>,
    reply: FastifyReply,
  ) {
    const query = {
      page: request.query.page,
      limit: request.query.limit,
      search: request.query.search,
      order: request.query.order,
    };

    const useCase = new getMunicipeUseCase(new SequelizeMunicipeRepository());

    const response = await useCase.execute(query);

    const maskedResponse = response.municipe.map((municipe: Municipe) =>
      MunicipePresentation.Masked(municipe),
    );

    return reply.status(200).send({
      message: "Retrivied sucessfully",
      municipe: response,
      count: response.count,
      ok: true,
    });
  }

  static async getMunicipeById(
    request: FastifyRequest<{ Params: { uuid: string } }>,
    reply: FastifyReply,
  ) {
    const uuid = request.params.uuid;

    const useCase = new getMunicipeByIdUseCase(new SequelizeMunicipeRepository());

    const response = await useCase.execute(uuid);

    const maskedResponse = MunicipePresentation.Masked(response);

    return reply.status(200).send({
      message: "Retrivied sucessfully",
      municipe: maskedResponse,
      ok: true,
    });
  }

  static async postMunicipe(
    request: FastifyRequest<{ Body: MunicipeDto }>,
    reply: FastifyReply,
  ) {
    const user = request.user;
    const municipe = request.body;
    const useCase = new createMunicipeUseCase(
      new SequelizeMunicipeRepository(),
    );

    const payload = {
      nome: municipe.nome,
      cpf: municipe.cpf,
      nascimento: municipe.nascimento,
      telefone: municipe.telefone,
      rua: municipe.rua,
      bairro: municipe.bairro,
      cidade: municipe.cidade,
      uf: municipe.uf,
      cep: municipe.cep,
      numero: municipe.numero,
      complemento: municipe.complemento,
    };

    const response = await useCase.execute(payload, String(user.id));

    const maskedResponse = MunicipePresentation.Masked(response);

    return reply.status(201).send({
      message: "Municipe created sucessfully",
      municipe: maskedResponse,
      ok: true,
    });
  }

    static async updateMunicipe(
    request: FastifyRequest<{ Body: MunicipeDto, Params: { uuid: string } }>,
    reply: FastifyReply,
  ) {
    const user = request.user;
    const municipe = request.body;
    const useCase = new updateMunicipeUseCase(
      new SequelizeMunicipeRepository(),
    );

    const uuid = request.params.uuid

    const payload = {
      nome: municipe.nome,
      cpf: municipe.cpf,
      nascimento: municipe.nascimento,
      telefone: municipe.telefone,
      rua: municipe.rua,
      bairro: municipe.bairro,
      cidade: municipe.cidade,
      uf: municipe.uf,
      cep: municipe.cep,
      numero: municipe.numero,
      complemento: municipe.complemento,
    };

    const response = await useCase.execute(uuid, payload, user.id);

    const maskedResponse = MunicipePresentation.Masked(response);

    return reply.status(201).send({
      message: "Municipe created sucessfully",
      municipe: maskedResponse,
      ok: true,
    });
  }
}
