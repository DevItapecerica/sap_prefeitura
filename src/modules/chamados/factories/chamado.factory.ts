import { SequelizeChamadoRepository } from "../../../infra/database/sequelize/repositories/sequelize.chamado.repository.js";
import { SequelizeUserRepository } from "../../../infra/database/sequelize/repositories/sequelize.user.repository.js";
import { SequelizeSetorRepository } from "../../../infra/database/sequelize/repositories/sequelize.setor.repository.js";
import { ChamadoService } from "../application/use-case/chamado.service.js";

const chamadoFactory = (logger: any): ChamadoService => {
  const chamadoRepository = new SequelizeChamadoRepository();
  const userRepository = new SequelizeUserRepository();
  const setorRepository = new SequelizeSetorRepository();
  const chamadoService = new ChamadoService(chamadoRepository, userRepository, setorRepository, logger);
  return chamadoService;
};

export default chamadoFactory;
