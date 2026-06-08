import { FastifyReply, FastifyRequest } from "fastify";

import { QueryParams } from "../../../../core/types/genericTypes.js";
import FT_API from "../../api.js";

export class BolsistaController {
  static getBolsistas = async (
    request: FastifyRequest<{ Querystring: QueryParams }>,
    reply: FastifyReply,
  ) => {
    let user = request.user;

    const { page = 0, limit = 10, search = "" } = request.query;

    const [
      { data },
      {
        data: { token },
      },
    ] = await Promise.all([
      FT_API.get(
        "/ft/bolsista?page=" + page + "&limit=" + limit + "&search=" + search,
      ),
      FT_API.get(`/ft/auth/${user}`),
    ]);

    reply.status(200).send({ ...data, uploadToken: token });
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
