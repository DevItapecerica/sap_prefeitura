import bcrypt from "bcryptjs";
import { IBcrypt } from "./bcrypt.interface.js";

export class BcryptService implements IBcrypt {
  private salt = 10;
  hashSync = async (password: string, salt?: number): Promise<string> => {
    const hashedPassword = await bcrypt.hash(password, salt || this.salt);
    return hashedPassword;
  };

  compareSync = async (password: string, hash: string): Promise<boolean> => {
    return await bcrypt.compare(password, hash);
  };
}
