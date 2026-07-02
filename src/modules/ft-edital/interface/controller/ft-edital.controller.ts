import { FastifyReply, FastifyRequest } from "fastify";
import {
  FtEditalBolsistaQueryDto,
  FtEditalDto,
  FtEditalQueryDto,
  FtVincularBolsistaDto,
} from "../../application/dto/ft-edital.dto.js";
import { makeFtEditalService } from "../../factories/makeFtEditalService.js";
import { FtRelatorioQueryDto } from "../../../ft-relatorio/application/dto/ft-relatorio.dto.js";
import { makeGerarRelatorioFtUseCase } from "../../../ft-relatorio/factories/makeGerarRelatorioFtUseCase.js";

const service = makeFtEditalService();
const gerarRelatorioFtUseCase = makeGerarRelatorioFtUseCase();

export class FtEditalController {
  static getEdital = async (
    request: FastifyRequest<{ Querystring: FtEditalQueryDto }>,
    reply: FastifyReply,
  ) => {
    const { edital, count } = await service.allEdital(request.query);

    return reply
      .status(200)
      .send({ message: "Edital selecionados com sucesso", edital, count });
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
    request: FastifyRequest<{
      Params: { id: string };
      Querystring: FtRelatorioQueryDto;
    }>,
    reply: FastifyReply,
  ) => {
    const relatory = await gerarRelatorioFtUseCase.execute(
      request.params.id,
      request.query,
    );

    return reply
      .status(200)
      .header("Content-Type", relatory.type)
      .header("Content-Disposition", `attachment; filename="${relatory.fileName}"`)
      .send(relatory.csv);
  };
}
