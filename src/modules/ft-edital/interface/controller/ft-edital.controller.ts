import { FastifyReply, FastifyRequest } from "fastify";
import {
  FtEditalBolsistaQueryDto,
  FtEditalDto,
  FtVincularBolsistaDto,
} from "../../application/dto/ft-edital.dto.js";
import { makeFtEditalService } from "../../factories/makeFtEditalService.js";

const service = makeFtEditalService();

export class FtEditalController {
  static getEdital = async (_request: FastifyRequest, reply: FastifyReply) => {
    const edital = await service.allEdital();

    return reply
      .status(200)
      .send({ message: "Edital selecionados com sucesso", edital });
  };

  static getEditalById = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) => {
    const edital = await service.editalById(request.params.id);

    return reply
      .status(200)
      .send({ message: "Edital selecionados com sucesso", edital });
  };

  static postEdital = async (
    request: FastifyRequest<{ Body: { edital: FtEditalDto } }>,
    reply: FastifyReply,
  ) => {
    const { edital } = request.body;
    const newEdital = await service.createEdital(edital);

    return reply
      .status(201)
      .send({ message: "Edital criado com sucesso", newEdital });
  };

  static updateEdital = async (
    request: FastifyRequest<{
      Params: { id: string };
      Body: { edital: FtEditalDto };
    }>,
    reply: FastifyReply,
  ) => {
    const { edital } = request.body;
    const newEdital = await service.updateEdital(request.params.id, edital);

    return reply
      .status(200)
      .send({ message: "Edital criado com sucesso", edital: newEdital });
  };

  static deleteEdital = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) => {
    await service.deleteEdital(request.params.id);

    return reply.status(201).send({ message: "Edital deletado com sucesso" });
  };

  static vincularBolsista = async (
    request: FastifyRequest<{
      Params: { id: string };
      Body: FtVincularBolsistaDto;
    }>,
    reply: FastifyReply,
  ) => {
    const { bolsista, data_vinculo } = request.body;

    await service.vincularBolsista(
      request.params.id,
      bolsista,
      data_vinculo,
    );

    return reply.status(201).send({ message: "Bolsista vinculado com sucesso" });
  };

  static getAllEditalWithBolsista = async (
    _request: FastifyRequest,
    reply: FastifyReply,
  ) => {
    const bolsista_edital = await service.getAllWithBolsista();

    return reply
      .status(200)
      .send({ message: "Todos os editais com bolsistas", bolsista_edital });
  };

  static getEditalWithBolsista = async (
    request: FastifyRequest<{
      Params: { id: string };
      Querystring: FtEditalBolsistaQueryDto;
    }>,
    reply: FastifyReply,
  ) => {
    const { bolsistas, count } = await service.getWithBolsista(
      request.params.id,
      request.query,
    );

    return reply
      .status(200)
      .send({ message: "Edital com bolsistas", bolsistas, count });
  };

  static getRelatory = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) => {
    const relatory = await service.getRelatory(request.params.id);

    return reply
      .status(200)
      .header("Content-Type", relatory.type)
      .header("Content-Disposition", `attachment; filename="${relatory.fileName}"`)
      .send(relatory.csv);
  };
}
