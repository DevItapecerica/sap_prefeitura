import { SECRET_KEY } from "../../env.js";
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  CipherGCM,
  DecipherGCM,
} from "crypto";
import { IAesCrypt } from "./AesCrypt.interface.js";

export default class AesCryptService implements IAesCrypt {
  private saltRounds = 10;
  private ALGORITHM = "aes-256-gcm";

  encrypt = async (data: string) => {
    const iv = randomBytes(this.saltRounds);
    const cipher = createCipheriv(
      this.ALGORITHM,
      Buffer.from(SECRET_KEY),
      iv,
    ) as CipherGCM;

    let encrypted = cipher.update(data, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");

    return `${iv.toString("hex")}:${authTag}:${encrypted}`;
  };

  decrypt = async (encryptedData: string) => {
    const [ivHex, authTagHex, encryptedText] = encryptedData.split(":");
    const decipher = createDecipheriv(
      this.ALGORITHM,
      Buffer.from(SECRET_KEY),
      Buffer.from(ivHex, "hex"),
    ) as DecipherGCM; // Cast para DecipherGCM

    decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  };
}
