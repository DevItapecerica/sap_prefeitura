import { FastifyBaseLogger } from "fastify";
import { SequelizeCarterinhaRepository } from "../../../infra/database/sequelize/repositories/sequelize.carterinha.repository.js";
import { SequelizeMunicipeRepository } from "../../../infra/database/sequelize/repositories/sequelize.municipe.repository.js";
import { SequelizeAtletaRepository } from "../../../infra/database/sequelize/repositories/sequelize.atleta.repository.js";
import { SequelizeModalidadeRepository } from "../../../infra/database/sequelize/repositories/sequelize.modalidade.repository.js";
import AtletaService from "../application/use-case/atleta.service.js";
import Sha256CryptService from "../../../core/security/sha256/sha256.service.js";
import AesCryptService from "../../../core/security/aes/AesCrypt.service.js";
import CreateCarterinhaPdfUseCase from "../../carterinhas/application/use-case/createCarterinhaPdf.use-case.js";
import CreateCarterinhaUseCase from "../../carterinhas/application/use-case/createCarterinha.use-case.js";
import { PDF_API_URL } from "../../../core/env.js";

export default function atletaFactory(_logger: FastifyBaseLogger): AtletaService {
  const municipeRepository = new SequelizeMunicipeRepository();
  const carterinhaRepository = new SequelizeCarterinhaRepository();
  const aesCrypt = new AesCryptService();
  const sha256Crypt = new Sha256CryptService();
  const createCarterinhaUseCase = new CreateCarterinhaUseCase(
    municipeRepository,
    carterinhaRepository,
    new CreateCarterinhaPdfUseCase(PDF_API_URL),
    aesCrypt,
    sha256Crypt,
  );

  return new AtletaService(
    new SequelizeAtletaRepository(),
    new SequelizeModalidadeRepository(),
    municipeRepository,
    carterinhaRepository,
    createCarterinhaUseCase,
    sha256Crypt,
    aesCrypt,
  );
}
