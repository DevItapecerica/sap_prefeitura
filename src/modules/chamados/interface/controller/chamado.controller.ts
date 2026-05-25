import { FastifyRequest, FastifyReply } from "fastify";
import AppError from "../../../../core/appError.js";
import { ChamadoService } from "../../application/use-case/chamado.service.js";
import {
  CreateChamadoDto,
  UpdateChamadoDto,
} from "../../application/dto/chamado.dto.js";

export class ChamadoController {
  constructor(private chamadoService: ChamadoService) {}

  async create(request: FastifyRequest, reply: FastifyReply) {
    const {
      patrimonio,
      tipo,
      setorId,
      solicitanteId,
      descricao,
      prioridade,
      responsavelId,
      observacoes,
    } = request.body as CreateChamadoDto;

    const chamado = await this.chamadoService.createChamado({
      patrimonio,
      tipo,
      setorId,
      solicitanteId,
      descricao,
      prioridade,
      responsavelId,
      observacoes,
    });

    return reply.status(201).send(chamado);
  }

  async getAll(request: FastifyRequest, reply: FastifyReply) {
    const chamados = await this.chamadoService.findAllChamado(
      request.query as any,
    );

    return reply.status(200).send(chamados);
  }

  async getById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const chamado = await this.chamadoService.findOneChamado(id);

    return reply.status(200).send(chamado);
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const updateData = request.body as UpdateChamadoDto;
    const chamado = await this.chamadoService.updateChamado(id, updateData);

    return reply.status(200).send(chamado);
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const deleted = await this.chamadoService.deleteChamado(id);

    return reply.status(200).send({ success: deleted });
  }

  async assignResponsavel(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const userId = request.user?.id;

    if (!userId) {
      throw new AppError("Usuario nao autenticado", 401, "UNAUTHORIZED");
    }

    const chamado = await this.chamadoService.assignResponsavel(
      id,
      Number(userId),
    );

    return reply.status(200).send(chamado);
  }

  async getReport(request: FastifyRequest, reply: FastifyReply) {
    const report = await this.chamadoService.getReport(request.query as any);

    return reply.status(200).send(report);
  }

  async getAverageTimeReport(request: FastifyRequest, reply: FastifyReply) {
    const report = await this.chamadoService.getAverageTimeReport(
      request.query as any,
    );

    return reply.status(200).send(report);
  }
}
