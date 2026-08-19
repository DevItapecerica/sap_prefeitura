import { FastifyReply, FastifyRequest } from "fastify";
import {
  FtBolsistaDto,
  FtBolsistaFaltaDto,
  FtBolsistaFaltaQueryDto,
  FtBolsistaProrrogacaoDto,
  FtBolsistaQueryDto,
} from "../../application/dto/ft-bolsista.dto.js";
import { makeResourceReadEventPublisher } from "../../../../factories/resource-read-events.factory.js";
import { makeApplicationEventContext } from "../../../../infra/http/fastify/application-event-context.js";
import { makeFtBolsistaEventPublisher } from "../../factories/ft-bolsista-events.factory.js";
import { RESOURCE_READ_EVENTS } from "../../../../core/event/resource-read.events.js";
import { FT_BOLSISTA_EVENTS } from "../../application/events/ft-bolsista.events.js";

const resourceReadEventPublisher = makeResourceReadEventPublisher();
import { makeFtBolsistaService } from "../../factories/makeFtBolsistaService.js";

const service = makeFtBolsistaService();
const eventPublisher = makeFtBolsistaEventPublisher();
const plain = (value: any) => value?.toJSON?.() ?? value;

export class FrenteTrabalhoBolsistaController {
  static readonly getBolsistas = async (
    request: FastifyRequest<{ Querystring: FtBolsistaQueryDto }>,
    reply: FastifyReply,
  ) => {
    const data = await service.getAllBolsistas(request.query);
    await resourceReadEventPublisher.publish(RESOURCE_READ_EVENTS.listed, {
      context: makeApplicationEventContext(request),
      module: "ft-bolsista",
      resourceType: "bolsista",
      filters: request.query,
      returnedCount: data.bolsista.length,
    });
    return reply.status(200).send(data);
  };

  static readonly getBolsistasParaVinculo = async (
    request: FastifyRequest<{ Querystring: FtBolsistaQueryDto }>,
    reply: FastifyReply,
  ) => {
    const data = await service.getBolsistasParaVinculo(request.query);
    await resourceReadEventPublisher.publish(RESOURCE_READ_EVENTS.listed, {
      context: makeApplicationEventContext(request),
      module: "ft-bolsista",
      resourceType: "bolsista",
      filters: { ...request.query, eligibleForLink: true },
      returnedCount: data.bolsistas.length,
    });
    return reply.status(200).send(data);
  };

