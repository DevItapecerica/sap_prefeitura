import { FastifyBaseLogger } from "fastify";
import { SequelizeModalidadeRepository } from "../../../infra/database/sequelize/repositories/sequelize.modalidade.repository.js";
import ModalidadeService from "../application/use-case/modalidade.service.js";

export default function modalidadeFactory(
  _logger: FastifyBaseLogger,
): ModalidadeService {
  return new ModalidadeService(new SequelizeModalidadeRepository());
}
