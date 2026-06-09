import { SECRET_KEY } from "../../env.js";
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  CipherGCM,
  DecipherGCM,
} from "crypto";
import { IAesCrypt } from "./AesCrypt.interface.js";

export default class AesCryptService implements IAesCrypt {
  private ALGORITHM = "aes-256-gcm";

  private getKey() {
    const key = Buffer.from(SECRET_KEY);
    return key.length === 32 ? key : createHash("sha256").update(SECRET_KEY).digest();
  }

  encrypt = async (data: string) => {
    const iv = randomBytes(12);
    const cipher = createCipheriv(
      this.ALGORITHM,
      this.getKey(),
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
      this.getKey(),
      Buffer.from(ivHex, "hex"),
    ) as DecipherGCM; // Cast para DecipherGCM

    decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  };
}
