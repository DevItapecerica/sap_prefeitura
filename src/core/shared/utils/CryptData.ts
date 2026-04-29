import { SECRET_KEY } from "../../env.js";
import {
  createHash,
  createCipheriv,
  createDecipheriv,
  randomBytes,
  CipherGCM,
  DecipherGCM,
} from "crypto";

export default class CryptData {
  private saltRounds = 10;
  private ALGORITHM = "aes-256-gcm";

  Encryption = async (data: string) => {
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

  Decryption = async (encryptedData: string) => {
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

  staticHash = async (data: string) => {
    return createHash("sha256").update(data).digest("hex");
  };
}
