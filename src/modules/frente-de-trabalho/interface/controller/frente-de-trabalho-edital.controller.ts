import { FastifyReply, FastifyRequest } from "fastify";
import FT_API from "../../api.js";
import { QueryParams } from "../../../../core/shared/types/genericTypes.js";
export default class EditalController {
  static getEditais = async (request: FastifyRequest, reply: FastifyReply) => {
    const response = await FT_API.get("/ft/edital");
    const { data } = response;
    reply.status(200).send({ ...data });
  };

  static getEditalById = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) => {
    const { id } = request.params;
    const response = await FT_API.get(`/ft/edital/${id}`);
    const { data } = response;

    reply.status(200).send({ ...data });
  };

  static postEdital = async (
    request: FastifyRequest<{ Body: { edital: any } }>,
    reply: FastifyReply,
  ) => {
    const { edital } = request.body;

    const response = await FT_API.post(`/ft/edital`, {
      edital,
    });

    const { data } = response;

    reply.status(200).send({ ...data });
  };

  static updateEdital = async (
    request: FastifyRequest<{ Params: { id: string }; Body: { edital: any } }>,
    reply: FastifyReply,
  ) => {
    const { id } = request.params;
    const { edital } = request.body;

    const response = await FT_API.put(`/ft/edital/${id}`, {
      edital,
    });
    const { data } = response;

    reply.status(200).send({ ...data });
  };

  static deleteEdital = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) => {
    const { id } = request.params;

    const response = await FT_API.delete(`/ft/edital/${id}`);

    const { data } = response;

    reply.status(200).send({ ...data });
  };

  static vincularBolsista = async (
    request: FastifyRequest<{
      Params: { id: string };
      Body: { bolsista: any; data_vinculo: any };
    }>,
    reply: FastifyReply,
  ) => {
    const { id } = request.params;
    const { bolsista } = request.body;
    const { data_vinculo } = request.body;

    const { data } = await FT_API.post(`/ft/edital/vincularbolsista/${id}`, {
      bolsista,
      data_vinculo,
    });

    reply.status(200).send({ ...data });
  };

  static getEditalWithBolsista = async (
    request: FastifyRequest<{
      Params: { id: string };
      Querystring: QueryParams;
    }>,
    reply: FastifyReply,
  ) => {
    const { id } = request.params;
    const { page = 0, limit = 10, search = "" } = request.query;

    const { data } = await FT_API.get(
      `/ft/edital/${id}/bolsista?page=${page}&limit=${limit}&search=${search}`,
    );

    reply.status(200).send(data);
  };

  static getAllWithBolsista = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => {
    const { data } = await FT_API.get(`/ft/edital/bolsista`);

    reply.status(200).send({ ...data });
  };
}
