import { FastifyReply, FastifyRequest } from "fastify";
import ModalidadeService from "../../application/use-case/modalidade.service.js";
import {
  CreateModalidadeDto,
  QueryModalidadeDto,
  UpdateModalidadeDto,
} from "../../application/dto/modalidade.dto.js";

export default class ModalidadeController {
  constructor(private modalidadeService: ModalidadeService) {}

  create = async (
    request: FastifyRequest<{ Body: CreateModalidadeDto }>,
    reply: FastifyReply,
  ) => {
    const response = await this.modalidadeService.createModalidade(
      request.body,
    );

    return reply.status(201).send({
      message: "Created successfully",
      data: response,
      ok: true,
    });
  };

  findAll = async (
    request: FastifyRequest<{ Querystring: QueryModalidadeDto }>,
    reply: FastifyReply,
  ) => {
    const response = await this.modalidadeService.findAllModalidades(
      request.query,
    );

    return reply.status(200).send({
      message: "Retrieved successfully",
      data: response.modalidades,
      count: response.count,
      ok: true,
    });
  };

  findOne = async (
    request: FastifyRequest<{ Params: { uuid: string } }>,
    reply: FastifyReply,
  ) => {
    const response = await this.modalidadeService.findOneModalidade(
      request.params.uuid,
    );

    return reply.status(200).send({
      message: "Retrieved successfully",
      data: response,
      ok: true,
    });
  };

  update = async (
    request: FastifyRequest<{
      Params: { uuid: string };
      Body: UpdateModalidadeDto;
    }>,
    reply: FastifyReply,
  ) => {
    const response = await this.modalidadeService.updateModalidade(
      request.params.uuid,
      request.body,
    );

    return reply.status(200).send({
      message: "Updated successfully",
      data: response,
      ok: true,
    });
  };

  delete = async (
    request: FastifyRequest<{ Params: { uuid: string } }>,
    reply: FastifyReply,
  ) => {
    const deleted = await this.modalidadeService.deleteModalidade(
      request.params.uuid,
    );

    return reply
      .status(200)
      .send({ message: "Deleted successfully", data: { deleted }, ok: true });
  };
}