  static readonly getOneBolsista = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) => {
    const response = await service.getBolsistaById(request.params.id);
    await resourceReadEventPublisher.publish(RESOURCE_READ_EVENTS.viewed, {
      context: makeApplicationEventContext(request),
      module: "ft-bolsista",
      resourceType: "bolsista",
      resourceId: request.params.id,
    });
    return reply.status(200).send({
      message: response.message,
      bolsista: response.bolsista,
    });
  };

  static readonly createBolsista = async (
    request: FastifyRequest<{ Body: { bolsista: FtBolsistaDto } }>,
    reply: FastifyReply,
  ) => {
    const { bolsista } = request.body;
    const newBolsista = await service.saveBolsista(bolsista);
    await eventPublisher.publish(FT_BOLSISTA_EVENTS.created, {
      context: makeApplicationEventContext(request),
      resourceType: "bolsista",
      resourceId: String(newBolsista.id ?? ""),
      after: newBolsista,
    });
    return reply.status(200).send(newBolsista);
  };

  static readonly updateBolsista = async (
    request: FastifyRequest<{
      Params: { id: string };
      Body: { bolsista: FtBolsistaDto };
    }>,
    reply: FastifyReply,
  ) => {
    const { bolsista } = request.body;
    const current = await service.getBolsistaById(request.params.id);
    const updatedBolsista = await service.saveBolsista(
      bolsista,
      request.params.id,
    );
    await eventPublisher.publish(FT_BOLSISTA_EVENTS.updated, {
      context: makeApplicationEventContext(request),
      resourceType: "bolsista",
      resourceId: request.params.id,
      before: plain(current.bolsista),
      after: plain(updatedBolsista),
    });

    return reply.status(200).send({
      message: "Bolsista updated successfully",
      bolsista: updatedBolsista,
    });
  };

  static readonly deleteBolsista = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) => {
    const current = await service.getBolsistaById(request.params.id);
    await service.deleteBolsista(request.params.id);
    await eventPublisher.publish(FT_BOLSISTA_EVENTS.deleted, {
      context: makeApplicationEventContext(request),
      resourceType: "bolsista",
      resourceId: request.params.id,
      before: plain(current.bolsista),
    });

    return reply.status(200).send({
      message: "Bolsista deleted successfully",
    });
  };

  static readonly getToExpire = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => {
    const toExpire = await service.getAllToExpire();
    await resourceReadEventPublisher.publish(RESOURCE_READ_EVENTS.listed, {
      context: makeApplicationEventContext(request),
      module: "ft-bolsista",
      resourceType: "bolsista",
      filters: { expiringWithinDays: 5 },
      returnedCount: (toExpire.rows || []).length,
    });

    return reply.status(200).send({
      mesasge: "Retrivied sucessfully",
      bolsistas: toExpire.rows || [],
      count: toExpire.count,
    });
  };

  static readonly prorrogate = async (
    request: FastifyRequest<{ Body: { bolsistas: FtBolsistaProrrogacaoDto[] } }>,
    reply: FastifyReply,
  ) => {
    const { bolsistas } = request.body;
    const response = await service.prorrogate(bolsistas);
    await eventPublisher.publish(FT_BOLSISTA_EVENTS.updated, {
      context: makeApplicationEventContext(request),
      resourceType: "vinculo",
      before: response.before,
      after: response.after,
    });

    return reply.status(201).send({ message: response.message });
  };

  static readonly getBolsistaEdital = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) => {
    const bolsista = await service.getBolsistaByEditalId(request.params.id);
    await resourceReadEventPublisher.publish(RESOURCE_READ_EVENTS.listed, {
      context: makeApplicationEventContext(request),
      module: "ft-bolsista",
      resourceType: "edital_bolsista",
      filters: { editalId: request.params.id },
      returnedCount: Array.isArray(bolsista) ? bolsista.length : 1,
    });

    return reply.status(200).send({
      message: "Bolsista get successfully",
      bolsista,
    });
  };

  static readonly getHistoricoBolsista = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) => {
    const response = await service.getHistoricoBolsista(request.params.id);
    await resourceReadEventPublisher.publish(RESOURCE_READ_EVENTS.listed, {
      context: makeApplicationEventContext(request),
      module: "ft-bolsista",
      resourceType: "historico_bolsista",
      filters: { bolsistaId: request.params.id },
      returnedCount: response.historico.length,
    });

    return reply.status(200).send(response);
  };

  static readonly cancelBolsistaEdital = async (
    request: FastifyRequest<{ Params: { bolsista: string; edital: string } }>,
    reply: FastifyReply,
  ) => {
    const result = await service.cancelBolsistaEdital(
      request.params.bolsista,
      request.params.edital,
    );
    await eventPublisher.publish(FT_BOLSISTA_EVENTS.updated, {
      context: makeApplicationEventContext(request),
      resourceType: "vinculo",
      resourceId: `${request.params.bolsista}:${request.params.edital}`,
      before: result.before,
      after: result.after,
    });

    return reply.status(201).send({ message: "Bolsista alterado com sucesso!" });
  };

  static readonly createFalta = async (
    request: FastifyRequest<{
      Params: { id: string };
      Body: FtBolsistaFaltaDto;
    }>,
    reply: FastifyReply,
  ) => {
    const response = await service.createFalta(request.params.id, request.body);
    await eventPublisher.publish(FT_BOLSISTA_EVENTS.created, {
      context: makeApplicationEventContext(request),
      resourceType: "falta",
      resourceId: String(plain(response.falta)?.id ?? ""),
      after: plain(response.falta),
    });

    return reply.status(201).send(response);
  };

  static readonly listFaltas = async (
    request: FastifyRequest<{
      Params: { id: string };
      Querystring: FtBolsistaFaltaQueryDto;
    }>,
    reply: FastifyReply,
  ) => {
    const response = await service.listFaltas(request.params.id, request.query);
    await resourceReadEventPublisher.publish(RESOURCE_READ_EVENTS.listed, {
      context: makeApplicationEventContext(request),
      module: "ft-bolsista",
      resourceType: "falta",
      filters: { ...request.query, bolsistaId: request.params.id },
      returnedCount: response.faltas.length,
    });

    return reply.status(200).send(response);
  };

  static readonly deleteFalta = async (
    request: FastifyRequest<{ Params: { id: string; faltaId: string } }>,
    reply: FastifyReply,
  ) => {
    const response = await service.deleteFalta(
      request.params.id,
      request.params.faltaId,
    );
    await eventPublisher.publish(FT_BOLSISTA_EVENTS.deleted, {
      context: makeApplicationEventContext(request),
      resourceType: "falta",
      resourceId: request.params.faltaId,
      before: response.before,
    });
    const { before: _before, ...payload } = response;

    return reply.status(200).send(payload);
  };
}
