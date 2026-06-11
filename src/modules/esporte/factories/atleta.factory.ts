import { FastifyBaseLogger } from "fastify";
import { SequelizeCarterinhaRepository } from "../../../infra/database/sequelize/repositories/sequelize.carterinha.repository.js";
import { SequelizeMunicipeRepository } from "../../../infra/database/sequelize/repositories/sequelize.municipe.repository.js";
import { SequelizeAtletaRepository } from "../../../infra/database/sequelize/repositories/sequelize.atleta.repository.js";
import AtletaService from "../application/use-case/atleta.service.js";
import Sha256CryptService from "../../../core/security/sha256/sha256.service.js";
import AesCryptService from "../../../core/security/aes/AesCrypt.service.js";

export default function atletaFactory(_logger: FastifyBaseLogger): AtletaService {
  return new AtletaService(
    new SequelizeAtletaRepository(),
    new SequelizeMunicipeRepository(),
    new SequelizeCarterinhaRepository(),
    new Sha256CryptService(),
    new AesCryptService(),
  );
}
