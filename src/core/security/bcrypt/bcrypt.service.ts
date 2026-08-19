import bcrypt from "bcryptjs";
import { IBcrypt } from "./bcrypt.interface.js";

export class BcryptService implements IBcrypt {
  private readonly salt = 10;

  hash(password: string, salt?: number): Promise<string> {
    return bcrypt.hash(password, salt ?? this.salt);
  }

  compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
