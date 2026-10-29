import jwt, {SignOptions} from "jsonwebtoken";
import { JWT_KEY } from "../../../core/env.js";
import { JwtUserPayload } from "../types.js";

export default class JwtServices {
  constructor(private logger: any) {}

  async sign(
    payload: JwtUserPayload,
    expiresIn: SignOptions["expiresIn"] = "15m",
  ): Promise<string> {
    this.logger.info("Assinando token");
    const token = jwt.sign(
      {
        ...payload
      },
      JWT_KEY,
      {
        expiresIn,
      },
    );

    return token;
  }

  verify(token: string): JwtUserPayload {
    this.logger.info("Verificando token");
    return jwt.verify(token, JWT_KEY) as JwtUserPayload;
  }
}
