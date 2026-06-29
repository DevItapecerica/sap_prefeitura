import { FastifyReply, FastifyRequest } from "fastify";
import {
  FtRelatorioFaltasQueryDto,
  FtRelatorioQueryDto,
} from "../../application/dto/ft-relatorio.dto.js";
import { makeGerarRelatorioFtUseCase } from "../../factories/makeGerarRelatorioFtUseCase.js";
import { makeGerarRelatorioFaltasFtUseCase } from "../../factories/makeGerarRelatorioFaltasFtUseCase.js";
import { makeGerarListaPresencaFtUseCase } from "../../factories/makeGerarListaPresencaFtUseCase.js";

const gerarRelatorioFtUseCase = makeGerarRelatorioFtUseCase();
const gerarRelatorioFaltasFtUseCase = makeGerarRelatorioFaltasFtUseCase();
const gerarListaPresencaFtUseCase = makeGerarListaPresencaFtUseCase();

export class FtRelatorioController {
  static gerarRelatorioEdital = async (
    request: FastifyRequest<{
      Params: { id: string };
      Querystring: FtRelatorioQueryDto;
    }>,
    reply: FastifyReply,
  ) => {
    const relatorio = await gerarRelatorioFtUseCase.execute(
      request.params.id,
      request.query,
    );

    return reply
      .status(200)
      .header("Content-Type", relatorio.type)
      .header("Content-Disposition", `attachment; filename="${relatorio.fileName}"`)
      .send(relatorio.csv);
  };

  static gerarRelatorioFaltasEdital = async (
    request: FastifyRequest<{
      Params: { id: string };
      Querystring: FtRelatorioFaltasQueryDto;
    }>,
    reply: FastifyReply,
  ) => {
    const relatorio = await gerarRelatorioFaltasFtUseCase.execute(
      request.params.id,
      request.query,
    );

    return reply
      .status(200)
      .header("Content-Type", relatorio.type)
      .header("Content-Disposition", `attachment; filename="${relatorio.fileName}"`)
      .send(relatorio.csv);
  };

  static gerarListaPresencaEdital = async (
    request: FastifyRequest<{
      Params: { id: string };
      Querystring: FtRelatorioFaltasQueryDto;
    }>,
    reply: FastifyReply,
  ) => {
    const relatorio = await gerarListaPresencaFtUseCase.execute(
      request.params.id,
      request.query,
    );

    return reply
      .status(200)
      .header("Content-Type", relatorio.type)
      .header("Content-Disposition", `attachment; filename="${relatorio.fileName}"`)
      .send(relatorio.csv);
  };
}
