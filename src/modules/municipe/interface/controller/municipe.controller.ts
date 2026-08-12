import { FastifyReply, FastifyRequest } from "fastify";
import { QueryParams } from "../../../../core/types/genericTypes.js";
import { SequelizeMunicipeRepository } from "../../../../infra/database/sequelize/repositories/sequelize.municipe.repository.js";
import getMunicipeUseCase from "../../application/usecase/getMunicipe.use-case.js";
import MunicipePresentation from "../presentation/municipe.masked.presentation.js";
import Municipe from "../../domain/entity/Municipe.js";
import { MunicipeDto, updateMunicipeDto } from "../../application/dto/municipe.dto.js";
import createMunicipeUseCase from "../../application/usecase/createMunicipe.use-case.js";
import getMunicipeByIdUseCase from "../../application/usecase/getMunicipeById.use-case.js";
import updateMunicipeUseCase from "../../application/usecase/updateMunicipe.use-case.js";
import AesCryptService from "../../../../core/security/aes/AesCrypt.service.js";
import Sha256CryptService from "../../../../core/security/sha256/sha256.service.js";
import { makeResourceReadEventPublisher } from "../../../../factories/resource-read-events.factory.js";
import { makeApplicationEventContext } from "../../../../infra/http/fastify/application-event-context.js";
import { makeMunicipeEventPublisher } from "../../factories/municipe-events.factory.js";
import { RESOURCE_READ_EVENTS } from "../../../../core/event/resource-read.events.js";
import { MUNICIPE_EVENTS } from "../../application/events/municipe.events.js";

const resourceReadEventPublisher = makeResourceReadEventPublisher();
const municipeEventPublisher = makeMunicipeEventPublisher();

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

    const useCase = new getMunicipeUseCase(
      new SequelizeMunicipeRepository(),
      new AesCryptService(),
      new Sha256CryptService(),
    );

    const response = await useCase.execute(query);

    const maskedResponse = response.municipe.map((municipe: Municipe) =>
      MunicipePresentation.Masked(municipe),
    );
    await resourceReadEventPublisher.publish(RESOURCE_READ_EVENTS.listed, {
      context: makeApplicationEventContext(request),
      module: "municipe",
      resourceType: "municipe",
      filters: query,
      returnedCount: maskedResponse.length,
    });

    return reply.status(200).send({
      message: "Retrivied sucessfully",
      data: maskedResponse,
      count: response.count,
      ok: true,
    });
  }

  static async getMunicipeById(
    request: FastifyRequest<{ Params: { uuid: string } }>,
    reply: FastifyReply,
  ) {
    const uuid = request.params.uuid;

    const useCase = new getMunicipeByIdUseCase(
      new SequelizeMunicipeRepository(),
      new AesCryptService(),
      new Sha256CryptService(),
    );

    const response = await useCase.execute(uuid);

    const maskedResponse = MunicipePresentation.Masked(response);
    await resourceReadEventPublisher.publish(RESOURCE_READ_EVENTS.viewed, {
      context: makeApplicationEventContext(request),
      module: "municipe",
      resourceType: "municipe",
      resourceId: uuid,
    });

    return reply.status(200).send({
      message: "Retrivied sucessfully",
      data: maskedResponse,
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
      new AesCryptService(),
      new Sha256CryptService(),
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

    const { municipe: response, protected: after } =
      await useCase.execute(payload, String(user.id));
    await municipeEventPublisher.publish(MUNICIPE_EVENTS.created, {
      context: makeApplicationEventContext(request),
      after,
    });

    const maskedResponse = MunicipePresentation.Masked(response);

    return reply.status(201).send({
      message: "Municipe created sucessfully",
      data: maskedResponse,
      ok: true,
    });
  }

  static async updateMunicipe(
    request: FastifyRequest<{ Body: updateMunicipeDto; Params: { uuid: string } }>,
    reply: FastifyReply,
  ) {
    const user = request.user;
    const municipe = request.body;
    const useCase = new updateMunicipeUseCase(
      new SequelizeMunicipeRepository(),
      new AesCryptService(),
      new Sha256CryptService(),
    );

    const uuid = request.params.uuid;

    const payload = Object.fromEntries(
      Object.entries({
        nascimento: municipe.nascimento,
        telefone: municipe.telefone,
        rua: municipe.rua,
        bairro: municipe.bairro,
        cidade: municipe.cidade,
        uf: municipe.uf,
        cep: municipe.cep,
        numero: municipe.numero,
        complemento: municipe.complemento,
      }).filter(([, value]) => value !== undefined),
    ) as updateMunicipeDto;

    const { municipe: response, before, after } =
      await useCase.execute(uuid, payload, user.id);
    await municipeEventPublisher.publish(MUNICIPE_EVENTS.updated, {
      context: makeApplicationEventContext(request),
      before,
      after,
    });

    const maskedResponse = MunicipePresentation.Masked(response);

    return reply.status(200).send({
      message: "Municipe updated sucessfully",
      data: maskedResponse,
      ok: true,
    });
  }
}
