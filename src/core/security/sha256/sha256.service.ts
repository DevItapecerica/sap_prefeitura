import {
  createHash,

} from "crypto";
import { ISha256Crypt } from "./sha256.interface.js";

export default class Sha256CryptService implements ISha256Crypt {
  private ALGORITHM = "sha256";

  encrypt = async (data: string) => {
    return createHash(this.ALGORITHM).update(data).digest("hex");
  };

  compare = async (data: string, hash: string): Promise<boolean> => {
    return createHash(this.ALGORITHM).update(data).digest("hex") === hash;
  };
}
