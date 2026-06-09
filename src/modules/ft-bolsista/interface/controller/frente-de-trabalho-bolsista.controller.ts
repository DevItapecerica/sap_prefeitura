import { FastifyReply, FastifyRequest } from "fastify";
import {
  FtBolsistaDto,
  FtBolsistaFaltaDto,
  FtBolsistaFaltaQueryDto,
  FtBolsistaProrrogacaoDto,
  FtBolsistaQueryDto,
} from "../../application/dto/ft-bolsista.dto.js";
import { makeFtBolsistaService } from "../../factories/makeFtBolsistaService.js";

const service = makeFtBolsistaService();

export class FrenteTrabalhoBolsistaController {
  static getBolsistas = async (
    request: FastifyRequest<{ Querystring: FtBolsistaQueryDto }>,
    reply: FastifyReply,
  ) => {
    const data = await service.getAllBolsistas(request.query);
    return reply.status(200).send(data);
  };

  static getOneBolsista = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) => {
    const response = await service.getBolsistaById(request.params.id);
    return reply.status(200).send({
      message: response.message,
      bolsista: response.bolsista,
    });
  };

  static createBolsista = async (
    request: FastifyRequest<{ Body: { bolsista: FtBolsistaDto } }>,
    reply: FastifyReply,
  ) => {
    const { bolsista } = request.body;
    const newBolsista = await service.saveBolsista(bolsista);
    return reply.status(200).send(newBolsista);
  };

  static updateBolsista = async (
    request: FastifyRequest<{
      Params: { id: string };
      Body: { bolsista: FtBolsistaDto };
    }>,
    reply: FastifyReply,
  ) => {
    const { bolsista } = request.body;
    const updatedBolsista = await service.saveBolsista(
      bolsista,
      request.params.id,
    );

    return reply.status(200).send({
      message: "Bolsista updated successfully",
      bolsista: updatedBolsista,
    });
  };

  static deleteBolsista = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) => {
    await service.deleteBolsista(request.params.id);

    return reply.status(200).send({
      message: "Bolsista deleted successfully",
    });
  };

  static getToExpire = async (_request: FastifyRequest, reply: FastifyReply) => {
    const toExpire = await service.getAllToExpire();

    return reply.status(200).send({
      mesasge: "Retrivied sucessfully",
      bolsistas: toExpire.rows || [],
      count: toExpire.count,
    });
  };

  static prorrogate = async (
    request: FastifyRequest<{ Body: { bolsistas: FtBolsistaProrrogacaoDto[] } }>,
    reply: FastifyReply,
  ) => {
    const { bolsistas } = request.body;
    const response = await service.prorrogate(bolsistas);

    return reply.status(201).send(response);
  };

  static getBolsistaEdital = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) => {
    const bolsista = await service.getBolsistaByEditalId(request.params.id);

    return reply.status(200).send({
      message: "Bolsista get successfully",
      bolsista,
    });
  };

  static cancelBolsistaEdital = async (
    request: FastifyRequest<{ Params: { bolsista: string; edital: string } }>,
    reply: FastifyReply,
  ) => {
    await service.cancelBolsistaEdital(
      request.params.bolsista,
      request.params.edital,
    );

    return reply.status(201).send({ message: "Bolsista alterado com sucesso!" });
  };

  static createFalta = async (
    request: FastifyRequest<{
      Params: { id: string };
      Body: FtBolsistaFaltaDto;
    }>,
    reply: FastifyReply,
  ) => {
    const response = await service.createFalta(request.params.id, request.body);

    return reply.status(201).send(response);
  };

  static listFaltas = async (
    request: FastifyRequest<{
      Params: { id: string };
      Querystring: FtBolsistaFaltaQueryDto;
    }>,
    reply: FastifyReply,
  ) => {
    const response = await service.listFaltas(request.params.id, request.query);

    return reply.status(200).send(response);
  };

  static deleteFalta = async (
    request: FastifyRequest<{ Params: { id: string; faltaId: string } }>,
    reply: FastifyReply,
  ) => {
    const response = await service.deleteFalta(
      request.params.id,
      request.params.faltaId,
    );

    return reply.status(200).send(response);
  };
}
