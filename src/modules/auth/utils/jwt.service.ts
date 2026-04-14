import jwt from "jsonwebtoken";
import { SECRET_KEY } from "../../../core/env.js";
import { JwtUserPayload } from "../types.js";

export default class JwtServices {
  constructor(private logger: any) {}

  async sign(payload: JwtUserPayload): Promise<string> {
    this.logger.info("Assinando token");
    const token = jwt.sign(
      {
        ...payload
      },
      SECRET_KEY,
      {
        expiresIn: "5m",
      },
    );

    return token;
  }

  verify(token: string): JwtUserPayload {
    this.logger.info("Verificando token");
    return jwt.verify(token, SECRET_KEY) as JwtUserPayload;
  }
}
