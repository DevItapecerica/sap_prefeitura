import { PDF_API_URL } from "../../../core/env.js";
import AesCryptService from "../../../core/security/aes/AesCrypt.service.js";
import { SequelizeComprovanteEntregaRepository } from "../../../infra/database/sequelize/repositories/sequelize.comprovante-entrega.repository.js";
import { AxiosComprovanteEntregaGateway } from "../../../infra/pdf/axios-comprovante-entrega.gateway.js";
import { GerarComprovanteUseCase } from "../application/gerar-comprovante.use-case.js";
import { ComprovantesController } from "../interface/comprovantes.controller.js";

export const makeGerarComprovante = () =>
  new GerarComprovanteUseCase(
    new SequelizeComprovanteEntregaRepository(),
    new AesCryptService(),
    new AxiosComprovanteEntregaGateway(PDF_API_URL),
  );
export const makeComprovantesController = () =>
  new ComprovantesController(makeGerarComprovante());
