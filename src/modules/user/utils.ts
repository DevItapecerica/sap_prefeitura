import { userParams } from "../../types/userType.js";
import UserRepository from "./repository.js";

const validarEmailDuplicado = async (email: string, excludeId?: userParams): Promise<boolean> => {
  const userExists = await UserRepository.getByEmail(email, excludeId);

  return !!userExists;

};

export default validarEmailDuplicado;