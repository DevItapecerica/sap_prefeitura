import { FastifyReply, FastifyRequest } from "fastify";
import FT_API from "../../api.js";
import { QueryParams } from "../../../../core/types/genericTypes.js";
import getEditalUseCase from "../../application/use-case/getEdital.use-case.js";
import { SequelizeEditalRepository } from "../../../../infra/database/sequelize/repositories/sequelize.edital.repository.js";
export default class FtEditalController {

  static getEdital = async (request: FastifyRequest, reply: FastifyReply) => {
    const useCase = new getEditalUseCase(new SequelizeEditalRepository());
    const response = await useCase.execute();
    reply.status(200).send({ message: "Editais retrivied", data: response, ok: true });
  };

  static getEditalById = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) => {
    const { id } = request.params;
    const response = await FT_API.get(`/ft/edital/${id}`);

    reply.status(200).send({ message: "edital found", data: response, ok: true });
  };

  static postEdital = async (
    request: FastifyRequest<{ Body: { edital: any } }>,
    reply: FastifyReply,
  ) => {
    const { edital } = request.body;

    const response = await FT_API.post(`/ft/edital`, {
      edital,
    });

    reply.status(200).send({ message: "edital created", data: response, ok: true });
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

    reply.status(200).send({ message: "edital updated", data: response, ok: true });
  };

  static deleteEdital = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) => {
    const { id } = request.params;

    const response = await FT_API.delete(`/ft/edital/${id}`);

    reply.status(200).send({ message: "edital deleted", data: response, ok: true });
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

    const response = await FT_API.post(`/ft/edital/vincularbolsista/${id}`, {
      bolsista,
      data_vinculo,
    });

    reply.status(200).send({ message: "edital deleted", data: response, ok: true });
  };

  static getEditalWithBolsista = async (
    request: FastifyRequest<{
      Params: { id: string };
      Querystring: QueryParams;
    }>,
    reply: FastifyReply,
  ) => {
    const { id } = request.params;
    const { page = 0, limit = 10, search = "", order = "creatAt:desc" } = request.query;

    const response = await FT_API.get(
      `/ft/edital/${id}/bolsista?page=${page}&limit=${limit}&search=${search}`,
    );

    reply.status(200).send({ message: "edital deleted", data: response, ok: true });
  };
}
