import { SequelizeMunicipeRepository } from "../../../infra/database/sequelize/repositories/sequelize.municipe.repository.js";
import AesCryptService from "../../../core/security/aes/AesCrypt.service.js";
import Sha256CryptService from "../../../core/security/sha256/sha256.service.js";
import GetMunicipe from "../application/usecase/getMunicipe.use-case.js";
import GetMunicipeById from "../application/usecase/getMunicipeById.use-case.js";
import CreateMunicipe from "../application/usecase/createMunicipe.use-case.js";
import UpdateMunicipe from "../application/usecase/updateMunicipe.use-case.js";

export const makeGetMunicipe = () =>
  new GetMunicipe(
    new SequelizeMunicipeRepository(),
    new AesCryptService(),
    new Sha256CryptService(),
  );
export const makeGetMunicipeById = () =>
  new GetMunicipeById(
    new SequelizeMunicipeRepository(),
    new AesCryptService(),
    new Sha256CryptService(),
  );
export const makeCreateMunicipe = () =>
  new CreateMunicipe(
    new SequelizeMunicipeRepository(),
    new AesCryptService(),
    new Sha256CryptService(),
  );
export const makeUpdateMunicipe = () =>
  new UpdateMunicipe(
    new SequelizeMunicipeRepository(),
    new AesCryptService(),
    new Sha256CryptService(),
  );
