import { sendMail } from "./mailler.js";
import bcrypt from "bcryptjs";

export const sendPass = async (mail: string, password: string): Promise<string> => {
  const hashedPassword = await bcrypt.hash(password, 10);

  await sendMail(
    mail,
    "Usuário criado com sucesso",
    "Lembre-se de alterar sua senha!",
    `Sua senha temporária é:<br/> <b>${password}</b> <br/><b>Tenha em mente que ela é de sua responsabilidade, assim como qualquer movimentação usando seu usuário.</b>`
  );

  return hashedPassword;
};
