import { FastifyReply, FastifyRequest } from "fastify";
import AtletaService from "../../application/use-case/atleta.service.js";
import {
  AddModalidadeAtletaDto,
  CreateCarteirinhaAtletaDto,
  CreateAtletaDto,
  QueryAtletaDto,
  UpdateAtletaDto,
} from "../../application/dto/atleta.dto.js";
import { QueryCarterinhaEsporteDto } from "../../../carterinha-esporte/application/dto/queryCarterinhaEsporte.dto.js";
import AtletaPresentation from "../presentation/atleta.presentation.js";

export default class AtletaController {
  constructor(private atletaService: AtletaService) {}

  create = async (
    request: FastifyRequest<{ Body: CreateAtletaDto }>,
    reply: FastifyReply,
  ) => {
    const response = await this.atletaService.createAtleta(
      request.body,
      request.user.id,
    );

    return reply
      .status(201)
      .send({
        message: "Created successfully",
        data: AtletaPresentation.Masked(response),
        ok: true,
      });
  };

  findAll = async (
    request: FastifyRequest<{ Querystring: QueryAtletaDto }>,
    reply: FastifyReply,
  ) => {
    const response = await this.atletaService.findAllAtletas(request.query);

    return reply
      .status(200)
      .send({
        message: "Retrieved successfully",
        data: AtletaPresentation.MaskedList(response.atletas),
        count: response.count,
        ok: true,
      });
  };

  findCarteirinhas = async (
    request: FastifyRequest<{
      Querystring: QueryCarterinhaEsporteDto;
    }>,
    reply: FastifyReply,
  ) => {
    const response = await this.atletaService.findCarteirinhasEsporte(
      request.query,
    );

    return reply
      .status(200)
      .send({
        message: "Retrieved successfully",
        data: response.carterinhas,
        count: response.count,
        ok: true,
      });
  };

  findCarteirinhasByAtleta = async (
    request: FastifyRequest<{
      Params: { uuid: string };
      Querystring: QueryCarterinhaEsporteDto;
    }>,
    reply: FastifyReply,
  ) => {
    const response = await this.atletaService.findCarteirinhasByAtleta(
      request.params.uuid,
      request.query,
    );

    return reply
      .status(200)
      .send({
        message: "Retrieved successfully",
        data: response.carterinhas,
        count: response.count,
        ok: true,
      });
  };

  findOne = async (
    request: FastifyRequest<{ Params: { uuid: string } }>,
    reply: FastifyReply,
  ) => {
    const response = await this.atletaService.findOneAtleta(
      request.params.uuid,
    );

    return reply
      .status(200)
      .send({
        message: "Retrieved successfully",
        data: AtletaPresentation.Masked(response),
        ok: true,
      });
  };

  update = async (
    request: FastifyRequest<{
      Params: { uuid: string };
      Body: UpdateAtletaDto;
    }>,
    reply: FastifyReply,
  ) => {
    const response = await this.atletaService.updateAtleta(
      request.params.uuid,
      request.body,
    );

    return reply
      .status(200)
      .send({
        message: "Updated successfully",
        data: AtletaPresentation.Masked(response),
        ok: true,
      });
  };

  addModalidade = async (
    request: FastifyRequest<{
      Params: { uuid: string };
      Body: AddModalidadeAtletaDto;
    }>,
    reply: FastifyReply,
  ) => {
    const response = await this.atletaService.addModalidadeToAtleta(
      request.params.uuid,
      request.body,
    );

    return reply
      .status(201)
      .send({
        message: "Modalidade linked successfully",
        data: AtletaPresentation.Masked(response),
        ok: true,
      });
  };

  removeModalidade = async (
    request: FastifyRequest<{
      Params: { uuid: string; modalidade_uuid: string };
    }>,
    reply: FastifyReply,
  ) => {
    const deleted = await this.atletaService.removeModalidadeFromAtleta(
      request.params.uuid,
      request.params.modalidade_uuid,
    );

    return reply
      .status(200)
      .send({ message: "Modalidade unlinked successfully", data: { deleted }, ok: true });
  };

  delete = async (
    request: FastifyRequest<{ Params: { uuid: string } }>,
    reply: FastifyReply,
  ) => {
    const deleted = await this.atletaService.deleteAtleta(request.params.uuid);

    return reply
      .status(200)
      .send({ message: "Deleted successfully", data: { deleted }, ok: true });
  };

  createCarteirinha = async (
    request: FastifyRequest<{
      Params: { uuid: string };
      Body: CreateCarteirinhaAtletaDto;
    }>,
    reply: FastifyReply,
  ) => {
    const response = await this.atletaService.createCarteirinha(
      request.params.uuid,
      request.user.id,
      request.body || {},
    );

    return reply
      .status(201)
      .send({
        message: "Carteirinha created successfully",
        data: response,
        ok: true,
      });
  };

  getCarteirinhaPdf = async (
    request: FastifyRequest<{ Params: { uuid: string } }>,
    reply: FastifyReply,
  ) => {
    const response = await this.atletaService.renderCarteirinhaPdf(
      request.params.uuid,
    );

    reply.header("Content-Type", response.contentType);
    reply.header("Content-Disposition", response.contentDisposition);
    if (response.contentLength) {
      reply.header("Content-Length", response.contentLength);
    }

    return reply.status(200).send(response.file);
  };
}
