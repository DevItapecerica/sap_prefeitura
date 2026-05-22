import { FastifyRequest, FastifyReply } from "fastify";
import { ChamadoService } from "../../application/use-case/chamado.service.js";
import { CreateChamadoDto, UpdateChamadoDto } from "../../application/dto/chamado.dto.js";

export class ChamadoController {
  constructor(private chamadoService: ChamadoService) {}

  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { patrimonio, tipo, setorId, solicitanteId, descricao, prioridade, responsavelId, observacoes } = request.body as CreateChamadoDto;

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
    } catch (error: any) {
      return reply.status(error.statusCode || 500).send({
        message: error.message || "Erro ao criar chamado",
        code: error.code || "INTERNAL_ERROR",
      });
    }
  }

  async getAll(request: FastifyRequest, reply: FastifyReply) {
    try {
      const chamados = await this.chamadoService.findAllChamado(request.query as any);

      return reply.status(200).send(chamados);
    } catch (error: any) {
      return reply.status(500).send({
        message: error.message || "Erro ao listar chamados",
        code: "INTERNAL_ERROR",
      });
    }
  }

  async getById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };

      const chamado = await this.chamadoService.findOneChamado(id);

      return reply.status(200).send(chamado);
    } catch (error: any) {
      return reply.status(error.statusCode || 500).send({
        message: error.message || "Erro ao buscar chamado",
        code: error.code || "INTERNAL_ERROR",
      });
    }
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const updateData = request.body as UpdateChamadoDto;

      const chamado = await this.chamadoService.updateChamado(id, updateData);

      return reply.status(200).send(chamado);
    } catch (error: any) {
      return reply.status(error.statusCode || 500).send({
        message: error.message || "Erro ao atualizar chamado",
        code: error.code || "INTERNAL_ERROR",
      });
    }
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };

      const deleted = await this.chamadoService.deleteChamado(id);

      return reply.status(200).send({ success: deleted });
    } catch (error: any) {
      return reply.status(error.statusCode || 500).send({
        message: error.message || "Erro ao deletar chamado",
        code: error.code || "INTERNAL_ERROR",
      });
    }
  }

  async assignResponsavel(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const userId = (request as any).user?.id;

      if (!userId) {
        throw new Error("Usuário não autenticado");
      }

      const chamado = await this.chamadoService.assignResponsavel(id, userId);

      return reply.status(200).send(chamado);
    } catch (error: any) {
      return reply.status(error.statusCode || 500).send({
        message: error.message || "Erro ao atribuir responsável",
        code: error.code || "INTERNAL_ERROR",
      });
    }
  }

  async getReport(request: FastifyRequest, reply: FastifyReply) {
    try {
      const report = await this.chamadoService.getReport(request.query as any);

      return reply.status(200).send(report);
    } catch (error: any) {
      return reply.status(error.statusCode || 500).send({
        message: error.message || "Erro ao gerar relatório",
        code: error.code || "INTERNAL_ERROR",
      });
    }
  }

  async getAverageTimeReport(request: FastifyRequest, reply: FastifyReply) {
    try {
      const report = await this.chamadoService.getAverageTimeReport(request.query as any);

      return reply.status(200).send(report);
    } catch (error: any) {
      return reply.status(error.statusCode || 500).send({
        message: error.message || "Erro ao gerar relatório de tempo médio",
        code: error.code || "INTERNAL_ERROR",
      });
    }
  }
}
