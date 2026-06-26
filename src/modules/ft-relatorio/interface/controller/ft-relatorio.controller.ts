import { FastifyReply, FastifyRequest } from "fastify";
import { FtRelatorioQueryDto } from "../../application/dto/ft-relatorio.dto.js";
import { makeGerarRelatorioFtUseCase } from "../../factories/makeGerarRelatorioFtUseCase.js";

const gerarRelatorioFtUseCase = makeGerarRelatorioFtUseCase();

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
}
