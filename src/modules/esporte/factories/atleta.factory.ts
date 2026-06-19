import { FastifyBaseLogger } from "fastify";
import { SequelizeCarterinhaEsporteRepository } from "../../../infra/database/sequelize/repositories/sequelize.carterinha-esporte.repository.js";
import { SequelizeMunicipeRepository } from "../../../infra/database/sequelize/repositories/sequelize.municipe.repository.js";
import { SequelizeAtletaRepository } from "../../../infra/database/sequelize/repositories/sequelize.atleta.repository.js";
import { SequelizeModalidadeRepository } from "../../../infra/database/sequelize/repositories/sequelize.modalidade.repository.js";
import AtletaService from "../application/use-case/atleta.service.js";
import Sha256CryptService from "../../../core/security/sha256/sha256.service.js";
import AesCryptService from "../../../core/security/aes/AesCrypt.service.js";
import { PDF_API_URL } from "../../../core/env.js";
import CreateCarterinhaEsporteUseCase from "../../carterinha-esporte/application/use-case/create-carterinha-esporte.use-case.js";
import ListCarterinhasEsporteUseCase from "../../carterinha-esporte/application/use-case/list-carterinhas-esporte.use-case.js";
import ListCarterinhasEsporteByAtletaUseCase from "../../carterinha-esporte/application/use-case/list-carterinhas-esporte-by-atleta.use-case.js";
import RenderCarterinhaEsportePdfUseCase from "../../carterinha-esporte/application/use-case/render-carterinha-esporte-pdf.use-case.js";

export default function atletaFactory(_logger: FastifyBaseLogger): AtletaService {
  const municipeRepository = new SequelizeMunicipeRepository();
  const carterinhaEsporteRepository = new SequelizeCarterinhaEsporteRepository();
  const aesCrypt = new AesCryptService();
  const sha256Crypt = new Sha256CryptService();
  const createCarterinhaEsporteUseCase = new CreateCarterinhaEsporteUseCase(
    carterinhaEsporteRepository,
  );
  const listCarterinhasEsporteUseCase = new ListCarterinhasEsporteUseCase(
    carterinhaEsporteRepository,
  );
  const listCarterinhasEsporteByAtletaUseCase =
    new ListCarterinhasEsporteByAtletaUseCase(carterinhaEsporteRepository);
  const renderCarterinhaEsportePdfUseCase =
    new RenderCarterinhaEsportePdfUseCase(
      carterinhaEsporteRepository,
      municipeRepository,
      PDF_API_URL,
      aesCrypt,
      sha256Crypt,
    );

  return new AtletaService(
    new SequelizeAtletaRepository(),
    new SequelizeModalidadeRepository(),
    municipeRepository,
    createCarterinhaEsporteUseCase,
    listCarterinhasEsporteUseCase,
    listCarterinhasEsporteByAtletaUseCase,
    renderCarterinhaEsportePdfUseCase,
    sha256Crypt,
    aesCrypt,
  );
}
