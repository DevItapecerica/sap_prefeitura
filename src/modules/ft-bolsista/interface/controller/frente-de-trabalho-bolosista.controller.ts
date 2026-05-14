import { FastifyReply, FastifyRequest } from "fastify";

import FT_API from "../../api.js";
import GetBolsistaUseCase from "../../application/use-case/getBolsista.useCase.js";
import { SequelizeBolsistaRepository } from "../../../../infra/database/sequelize/repositories/sequelize.bolsista.repository.js";
import { BolsistaQueryDto } from "../../application/dto/bolsista-query.dto.js";

export class FtBolsistaController {
  static getBolsista = async (
    request: FastifyRequest<{ Querystring: BolsistaQueryDto }>,
    reply: FastifyReply,
  ) => {
    const useCase = new GetBolsistaUseCase(new SequelizeBolsistaRepository());

    const query = request.query;


    const response = await useCase.execute(query)

    reply.status(200).send(response);
  };

  static getOneBolsistas = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) => {
    const { id } = request.params;
    const { data } = await FT_API.get(`/ft/bolsista/${id}`);
    const bolsistas = data;

    reply.status(200).send(bolsistas);
  };

  static createBolsistas = async (
    request: FastifyRequest<{ Body: { bolsista: any } }>,
    reply: FastifyReply,
  ) => {
    const { bolsista } = request.body;

    const { data } = await FT_API.post(`/ft/bolsista`, {
      bolsista,
    });

    reply.status(200).send({ bolsista: data });
  };

  static updateBolsistas = async (
    request: FastifyRequest<{
      Params: { id: string };
      Body: { bolsista: any };
    }>,
    reply: FastifyReply,
  ) => {
    const { id } = request.params;
    const updatedData = request.body;

    const { data } = await FT_API.put(`/ft/bolsista/${id}`, updatedData);
    const bolsista = data;

    reply.status(200).send(bolsista);
  };

  static deleteBolsistas = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) => {
    const { id } = request.params;

    const { data } = await FT_API.delete(`/ft/bolsista/${id}`);
    const message = data.message;

    reply.status(200).send(message);
  };

  static getBolsistaEdital = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) => {
    const { id } = request.params;

    const { data } = await FT_API.get(`/ft/bolsista/edital/${id}`);
    const bolsista = data;
    reply.status(200).send(bolsista);
  };

  static toggleBolsistaEdital = async (
    request: FastifyRequest<{ Params: { bolsista: string; edital: string } }>,
    reply: FastifyReply,
  ) => {
    const { bolsista } = request.params;
    const { edital } = request.params;

    const { data } = await FT_API.put(
      `/ft/bolsista/${bolsista}/edital/${edital}`,
      {},
    );

    reply.status(200).send(data);
  };

  static getToExpire = async (request: FastifyRequest, reply: FastifyReply) => {
    const { data } = await FT_API.get(`/ft/bolsista/toExpire`);

    reply.status(200).send(data);
  };

  static prorrogate = async (
    request: FastifyRequest<{ Body: { bolsistas: any } }>,
    reply: FastifyReply,
  ) => {
    const { bolsistas } = request.body;

    const { data } = await FT_API.put(`/ft/bolsista/prorrogate`, {
      bolsistas,
    });

    reply.status(200).send(data);
  };
}
