import { FastifyReply, FastifyRequest } from "fastify";
import AtletaService from "../../application/use-case/atleta.service.js";
import { CreateAtletaDto, QueryAtletaDto, UpdateAtletaDto } from "../../application/dto/atleta.dto.js";

export default class AtletaController {
  constructor(private atletaService: AtletaService) {}

  create = async (request: FastifyRequest<{ Body: CreateAtletaDto }>, reply: FastifyReply) => {
    const response = await this.atletaService.createAtleta(
      request.body,
      request.user.id,
    );

    return reply.status(201).send({ message: "Created successfully", data: response, ok: true });
  };

  findAll = async (request: FastifyRequest<{ Querystring: QueryAtletaDto }>, reply: FastifyReply) => {
    const response = await this.atletaService.findAllAtletas(request.query);

    return reply.status(200).send({ message: "Retrieved successfully", data: response.atletas, count: response.count, ok: true });
  };

  findOne = async (request: FastifyRequest<{ Params: { uuid: string } }>, reply: FastifyReply) => {
    const response = await this.atletaService.findOneAtleta(request.params.uuid);

    return reply.status(200).send({ message: "Retrieved successfully", data: response, ok: true });
  };

  update = async (
    request: FastifyRequest<{ Params: { uuid: string }; Body: UpdateAtletaDto }>,
    reply: FastifyReply,
  ) => {
    const response = await this.atletaService.updateAtleta(request.params.uuid, request.body);

    return reply.status(200).send({ message: "Updated successfully", data: response, ok: true });
  };

  delete = async (request: FastifyRequest<{ Params: { uuid: string } }>, reply: FastifyReply) => {
    const deleted = await this.atletaService.deleteAtleta(request.params.uuid);

    return reply.status(200).send({ message: "Deleted successfully", data: { deleted }, ok: true });
  };

  createCarteirinha = async (request: FastifyRequest<{ Params: { uuid: string } }>, reply: FastifyReply) => {
    const response = await this.atletaService.createCarteirinha(
      request.params.uuid,
      request.user.id,
    );

    return reply.status(201).send({ message: "Carteirinha created successfully", data: response, ok: true });
  };
}
